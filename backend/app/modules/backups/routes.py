from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.auth.dependencies import obter_usuario_atual
from app.modules.auth.models import Usuario
from app.modules.backups.schemas import BackupResponse, BackupGenerico
from app.modules.backups.service import BackupService

router = APIRouter(prefix="/backups", tags=["Backups"])
service = BackupService()

@router.post("/gerar", response_model=BackupGenerico)
def gerar_backup(current_user: Usuario = Depends(obter_usuario_atual)):
    # Dependendo da permissão, poderíamos restringir a OWNER ou MANAGER.
    if current_user.papel not in ["OWNER", "MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas gerentes ou donos podem iniciar o backup manual."
        )

    try:
        nome_arquivo = service.criar_backup()
        return BackupGenerico(mensagem=f"Backup concluído com sucesso: {nome_arquivo}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao gerar backup: {str(e)}"
        )

@router.get("/", response_model=List[BackupResponse])
def listar_backups(current_user: Usuario = Depends(obter_usuario_atual)):
    if current_user.papel not in ["OWNER", "MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada."
        )
    return service.listar_backups()
