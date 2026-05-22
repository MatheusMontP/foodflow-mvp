from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.estoque.models import ConferenciaEstoqueDiaria, MovimentacaoEstoque


def salvar_movimentacao(sessao: Session, movimentacao: MovimentacaoEstoque) -> MovimentacaoEstoque:
    sessao.add(movimentacao)
    sessao.flush()
    sessao.refresh(movimentacao)
    return movimentacao


def atualizar_estoque_insumo(sessao: Session, insumo) -> None:
    sessao.add(insumo)
    sessao.flush()


def listar_movimentacoes(sessao: Session) -> list[MovimentacaoEstoque]:
    return list(sessao.scalars(select(MovimentacaoEstoque).order_by(MovimentacaoEstoque.id.desc())))


def listar_movimentacoes_por_venda(sessao: Session, venda_id: int, numero_pedido: str) -> list[MovimentacaoEstoque]:
    return list(
        sessao.scalars(
            select(MovimentacaoEstoque)
            .where(
                (MovimentacaoEstoque.venda_id == venda_id)
                | (MovimentacaoEstoque.motivo == f"Venda {numero_pedido}")
            )
            .order_by(MovimentacaoEstoque.id)
        )
    )


def buscar_conferencia_por_data(sessao: Session, data: date) -> ConferenciaEstoqueDiaria | None:
    return sessao.scalar(select(ConferenciaEstoqueDiaria).where(ConferenciaEstoqueDiaria.data == data))


def salvar_conferencia(sessao: Session, conferencia: ConferenciaEstoqueDiaria) -> ConferenciaEstoqueDiaria:
    sessao.add(conferencia)
    sessao.commit()
    sessao.refresh(conferencia)
    return conferencia


def listar_conferencias(sessao: Session) -> list[ConferenciaEstoqueDiaria]:
    return list(sessao.scalars(select(ConferenciaEstoqueDiaria).order_by(ConferenciaEstoqueDiaria.data.desc())))
