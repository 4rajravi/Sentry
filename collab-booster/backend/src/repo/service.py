"""Orchestrates the full repo ingestion pipeline."""
import logging
from pathlib import Path

from src.repo.chunker.ast_chunker import ASTChunker
from src.repo.chunker.base import Chunk
from src.repo.chunker.commit_chunker import CommitChunker
from src.repo.chunker.config_chunker import ConfigChunker
from src.repo.chunker.markdown_chunker import MarkdownChunker
from src.repo.cloner import get_git_commits, walk_repo_files
from src.repo.embedder import Embedder
from src.repo.indexer import index_chunks

logger = logging.getLogger(__name__)

MARKDOWN_EXTENSIONS = {".md", ".mdx", ".rst"}
CONFIG_EXTENSIONS = {".yml", ".yaml", ".toml", ".json", ".env", ".ini", ".cfg"}
CODE_EXTENSIONS = {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs"}


async def ingest_repo(repo_path: str) -> dict:
    """Full pipeline: walk files → chunk → embed → index."""
    ast_chunker = ASTChunker()
    md_chunker = MarkdownChunker()
    config_chunker = ConfigChunker()
    commit_chunker = CommitChunker()
    embedder = Embedder()

    all_chunks: list[Chunk] = []

    # Walk and chunk files
    files = walk_repo_files(repo_path)
    logger.info(f"Found {len(files)} files in {repo_path}")

    for rel_path, content in files:
        ext = Path(rel_path).suffix.lower()
        try:
            if ext in MARKDOWN_EXTENSIONS:
                chunks = md_chunker.chunk(rel_path, content)
            elif ext in CONFIG_EXTENSIONS:
                chunks = config_chunker.chunk(rel_path, content)
            elif ext in CODE_EXTENSIONS:
                chunks = ast_chunker.chunk(rel_path, content)
            else:
                continue
            all_chunks.extend(chunks)
        except Exception as e:
            logger.warning(f"Failed to chunk {rel_path}: {e}")

    # Chunk commits
    try:
        commits = get_git_commits(repo_path)
        for c in commits:
            chunk = commit_chunker.chunk_commit(
                commit_sha=c["sha"],
                commit_message=c["message"],
                author=c["author"],
                date=c["date"],
                files_changed=c["files_changed"],
            )
            all_chunks.append(chunk)
    except Exception as e:
        logger.warning(f"Failed to chunk commits: {e}")

    logger.info(f"Total chunks: {len(all_chunks)}")

    # Embed in batches
    texts = [c.content for c in all_chunks]
    embeddings = await embedder.embed_batch(texts)

    # Index
    await index_chunks(all_chunks, embeddings)

    return {
        "files_processed": len(files),
        "chunks_indexed": len(all_chunks),
    }
