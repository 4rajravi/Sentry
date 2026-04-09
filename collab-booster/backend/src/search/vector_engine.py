"""Dense vector search via Qdrant."""
from qdrant_client.models import Filter, FieldCondition, MatchValue

from src.common.qdrant import get_qdrant
from src.config import settings


async def vector_search(
    query_vector: list[float],
    top_k: int = 20,
    chunk_type: str | None = None,
    file_path: str | None = None,
    language: str | None = None,
    user_id: str | None = None,
    repo_id: str | None = None,
) -> list[tuple[str, float, dict]]:
    """Search Qdrant. Returns (point_id, score, payload) tuples."""
    client = get_qdrant()

    # Build optional filter
    conditions = []
    if chunk_type:
        conditions.append(FieldCondition(key="chunk_type", match=MatchValue(value=chunk_type)))
    if file_path:
        conditions.append(FieldCondition(key="file_path", match=MatchValue(value=file_path)))
    if language:
        conditions.append(FieldCondition(key="language", match=MatchValue(value=language)))
    if user_id:
        conditions.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
    if repo_id:
        conditions.append(FieldCondition(key="repo_id", match=MatchValue(value=repo_id)))

    query_filter = Filter(must=conditions) if conditions else None

    try:
        results = await client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vector,
            limit=top_k,
            query_filter=query_filter,
            with_payload=True,
        )
        return [(str(r.id), r.score, r.payload or {}) for r in results]
    except Exception:
        return []
