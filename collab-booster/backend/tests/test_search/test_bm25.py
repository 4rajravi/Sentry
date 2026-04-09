"""Tests for the BM25 search engine."""


def test_bm25_engine_builds():
    from src.search.bm25_engine import BM25Engine
    engine = BM25Engine()
    engine.build(
        chunk_ids=["id1", "id2", "id3"],
        contents=[
            "loan calculator monthly payment interest rate",
            "user authentication login password token",
            "database model schema migration table",
        ],
        payloads=[{"chunk_type": "function"}, {"chunk_type": "function"}, {"chunk_type": "config"}],
    )
    assert engine.is_built


def test_bm25_search_returns_relevant():
    from src.search.bm25_engine import BM25Engine
    engine = BM25Engine()
    engine.build(
        chunk_ids=["id1", "id2", "id3"],
        contents=[
            "loan calculator monthly payment interest rate amortization",
            "user authentication login password jwt token bearer",
            "database model schema migration SQLAlchemy table column",
        ],
        payloads=[{}, {}, {}],
    )
    results = engine.search("loan interest payment", top_k=3)
    assert len(results) > 0
    # The loan-related doc should rank first
    assert results[0][0] == "id1"


def test_bm25_search_empty_index():
    from src.search.bm25_engine import BM25Engine
    engine = BM25Engine()
    results = engine.search("anything", top_k=5)
    assert results == []


def test_bm25_returns_zero_score_for_irrelevant():
    from src.search.bm25_engine import BM25Engine
    engine = BM25Engine()
    engine.build(
        chunk_ids=["id1"],
        contents=["loan calculator monthly payment"],
        payloads=[{}],
    )
    results = engine.search("xyzqwerty randomnonexistent", top_k=5)
    # Either empty or all zero scores
    for _, score, _ in results:
        assert score == 0.0
