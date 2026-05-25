import logging
from decimal import Decimal
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from pulp import LpProblem, LpMaximize, LpVariable, lpSum, LpStatus, LpStatusOptimal, PULP_CBC_CMD

from app.modules.recomendacoes.models import Recomendacao
from app.modules.recomendacoes.schemas import RecomendacaoCreate, RecomendacaoParametros, ItemRecomendacaoCreate
from app.modules.recomendacoes.repository import RecomendacaoRepository
from app.modules.produtos.models import Produto, StatusProduto
from app.modules.insumos.models import Insumo

logger = logging.getLogger(__name__)

class RecomendacaoService:
    def __init__(self):
        self.repository = RecomendacaoRepository()

    def gerar_recomendacao(
        self, db: Session, parametros: RecomendacaoParametros, usuario_id: int
    ) -> Recomendacao:
        # Busca produtos elegiveis
        produtos = (
            db.query(Produto)
            .filter(Produto.status == StatusProduto.ATIVO)
            .all()
        )
        
        # Filtra produtos que possuem ficha tecnica
        produtos_elegiveis = [p for p in produtos if p.itens_ficha_tecnica]
        
        # Coleta os insumos
        insumos = db.query(Insumo).all()
        estoque_insumos: Dict[int, Decimal] = {
            i.id: (i.estoque_atual if i.estoque_atual else Decimal(0))
            for i in insumos
        }
        
        demanda_produtos: Dict[int, int] = {}
        for p in produtos_elegiveis:
            # Aqui deveríamos buscar do historico (vendas reais), mas para MVP a gente usa fallback ou campo do produto se não tiver vendas suficientes.
            demanda_produtos[p.id] = p.demanda_esperada_diaria
            
        prob = LpProblem("Maximizacao_Lucro_Producao", LpMaximize)
        
        # Variaveis de decisao
        x_vars = {}
        for p in produtos_elegiveis:
            var_name = f"x_{p.id}"
            x_vars[p.id] = LpVariable(name=var_name, lowBound=0, cat="Integer")
            
        # Funcao Objetivo
        prob += lpSum([x_vars[p.id] * float(p.margem_estimada) for p in produtos_elegiveis]), "Lucro_Total"
        
        # Restricao: Demanda
        for p in produtos_elegiveis:
            demanda_maxima = demanda_produtos.get(p.id, 0)
            prob += x_vars[p.id] <= demanda_maxima, f"Demanda_Max_{p.id}"
            
        # Restricao: Capacidade da Cozinha
        prob += lpSum([x_vars[p.id] for p in produtos_elegiveis]) <= parametros.capacidade_diaria, "Capacidade_Cozinha"
        
        # Restricao: Estoque de Insumos
        # Para cada insumo, a soma do uso em todos os produtos não pode ultrapassar o estoque
        uso_insumo = {i.id: [] for i in insumos}
        for p in produtos_elegiveis:
            for item_ft in p.itens_ficha_tecnica:
                insumo_id = item_ft.insumo_id
                quantidade = float(item_ft.quantidade)
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
            capacidade_total=parametros.capacidade_diaria,
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
