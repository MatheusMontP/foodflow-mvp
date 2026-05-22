from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.categorias.repository import listar_categorias
from app.modules.produtos.repository import buscar_produto_por_id
from app.modules.promocoes.models import EscopoPromocao, Promocao, TipoDesconto
from app.modules.promocoes.repository import (
    buscar_promocao_por_id,
    buscar_promocao_por_nome,
    listar_promocoes,
    salvar_promocao,
)
from app.modules.promocoes.schemas import PromocaoAtualizar, PromocaoCriar, PromocaoStatusAtualizar


CENTAVOS = Decimal("0.01")


@dataclass
class ItemPromocaoContexto:
    produto_id: int
    categoria_id: int
    subtotal: Decimal
    quantidade: int


@dataclass
class PromocaoAplicada:
    promocao_id: int
    nome: str
    escopo: EscopoPromocao
    desconto_total: Decimal
    item_indice: int | None = None


def criar_promocao(sessao: Session, dados: PromocaoCriar) -> Promocao:
    nome = dados.nome.strip()
    if buscar_promocao_por_nome(sessao, nome) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe promocao com este nome.",
        )

    _validar_referencias(sessao, dados.escopo, dados.produto_id, dados.categoria_id)
    promocao = Promocao(
        nome=nome,
        escopo=dados.escopo,
        tipo_desconto=dados.tipo_desconto,
        valor=dados.valor,
        produto_id=dados.produto_id if dados.escopo == EscopoPromocao.PRODUTO else None,
        categoria_id=dados.categoria_id if dados.escopo == EscopoPromocao.CATEGORIA else None,
        inicio_em=dados.inicio_em,
        fim_em=dados.fim_em,
        ativa=dados.ativa,
    )
    return salvar_promocao(sessao, promocao)


def obter_promocoes(sessao: Session) -> list[Promocao]:
    return listar_promocoes(sessao)


def atualizar_promocao(sessao: Session, promocao_id: int, dados: PromocaoAtualizar) -> Promocao:
    promocao = _exigir_promocao(sessao, promocao_id)

    if dados.nome is not None:
        nome = dados.nome.strip()
        existente = buscar_promocao_por_nome(sessao, nome)
        if existente is not None and existente.id != promocao.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ja existe promocao com este nome.",
            )
        promocao.nome = nome

    if dados.tipo_desconto is not None:
        promocao.tipo_desconto = dados.tipo_desconto
    if dados.valor is not None:
        promocao.valor = dados.valor
    if dados.inicio_em is not None:
        promocao.inicio_em = dados.inicio_em
    if dados.fim_em is not None:
        promocao.fim_em = dados.fim_em
    if dados.ativa is not None:
        promocao.ativa = dados.ativa

    if promocao.inicio_em is not None and promocao.fim_em is not None and promocao.inicio_em > promocao.fim_em:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Periodo da promocao invalido.")

    return salvar_promocao(sessao, promocao)


def atualizar_status_promocao(sessao: Session, promocao_id: int, dados: PromocaoStatusAtualizar) -> Promocao:
    promocao = _exigir_promocao(sessao, promocao_id)
    promocao.ativa = dados.ativa
    return salvar_promocao(sessao, promocao)


def calcular_promocoes_venda(
    sessao: Session,
    itens: list[ItemPromocaoContexto],
    subtotal: Decimal,
) -> tuple[list[Decimal], Decimal, list[PromocaoAplicada]]:
    promocoes = [promocao for promocao in listar_promocoes(sessao) if _promocao_vigente(promocao)]
    descontos_itens = [Decimal("0") for _ in itens]
    aplicadas: list[PromocaoAplicada] = []

    produto_aplicadas = _aplicar_promocoes_item(promocoes, itens, EscopoPromocao.PRODUTO)
    if produto_aplicadas:
        for aplicada in produto_aplicadas:
            descontos_itens[aplicada.item_indice or 0] += aplicada.desconto_total
        return descontos_itens, sum(descontos_itens, Decimal("0")), produto_aplicadas

    categoria_aplicadas = _aplicar_promocoes_item(promocoes, itens, EscopoPromocao.CATEGORIA)
    if categoria_aplicadas:
        for aplicada in categoria_aplicadas:
            descontos_itens[aplicada.item_indice or 0] += aplicada.desconto_total
        return descontos_itens, sum(descontos_itens, Decimal("0")), categoria_aplicadas

    venda_promocao = _melhor_promocao_venda(promocoes, subtotal)
    if venda_promocao is None:
        return descontos_itens, Decimal("0"), aplicadas

    desconto_venda = _calcular_desconto(venda_promocao, subtotal)
    if desconto_venda <= Decimal("0"):
        return descontos_itens, Decimal("0"), aplicadas

    descontos_itens = _ratear_desconto(desconto_venda, [item.subtotal for item in itens], subtotal)
    aplicadas.append(
        PromocaoAplicada(
            promocao_id=venda_promocao.id,
            nome=venda_promocao.nome,
            escopo=venda_promocao.escopo,
            desconto_total=desconto_venda,
        )
    )
    return descontos_itens, desconto_venda, aplicadas


def _aplicar_promocoes_item(
    promocoes: list[Promocao],
    itens: list[ItemPromocaoContexto],
    escopo: EscopoPromocao,
) -> list[PromocaoAplicada]:
    aplicadas: list[PromocaoAplicada] = []
    candidatas = [promocao for promocao in promocoes if promocao.escopo == escopo]

    for indice, item in enumerate(itens):
        elegiveis = [
            promocao
            for promocao in candidatas
            if (
                escopo == EscopoPromocao.PRODUTO
                and promocao.produto_id == item.produto_id
            )
            or (
                escopo == EscopoPromocao.CATEGORIA
                and promocao.categoria_id == item.categoria_id
            )
        ]
        melhor = _melhor_promocao_por_economia(elegiveis, item.subtotal)
        if melhor is None:
            continue
        desconto = _calcular_desconto(melhor, item.subtotal)
        if desconto > Decimal("0"):
            aplicadas.append(
                PromocaoAplicada(
                    promocao_id=melhor.id,
                    nome=melhor.nome,
                    escopo=melhor.escopo,
                    desconto_total=desconto,
                    item_indice=indice,
                )
            )

    return aplicadas


def _melhor_promocao_venda(promocoes: list[Promocao], subtotal: Decimal) -> Promocao | None:
    return _melhor_promocao_por_economia(
        [promocao for promocao in promocoes if promocao.escopo == EscopoPromocao.VENDA],
        subtotal,
    )


def _melhor_promocao_por_economia(promocoes: list[Promocao], base: Decimal) -> Promocao | None:
    if not promocoes:
        return None
    return max(promocoes, key=lambda promocao: (_calcular_desconto(promocao, base), -promocao.id))


def _calcular_desconto(promocao: Promocao, base: Decimal) -> Decimal:
    if base <= Decimal("0"):
        return Decimal("0")
    if promocao.tipo_desconto == TipoDesconto.PERCENTUAL:
        desconto = base * Decimal(promocao.valor) / Decimal("100")
    else:
        desconto = Decimal(promocao.valor)
    return min(desconto, base).quantize(CENTAVOS, rounding=ROUND_HALF_UP)


def _ratear_desconto(desconto: Decimal, bases: list[Decimal], subtotal: Decimal) -> list[Decimal]:
    if subtotal <= Decimal("0") or not bases:
        return [Decimal("0") for _ in bases]

    descontos = []
    acumulado = Decimal("0")
    for base in bases[:-1]:
        item_desconto = (desconto * base / subtotal).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
        descontos.append(item_desconto)
        acumulado += item_desconto

    descontos.append((desconto - acumulado).quantize(CENTAVOS, rounding=ROUND_HALF_UP))
    return descontos


def _promocao_vigente(promocao: Promocao) -> bool:
    if not promocao.ativa:
        return False
    agora = datetime.now(UTC)
    inicio = _normalizar_data(promocao.inicio_em)
    fim = _normalizar_data(promocao.fim_em)
    if inicio is not None and agora < inicio:
        return False
    if fim is not None and agora > fim:
        return False
    return True


def _normalizar_data(valor: datetime | None) -> datetime | None:
    if valor is None:
        return None
    if valor.tzinfo is None:
        return valor.replace(tzinfo=UTC)
    return valor.astimezone(UTC)


def _validar_referencias(
    sessao: Session,
    escopo: EscopoPromocao,
    produto_id: int | None,
    categoria_id: int | None,
) -> None:
    if escopo == EscopoPromocao.PRODUTO and (produto_id is None or buscar_produto_por_id(sessao, produto_id) is None):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado.")

    if escopo == EscopoPromocao.CATEGORIA:
        categorias = {categoria.id: categoria for categoria in listar_categorias(sessao)}
        categoria = categorias.get(categoria_id or 0)
        if categoria is None or not categoria.ativo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria nao encontrada.")


def _exigir_promocao(sessao: Session, promocao_id: int) -> Promocao:
    promocao = buscar_promocao_por_id(sessao, promocao_id)
    if promocao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocao nao encontrada.")
    return promocao
