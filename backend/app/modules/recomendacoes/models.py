from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

class Recomendacao(Base):
    __tablename__ = "recomendacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fator_confianca: Mapped[int] = mapped_column(Integer, nullable=False) # 0 a 10
    lucro_estimado: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    capacidade_usada: Mapped[int] = mapped_column(Integer, nullable=False)
    capacidade_total: Mapped[int] = mapped_column(Integer, nullable=False)
    periodo_recomendado: Mapped[str] = mapped_column(String(50), nullable=False) # Ex: "Hoje", "Amanha"
    insumos_limitantes: Mapped[str | None] = mapped_column(Text, nullable=True) # Nome dos insumos separados por virgula
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario")
    itens = relationship(
        "ItemRecomendacao",
        back_populates="recomendacao",
        cascade="all, delete-orphan",
    )

class ItemRecomendacao(Base):
    __tablename__ = "itens_recomendacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recomendacao_id: Mapped[int] = mapped_column(ForeignKey("recomendacoes.id"), nullable=False)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    quantidade_recomendada: Mapped[int] = mapped_column(Integer, nullable=False)
    demanda_considerada: Mapped[int] = mapped_column(Integer, nullable=False)
    lucro_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recomendacao = relationship("Recomendacao", back_populates="itens")
    produto = relationship("Produto")
