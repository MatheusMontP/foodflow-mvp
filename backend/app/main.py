from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import criar_banco, criar_dados_iniciais
from app.modules.adicionais.routes import router as adicionais_router
from app.modules.auth.routes import router as auth_router
from app.modules.categorias.routes import router as categorias_router
from app.modules.estoque.routes import router as estoque_router
from app.modules.health.routes import router as health_router
from app.modules.insumos.routes import router as insumos_router
from app.modules.produtos.routes import router as produtos_router
from app.modules.unidades.routes import router_conversoes, router_unidades
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
    app.include_router(categorias_router, prefix=settings.api_prefix)
    app.include_router(router_unidades, prefix=settings.api_prefix)
    app.include_router(router_conversoes, prefix=settings.api_prefix)
    app.include_router(insumos_router, prefix=settings.api_prefix)
    app.include_router(estoque_router, prefix=settings.api_prefix)
    app.include_router(produtos_router, prefix=settings.api_prefix)
    app.include_router(adicionais_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    def ao_iniciar() -> None:
        criar_banco()
        criar_dados_iniciais()

    return app


app = criar_app()
