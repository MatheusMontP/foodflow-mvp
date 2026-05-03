from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class StatusProduto(str, Enum):
    RASCUNHO = "RASCUNHO"
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    custo_ficha_tecnica: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    margem_estimada: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    demanda_esperada_diaria: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[StatusProduto] = mapped_column(
        SqlEnum(StatusProduto),
        default=StatusProduto.RASCUNHO,
        nullable=False,
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    categoria = relationship("Categoria")
    itens_ficha_tecnica = relationship(
        "ItemFichaTecnica",
        back_populates="produto",
        cascade="all, delete-orphan",
    )


class ItemFichaTecnica(Base):
    __tablename__ = "itens_ficha_tecnica"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    unidade_medida_id: Mapped[int] = mapped_column(ForeignKey("unidades_medida.id"), nullable=False)
    removivel: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    produto = relationship("Produto", back_populates="itens_ficha_tecnica")
    insumo = relationship("Insumo")
    unidade_medida = relationship("UnidadeMedida")
