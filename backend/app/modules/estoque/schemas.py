from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.modules.estoque.models import TipoMovimentacaoEstoque


class MovimentacaoEstoqueResponse(BaseModel):
    id: int
    insumo_id: int
    usuario_id: int | None
    venda_id: int | None
    tipo: TipoMovimentacaoEstoque
    quantidade: Decimal
    estoque_antes: Decimal
    estoque_depois: Decimal
    motivo: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class EntradaEstoqueCriar(BaseModel):
    insumo_id: int
    quantidade: Decimal = Field(gt=0, decimal_places=3)
    unidade_compra_id: int | None = None
    quantidade_equivalente_informada: Decimal | None = Field(default=None, gt=0, decimal_places=3)
    motivo: str | None = Field(default=None, max_length=255)


class AjusteEstoqueCriar(BaseModel):
    insumo_id: int
    quantidade_diferenca: Decimal = Field(decimal_places=3)
    motivo: str = Field(min_length=3, max_length=255)


class PerdaEstoqueCriar(BaseModel):
    insumo_id: int
    quantidade: Decimal = Field(gt=0, decimal_places=3)
    motivo: str = Field(min_length=3, max_length=255)


class ConferenciaEstoqueCriar(BaseModel):
    data: date | None = None
    observacao: str | None = Field(default=None, max_length=255)


class ConferenciaEstoqueResponse(BaseModel):
    id: int
    data: date
    usuario_id: int | None
    observacao: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}
