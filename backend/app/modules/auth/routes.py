from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import obter_usuario_atual
from app.modules.auth.models import Usuario
from app.modules.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UsuarioPrimeiroOwnerCriar,
    UsuarioResponse,
)
from app.modules.auth.service import autenticar, criar_primeiro_owner, renovar_token


router = APIRouter(prefix="/auth", tags=["Autenticacao"])


@router.post(
    "/primeiro-owner",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_primeiro_owner(
    dados: UsuarioPrimeiroOwnerCriar,
    sessao: Session = Depends(obter_sessao),
) -> Usuario:
    return criar_primeiro_owner(sessao, dados)


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginRequest, sessao: Session = Depends(obter_sessao)) -> TokenResponse:
    return autenticar(sessao, dados.email, dados.senha)


@router.post("/refresh", response_model=TokenResponse)
def refresh(dados: RefreshRequest, sessao: Session = Depends(obter_sessao)) -> TokenResponse:
    return renovar_token(sessao, dados.refresh_token)


@router.get("/me", response_model=UsuarioResponse)
def me(usuario: Usuario = Depends(obter_usuario_atual)) -> Usuario:
    return usuario

