from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


ALGORITMO_JWT = "HS256"
password_hash = PasswordHash.recommended()


def gerar_hash_senha(senha: str) -> str:
    return password_hash.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return password_hash.verify(senha, senha_hash)


def criar_token(dados: dict[str, Any], expira_em: timedelta, tipo: str) -> str:
    agora = datetime.now(UTC)
    payload = dados.copy()
    payload.update(
        {
            "type": tipo,
            "iat": agora,
            "exp": agora + expira_em,
        }
    )
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITMO_JWT)


def decodificar_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITMO_JWT])

