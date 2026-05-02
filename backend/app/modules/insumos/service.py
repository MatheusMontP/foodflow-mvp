from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.estoque.models import MovimentacaoEstoque, TipoMovimentacaoEstoque
from app.modules.estoque.repository import salvar_movimentacao
from app.modules.insumos.models import ConversaoCompraInsumo, Insumo
from app.modules.insumos.repository import (
    buscar_conversao_compra,
    buscar_insumo_por_id,
    buscar_insumo_por_nome,
    listar_conversoes_compra,
    listar_insumos,
    salvar_conversao_compra,
    salvar_insumo,
)
from app.modules.insumos.schemas import ConversaoCompraInsumoCriar, InsumoCriar
from app.modules.unidades.repository import buscar_unidade_por_id


def criar_insumo(sessao: Session, dados: InsumoCriar, usuario_id: int | None) -> Insumo:
    nome = dados.nome.strip()
    if buscar_insumo_por_nome(sessao, nome) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe insumo com este nome.",
        )

    unidade = buscar_unidade_por_id(sessao, dados.unidade_medida_id)
    if unidade is None or not unidade.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade de medida nao encontrada.",
        )

    insumo = salvar_insumo(
        sessao,
        Insumo(
            nome=nome,
            unidade_medida_id=dados.unidade_medida_id,
            custo_unitario=dados.custo_unitario,
            quantidade_estoque=dados.estoque_inicial,
            estoque_minimo=dados.estoque_minimo,
            ativo=True,
        ),
    )

    if dados.estoque_inicial > Decimal("0"):
        salvar_movimentacao(
            sessao,
            MovimentacaoEstoque(
                insumo_id=insumo.id,
                usuario_id=usuario_id,
                tipo=TipoMovimentacaoEstoque.ENTRADA,
                quantidade=dados.estoque_inicial,
                estoque_antes=Decimal("0"),
                estoque_depois=dados.estoque_inicial,
                motivo="Estoque inicial do insumo",
            ),
        )

    sessao.commit()
    sessao.refresh(insumo)
    return insumo


def obter_insumos(sessao: Session) -> list[Insumo]:
    return listar_insumos(sessao)


def criar_conversao_compra(
    sessao: Session,
    insumo_id: int,
    dados: ConversaoCompraInsumoCriar,
) -> ConversaoCompraInsumo:
    insumo = buscar_insumo_por_id(sessao, insumo_id)
    if insumo is None or not insumo.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo nao encontrado.",
        )

    unidade_compra = buscar_unidade_por_id(sessao, dados.unidade_compra_id)
    if unidade_compra is None or not unidade_compra.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade de compra nao encontrada.",
        )

    if dados.unidade_compra_id == insumo.unidade_medida_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unidade de compra deve ser diferente da unidade base do insumo.",
        )

    if buscar_conversao_compra(sessao, insumo_id, dados.unidade_compra_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe conversao de compra para este insumo e unidade.",
        )

    return salvar_conversao_compra(
        sessao,
        ConversaoCompraInsumo(
            insumo_id=insumo.id,
            unidade_compra_id=dados.unidade_compra_id,
            unidade_estoque_id=insumo.unidade_medida_id,
            quantidade_equivalente=dados.quantidade_equivalente,
            ativa=True,
        ),
    )


def obter_conversoes_compra(sessao: Session, insumo_id: int) -> list[ConversaoCompraInsumo]:
    if buscar_insumo_por_id(sessao, insumo_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo nao encontrado.",
        )

    return listar_conversoes_compra(sessao, insumo_id)
