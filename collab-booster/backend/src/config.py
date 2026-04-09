from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://collabbooster:collabbooster@localhost:5432/collabbooster"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "code_chunks"

    # OpenAI
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    fast_model: str = "gpt-4o-mini"
    smart_model: str = "gpt-4o"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
