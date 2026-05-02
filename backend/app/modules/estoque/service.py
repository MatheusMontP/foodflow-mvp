from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.estoque.models import MovimentacaoEstoque, TipoMovimentacaoEstoque
from app.modules.estoque.repository import (
    atualizar_estoque_insumo,
    listar_movimentacoes,
    salvar_movimentacao,
)
from app.modules.estoque.schemas import EntradaEstoqueCriar
from app.modules.insumos.repository import buscar_conversao_compra, buscar_insumo_por_id
from app.modules.unidades.repository import buscar_unidade_por_id


def obter_movimentacoes(sessao: Session):
    return listar_movimentacoes(sessao)


def registrar_entrada_estoque(
    sessao: Session,
    dados: EntradaEstoqueCriar,
    usuario_id: int | None,
) -> MovimentacaoEstoque:
    insumo = buscar_insumo_por_id(sessao, dados.insumo_id)
    if insumo is None or not insumo.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo nao encontrado.",
        )

    unidade_compra_id = dados.unidade_compra_id or insumo.unidade_medida_id
    unidade_compra = buscar_unidade_por_id(sessao, unidade_compra_id)
    if unidade_compra is None or not unidade_compra.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade de compra nao encontrada.",
        )

    quantidade_base = Decimal(dados.quantidade)
    if unidade_compra_id != insumo.unidade_medida_id:
        if dados.quantidade_equivalente_informada is not None:
            quantidade_equivalente = Decimal(dados.quantidade_equivalente_informada)
        else:
            conversao = buscar_conversao_compra(sessao, insumo.id, unidade_compra_id)
            if conversao is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Informe a equivalencia da compra ou cadastre uma conversao padrao para este insumo.",
                )

            quantidade_equivalente = Decimal(conversao.quantidade_equivalente)

        quantidade_base = Decimal(dados.quantidade) * quantidade_equivalente

    estoque_antes = Decimal(insumo.quantidade_estoque)
    estoque_depois = estoque_antes + quantidade_base
    insumo.quantidade_estoque = estoque_depois
    atualizar_estoque_insumo(sessao, insumo)

    movimentacao = salvar_movimentacao(
        sessao,
        MovimentacaoEstoque(
            insumo_id=insumo.id,
            usuario_id=usuario_id,
            tipo=TipoMovimentacaoEstoque.ENTRADA,
            quantidade=quantidade_base,
            estoque_antes=estoque_antes,
            estoque_depois=estoque_depois,
            motivo=dados.motivo or "Entrada de estoque",
        ),
    )
    sessao.commit()
    sessao.refresh(movimentacao)
    return movimentacao
