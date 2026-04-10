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
    smart_model: str = "gpt-4o-mini"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    # GitHub OAuth (for private repo access)
    github_client_id: str = ""
    github_client_secret: str = ""
    github_oauth_scope: str = "repo read:user"

    # Google OAuth (for Google Docs import)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_oauth_scope: str = (
        "openid email "
        "https://www.googleapis.com/auth/documents "
        "https://www.googleapis.com/auth/drive.file"
    )

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
