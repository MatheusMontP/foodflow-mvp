from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.auth.models import LogAcesso, Usuario


def contar_usuarios(sessao: Session) -> int:
    return sessao.scalar(select(func.count()).select_from(Usuario)) or 0


def buscar_usuario_por_email(sessao: Session, email: str) -> Usuario | None:
    return sessao.scalar(select(Usuario).where(Usuario.email == email.lower()))


def buscar_usuario_por_id(sessao: Session, usuario_id: int) -> Usuario | None:
    return sessao.get(Usuario, usuario_id)


def listar_usuarios(sessao: Session) -> list[Usuario]:
    return list(sessao.scalars(select(Usuario).order_by(Usuario.nome)))


def salvar_usuario(sessao: Session, usuario: Usuario) -> Usuario:
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)
    return usuario


def registrar_log_acesso(
    sessao: Session,
    email: str,
    sucesso: bool,
    usuario_id: int | None = None,
    motivo: str | None = None,
) -> LogAcesso:
    log = LogAcesso(
        usuario_id=usuario_id,
        email=email.lower(),
        sucesso=sucesso,
        motivo=motivo,
    )
    sessao.add(log)
    sessao.commit()
    sessao.refresh(log)
    return log

