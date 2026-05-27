from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.insumos.schemas import (
    ConversaoCompraInsumoCriar,
    ConversaoCompraInsumoResponse,
    InsumoAtualizar,
    InsumoCriar,
    InsumoResponse,
)
from app.modules.insumos.service import (
    atualizar_insumo,
    criar_conversao_compra,
    criar_insumo,
    obter_conversoes_compra,
    obter_insumos,
)


router = APIRouter(prefix="/insumos", tags=["Insumos"])


@router.post("", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_insumo(
    dados: InsumoCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_insumo(sessao, dados, usuario.id)


@router.get("", response_model=list[InsumoResponse])
def listar_insumos(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_insumos(sessao)


@router.put("/{insumo_id}", response_model=InsumoResponse)
def editar_insumo(
    insumo_id: int,
    dados: InsumoAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return atualizar_insumo(sessao, insumo_id, dados)


@router.post(
    "/{insumo_id}/conversoes-compra",
    response_model=ConversaoCompraInsumoResponse,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_conversao_compra(
    insumo_id: int,
    dados: ConversaoCompraInsumoCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_conversao_compra(sessao, insumo_id, dados)


@router.get(
    "/{insumo_id}/conversoes-compra",
    response_model=list[ConversaoCompraInsumoResponse],
)
def listar_conversoes_compra(
    insumo_id: int,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_conversoes_compra(sessao, insumo_id)
