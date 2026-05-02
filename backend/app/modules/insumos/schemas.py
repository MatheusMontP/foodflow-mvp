from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class InsumoCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=140)
    unidade_medida_id: int
    custo_unitario: Decimal = Field(ge=0, decimal_places=2)
    estoque_inicial: Decimal = Field(default=0, ge=0, decimal_places=3)
    estoque_minimo: Decimal = Field(default=0, ge=0, decimal_places=3)


class InsumoResponse(BaseModel):
    id: int
    nome: str
    unidade_medida_id: int
    custo_unitario: Decimal
    quantidade_estoque: Decimal
    estoque_minimo: Decimal
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


class ConversaoCompraInsumoCriar(BaseModel):
    unidade_compra_id: int
    quantidade_equivalente: Decimal = Field(gt=0, decimal_places=3)


class ConversaoCompraInsumoResponse(BaseModel):
    id: int
    insumo_id: int
    unidade_compra_id: int
    unidade_estoque_id: int
    quantidade_equivalente: Decimal
    ativa: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
