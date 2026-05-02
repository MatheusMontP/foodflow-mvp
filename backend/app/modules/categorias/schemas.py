from datetime import datetime

from pydantic import BaseModel, Field


class CategoriaCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    descricao: str | None = Field(default=None, max_length=255)


class CategoriaResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}

