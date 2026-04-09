"""Tests for RRF fusion."""


def test_rrf_fusion_combines_results():
    from src.search.fusion import rrf_fusion
    bm25 = [("id1", 0.9, {"chunk_type": "function"}), ("id2", 0.7, {"chunk_type": "class"})]
    vec = [("id2", 0.95, {"chunk_type": "class"}), ("id3", 0.8, {"chunk_type": "function"})]
    result = rrf_fusion(bm25, vec, top_k=3)
    ids = [r[0] for r in result]
    # id2 appears in both lists — should rank high
    assert "id2" in ids[:2]


def test_rrf_fusion_empty_inputs():
    from src.search.fusion import rrf_fusion
    result = rrf_fusion([], [], top_k=5)
    assert result == []


def test_rrf_fusion_single_source():
    from src.search.fusion import rrf_fusion
    bm25 = [("id1", 0.9, {}), ("id2", 0.5, {})]
    result = rrf_fusion(bm25, [], top_k=2)
    assert len(result) == 2


def test_results_to_search_results():
    from src.search.fusion import results_to_search_results
    fused = [
        (
            "abc123",
            0.85,
            {
                "content": "def calculate(): ...",
                "context_header": "# File: calc.py",
                "body": "def calculate(): ...",
                "chunk_type": "function",
                "file_path": "src/calc.py",
            },
        )
    ]
    results = results_to_search_results(fused)
    assert len(results) == 1
    assert results[0].chunk_id == "abc123"
    assert results[0].score == 0.85
    assert results[0].file_path == "src/calc.py"
