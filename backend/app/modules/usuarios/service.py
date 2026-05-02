from sqlalchemy.orm import Session

from app.modules.auth.models import Usuario
from app.modules.auth.service import criar_usuario as criar_usuario_auth
from app.modules.usuarios.repository import listar_usuarios
from app.modules.usuarios.schemas import UsuarioCriar


def criar_usuario(sessao: Session, dados: UsuarioCriar) -> Usuario:
    return criar_usuario_auth(sessao, dados)


def obter_usuarios(sessao: Session) -> list[Usuario]:
    return listar_usuarios(sessao)

