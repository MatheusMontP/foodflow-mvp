from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UnidadeMedida(Base):
    __tablename__ = "unidades_medida"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    sigla: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    personalizada: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ConversaoUnidade(Base):
    __tablename__ = "conversoes_unidade"
    __table_args__ = (
        UniqueConstraint("unidade_origem_id", "unidade_destino_id", name="uq_conversao_unidade"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unidade_origem_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    unidade_destino_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    fator: Mapped[Decimal] = mapped_column(Numeric(14, 6), nullable=False)
    automatica: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    unidade_origem: Mapped[UnidadeMedida] = relationship(foreign_keys=[unidade_origem_id])
    unidade_destino: Mapped[UnidadeMedida] = relationship(foreign_keys=[unidade_destino_id])
