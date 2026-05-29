from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class ItemRecomendacaoBase(BaseModel):
    produto_id: int
    quantidade_recomendada: int
    demanda_considerada: int
    lucro_unitario: Decimal

class ItemRecomendacaoCreate(ItemRecomendacaoBase):
    pass

class ItemRecomendacaoResponse(ItemRecomendacaoBase):
    id: int
    recomendacao_id: int
    criado_em: datetime
    produto_nome: str | None = None
    tipo_recomendacao: str | None = None
    acao_sugerida: str | None = None
    desconto_seguro_valor: Decimal | None = None
    desconto_seguro_percentual: Decimal | None = None

    class Config:
        from_attributes = True


class RecomendacaoBase(BaseModel):
    fator_confianca: int
    lucro_estimado: Decimal
    capacidade_usada: int
    capacidade_total: int
    periodo_recomendado: str
    insumos_limitantes: Optional[str] = None
    usuario_id: int

class RecomendacaoCreate(RecomendacaoBase):
    itens: List[ItemRecomendacaoCreate]

class RecomendacaoResponse(RecomendacaoBase):
    id: int
    criado_em: datetime
    itens: List[ItemRecomendacaoResponse]
    usuario_nome: str | None = None

    class Config:
        from_attributes = True

class RecomendacaoParametros(BaseModel):
    capacidade_diaria: int = 150
    dias_analise_demanda: int = 7
    periodo_recomendado: str = "Hoje"
