"""Writes chunks to Qdrant vector store and maintains BM25 index."""
import uuid

from qdrant_client.models import Distance, PointStruct, VectorParams

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


async def index_chunks(chunks: list[Chunk], embeddings: list[list[float]]):
    """Upsert chunks with their embeddings into Qdrant."""
    await ensure_collection()
    client = get_qdrant()

    points = []
    for chunk, embedding in zip(chunks, embeddings):
        point_id = str(uuid.uuid4())
        payload = {
            "content": chunk.content,
            "context_header": chunk.context_header,
            "body": chunk.body,
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
