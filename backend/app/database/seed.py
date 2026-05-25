from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import gerar_hash_senha
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.categorias.models import Categoria
from app.modules.estoque.models import MovimentacaoEstoque, TipoMovimentacaoEstoque
from app.modules.insumos.models import Insumo
from app.modules.produtos.models import ItemFichaTecnica, Produto, StatusProduto
from app.modules.unidades.models import ConversaoUnidade, UnidadeMedida
from app.modules.unidades.repository import buscar_conversao, buscar_unidade_por_sigla


UNIDADES_PADRAO = [
    ("quilograma", "kg"),
    ("grama", "g"),
    ("litro", "L"),
    ("mililitro", "ml"),
    ("unidade", "unidade"),
    ("pacote", "pacote"),
    ("caixa", "caixa"),
    ("duzia", "duzia"),
    ("lata", "lata"),
    ("garrafa", "garrafa"),
    ("sache", "sache"),
    ("bandeja", "bandeja"),
]


def criar_dados_iniciais(sessao: Session) -> None:
    unidades = {}

    for nome, sigla in UNIDADES_PADRAO:
        unidade = buscar_unidade_por_sigla(sessao, sigla)
        if unidade is None:
            unidade = UnidadeMedida(
                nome=nome,
                sigla=sigla,
                personalizada=False,
                ativa=True,
            )
            sessao.add(unidade)
            sessao.flush()

        unidades[sigla] = unidade

    _criar_conversao_automatica(sessao, unidades["kg"].id, unidades["g"].id, Decimal("1000"))
    _criar_conversao_automatica(sessao, unidades["L"].id, unidades["ml"].id, Decimal("1000"))

    usuarios = _criar_usuarios_demo(sessao)
    categorias = _criar_categorias_demo(sessao)
    insumos = _criar_insumos_demo(sessao, unidades, usuarios["owner"].id)
    _criar_produtos_demo(sessao, categorias, insumos, unidades)

    sessao.commit()


def _criar_conversao_automatica(
    sessao: Session,
    unidade_origem_id: int,
    unidade_destino_id: int,
    fator: Decimal,
) -> None:
    if buscar_conversao(sessao, unidade_origem_id, unidade_destino_id) is not None:
        return

    sessao.add(
        ConversaoUnidade(
            unidade_origem_id=unidade_origem_id,
            unidade_destino_id=unidade_destino_id,
            fator=fator,
            automatica=True,
            ativa=True,
        )
    )


def _criar_usuarios_demo(sessao: Session) -> dict[str, Usuario]:
    dados = {
        "owner": ("Owner FoodFlow", "owner@example.com", PapelUsuario.OWNER),
        "gerente": ("Gerente FoodFlow", "gerente@example.com", PapelUsuario.MANAGER),
        "caixa": ("Caixa FoodFlow", "caixa@example.com", PapelUsuario.CASHIER),
    }
    usuarios = {}

    for chave, (nome, email, papel) in dados.items():
        usuario = sessao.scalar(select(Usuario).where(Usuario.email == email))
        if usuario is None:
            usuario = Usuario(
                nome=nome,
                email=email,
                senha_hash=gerar_hash_senha("12345678"),
                papel=papel,
                ativo=True,
            )
            sessao.add(usuario)
            sessao.flush()
        usuarios[chave] = usuario

    return usuarios


def _criar_categorias_demo(sessao: Session) -> dict[str, Categoria]:
    dados = {
        "lanches": ("Lanches", "Hamburgueres e sanduiches"),
        "porcoes": ("Porcoes", "Porcoes e acompanhamentos"),
        "bebidas": ("Bebidas", "Bebidas geladas"),
    }
    categorias = {}

    for chave, (nome, descricao) in dados.items():
        categoria = sessao.scalar(select(Categoria).where(Categoria.nome == nome))
        if categoria is None:
            categoria = Categoria(nome=nome, descricao=descricao, ativo=True)
            sessao.add(categoria)
            sessao.flush()
        categorias[chave] = categoria

    return categorias


def _criar_insumos_demo(
    sessao: Session,
    unidades: dict[str, UnidadeMedida],
    usuario_id: int | None,
) -> dict[str, Insumo]:
    dados = {
        "pao": ("Pao de hamburguer", "unidade", Decimal("1.20"), Decimal("120"), Decimal("30")),
        "hamburguer": ("Hamburguer 180g", "unidade", Decimal("4.50"), Decimal("80"), Decimal("20")),
        "queijo": ("Queijo cheddar", "kg", Decimal("35.00"), Decimal("8"), Decimal("2")),
        "bacon": ("Bacon", "kg", Decimal("45.00"), Decimal("5"), Decimal("1")),
        "alface": ("Alface", "unidade", Decimal("3.00"), Decimal("25"), Decimal("8")),
        "tomate": ("Tomate", "kg", Decimal("8.00"), Decimal("10"), Decimal("3")),
        "batata": ("Batata congelada", "kg", Decimal("12.00"), Decimal("20"), Decimal("5")),
        "oleo": ("Oleo de fritura", "L", Decimal("9.00"), Decimal("18"), Decimal("5")),
        "coca": ("Coca-Cola lata", "unidade", Decimal("3.00"), Decimal("96"), Decimal("24")),
    }
    insumos = {}

    for chave, (nome, sigla_unidade, custo, estoque, minimo) in dados.items():
        insumo = sessao.scalar(select(Insumo).where(Insumo.nome == nome))
        if insumo is None:
            insumo = Insumo(
                nome=nome,
                unidade_medida_id=unidades[sigla_unidade].id,
                custo_unitario=custo,
                quantidade_estoque=estoque,
                estoque_minimo=minimo,
                ativo=True,
            )
            sessao.add(insumo)
            sessao.flush()
            sessao.add(
                MovimentacaoEstoque(
                    insumo_id=insumo.id,
                    usuario_id=usuario_id,
                    tipo=TipoMovimentacaoEstoque.ENTRADA,
                    quantidade=estoque,
                    estoque_antes=Decimal("0"),
                    estoque_depois=estoque,
                    motivo="Pre-cadastro inicial do FoodFlow",
                )
            )
        insumos[chave] = insumo

    return insumos


def _criar_produtos_demo(
    sessao: Session,
    categorias: dict[str, Categoria],
    insumos: dict[str, Insumo],
    unidades: dict[str, UnidadeMedida],
) -> None:
    produtos = [
        (
            "X-Bacon",
            "Hamburguer com queijo cheddar e bacon",
            categorias["lanches"].id,
            Decimal("22.90"),
            30,
            [
                ("pao", Decimal("1"), "unidade", False),
                ("hamburguer", Decimal("1"), "unidade", False),
                ("queijo", Decimal("30"), "g", False),
                ("bacon", Decimal("25"), "g", False),
            ],
        ),
        (
            "X-Salada",
            "Hamburguer com queijo, alface e tomate",
            categorias["lanches"].id,
            Decimal("18.90"),
            24,
            [
                ("pao", Decimal("1"), "unidade", False),
                ("hamburguer", Decimal("1"), "unidade", False),
                ("queijo", Decimal("25"), "g", False),
                ("alface", Decimal("1"), "unidade", True),
                ("tomate", Decimal("40"), "g", True),
            ],
        ),
        (
            "Batata Frita G",
            "Porcao grande de batata frita",
            categorias["porcoes"].id,
            Decimal("22.90"),
            18,
            [
                ("batata", Decimal("300"), "g", False),
                ("oleo", Decimal("25"), "ml", False),
            ],
        ),
        (
            "Coca-Cola Lata",
            "Refrigerante lata 350ml",
            categorias["bebidas"].id,
            Decimal("6.90"),
            40,
            [("coca", Decimal("1"), "unidade", False)],
        ),
    ]

    for nome, descricao, categoria_id, preco, demanda, ficha in produtos:
        produto = sessao.scalar(select(Produto).where(Produto.nome == nome))
        if produto is not None:
            continue

        produto = Produto(
            nome=nome,
            descricao=descricao,
            categoria_id=categoria_id,
            preco_venda=preco,
            custo_ficha_tecnica=Decimal("0"),
            margem_estimada=preco,
            demanda_esperada_diaria=demanda,
            status=StatusProduto.ATIVO,
        )
        sessao.add(produto)
        sessao.flush()

        custo = Decimal("0")
        for chave_insumo, quantidade, sigla_unidade, removivel in ficha:
            insumo = insumos[chave_insumo]
            sessao.add(
                ItemFichaTecnica(
                    produto_id=produto.id,
                    insumo_id=insumo.id,
                    quantidade=quantidade,
                    unidade_medida_id=unidades[sigla_unidade].id,
                    removivel=removivel,
                )
            )
            custo += _converter_custo_demo(insumo, quantidade, sigla_unidade)

        produto.custo_ficha_tecnica = custo.quantize(Decimal("0.01"))
        produto.margem_estimada = (preco - produto.custo_ficha_tecnica).quantize(Decimal("0.01"))


def _converter_custo_demo(insumo: Insumo, quantidade: Decimal, sigla_unidade_item: str) -> Decimal:
    unidade = insumo.unidade_medida.sigla if insumo.unidade_medida is not None else sigla_unidade_item
    quantidade_base = quantidade

    if sigla_unidade_item == "g" and unidade == "kg":
        quantidade_base = quantidade / Decimal("1000")
    elif sigla_unidade_item == "ml" and unidade == "L":
        quantidade_base = quantidade / Decimal("1000")

    return quantidade_base * Decimal(insumo.custo_unitario)
