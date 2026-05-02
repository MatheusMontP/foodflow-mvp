from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TipoMovimentacaoEstoque(str, Enum):
    ENTRADA = "ENTRADA"
    SAIDA_VENDA = "SAIDA_VENDA"
    AJUSTE_MANUAL = "AJUSTE_MANUAL"
    PERDA_DESPERDICIO = "PERDA_DESPERDICIO"
    DEVOLUCAO_CANCELAMENTO = "DEVOLUCAO_CANCELAMENTO"


class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    tipo: Mapped[TipoMovimentacaoEstoque] = mapped_column(SqlEnum(TipoMovimentacaoEstoque), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    estoque_antes: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    estoque_depois: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    insumo = relationship("Insumo", back_populates="movimentacoes")

