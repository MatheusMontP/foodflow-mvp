import os
import shutil
import glob
import logging
from datetime import datetime
from pathlib import Path
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)

class BackupService:
    def __init__(self):
        # A URL do banco tem formato "sqlite:///./foodflow.db"
        # Precisamos pegar o caminho real do arquivo
        db_url = settings.database_url
        if db_url.startswith("sqlite:///"):
            self.db_path = db_url.replace("sqlite:///", "")
        else:
            self.db_path = "./foodflow.db"

        # Diretório onde os backups serão guardados
        self.diretorio_backups = os.path.join(os.path.dirname(self.db_path), "backups_local")
        
    def criar_backup(self) -> str:
        """Cria uma cópia do banco de dados atual no diretório de backups."""
        if not os.path.exists(self.db_path):
            logger.warning(f"Arquivo de banco de dados não encontrado em {self.db_path}. Ignorando backup.")
            return "Banco não encontrado."

        if not os.path.exists(self.diretorio_backups):
            os.makedirs(self.diretorio_backups)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nome_backup = f"foodflow_backup_{timestamp}.db"
        caminho_backup = os.path.join(self.diretorio_backups, nome_backup)

        try:
            shutil.copy2(self.db_path, caminho_backup)
            logger.info(f"Backup criado com sucesso: {nome_backup}")
        except Exception as e:
            logger.error(f"Erro ao criar backup do SQLite: {e}")
            raise e

        # Limpar backups antigos
        self._limpar_backups_antigos()

        return nome_backup

    def _limpar_backups_antigos(self):
        """Mantém apenas os últimos 7 backups no diretório e deleta os mais antigos."""
        if not os.path.exists(self.diretorio_backups):
            return

        arquivos_backup = glob.glob(os.path.join(self.diretorio_backups, "foodflow_backup_*.db"))
        
        # Ordena pela data de modificação (do mais antigo para o mais recente)
        arquivos_backup.sort(key=os.path.getmtime)

        # Se tiver mais que 7, remove os mais antigos
        qtd_para_remover = len(arquivos_backup) - 7
        if qtd_para_remover > 0:
            para_remover = arquivos_backup[:qtd_para_remover]
            for arquivo in para_remover:
                try:
                    os.remove(arquivo)
                    logger.info(f"Backup antigo removido: {arquivo}")
                except Exception as e:
                    logger.error(f"Erro ao remover backup antigo {arquivo}: {e}")

    def listar_backups(self) -> List[dict]:
        """Retorna os metadados dos backups disponiveis."""
        if not os.path.exists(self.diretorio_backups):
            return []

        arquivos_backup = glob.glob(os.path.join(self.diretorio_backups, "foodflow_backup_*.db"))
        arquivos_backup.sort(key=os.path.getmtime, reverse=True)

        resultados = []
        for arquivo in arquivos_backup:
            stats = os.stat(arquivo)
            nome = os.path.basename(arquivo)
            resultados.append({
                "nome_arquivo": nome,
                "tamanho_bytes": stats.st_size,
                "data_criacao": datetime.fromtimestamp(stats.st_mtime)
            })

        return resultados
