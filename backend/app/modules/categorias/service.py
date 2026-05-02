from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import (
    buscar_categoria_por_nome,
    listar_categorias,
    salvar_categoria,
)
from app.modules.categorias.schemas import CategoriaCriar


def criar_categoria(sessao: Session, dados: CategoriaCriar) -> Categoria:
    nome = dados.nome.strip()
    if buscar_categoria_por_nome(sessao, nome) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe categoria com este nome.",
        )

    return salvar_categoria(
        sessao,
        Categoria(nome=nome, descricao=dados.descricao, ativo=True),
    )


def obter_categorias(sessao: Session) -> list[Categoria]:
    return listar_categorias(sessao)

