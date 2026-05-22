from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class EscopoPromocao(str, Enum):
    PRODUTO = "PRODUTO"
    CATEGORIA = "CATEGORIA"
    VENDA = "VENDA"


class TipoDesconto(str, Enum):
    PERCENTUAL = "PERCENTUAL"
    VALOR_FIXO = "VALOR_FIXO"


class Promocao(Base):
    __tablename__ = "promocoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    escopo: Mapped[EscopoPromocao] = mapped_column(SqlEnum(EscopoPromocao), nullable=False)
    tipo_desconto: Mapped[TipoDesconto] = mapped_column(SqlEnum(TipoDesconto), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    produto_id: Mapped[int | None] = mapped_column(ForeignKey("produtos.id"), nullable=True)
    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id"), nullable=True)
    inicio_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fim_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    produto = relationship("Produto")
    categoria = relationship("Categoria")
