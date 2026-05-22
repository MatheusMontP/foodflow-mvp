from collections.abc import Generator

from sqlalchemy import create_engine, text
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
    _garantir_colunas_sqlite()


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


def _garantir_colunas_sqlite() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    colunas = {
        "vendas": {
            "desconto_total": "NUMERIC(12, 2) NOT NULL DEFAULT 0",
            "promocoes_resumo": "TEXT",
        },
        "itens_venda": {
            "desconto_total": "NUMERIC(12, 2) NOT NULL DEFAULT 0",
            "promocao_resumo": "TEXT",
        },
    }
    with engine.begin() as conexao:
        for tabela, definicoes in colunas.items():
            existentes = {
                linha[1]
                for linha in conexao.execute(text(f"PRAGMA table_info({tabela})")).fetchall()
            }
            if not existentes:
                continue
            for coluna, definicao in definicoes.items():
                if coluna not in existentes:
                    conexao.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}"))
