from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.categorias.models import Categoria


def buscar_categoria_por_nome(sessao: Session, nome: str) -> Categoria | None:
    return sessao.scalar(select(Categoria).where(Categoria.nome == nome.strip()))


def listar_categorias(sessao: Session) -> list[Categoria]:
    return list(sessao.scalars(select(Categoria).order_by(Categoria.nome)))


def salvar_categoria(sessao: Session, categoria: Categoria) -> Categoria:
    sessao.add(categoria)
    sessao.commit()
    sessao.refresh(categoria)
    return categoria

