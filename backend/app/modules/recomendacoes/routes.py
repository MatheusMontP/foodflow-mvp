from typing import List
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import obter_usuario_atual
from app.modules.auth.models import Usuario
from app.modules.recomendacoes.schemas import RecomendacaoParametros, RecomendacaoResponse
from app.modules.recomendacoes.service import RecomendacaoService

router = APIRouter(prefix="/recomendacoes", tags=["Recomendações"])
service = RecomendacaoService()
CENTAVOS = Decimal("0.01")


@router.post("/gerar", response_model=RecomendacaoResponse, status_code=status.HTTP_201_CREATED)
def gerar_recomendacao(
    parametros: RecomendacaoParametros,
    db: Session = Depends(obter_sessao),
    current_user: Usuario = Depends(obter_usuario_atual),
):
    try:
        recomendacao = service.gerar_recomendacao(db, parametros, current_user.id)
        # Hackzinho para o response schema retornar o nome do usuario, se necessario
        recomendacao.usuario_nome = current_user.nome
        _enriquecer_itens(recomendacao.itens)
        return recomendacao
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao gerar recomendação: {str(e)}"
        )


@router.get("/", response_model=List[RecomendacaoResponse])
def listar_recomendacoes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(obter_sessao),
    current_user: Usuario = Depends(obter_usuario_atual),
):
    recs = service.listar_recomendacoes(db, skip, limit)
    for rec in recs:
        if rec.usuario:
            rec.usuario_nome = rec.usuario.nome
        _enriquecer_itens(rec.itens)
    return recs


@router.get("/{recomendacao_id}", response_model=RecomendacaoResponse)
def obter_recomendacao(
    recomendacao_id: int,
    db: Session = Depends(obter_sessao),
    current_user: Usuario = Depends(obter_usuario_atual),
):
    recomendacao = service.obter_recomendacao_por_id(db, recomendacao_id)
    if not recomendacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recomendação não encontrada."
        )
    if recomendacao.usuario:
        recomendacao.usuario_nome = recomendacao.usuario.nome
    _enriquecer_itens(recomendacao.itens)
    return recomendacao


def _enriquecer_itens(itens) -> None:
    itens_ordenados = sorted(itens, key=lambda item: Decimal(item.lucro_unitario), reverse=True)
    margens = [Decimal(item.lucro_unitario) for item in itens_ordenados]

    for item in itens:
        if item.produto:
            item.produto_nome = item.produto.nome

        tipo = _tipo_recomendacao(item)
        item.tipo_recomendacao = tipo
        item.acao_sugerida = "Montar combo" if tipo == "COMPLEMENTO" else "Destacar no PDV"

        margem_atual = Decimal(item.lucro_unitario)
        maior_margem_concorrente = max(
            (margem for margem in margens if margem < margem_atual),
            default=Decimal("0"),
        )
        desconto_seguro = ((margem_atual - maior_margem_concorrente) * Decimal("0.90")).quantize(
            CENTAVOS,
            rounding=ROUND_HALF_UP,
        )
        if desconto_seguro < Decimal("0"):
            desconto_seguro = Decimal("0")

        preco_venda = Decimal(item.produto.preco_venda) if item.produto is not None else Decimal("0")
        percentual = Decimal("0")
        if preco_venda > Decimal("0") and desconto_seguro > Decimal("0"):
            percentual = (desconto_seguro * Decimal("100") / preco_venda).quantize(
                CENTAVOS,
                rounding=ROUND_HALF_UP,
            )

        item.desconto_seguro_valor = desconto_seguro
        item.desconto_seguro_percentual = percentual


def _tipo_recomendacao(item) -> str:
    produto = item.produto
    if produto is None:
        return "PRINCIPAL"

    textos = [
        produto.nome,
        produto.categoria.nome if produto.categoria is not None else "",
        produto.categoria.descricao if produto.categoria is not None and produto.categoria.descricao is not None else "",
    ]
    texto = " ".join(textos).lower()
    if any(termo in texto for termo in ["batata", "porcao", "porção", "acompanhamento"]):
        return "COMPLEMENTO"
    return "PRINCIPAL"
