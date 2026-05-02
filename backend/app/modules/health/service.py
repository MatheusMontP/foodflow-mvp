from app.core.config import settings
from app.modules.health.schemas import HealthResponse


def obter_status() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        ambiente=settings.app_env,
    )

