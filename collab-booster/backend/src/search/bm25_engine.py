"""BM25 in-memory search index over code chunks."""
import re

from rank_bm25 import BM25Okapi

from src.search.schemas import SearchResult


def _tokenize(text: str) -> list[str]:
    """Simple tokenizer: lowercase, split on non-alphanumeric."""
    return re.findall(r"[a-z0-9_]+", text.lower())


class BM25Engine:
    """Maintains an in-memory BM25 index over indexed chunks.

    Rebuilt at startup by loading all chunk contents from Qdrant payloads.
    """

    def __init__(self):
        self._corpus: list[str] = []
        self._ids: list[str] = []
        self._payloads: list[dict] = []
        self._bm25: BM25Okapi | None = None

    def build(self, chunk_ids: list[str], contents: list[str], payloads: list[dict]):
        self._ids = chunk_ids
        self._corpus = contents
        self._payloads = payloads
        if not contents:
            # Empty index is valid after cleanup/logout.
            self._bm25 = None
            return
        tokenized = [_tokenize(c) for c in contents]
        self._bm25 = BM25Okapi(tokenized)

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float, dict]]:
        """Returns (chunk_id, score, payload) tuples sorted by BM25 score descending."""
        if self._bm25 is None or not self._ids:
            return []
        tokenized_query = _tokenize(query)
        scores = self._bm25.get_scores(tokenized_query)
        ranked = sorted(
            enumerate(scores), key=lambda x: x[1], reverse=True
        )[:top_k]
        return [
            (self._ids[idx], float(score), self._payloads[idx])
            for idx, score in ranked
            if score > 0
        ]

    @property
    def is_built(self) -> bool:
        return self._bm25 is not None


# Global singleton
_bm25_engine = BM25Engine()


def get_bm25_engine() -> BM25Engine:
    return _bm25_engine
