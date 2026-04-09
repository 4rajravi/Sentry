"""Unified hybrid search interface: BM25 + dense vectors + RRF fusion."""
from src.repo.embedder import Embedder
from src.search.bm25_engine import get_bm25_engine
from src.search.fusion import results_to_search_results, rrf_fusion
from src.search.schemas import SearchRequest, SearchResult
from src.search.vector_engine import vector_search

_embedder: Embedder | None = None


def _get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder


async def hybrid_search(req: SearchRequest) -> list[SearchResult]:
    embedder = _get_embedder()

    # Parallel: embed query + BM25 search
    query_vector = await embedder.embed_one(req.query)

    bm25_engine = get_bm25_engine()
    bm25_results = bm25_engine.search(req.query, top_k=20) if bm25_engine.is_built else []

    vec_results = await vector_search(
        query_vector=query_vector,
        top_k=20,
        chunk_type=req.chunk_type,
        file_path=req.file_path,
        language=req.language,
    )

    fused = rrf_fusion(bm25_results, vec_results, top_k=req.top_k)
    return results_to_search_results(fused)


async def rebuild_bm25_from_qdrant():
    """Load all chunk contents from Qdrant and rebuild BM25 index."""
    from src.common.qdrant import get_qdrant
    from src.config import settings

    client = get_qdrant()
    try:
        scroll_result = await client.scroll(
            collection_name=settings.qdrant_collection,
            limit=10000,
            with_payload=True,
        )
        points = scroll_result[0]
    except Exception:
        return

    chunk_ids = [str(p.id) for p in points]
    contents = [p.payload.get("content", "") for p in points]
    payloads = [p.payload or {} for p in points]

    engine = get_bm25_engine()
    engine.build(chunk_ids, contents, payloads)
