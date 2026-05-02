from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.auth.service import obter_usuario_por_token


bearer_scheme = HTTPBearer(auto_error=False)


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    sessao: Session = Depends(obter_sessao),
) -> Usuario:
    if credenciais is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso obrigatorio.",
        )

    return obter_usuario_por_token(sessao, credenciais.credentials)


def exigir_papeis(*papeis: PapelUsuario) -> Callable[[Usuario], Usuario]:
    def dependencia(usuario: Usuario = Depends(obter_usuario_atual)) -> Usuario:
        if usuario.papel not in papeis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissao insuficiente.",
            )
        return usuario

    return dependencia

