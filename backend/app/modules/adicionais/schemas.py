from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ItemFichaTecnicaAdicionalCriar(BaseModel):
    insumo_id: int
    quantidade: Decimal = Field(gt=0, decimal_places=3)
    unidade_medida_id: int


class AdicionalCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=140)
    descricao: str | None = None
    preco_extra: Decimal = Field(ge=0, decimal_places=2)
    ativo: bool = True
    categoria_ids: list[int] = Field(min_length=1)
    itens_ficha_tecnica: list[ItemFichaTecnicaAdicionalCriar] = Field(min_length=1)


class AdicionalStatusAtualizar(BaseModel):
    ativo: bool


class CategoriasAdicionalAtualizar(BaseModel):
    categoria_ids: list[int] = Field(min_length=1)


class FichaTecnicaAdicionalAtualizar(BaseModel):
    itens: list[ItemFichaTecnicaAdicionalCriar] = Field(min_length=1)


class ItemFichaTecnicaAdicionalResponse(BaseModel):
    id: int
    adicional_id: int
    insumo_id: int
    quantidade: Decimal
    unidade_medida_id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class AdicionalResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None
    preco_extra: Decimal
    ativo: bool
    ficha_tecnica_valida: bool
    disponivel: bool
    motivo_indisponibilidade: str | None
    categoria_ids: list[int]
    criado_em: datetime
    itens_ficha_tecnica: list[ItemFichaTecnicaAdicionalResponse]

    model_config = {"from_attributes": True}


class RemocaoPermitidaResponse(BaseModel):
    item_ficha_tecnica_id: int
    insumo_id: int
    nome_insumo: str
    quantidade: Decimal
    unidade_medida_id: int


class VariacoesProdutoResponse(BaseModel):
    produto_id: int
    adicionais: list[AdicionalResponse]
    remocoes_permitidas: list[RemocaoPermitidaResponse]
    observacao_permitida: bool = True


class SimulacaoItemRequest(BaseModel):
    adicional_ids: list[int] = Field(default_factory=list)
    remocao_item_ficha_tecnica_ids: list[int] = Field(default_factory=list)
    observacao: str | None = Field(default=None, max_length=255)


class BaixaEstoquePrevistaResponse(BaseModel):
    insumo_id: int
    nome_insumo: str
    quantidade: Decimal
    estoque_atual: Decimal
    estoque_depois: Decimal
    suficiente: bool


class SimulacaoItemResponse(BaseModel):
    produto_id: int
    preco_base: Decimal
    preco_adicionais: Decimal
    preco_total: Decimal
    observacao: str | None
    baixas_previstas: list[BaixaEstoquePrevistaResponse]
    estoque_suficiente: bool
