from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.modules.promocoes.models import EscopoPromocao, TipoDesconto


class PromocaoCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=140)
    escopo: EscopoPromocao
    tipo_desconto: TipoDesconto
    valor: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    quantidade_leve: int | None = Field(default=None, ge=2)
    quantidade_pague: int | None = Field(default=None, ge=1)
    produto_id: int | None = None
    categoria_id: int | None = None
    inicio_em: datetime | None = None
    fim_em: datetime | None = None
    ativa: bool = True

    @model_validator(mode="after")
    def validar_alvo(self):
        if self.escopo == EscopoPromocao.PRODUTO and self.produto_id is None:
            raise ValueError("Promocao por produto exige produto_id.")
        if self.escopo == EscopoPromocao.CATEGORIA and self.categoria_id is None:
            raise ValueError("Promocao por categoria exige categoria_id.")
        if self.escopo == EscopoPromocao.VENDA and (self.produto_id is not None or self.categoria_id is not None):
            raise ValueError("Promocao de venda inteira nao deve ter produto_id ou categoria_id.")
        if self.tipo_desconto == TipoDesconto.LEVE_PAGUE:
            if self.escopo == EscopoPromocao.VENDA:
                raise ValueError("Leve e pague deve ser aplicado a produto ou categoria.")
            if self.quantidade_leve is None or self.quantidade_pague is None:
                raise ValueError("Leve e pague exige as quantidades leve e pague.")
            if self.quantidade_pague >= self.quantidade_leve:
                raise ValueError("A quantidade paga deve ser menor que a quantidade levada.")
            self.valor = Decimal("0")
        elif self.valor <= 0:
            raise ValueError("Valor da promocao deve ser maior que zero.")
        if self.inicio_em is not None and self.fim_em is not None and self.inicio_em > self.fim_em:
            raise ValueError("Periodo da promocao invalido.")
        return self


class PromocaoAtualizar(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=140)
    tipo_desconto: TipoDesconto | None = None
    valor: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    quantidade_leve: int | None = Field(default=None, ge=2)
    quantidade_pague: int | None = Field(default=None, ge=1)
    inicio_em: datetime | None = None
    fim_em: datetime | None = None
    ativa: bool | None = None


class PromocaoStatusAtualizar(BaseModel):
    ativa: bool


class PromocaoResponse(BaseModel):
    id: int
    nome: str
    escopo: EscopoPromocao
    tipo_desconto: TipoDesconto
    valor: Decimal
    quantidade_leve: int | None
    quantidade_pague: int | None
    produto_id: int | None
    categoria_id: int | None
    inicio_em: datetime | None
    fim_em: datetime | None
    ativa: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
