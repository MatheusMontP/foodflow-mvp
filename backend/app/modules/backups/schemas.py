from datetime import datetime
from pydantic import BaseModel

class BackupResponse(BaseModel):
    nome_arquivo: str
    tamanho_bytes: int
    data_criacao: datetime

class BackupGenerico(BaseModel):
    mensagem: str
