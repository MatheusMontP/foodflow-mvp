from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.estoque.models import MovimentacaoEstoque


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
