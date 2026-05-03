from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FoodFlow Gestao"
    app_env: str = "development"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./foodflow.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    secret_key: str = "troque-esta-chave-em-desenvolvimento"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def obter_settings() -> Settings:
    return Settings()


settings = obter_settings()
