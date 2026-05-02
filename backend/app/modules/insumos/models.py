from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Insumo(Base):
    __tablename__ = "insumos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    unidade_medida_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    custo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantidade_estoque: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0, nullable=False)
    estoque_minimo: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    unidade_medida = relationship("UnidadeMedida")
    movimentacoes = relationship("MovimentacaoEstoque", back_populates="insumo")
    conversoes_compra = relationship("ConversaoCompraInsumo", back_populates="insumo")


class ConversaoCompraInsumo(Base):
    __tablename__ = "conversoes_compra_insumo"
    __table_args__ = (
        UniqueConstraint("insumo_id", "unidade_compra_id", name="uq_conversao_compra_insumo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False)
    unidade_compra_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    unidade_estoque_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    quantidade_equivalente: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    insumo = relationship("Insumo", back_populates="conversoes_compra")
    unidade_compra = relationship("UnidadeMedida", foreign_keys=[unidade_compra_id])
    unidade_estoque = relationship("UnidadeMedida", foreign_keys=[unidade_estoque_id])
