from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.promocoes.models import Promocao


def buscar_promocao_por_id(sessao: Session, promocao_id: int) -> Promocao | None:
    return sessao.get(Promocao, promocao_id)


def buscar_promocao_por_nome(sessao: Session, nome: str) -> Promocao | None:
    return sessao.scalar(select(Promocao).where(Promocao.nome == nome.strip()))


def listar_promocoes(sessao: Session) -> list[Promocao]:
    return list(sessao.scalars(select(Promocao).order_by(Promocao.ativa.desc(), Promocao.nome)))


def salvar_promocao(sessao: Session, promocao: Promocao) -> Promocao:
    sessao.add(promocao)
    sessao.commit()
    sessao.refresh(promocao)
    return promocao
