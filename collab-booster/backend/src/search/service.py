"""Unified hybrid search interface: BM25 + dense vectors + RRF fusion."""
import logging
from time import perf_counter

from src.repo.embedder import Embedder
from src.search.bm25_engine import get_bm25_engine
from src.search.fusion import results_to_search_results, rrf_fusion
from src.search.schemas import SearchRequest, SearchResult
from src.search.vector_engine import vector_search

_embedder: Embedder | None = None
logger = logging.getLogger(__name__)


def _get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder


async def hybrid_search(
    req: SearchRequest,
    *,
    user_id: str | None = None,
    repo_id: str | None = None,
) -> list[SearchResult]:
    embedder = _get_embedder()

    # Parallel: embed query + BM25 search
    started = perf_counter()
    query_vector = await embedder.embed_one(req.query)
    embed_ms = (perf_counter() - started) * 1000

    bm25_engine = get_bm25_engine()
    bm25_started = perf_counter()
    bm25_results = bm25_engine.search(req.query, top_k=60) if bm25_engine.is_built else []
    if user_id or repo_id:
        filtered = []
        for chunk_id, score, payload in bm25_results:
            if user_id and payload.get("user_id") != user_id:
                continue
            if repo_id and payload.get("repo_id") != repo_id:
                continue
            filtered.append((chunk_id, score, payload))
        bm25_results = filtered[:20]
    bm25_ms = (perf_counter() - bm25_started) * 1000

    vec_started = perf_counter()
    vec_results = await vector_search(
        query_vector=query_vector,
        top_k=20,
        chunk_type=req.chunk_type,
        file_path=req.file_path,
        language=req.language,
        user_id=user_id,
        repo_id=repo_id,
    )
    vec_ms = (perf_counter() - vec_started) * 1000

    fused = rrf_fusion(bm25_results, vec_results, top_k=req.top_k)
    total_ms = (perf_counter() - started) * 1000
    logger.info(
        "hybrid_search %.1fms (embed=%.1fms bm25=%.1fms vec=%.1fms q=%r)",
        total_ms,
        embed_ms,
        bm25_ms,
        vec_ms,
        req.query[:80],
    )
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
