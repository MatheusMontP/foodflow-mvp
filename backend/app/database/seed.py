from decimal import Decimal

from sqlalchemy.orm import Session

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
