from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FormaPagamento(str, Enum):
    DINHEIRO = "DINHEIRO"
    CARTAO_DEBITO = "CARTAO_DEBITO"
    CARTAO_CREDITO = "CARTAO_CREDITO"
    PIX = "PIX"
    OUTRO = "OUTRO"


class StatusVenda(str, Enum):
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


class Venda(Base):
    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    numero_pedido: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    forma_pagamento: Mapped[FormaPagamento] = mapped_column(SqlEnum(FormaPagamento), nullable=False)
    status: Mapped[StatusVenda] = mapped_column(
        SqlEnum(StatusVenda),
        default=StatusVenda.CONCLUIDA,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    desconto_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    promocoes_resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    itens = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")


class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas.id"), nullable=False)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    nome_produto: Mapped[str] = mapped_column(String(140), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    desconto_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    preco_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    promocao_resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    adicionais_resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    remocoes_resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    venda = relationship("Venda", back_populates="itens")
    produto = relationship("Produto")
