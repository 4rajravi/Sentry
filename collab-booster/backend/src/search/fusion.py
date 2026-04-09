"""Reciprocal Rank Fusion (RRF) to combine BM25 + dense vector results."""
from collections import defaultdict

from src.search.schemas import SearchResult

RRF_K = 60  # standard RRF constant


def rrf_fusion(
    bm25_results: list[tuple[str, float, dict]],
    vector_results: list[tuple[str, float, dict]],
    top_k: int = 20,
) -> list[tuple[str, float, dict]]:
    """Fuse two ranked lists using Reciprocal Rank Fusion."""
    rrf_scores: dict[str, float] = defaultdict(float)
    payloads: dict[str, dict] = {}

    for rank, (chunk_id, _score, payload) in enumerate(bm25_results):
        rrf_scores[chunk_id] += 1.0 / (RRF_K + rank + 1)
        payloads[chunk_id] = payload

    for rank, (chunk_id, _score, payload) in enumerate(vector_results):
        rrf_scores[chunk_id] += 1.0 / (RRF_K + rank + 1)
        if chunk_id not in payloads:
            payloads[chunk_id] = payload

    ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return [(chunk_id, score, payloads[chunk_id]) for chunk_id, score in ranked]


def results_to_search_results(fused: list[tuple[str, float, dict]]) -> list[SearchResult]:
    results = []
    for chunk_id, score, payload in fused:
        results.append(
            SearchResult(
                chunk_id=chunk_id,
                content=payload.get("content", ""),
                context_header=payload.get("context_header", ""),
                body=payload.get("body", ""),
                chunk_type=payload.get("chunk_type", "unknown"),
                file_path=payload.get("file_path", ""),
                score=score,
                language=payload.get("language"),
                class_name=payload.get("class_name"),
                function_name=payload.get("function_name"),
                start_line=payload.get("start_line"),
                end_line=payload.get("end_line"),
            )
        )
    return results
