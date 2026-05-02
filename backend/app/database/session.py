from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.database.base import Base


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def criar_banco() -> None:
    import app.database.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def criar_dados_iniciais() -> None:
    from app.database.seed import criar_dados_iniciais as executar_seed

    sessao = SessionLocal()
    try:
        executar_seed(sessao)
    finally:
        sessao.close()


def obter_sessao() -> Generator[Session, None, None]:
    sessao = SessionLocal()
    try:
        yield sessao
    finally:
        sessao.close()
