from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.adicionais.repository import buscar_adicional_por_id
from app.modules.adicionais.service import simular_item_produto
from app.modules.adicionais.schemas import SimulacaoItemRequest
from app.modules.categorias.repository import listar_categorias
from app.modules.estoque.models import MovimentacaoEstoque, TipoMovimentacaoEstoque
from app.modules.estoque.repository import atualizar_estoque_insumo, salvar_movimentacao
from app.modules.insumos.repository import buscar_insumo_por_id
from app.modules.pdv.models import ItemVenda, StatusVenda, Venda
from app.modules.pdv.repository import contar_vendas_por_prefixo, listar_vendas, salvar_venda
from app.modules.pdv.schemas import VendaCriar
from app.modules.produtos.repository import buscar_produto_por_id, listar_produtos_ativos
from app.modules.produtos.service import produto_para_response


CENTAVOS = Decimal("0.01")


def obter_cardapio_pdv(sessao: Session) -> dict:
    categorias_usadas: set[int] = set()
    produtos_response = []

    for produto in listar_produtos_ativos(sessao):
        produtos_response.append(produto_para_response(sessao, produto))
        categorias_usadas.add(produto.categoria_id)

    categorias = [
        categoria
        for categoria in listar_categorias(sessao)
        if categoria.ativo and categoria.id in categorias_usadas
    ]
    return {"categorias": categorias, "produtos": produtos_response}


def obter_vendas(sessao: Session) -> list[Venda]:
    return listar_vendas(sessao)


def finalizar_venda(sessao: Session, dados: VendaCriar, usuario_id: int | None) -> Venda:
    itens_venda: list[ItemVenda] = []
    baixas_agregadas: dict[int, Decimal] = {}
    total = Decimal("0")

    for item_dados in dados.itens:
        produto = buscar_produto_por_id(sessao, item_dados.produto_id)
        if produto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto nao encontrado.")

        simulacao = simular_item_produto(
            sessao,
            produto.id,
            SimulacaoItemRequest(
                adicional_ids=item_dados.adicional_ids,
                remocao_item_ficha_tecnica_ids=item_dados.remocao_item_ficha_tecnica_ids,
                observacao=item_dados.observacao,
            ),
        )
        if not simulacao["estoque_suficiente"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Estoque insuficiente para vender {produto.nome}.",
            )

        quantidade = item_dados.quantidade
        preco_unitario = Decimal(simulacao["preco_total"])
        preco_total = (preco_unitario * quantidade).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
        total += preco_total

        for baixa in simulacao["baixas_previstas"]:
            insumo_id = baixa["insumo_id"]
            baixas_agregadas[insumo_id] = baixas_agregadas.get(insumo_id, Decimal("0")) + (
                Decimal(baixa["quantidade"]) * quantidade
            )

        itens_venda.append(
            ItemVenda(
                produto_id=produto.id,
                nome_produto=produto.nome,
                quantidade=quantidade,
                preco_unitario=preco_unitario,
                preco_total=preco_total,
                adicionais_resumo=_resumo_adicionais(sessao, item_dados.adicional_ids),
                remocoes_resumo=_resumo_remocoes(produto, item_dados.remocao_item_ficha_tecnica_ids),
                observacao=item_dados.observacao,
            )
        )

    _validar_estoque_agregado(sessao, baixas_agregadas)

    venda = Venda(
        numero_pedido=_proximo_numero_pedido(sessao),
        usuario_id=usuario_id,
        forma_pagamento=dados.forma_pagamento,
        status=StatusVenda.CONCLUIDA,
        subtotal=total.quantize(CENTAVOS, rounding=ROUND_HALF_UP),
        total=total.quantize(CENTAVOS, rounding=ROUND_HALF_UP),
        observacao=dados.observacao,
        itens=itens_venda,
    )
    venda = salvar_venda(sessao, venda)
    _baixar_estoque(sessao, baixas_agregadas, usuario_id, venda.numero_pedido)
    sessao.commit()
    sessao.refresh(venda)
    _ = venda.itens
    return venda


def _proximo_numero_pedido(sessao: Session) -> str:
    prefixo = datetime.now().strftime("%Y%m%d")
    sequencia = contar_vendas_por_prefixo(sessao, prefixo) + 1
    return f"{prefixo}-{sequencia:03d}"


def _validar_estoque_agregado(sessao: Session, baixas: dict[int, Decimal]) -> None:
    for insumo_id, quantidade in baixas.items():
        insumo = buscar_insumo_por_id(sessao, insumo_id)
        if insumo is None or Decimal(insumo.quantidade_estoque) < quantidade:
            nome = insumo.nome if insumo is not None else f"Insumo {insumo_id}"
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Estoque insuficiente de {nome} para finalizar a venda.",
            )


def _baixar_estoque(
    sessao: Session,
    baixas: dict[int, Decimal],
    usuario_id: int | None,
    numero_pedido: str,
) -> None:
    for insumo_id, quantidade in baixas.items():
        insumo = buscar_insumo_por_id(sessao, insumo_id)
        if insumo is None:
            continue

        estoque_antes = Decimal(insumo.quantidade_estoque)
        estoque_depois = estoque_antes - quantidade
        insumo.quantidade_estoque = estoque_depois
        atualizar_estoque_insumo(sessao, insumo)
        salvar_movimentacao(
            sessao,
            MovimentacaoEstoque(
                insumo_id=insumo.id,
                usuario_id=usuario_id,
                tipo=TipoMovimentacaoEstoque.SAIDA_VENDA,
                quantidade=quantidade,
                estoque_antes=estoque_antes,
                estoque_depois=estoque_depois,
                motivo=f"Venda {numero_pedido}",
            ),
        )


def _resumo_adicionais(sessao: Session, adicional_ids: list[int]) -> str | None:
    nomes = []
    for adicional_id in adicional_ids:
        adicional = buscar_adicional_por_id(sessao, adicional_id)
        if adicional is not None:
            nomes.append(adicional.nome)
    return ", ".join(nomes) if nomes else None


def _resumo_remocoes(produto, remocao_ids: list[int]) -> str | None:
    nomes = [
        item.insumo.nome
        for item in produto.itens_ficha_tecnica
        if item.id in remocao_ids and item.removivel
    ]
    return ", ".join(nomes) if nomes else None
