from qdrant_client import AsyncQdrantClient

from src.config import settings

_qdrant_client: AsyncQdrantClient | None = None


def get_qdrant() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = AsyncQdrantClient(url=settings.qdrant_url)
    return _qdrant_client
