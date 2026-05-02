from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.categorias.schemas import CategoriaCriar, CategoriaResponse
from app.modules.categorias.service import criar_categoria, obter_categorias


router = APIRouter(prefix="/categorias", tags=["Categorias"])


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_categoria(
    dados: CategoriaCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return criar_categoria(sessao, dados)


@router.get("", response_model=list[CategoriaResponse])
def listar_categorias(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_categorias(sessao)

