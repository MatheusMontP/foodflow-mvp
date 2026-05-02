from datetime import timedelta

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import criar_token, decodificar_token, gerar_hash_senha, verificar_senha
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.auth.repository import (
    buscar_usuario_por_email,
    buscar_usuario_por_id,
    contar_usuarios,
    registrar_log_acesso,
    salvar_usuario,
)
from app.modules.auth.schemas import TokenResponse, UsuarioCriar, UsuarioPrimeiroOwnerCriar


def criar_primeiro_owner(sessao: Session, dados: UsuarioPrimeiroOwnerCriar) -> Usuario:
    if contar_usuarios(sessao) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O primeiro OWNER ja foi criado.",
        )

    return _criar_usuario(
        sessao,
        UsuarioCriar(
            nome=dados.nome,
            email=dados.email,
            senha=dados.senha,
            papel=PapelUsuario.OWNER,
        ),
    )


def criar_usuario(sessao: Session, dados: UsuarioCriar) -> Usuario:
    return _criar_usuario(sessao, dados)


def autenticar(sessao: Session, email: str, senha: str) -> TokenResponse:
    usuario = buscar_usuario_por_email(sessao, email)

    if usuario is None or not verificar_senha(senha, usuario.senha_hash):
        registrar_log_acesso(sessao, email=email, sucesso=False, motivo="Credenciais invalidas")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha invalidos.",
        )

    if not usuario.ativo:
        registrar_log_acesso(
            sessao,
            email=email,
            usuario_id=usuario.id,
            sucesso=False,
            motivo="Usuario inativo",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo.",
        )

    registrar_log_acesso(sessao, email=email, usuario_id=usuario.id, sucesso=True)
    return _criar_par_tokens(usuario)


def renovar_token(sessao: Session, refresh_token: str) -> TokenResponse:
    try:
        payload = decodificar_token(refresh_token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido.",
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token invalido.",
        )

    usuario = buscar_usuario_por_id(sessao, int(payload["sub"]))
    if usuario is None or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado ou inativo.",
        )

    return _criar_par_tokens(usuario)


def obter_usuario_por_token(sessao: Session, token: str) -> Usuario:
    try:
        payload = decodificar_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado.",
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token invalido.",
        )

    usuario = buscar_usuario_por_id(sessao, int(payload["sub"]))
    if usuario is None or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado ou inativo.",
        )

    return usuario


def _criar_usuario(sessao: Session, dados: UsuarioCriar) -> Usuario:
    if buscar_usuario_por_email(sessao, dados.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe usuario com este email.",
        )

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email.lower(),
        senha_hash=gerar_hash_senha(dados.senha),
        papel=dados.papel,
        ativo=True,
    )
    return salvar_usuario(sessao, usuario)


def _criar_par_tokens(usuario: Usuario) -> TokenResponse:
    dados = {"sub": str(usuario.id), "email": usuario.email, "papel": usuario.papel.value}
    access_token = criar_token(
        dados,
        timedelta(minutes=settings.access_token_minutes),
        tipo="access",
    )
    refresh_token = criar_token(
        dados,
        timedelta(days=settings.refresh_token_days),
        tipo="refresh",
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

