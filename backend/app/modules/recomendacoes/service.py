import logging
import unicodedata
from datetime import datetime, time
from decimal import Decimal
from typing import Dict, List
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from pulp import LpProblem, LpMaximize, LpVariable, lpSum, LpStatus, LpStatusOptimal, PULP_CBC_CMD

from app.modules.recomendacoes.models import Recomendacao
from app.modules.recomendacoes.schemas import RecomendacaoCreate, RecomendacaoParametros, ItemRecomendacaoCreate
from app.modules.recomendacoes.repository import RecomendacaoRepository
from app.modules.produtos.models import ItemFichaTecnica, Produto, StatusProduto
from app.modules.insumos.models import Insumo
from app.modules.pdv.models import ItemVenda, StatusVenda, Venda

logger = logging.getLogger(__name__)

BEBIDAS_CATEGORIA_TERMOS = {"bebida", "bebidas", "refrigerante", "refrigerantes", "suco", "sucos", "agua", "aguas"}
BEBIDAS_PRODUTO_TERMOS = {"coca", "refrigerante", "suco", "agua mineral", "cerveja", "guarana", "fanta", "sprite"}
COMPLEMENTO_CATEGORIA_TERMOS = {
    "complemento",
    "complementos",
    "porcao",
    "porcoes",
    "acompanhamento",
    "acompanhamentos",
}
COMPLEMENTO_PRODUTO_TERMOS = {"batata", "frita", "fritas", "anel", "aneis", "porcao"}
UNIDADES_REVENDA = {"un", "und", "unidade", "unidades", "lata", "garrafa"}
PRODUCAO_MINIMA_SE_RECOMENDADO = 5
MAXIMO_PRODUTOS_PRINCIPAIS = 4
MAXIMO_COMPLEMENTOS_RECOMENDADOS = 2
COMPLEMENTO_MAXIMO_PROPORCAO_PRINCIPAIS = 0.45

class RecomendacaoService:
    def __init__(self):
        self.repository = RecomendacaoRepository()

    def gerar_recomendacao(
        self, db: Session, parametros: RecomendacaoParametros, usuario_id: int
    ) -> Recomendacao:
        # Busca produtos elegiveis
        produtos = (
            db.query(Produto)
            .options(
                joinedload(Produto.categoria),
                joinedload(Produto.itens_ficha_tecnica).joinedload(ItemFichaTecnica.insumo),
                joinedload(Produto.itens_ficha_tecnica).joinedload(ItemFichaTecnica.unidade_medida),
            )
            .filter(Produto.status == StatusProduto.ATIVO)
            .all()
        )
        
        # Filtra produtos que fazem sentido para planejamento de producao.
        # Bebidas industrializadas ficam fora porque nao disputam preparo de cozinha
        # e tendem a dominar a otimizacao por terem ficha tecnica simples.
        produtos_preparaveis = [
            p
            for p in produtos
            if p.itens_ficha_tecnica
            and Decimal(p.margem_estimada) > Decimal("0")
            and _produto_exige_preparo(p)
        ]

        produtos_principais = [
            p for p in produtos_preparaveis if not _produto_e_complemento(p)
        ]
        produtos_complementares = [
            p for p in produtos_preparaveis if _produto_e_complemento(p)
        ]

        produtos_elegiveis = sorted(
            produtos_principais,
            key=lambda produto: Decimal(produto.margem_estimada),
            reverse=True,
        )[:MAXIMO_PRODUTOS_PRINCIPAIS]
        produtos_elegiveis += sorted(
            produtos_complementares,
            key=lambda produto: Decimal(produto.margem_estimada),
            reverse=True,
        )[:MAXIMO_COMPLEMENTOS_RECOMENDADOS]

        vendas_hoje = _vendas_concluidas_hoje_por_produto(db)
        produtos_elegiveis_ids = {produto.id for produto in produtos_elegiveis}
        itens_preparaveis_vendidos_hoje = sum(
            quantidade
            for produto_id, quantidade in vendas_hoje.items()
            if produto_id in produtos_elegiveis_ids
        )
        capacidade_disponivel = max(parametros.capacidade_diaria - itens_preparaveis_vendidos_hoje, 0)
        
        # Coleta os insumos
        insumos = db.query(Insumo).all()
        estoque_insumos: Dict[int, Decimal] = {
            i.id: (i.quantidade_estoque if i.quantidade_estoque else Decimal(0))
            for i in insumos
        }
        
        demanda_produtos: Dict[int, int] = {}
        for p in produtos_elegiveis:
            # Aqui deveríamos buscar do historico (vendas reais), mas para MVP a gente usa fallback ou campo do produto se não tiver vendas suficientes.
            vendidos_hoje = vendas_hoje.get(p.id, 0)
            demanda_produtos[p.id] = max(p.demanda_esperada_diaria - vendidos_hoje, 0)
            
        prob = LpProblem("Maximizacao_Lucro_Producao", LpMaximize)
        
        # Variaveis de decisao
        x_vars = {}
        y_vars = {}
        for p in produtos_elegiveis:
            var_name = f"x_{p.id}"
            x_vars[p.id] = LpVariable(name=var_name, lowBound=0, cat="Integer")
            y_vars[p.id] = LpVariable(name=f"y_{p.id}", lowBound=0, upBound=1, cat="Binary")
            
        # Funcao Objetivo
        prob += lpSum([x_vars[p.id] * float(p.margem_estimada) for p in produtos_elegiveis]), "Lucro_Total"
        
        # Restricao: Demanda
        for p in produtos_elegiveis:
            demanda_maxima = demanda_produtos.get(p.id, 0)
            prob += x_vars[p.id] <= demanda_maxima, f"Demanda_Max_{p.id}"
            prob += x_vars[p.id] <= demanda_maxima * y_vars[p.id], f"Ativa_Produto_{p.id}"
            if demanda_maxima >= PRODUCAO_MINIMA_SE_RECOMENDADO:
                prob += x_vars[p.id] >= PRODUCAO_MINIMA_SE_RECOMENDADO * y_vars[p.id], f"Minimo_Produto_{p.id}"
            
        # Restricao: Capacidade da Cozinha
        prob += lpSum([x_vars[p.id] for p in produtos_elegiveis]) <= capacidade_disponivel, "Capacidade_Cozinha"

        produtos_principais_ids = [p.id for p in produtos_elegiveis if not _produto_e_complemento(p)]
        produtos_complementares_ids = [p.id for p in produtos_elegiveis if _produto_e_complemento(p)]

        if produtos_principais_ids and produtos_complementares_ids:
            total_principais = lpSum([x_vars[produto_id] for produto_id in produtos_principais_ids])
            total_principais_ativos = lpSum([y_vars[produto_id] for produto_id in produtos_principais_ids])
            total_complementos = lpSum([x_vars[produto_id] for produto_id in produtos_complementares_ids])
            prob += (
                total_complementos <= total_principais * COMPLEMENTO_MAXIMO_PROPORCAO_PRINCIPAIS
            ), "Complementos_Proporcionais_Principais"
            for produto_id in produtos_complementares_ids:
                prob += y_vars[produto_id] <= total_principais_ativos, f"Complemento_Depende_Principal_{produto_id}"
        
        # Restricao: Estoque de Insumos
        # Para cada insumo, a soma do uso em todos os produtos não pode ultrapassar o estoque
        uso_insumo = {i.id: [] for i in insumos}
        for p in produtos_elegiveis:
            for item_ft in p.itens_ficha_tecnica:
                insumo_id = item_ft.insumo_id
                quantidade = float(_quantidade_na_unidade_estoque(item_ft))
                if insumo_id in uso_insumo:
                    uso_insumo[insumo_id].append(x_vars[p.id] * quantidade)
                    
        for i_id, eq_list in uso_insumo.items():
            if eq_list:
                prob += lpSum(eq_list) <= float(estoque_insumos.get(i_id, 0)), f"Estoque_{i_id}"
                
        # Solver
        prob.solve(PULP_CBC_CMD(msg=False))
        
        if LpStatus[prob.status] != "Optimal":
            # Poderiamos falhar, mas deixaremos logado
            logger.warning(f"Solver status: {LpStatus[prob.status]}")
            
        itens_recomendados = []
        lucro_estimado_total = Decimal("0.0")
        capacidade_usada = 0
        
        for p in produtos_elegiveis:
            qtd = int(x_vars[p.id].varValue) if x_vars[p.id].varValue else 0
            if qtd > 0:
                lucro_item = Decimal(str(qtd)) * p.margem_estimada
                lucro_estimado_total += lucro_item
                capacidade_usada += qtd
                
                itens_recomendados.append(
                    ItemRecomendacaoCreate(
                        produto_id=p.id,
                        quantidade_recomendada=qtd,
                        demanda_considerada=demanda_produtos.get(p.id, 0),
                        lucro_unitario=p.margem_estimada
                    )
                )
                
        # Calcula fator de confianca (simplificado MVP)
        fator_confianca = 7 # Média fixa por padrão se não calcular todas as regras
        
        # Identificar Insumos limitantes 
        limitantes = []
        for i_id, eq_list in uso_insumo.items():
            if eq_list:
                uso_total = sum([item.value() for item in eq_list])
                if estoque_insumos.get(i_id, 0) > 0 and uso_total >= (float(estoque_insumos.get(i_id, 0)) * 0.95):
                    limitantes.append(str(i_id))
        
        insumos_limitantes_str = ",".join(limitantes) if limitantes else None
        
        nova_recomendacao = RecomendacaoCreate(
            fator_confianca=fator_confianca,
            lucro_estimado=lucro_estimado_total,
            capacidade_usada=capacidade_usada,
            capacidade_total=capacidade_disponivel,
            periodo_recomendado=parametros.periodo_recomendado,
            insumos_limitantes=insumos_limitantes_str,
            usuario_id=usuario_id,
            itens=itens_recomendados
        )
        
        return self.repository.criar_recomendacao(db, nova_recomendacao)

    def listar_recomendacoes(self, db: Session, skip: int = 0, limit: int = 100) -> List[Recomendacao]:
        return self.repository.listar_recomendacoes(db, skip, limit)

    def obter_recomendacao_por_id(self, db: Session, recomendacao_id: int) -> Recomendacao | None:
        return self.repository.obter_recomendacao_por_id(db, recomendacao_id)


def _produto_e_bebida(produto: Produto) -> bool:
    categoria = produto.categoria
    categoria_texto = _normalizar_texto(
        " ".join(
            item
            for item in [
                categoria.nome if categoria is not None else "",
                categoria.descricao if categoria is not None and categoria.descricao is not None else "",
            ]
            if item
        )
    )
    if any(termo in categoria_texto for termo in BEBIDAS_CATEGORIA_TERMOS):
        return True

    produto_nome = _normalizar_texto(produto.nome)
    tem_termo_bebida = any(termo in produto_nome for termo in BEBIDAS_PRODUTO_TERMOS)
    ficha_de_revenda = len(produto.itens_ficha_tecnica) <= 1
    return tem_termo_bebida and ficha_de_revenda


def _vendas_concluidas_hoje_por_produto(db: Session) -> dict[int, int]:
    agora = datetime.now()
    inicio = datetime.combine(agora.date(), time.min)
    fim = datetime.combine(agora.date(), time.max)

    linhas = db.execute(
        select(ItemVenda.produto_id, func.coalesce(func.sum(ItemVenda.quantidade), 0))
        .join(Venda, Venda.id == ItemVenda.venda_id)
        .where(Venda.status == StatusVenda.CONCLUIDA)
        .where(Venda.criado_em >= inicio)
        .where(Venda.criado_em <= fim)
        .group_by(ItemVenda.produto_id)
    ).all()

    return {int(produto_id): int(quantidade) for produto_id, quantidade in linhas}


def _produto_exige_preparo(produto: Produto) -> bool:
    if _produto_e_bebida(produto):
        return False
    return not _produto_e_revenda_simples(produto)


def _produto_e_complemento(produto: Produto) -> bool:
    categoria = produto.categoria
    categoria_texto = _normalizar_texto(
        " ".join(
            item
            for item in [
                categoria.nome if categoria is not None else "",
                categoria.descricao if categoria is not None and categoria.descricao is not None else "",
            ]
            if item
        )
    )
    produto_nome = _normalizar_texto(produto.nome)
    return any(termo in categoria_texto for termo in COMPLEMENTO_CATEGORIA_TERMOS) or any(
        termo in produto_nome for termo in COMPLEMENTO_PRODUTO_TERMOS
    )


def _produto_e_revenda_simples(produto: Produto) -> bool:
    if len(produto.itens_ficha_tecnica) != 1:
        return False

    item = produto.itens_ficha_tecnica[0]
    unidade_item = _normalizar_texto(item.unidade_medida.sigla if item.unidade_medida else "")
    unidade_estoque = _normalizar_texto(
        item.insumo.unidade_medida.sigla
        if item.insumo is not None and item.insumo.unidade_medida is not None
        else unidade_item
    )
    quantidade = Decimal(item.quantidade)
    nome_produto = _normalizar_texto(produto.nome)
    nome_insumo = _normalizar_texto(item.insumo.nome if item.insumo is not None else "")

    mesma_unidade_de_revenda = unidade_item in UNIDADES_REVENDA and unidade_estoque in UNIDADES_REVENDA
    mesmo_item = nome_insumo and (nome_insumo in nome_produto or nome_produto in nome_insumo)
    return quantidade == Decimal("1") and mesma_unidade_de_revenda and mesmo_item


def _normalizar_texto(valor: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", valor).encode("ascii", "ignore").decode("ascii")
    return sem_acento.strip().lower()


def _quantidade_na_unidade_estoque(item_ficha) -> Decimal:
    quantidade = Decimal(item_ficha.quantidade)
    unidade_item = item_ficha.unidade_medida.sigla if item_ficha.unidade_medida is not None else ""
    unidade_estoque = (
        item_ficha.insumo.unidade_medida.sigla
        if item_ficha.insumo is not None and item_ficha.insumo.unidade_medida is not None
        else unidade_item
    )

    if unidade_item == "g" and unidade_estoque == "kg":
        return quantidade / Decimal("1000")
    if unidade_item == "ml" and unidade_estoque == "L":
        return quantidade / Decimal("1000")
    return quantidade
