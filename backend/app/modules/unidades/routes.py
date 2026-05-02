from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.unidades.schemas import (
    ConversaoUnidadeCriar,
    ConversaoUnidadeResponse,
    UnidadeMedidaCriar,
    UnidadeMedidaResponse,
)
from app.modules.unidades.service import (
    criar_conversao,
    criar_unidade,
    obter_conversoes,
    obter_unidades,
)


router_unidades = APIRouter(prefix="/unidades-medida", tags=["Unidades de Medida"])
router_conversoes = APIRouter(prefix="/conversoes-unidade", tags=["Conversoes de Unidade"])


@router_unidades.post("", response_model=UnidadeMedidaResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_unidade(
    dados: UnidadeMedidaCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_unidade(sessao, dados)


@router_unidades.get("", response_model=list[UnidadeMedidaResponse])
def listar_unidades(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_unidades(sessao)


@router_conversoes.post("", response_model=ConversaoUnidadeResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_conversao(
    dados: ConversaoUnidadeCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_conversao(sessao, dados)


@router_conversoes.get("", response_model=list[ConversaoUnidadeResponse])
def listar_conversoes(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_conversoes(sessao)

