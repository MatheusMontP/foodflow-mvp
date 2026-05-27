from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.modules.produtos.models import StatusProduto


class ItemFichaTecnicaCriar(BaseModel):
    insumo_id: int
    quantidade: Decimal = Field(gt=0, decimal_places=3)
    unidade_medida_id: int
    removivel: bool = False


class ProdutoCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=140)
    descricao: str | None = None
    categoria_id: int
    preco_venda: Decimal = Field(ge=0, decimal_places=2)
    demanda_esperada_diaria: int = Field(default=0, ge=0)
    itens_ficha_tecnica: list[ItemFichaTecnicaCriar] = Field(min_length=1)


class ProdutoAtualizar(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=140)
    descricao: str | None = None
    categoria_id: int | None = None
    preco_venda: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    demanda_esperada_diaria: int | None = Field(default=None, ge=0)
    itens_ficha_tecnica: list[ItemFichaTecnicaCriar] | None = Field(default=None, min_length=1)


class ProdutoStatusAtualizar(BaseModel):
    status: StatusProduto


class FichaTecnicaAtualizar(BaseModel):
    itens: list[ItemFichaTecnicaCriar] = Field(min_length=1)


class ItemFichaTecnicaResponse(BaseModel):
    id: int
    produto_id: int
    insumo_id: int
    quantidade: Decimal
    unidade_medida_id: int
    removivel: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


class ProdutoResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None
    categoria_id: int
    preco_venda: Decimal
    custo_ficha_tecnica: Decimal
    margem_estimada: Decimal
    demanda_esperada_diaria: int
    status: StatusProduto
    ficha_tecnica_valida: bool
    vendavel: bool
    motivo_indisponibilidade: str | None
    criado_em: datetime
    itens_ficha_tecnica: list[ItemFichaTecnicaResponse]

    model_config = {"from_attributes": True}
