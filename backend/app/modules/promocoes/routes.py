from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.promocoes.schemas import (
    PromocaoAtualizar,
    PromocaoCriar,
    PromocaoResponse,
    PromocaoStatusAtualizar,
)
from app.modules.promocoes.service import (
    atualizar_promocao,
    atualizar_status_promocao,
    criar_promocao,
    obter_promocoes,
)


router = APIRouter(prefix="/promocoes", tags=["Promocoes"])


@router.post("", response_model=PromocaoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_promocao(
    dados: PromocaoCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_promocao(sessao, dados)


@router.get("", response_model=list[PromocaoResponse])
def listar_promocoes_api(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_promocoes(sessao)


@router.put("/{promocao_id}", response_model=PromocaoResponse)
def editar_promocao(
    promocao_id: int,
    dados: PromocaoAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return atualizar_promocao(sessao, promocao_id, dados)


@router.patch("/{promocao_id}/status", response_model=PromocaoResponse)
def editar_status_promocao(
    promocao_id: int,
    dados: PromocaoStatusAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return atualizar_status_promocao(sessao, promocao_id, dados)
