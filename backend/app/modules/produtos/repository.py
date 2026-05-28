from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.pdv.models import ItemVenda
from app.modules.produtos.models import ItemFichaTecnica, Produto, StatusProduto
from app.modules.promocoes.models import Promocao
from app.modules.recomendacoes.models import ItemRecomendacao


def buscar_produto_por_id(sessao: Session, produto_id: int) -> Produto | None:
    return sessao.scalar(
        select(Produto)
        .options(selectinload(Produto.itens_ficha_tecnica))
        .where(Produto.id == produto_id)
    )


def buscar_produto_por_nome(sessao: Session, nome: str) -> Produto | None:
    return sessao.scalar(select(Produto).where(Produto.nome == nome.strip()))


def listar_produtos(sessao: Session) -> list[Produto]:
    return list(
        sessao.scalars(
            select(Produto)
            .options(selectinload(Produto.itens_ficha_tecnica))
            .order_by(Produto.nome)
        )
    )


def listar_produtos_ativos(sessao: Session) -> list[Produto]:
    return list(
        sessao.scalars(
            select(Produto)
            .options(selectinload(Produto.itens_ficha_tecnica))
            .where(Produto.status == StatusProduto.ATIVO)
            .order_by(Produto.nome)
        )
    )


def salvar_produto(sessao: Session, produto: Produto) -> Produto:
    sessao.add(produto)
    sessao.commit()
    sessao.refresh(produto)
    return produto


def produto_tem_vinculos_operacionais(sessao: Session, produto_id: int) -> bool:
    consultas = (
        select(ItemVenda.id).where(ItemVenda.produto_id == produto_id),
        select(Promocao.id).where(Promocao.produto_id == produto_id),
        select(ItemRecomendacao.id).where(ItemRecomendacao.produto_id == produto_id),
    )
    return any(sessao.scalar(consulta.limit(1)) is not None for consulta in consultas)


def remover_produto(sessao: Session, produto: Produto) -> None:
    sessao.delete(produto)
    sessao.commit()


def substituir_itens_ficha(
    sessao: Session,
    produto: Produto,
    itens: list[ItemFichaTecnica],
) -> Produto:
    produto.itens_ficha_tecnica.clear()
    sessao.flush()
    produto.itens_ficha_tecnica.extend(itens)
    sessao.add(produto)
    sessao.commit()
    sessao.refresh(produto)
    _ = produto.itens_ficha_tecnica
    return produto
