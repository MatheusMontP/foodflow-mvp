from typing import List

from sqlalchemy.orm import Session, joinedload
from app.modules.recomendacoes.models import Recomendacao, ItemRecomendacao
from app.modules.recomendacoes.schemas import RecomendacaoCreate

class RecomendacaoRepository:
    def criar_recomendacao(self, db: Session, dados: RecomendacaoCreate) -> Recomendacao:
        nova_recomendacao_dict = dados.model_dump(exclude={"itens"})
        nova_recomendacao = Recomendacao(**nova_recomendacao_dict)
        
        db.add(nova_recomendacao)
        db.commit()
        db.refresh(nova_recomendacao)
        
        for item in dados.itens:
            novo_item = ItemRecomendacao(
                recomendacao_id=nova_recomendacao.id,
                **item.model_dump()
            )
            db.add(novo_item)
            
        db.commit()
        db.refresh(nova_recomendacao)
        return nova_recomendacao

    def listar_recomendacoes(self, db: Session, skip: int = 0, limit: int = 100) -> List[Recomendacao]:
        return (
            db.query(Recomendacao)
            .options(joinedload(Recomendacao.itens))
            .order_by(Recomendacao.criado_em.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def obter_recomendacao_por_id(self, db: Session, recomendacao_id: int) -> Recomendacao | None:
        return (
            db.query(Recomendacao)
            .options(joinedload(Recomendacao.itens))
            .filter(Recomendacao.id == recomendacao_id)
            .first()
        )
