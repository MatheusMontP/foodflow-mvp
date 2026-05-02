from fastapi import APIRouter

from app.modules.health.schemas import HealthResponse
from app.modules.health.service import obter_status


router = APIRouter(prefix="/health", tags=["Saude"])


@router.get("", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return obter_status()

