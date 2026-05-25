from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import obter_usuario_atual
from app.modules.auth.models import Usuario
from app.modules.recomendacoes.schemas import RecomendacaoParametros, RecomendacaoResponse
from app.modules.recomendacoes.service import RecomendacaoService

router = APIRouter(prefix="/recomendacoes", tags=["Recomendações"])
service = RecomendacaoService()


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
        for item in rec.itens:
            if item.produto:
                item.produto_nome = item.produto.nome
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
    for item in recomendacao.itens:
        if item.produto:
            item.produto_nome = item.produto.nome
    return recomendacao
