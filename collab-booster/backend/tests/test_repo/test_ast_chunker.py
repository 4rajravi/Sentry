"""Tests for the AST-aware Python chunker."""

SAMPLE_PYTHON = '''
"""Loan calculator module."""
import math

class LoanCalculator:
    """Calculates loan payments."""

    def __init__(self, principal: float, rate: float):
        self.principal = principal
        self.rate = rate

    def monthly_payment(self, term_months: int) -> float:
        """Calculate monthly payment using amortization formula."""
        r = self.rate / 12 / 100
        return self.principal * r / (1 - (1 + r) ** -term_months)

    def calculate_loan_term(self, monthly_payment: float) -> int:
        """Calculate number of months to repay the loan."""
        r = self.rate / 12 / 100
        return int(-math.log(1 - self.principal * r / monthly_payment) / math.log(1 + r))
'''


def test_ast_chunker_extracts_functions():
    from src.repo.chunker.ast_chunker import ASTChunker
    chunker = ASTChunker()
    chunks = chunker.chunk("calculator.py", SAMPLE_PYTHON)
    chunk_types = {c.metadata.chunk_type for c in chunks}
    assert "function" in chunk_types or "class" in chunk_types


def test_ast_chunker_generates_file_summary():
    from src.repo.chunker.ast_chunker import ASTChunker
    chunker = ASTChunker()
    chunks = chunker.chunk("calculator.py", SAMPLE_PYTHON)
    summaries = [c for c in chunks if c.metadata.chunk_type == "file_summary"]
    assert len(summaries) == 1
    assert "LoanCalculator" in summaries[0].content


def test_context_header_present():
    from src.repo.chunker.ast_chunker import ASTChunker
    chunker = ASTChunker()
    chunks = chunker.chunk("src/loan/calculator.py", SAMPLE_PYTHON)
    for chunk in chunks:
        assert chunk.context_header != ""
        assert "calculator.py" in chunk.context_header


def test_chunks_have_content():
    from src.repo.chunker.ast_chunker import ASTChunker
    chunker = ASTChunker()
    chunks = chunker.chunk("calculator.py", SAMPLE_PYTHON)
    for chunk in chunks:
        assert chunk.content == chunk.context_header + "\n\n" + chunk.body


def test_ast_chunker_file_path_in_metadata():
    from src.repo.chunker.ast_chunker import ASTChunker
    chunker = ASTChunker()
    chunks = chunker.chunk("src/calculator.py", SAMPLE_PYTHON)
    for chunk in chunks:
        assert chunk.metadata.file_path == "src/calculator.py"
