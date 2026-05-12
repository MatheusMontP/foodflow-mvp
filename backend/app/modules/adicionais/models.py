from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Adicional(Base):
    __tablename__ = "adicionais"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    preco_extra: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    categorias_permitidas = relationship(
        "AdicionalCategoria",
        back_populates="adicional",
        cascade="all, delete-orphan",
    )
    itens_ficha_tecnica = relationship(
        "ItemFichaTecnicaAdicional",
        back_populates="adicional",
        cascade="all, delete-orphan",
    )


class AdicionalCategoria(Base):
    __tablename__ = "adicionais_categorias"
    __table_args__ = (
        UniqueConstraint("adicional_id", "categoria_id", name="uq_adicional_categoria"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    adicional_id: Mapped[int] = mapped_column(ForeignKey("adicionais.id"), nullable=False)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)

    adicional = relationship("Adicional", back_populates="categorias_permitidas")
    categoria = relationship("Categoria")


class ItemFichaTecnicaAdicional(Base):
    __tablename__ = "itens_ficha_tecnica_adicional"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    adicional_id: Mapped[int] = mapped_column(ForeignKey("adicionais.id"), nullable=False)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    unidade_medida_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    adicional = relationship("Adicional", back_populates="itens_ficha_tecnica")
    insumo = relationship("Insumo")
    unidade_medida = relationship("UnidadeMedida")
