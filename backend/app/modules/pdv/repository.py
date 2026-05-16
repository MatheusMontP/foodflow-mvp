from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.pdv.models import Venda


def buscar_venda_por_id(sessao: Session, venda_id: int) -> Venda | None:
    return sessao.scalar(
        select(Venda)
        .options(selectinload(Venda.itens))
        .where(Venda.id == venda_id)
    )


def contar_vendas_por_prefixo(sessao: Session, prefixo: str) -> int:
    return sessao.scalar(
        select(func.count()).select_from(Venda).where(Venda.numero_pedido.like(f"{prefixo}-%"))
    ) or 0


def listar_vendas(sessao: Session) -> list[Venda]:
    return list(
        sessao.scalars(
            select(Venda)
            .options(selectinload(Venda.itens))
            .order_by(Venda.id.desc())
        )
    )


def salvar_venda(sessao: Session, venda: Venda) -> Venda:
    sessao.add(venda)
    sessao.flush()
    sessao.refresh(venda)
    return venda
