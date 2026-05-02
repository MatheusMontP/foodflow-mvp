from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.unidades.models import ConversaoUnidade, UnidadeMedida
from app.modules.unidades.repository import (
    buscar_conversao,
    buscar_unidade_por_id,
    buscar_unidade_por_sigla,
    listar_conversoes,
    listar_unidades,
    salvar_conversao,
    salvar_unidade,
)
from app.modules.unidades.schemas import ConversaoUnidadeCriar, UnidadeMedidaCriar


def criar_unidade(sessao: Session, dados: UnidadeMedidaCriar) -> UnidadeMedida:
    sigla = dados.sigla.strip()
    if buscar_unidade_por_sigla(sessao, sigla) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe unidade com esta sigla.",
        )

    return salvar_unidade(
        sessao,
        UnidadeMedida(
            nome=dados.nome.strip(),
            sigla=sigla,
            personalizada=True,
            ativa=True,
        ),
    )


def obter_unidades(sessao: Session) -> list[UnidadeMedida]:
    return listar_unidades(sessao)


def criar_conversao(sessao: Session, dados: ConversaoUnidadeCriar) -> ConversaoUnidade:
    if dados.unidade_origem_id == dados.unidade_destino_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unidade de origem e destino devem ser diferentes.",
        )

    origem = buscar_unidade_por_id(sessao, dados.unidade_origem_id)
    destino = buscar_unidade_por_id(sessao, dados.unidade_destino_id)
    if origem is None or destino is None or not origem.ativa or not destino.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade de origem ou destino nao encontrada.",
        )

    if buscar_conversao(sessao, dados.unidade_origem_id, dados.unidade_destino_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe conversao entre estas unidades.",
        )

    return salvar_conversao(
        sessao,
        ConversaoUnidade(
            unidade_origem_id=dados.unidade_origem_id,
            unidade_destino_id=dados.unidade_destino_id,
            fator=Decimal(dados.fator),
            automatica=False,
            ativa=True,
        ),
    )


def obter_conversoes(sessao: Session) -> list[ConversaoUnidade]:
    return listar_conversoes(sessao)

