from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.insumos.models import ConversaoCompraInsumo, Insumo


def buscar_insumo_por_nome(sessao: Session, nome: str) -> Insumo | None:
    return sessao.scalar(select(Insumo).where(Insumo.nome == nome.strip()))


def listar_insumos(sessao: Session) -> list[Insumo]:
    return list(sessao.scalars(select(Insumo).order_by(Insumo.nome)))


def buscar_insumo_por_id(sessao: Session, insumo_id: int) -> Insumo | None:
    return sessao.get(Insumo, insumo_id)


def salvar_insumo(sessao: Session, insumo: Insumo) -> Insumo:
    sessao.add(insumo)
    sessao.flush()
    sessao.refresh(insumo)
    return insumo


def buscar_conversao_compra(
    sessao: Session,
    insumo_id: int,
    unidade_compra_id: int,
) -> ConversaoCompraInsumo | None:
    return sessao.scalar(
        select(ConversaoCompraInsumo).where(
            ConversaoCompraInsumo.insumo_id == insumo_id,
            ConversaoCompraInsumo.unidade_compra_id == unidade_compra_id,
            ConversaoCompraInsumo.ativa.is_(True),
        )
    )


def listar_conversoes_compra(sessao: Session, insumo_id: int) -> list[ConversaoCompraInsumo]:
    return list(
        sessao.scalars(
            select(ConversaoCompraInsumo)
            .where(ConversaoCompraInsumo.insumo_id == insumo_id)
            .order_by(ConversaoCompraInsumo.id)
        )
    )


def salvar_conversao_compra(
    sessao: Session,
    conversao: ConversaoCompraInsumo,
) -> ConversaoCompraInsumo:
    sessao.add(conversao)
    sessao.commit()
    sessao.refresh(conversao)
    return conversao
