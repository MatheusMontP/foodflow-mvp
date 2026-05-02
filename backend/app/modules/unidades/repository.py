from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.unidades.models import ConversaoUnidade, UnidadeMedida


def buscar_unidade_por_id(sessao: Session, unidade_id: int) -> UnidadeMedida | None:
    return sessao.get(UnidadeMedida, unidade_id)


def buscar_unidade_por_sigla(sessao: Session, sigla: str) -> UnidadeMedida | None:
    return sessao.scalar(select(UnidadeMedida).where(UnidadeMedida.sigla == sigla.strip()))


def listar_unidades(sessao: Session) -> list[UnidadeMedida]:
    return list(sessao.scalars(select(UnidadeMedida).order_by(UnidadeMedida.nome)))


def salvar_unidade(sessao: Session, unidade: UnidadeMedida) -> UnidadeMedida:
    sessao.add(unidade)
    sessao.commit()
    sessao.refresh(unidade)
    return unidade


def buscar_conversao(
    sessao: Session,
    unidade_origem_id: int,
    unidade_destino_id: int,
) -> ConversaoUnidade | None:
    return sessao.scalar(
        select(ConversaoUnidade).where(
            ConversaoUnidade.unidade_origem_id == unidade_origem_id,
            ConversaoUnidade.unidade_destino_id == unidade_destino_id,
        )
    )


def listar_conversoes(sessao: Session) -> list[ConversaoUnidade]:
    return list(sessao.scalars(select(ConversaoUnidade).order_by(ConversaoUnidade.id)))


def salvar_conversao(sessao: Session, conversao: ConversaoUnidade) -> ConversaoUnidade:
    sessao.add(conversao)
    sessao.commit()
    sessao.refresh(conversao)
    return conversao

