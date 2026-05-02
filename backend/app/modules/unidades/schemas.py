from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class UnidadeMedidaCriar(BaseModel):
    nome: str = Field(min_length=1, max_length=80)
    sigla: str = Field(min_length=1, max_length=20)


class UnidadeMedidaResponse(BaseModel):
    id: int
    nome: str
    sigla: str
    personalizada: bool
    ativa: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


class ConversaoUnidadeCriar(BaseModel):
    unidade_origem_id: int
    unidade_destino_id: int
    fator: Decimal = Field(gt=0, decimal_places=6)


class ConversaoUnidadeResponse(BaseModel):
    id: int
    unidade_origem_id: int
    unidade_destino_id: int
    fator: Decimal
    automatica: bool
    ativa: bool
    criado_em: datetime

    model_config = {"from_attributes": True}

