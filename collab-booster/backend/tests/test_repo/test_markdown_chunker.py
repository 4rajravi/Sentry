"""Tests for the Markdown chunker."""

SAMPLE_MD = """
# Project README

## Installation

### Prerequisites
- Python 3.12+
- uv package manager

### Steps
1. Clone the repo
2. Run `uv sync`

## Usage

| Command | Description |
|---------|-------------|
| uv run start | Start server |
| uv run test | Run tests |

## Contributing
Please read CONTRIBUTING.md
"""


def test_markdown_splits_on_headers():
    from src.repo.chunker.markdown_chunker import MarkdownChunker
    chunker = MarkdownChunker()
    chunks = chunker.chunk("README.md", SAMPLE_MD)
    assert len(chunks) >= 2


def test_markdown_preserves_tables():
    from src.repo.chunker.markdown_chunker import MarkdownChunker
    chunker = MarkdownChunker()
    chunks = chunker.chunk("README.md", SAMPLE_MD)
    # The table should not be split across chunks
    table_chunks = [c for c in chunks if "|" in c.body]
    for tc in table_chunks:
        assert tc.body.count("|") >= 4


def test_markdown_context_header_includes_file():
    from src.repo.chunker.markdown_chunker import MarkdownChunker
    chunker = MarkdownChunker()
    chunks = chunker.chunk("docs/README.md", SAMPLE_MD)
    for chunk in chunks:
        assert "README.md" in chunk.context_header


def test_markdown_chunk_type():
    from src.repo.chunker.markdown_chunker import MarkdownChunker
    chunker = MarkdownChunker()
    chunks = chunker.chunk("README.md", SAMPLE_MD)
    for chunk in chunks:
        assert chunk.metadata.chunk_type == "markdown_section"
