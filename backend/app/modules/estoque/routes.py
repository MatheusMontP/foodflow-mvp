from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.estoque.schemas import EntradaEstoqueCriar, MovimentacaoEstoqueResponse
from app.modules.estoque.service import obter_movimentacoes, registrar_entrada_estoque


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


@router.get("/movimentacoes", response_model=list[MovimentacaoEstoqueResponse])
def listar_movimentacoes(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_movimentacoes(sessao)
