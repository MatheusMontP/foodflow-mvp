from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.adicionais.models import Adicional, AdicionalCategoria, ItemFichaTecnicaAdicional


def buscar_adicional_por_id(sessao: Session, adicional_id: int) -> Adicional | None:
    return sessao.scalar(
        select(Adicional)
        .options(
            selectinload(Adicional.categorias_permitidas),
            selectinload(Adicional.itens_ficha_tecnica),
        )
        .where(Adicional.id == adicional_id)
    )


def buscar_adicional_por_nome(sessao: Session, nome: str) -> Adicional | None:
    return sessao.scalar(select(Adicional).where(Adicional.nome == nome.strip()))


def listar_adicionais(sessao: Session) -> list[Adicional]:
    return list(
        sessao.scalars(
            select(Adicional)
            .options(
                selectinload(Adicional.categorias_permitidas),
                selectinload(Adicional.itens_ficha_tecnica),
            )
            .order_by(Adicional.nome)
        )
    )


def salvar_adicional(sessao: Session, adicional: Adicional) -> Adicional:
    sessao.add(adicional)
    sessao.commit()
    sessao.refresh(adicional)
    return adicional


def substituir_categorias(
    sessao: Session,
    adicional: Adicional,
    categoria_ids: list[int],
) -> Adicional:
    adicional.categorias_permitidas = [
        AdicionalCategoria(adicional_id=adicional.id, categoria_id=categoria_id)
        for categoria_id in categoria_ids
    ]
    sessao.add(adicional)
    sessao.flush()
    return adicional


def substituir_itens_ficha(
    sessao: Session,
    adicional: Adicional,
    itens: list[ItemFichaTecnicaAdicional],
) -> Adicional:
    adicional.itens_ficha_tecnica = itens
    sessao.add(adicional)
    sessao.flush()
    return adicional
