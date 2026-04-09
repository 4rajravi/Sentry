"""Config/YAML/TOML/JSON file chunker — whole file as one chunk."""
from pathlib import Path

from src.repo.chunker.base import AbstractChunker, Chunk, ChunkMetadata


class ConfigChunker(AbstractChunker):
    EXTENSIONS = {".yml", ".yaml", ".toml", ".json", ".env", ".ini", ".cfg"}

    def chunk(self, file_path: str, content: str) -> list[Chunk]:
        ext = Path(file_path).suffix.lower()
        lang = ext.lstrip(".") if ext else "config"
        header = f"# File: {file_path}\n# Type: config\n# Language: {lang}"
        return [
            Chunk(
                content=header + "\n\n" + content,
                context_header=header,
                body=content,
                metadata=ChunkMetadata(
                    chunk_type="config",
                    file_path=file_path,
                    language=lang,
                ),
            )
        ]
