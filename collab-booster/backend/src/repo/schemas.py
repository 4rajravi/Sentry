from pydantic import BaseModel


class IngestRequest(BaseModel):
    repo_url: str | None = None
    repo_path: str | None = None  # local path (for seed data)


class IngestResponse(BaseModel):
    files_processed: int
    chunks_indexed: int
    message: str = "Ingestion complete"


class FileTreeNode(BaseModel):
    name: str
    path: str
    type: str  # "file" | "dir"
    children: list["FileTreeNode"] = []
