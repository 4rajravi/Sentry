from pydantic import BaseModel


class IngestRequest(BaseModel):
    repo_url: str | None = None
    repo_path: str | None = None  # local path (for seed data)
    private_repo: bool = False


class IngestResponse(BaseModel):
    files_processed: int
    chunks_indexed: int
    message: str = "Ingestion complete"
    active_repo_id: str
    active_repo_url: str | None = None


class FileTreeNode(BaseModel):
    name: str
    path: str
    type: str  # "file" | "dir"
    children: list["FileTreeNode"] = []


class RepoContextResponse(BaseModel):
    github_connected: bool
    github_username: str | None = None
    active_repo_id: str | None = None
    active_repo_url: str | None = None
    active_repo_path: str | None = None


class GitHubAuthUrlResponse(BaseModel):
    auth_url: str
