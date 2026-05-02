from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import criar_banco
from app.modules.auth.routes import router as auth_router
from app.modules.health.routes import router as health_router
from app.modules.usuarios.routes import router as usuarios_router


def criar_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(usuarios_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    def ao_iniciar() -> None:
        criar_banco()

    return app


app = criar_app()
