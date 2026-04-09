"""Writes chunks to Qdrant vector store and maintains BM25 index."""
import hashlib

from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointStruct,
    VectorParams,
)

from src.common.qdrant import get_qdrant
from src.config import settings
from src.repo.chunker.base import Chunk

VECTOR_DIM = 1536


async def ensure_collection():
    client = get_qdrant()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    if settings.qdrant_collection not in names:
        await client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
        )


async def clear_repo_chunks(user_id: str, repo_id: str):
    client = get_qdrant()
    filt = Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="repo_id", match=MatchValue(value=repo_id)),
        ]
    )
    await client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=FilterSelector(filter=filt),
    )


async def index_chunks(
    chunks: list[Chunk],
    embeddings: list[list[float]],
    *,
    user_id: str,
    repo_id: str,
    repo_url: str | None = None,
):
    """Upsert chunks with their embeddings into Qdrant."""
    await ensure_collection()
    client = get_qdrant()

    points = []
    for chunk, embedding in zip(chunks, embeddings):
        source_id = (
            f"{repo_id}|{chunk.metadata.file_path}|{chunk.metadata.chunk_type}|"
            f"{chunk.metadata.start_line}|{chunk.metadata.end_line}|{chunk.body[:200]}"
        )
        point_id = hashlib.sha1(source_id.encode("utf-8")).hexdigest()
        payload = {
            "content": chunk.content,
            "context_header": chunk.context_header,
            "body": chunk.body,
            "user_id": user_id,
            "repo_id": repo_id,
            "repo_url": repo_url,
            "chunk_type": chunk.metadata.chunk_type,
            "file_path": chunk.metadata.file_path,
            "language": chunk.metadata.language,
            "class_name": chunk.metadata.class_name,
            "function_name": chunk.metadata.function_name,
            "start_line": chunk.metadata.start_line,
            "end_line": chunk.metadata.end_line,
            "commit_id": chunk.metadata.commit_id,
            "commit_message": chunk.metadata.commit_message,
        }
        points.append(PointStruct(id=point_id, vector=embedding, payload=payload))

    # Upsert in batches of 100
    for i in range(0, len(points), 100):
        await client.upsert(
            collection_name=settings.qdrant_collection,
            points=points[i : i + 100],
        )
