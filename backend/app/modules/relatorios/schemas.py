from decimal import Decimal

from pydantic import BaseModel


class ProdutoBloqueadoResponse(BaseModel):
    id: int
    nome: str
    motivo: str


class AlertaEstoqueResponse(BaseModel):
    insumo_id: int
    nome: str
    quantidade_estoque: Decimal
    estoque_minimo: Decimal


class ProdutoVendidoResponse(BaseModel):
    produto_id: int
    nome: str
    quantidade: int
    total: Decimal


class DashboardResponse(BaseModel):
    inicio: str | None
    fim: str | None
    faturamento: Decimal
    descontos: Decimal
    vendas_concluidas: int
    vendas_canceladas: int
    ticket_medio: Decimal
    itens_vendidos: int
    produtos_bloqueados: list[ProdutoBloqueadoResponse]
    alertas_estoque: list[AlertaEstoqueResponse]
    produtos_mais_vendidos: list[ProdutoVendidoResponse]
