from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.estoque.schemas import (
    AjusteEstoqueCriar,
    ConferenciaEstoqueCriar,
    ConferenciaEstoqueResponse,
    EntradaEstoqueCriar,
    MovimentacaoEstoqueResponse,
    PerdaEstoqueCriar,
)
from app.modules.estoque.service import (
    confirmar_estoque_diario,
    obter_conferencias,
    obter_movimentacoes,
    registrar_ajuste_estoque,
    registrar_entrada_estoque,
    registrar_perda_estoque,
)


router = APIRouter(prefix="/estoque", tags=["Estoque"])


@router.post(
    "/entradas",
    response_model=MovimentacaoEstoqueResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_entrada(
    dados: EntradaEstoqueCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return registrar_entrada_estoque(sessao, dados, usuario.id)


@router.post(
    "/ajustes",
    response_model=MovimentacaoEstoqueResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_ajuste(
    dados: AjusteEstoqueCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return registrar_ajuste_estoque(sessao, dados, usuario.id)


@router.post(
    "/perdas",
    response_model=MovimentacaoEstoqueResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_perda(
    dados: PerdaEstoqueCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return registrar_perda_estoque(sessao, dados, usuario.id)


@router.post(
    "/conferencias-diarias",
    response_model=ConferenciaEstoqueResponse,
    status_code=status.HTTP_201_CREATED,
)
def confirmar_conferencia_diaria(
    dados: ConferenciaEstoqueCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return confirmar_estoque_diario(sessao, dados, usuario.id)


@router.get("/conferencias-diarias", response_model=list[ConferenciaEstoqueResponse])
def listar_conferencias_diarias(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_conferencias(sessao)


@router.get("/movimentacoes", response_model=list[MovimentacaoEstoqueResponse])
def listar_movimentacoes(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_movimentacoes(sessao)
