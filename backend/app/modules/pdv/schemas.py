from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.modules.categorias.schemas import CategoriaResponse
from app.modules.pdv.models import FormaPagamento, StatusVenda
from app.modules.produtos.schemas import ProdutoResponse
from app.modules.promocoes.models import EscopoPromocao, TipoDesconto


class ItemVendaCriar(BaseModel):
    produto_id: int
    quantidade: int = Field(default=1, ge=1)
    adicional_ids: list[int] = Field(default_factory=list)
    remocao_item_ficha_tecnica_ids: list[int] = Field(default_factory=list)
    observacao: str | None = Field(default=None, max_length=255)


class VendaCriar(BaseModel):
    itens: list[ItemVendaCriar] = Field(min_length=1)
    forma_pagamento: FormaPagamento
    observacao: str | None = Field(default=None, max_length=500)
    promocao_id_selecionada: int | None = None


class PromocoesVendaSimular(BaseModel):
    itens: list[ItemVendaCriar] = Field(min_length=1)
    promocao_id_selecionada: int | None = None


class VendaCancelar(BaseModel):
    motivo: str = Field(min_length=3, max_length=500)


class ItemVendaResponse(BaseModel):
    id: int
    venda_id: int
    produto_id: int
    nome_produto: str
    quantidade: int
    preco_unitario: Decimal
    desconto_total: Decimal
    preco_total: Decimal
    promocao_resumo: str | None
    adicionais_resumo: str | None
    remocoes_resumo: str | None
    observacao: str | None

    model_config = {"from_attributes": True}


class VendaResponse(BaseModel):
    id: int
    numero_pedido: str
    usuario_id: int | None
    forma_pagamento: FormaPagamento
    status: StatusVenda
    subtotal: Decimal
    desconto_total: Decimal
    total: Decimal
    promocoes_resumo: str | None
    observacao: str | None
    motivo_cancelamento: str | None
    cancelado_por_id: int | None
    cancelado_em: datetime | None
    criado_em: datetime
    itens: list[ItemVendaResponse]

    model_config = {"from_attributes": True}


class ItemPromocaoVendaSimuladaResponse(BaseModel):
    indice: int
    produto_id: int
    nome_produto: str
    quantidade: int
    subtotal: Decimal
    desconto_total: Decimal
    total: Decimal
    promocao_resumo: str | None


class OpcaoPromocaoVendaResponse(BaseModel):
    promocao_id: int
    nome: str
    escopo: EscopoPromocao
    tipo_desconto: TipoDesconto
    desconto_total: Decimal
    total: Decimal
    resumo: str


class PromocoesVendaSimuladaResponse(BaseModel):
    subtotal: Decimal
    desconto_total: Decimal
    total: Decimal
    promocoes_resumo: str | None
    promocao_id_selecionada: int | None
    opcoes_promocao: list[OpcaoPromocaoVendaResponse]
    itens: list[ItemPromocaoVendaSimuladaResponse]


class CardapioPDVResponse(BaseModel):
    categorias: list[CategoriaResponse]
    produtos: list[ProdutoResponse]
