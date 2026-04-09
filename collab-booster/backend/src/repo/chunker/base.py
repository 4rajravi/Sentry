from abc import ABC, abstractmethod

from pydantic import BaseModel


class ChunkMetadata(BaseModel):
    chunk_type: str  # "file_summary" | "class" | "function" | "import_block" | "markdown_section" | "config" | "commit"
    file_path: str
    language: str | None = None
    class_name: str | None = None
    function_name: str | None = None
    start_line: int | None = None
    end_line: int | None = None
    calls: list[str] = []
    called_by: list[str] = []
    commit_id: str | None = None
    commit_message: str | None = None


class Chunk(BaseModel):
    content: str  # context_header + "\n\n" + body
    context_header: str
    body: str
    metadata: ChunkMetadata


class AbstractChunker(ABC):
    @abstractmethod
    def chunk(self, file_path: str, content: str) -> list[Chunk]:
        ...
