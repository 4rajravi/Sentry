from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    chunk_type: str | None = None  # filter by chunk_type
    file_path: str | None = None   # filter by file_path
    language: str | None = None


class SearchResult(BaseModel):
    chunk_id: str
    content: str
    context_header: str
    body: str
    chunk_type: str
    file_path: str
    score: float
    language: str | None = None
    class_name: str | None = None
    function_name: str | None = None
    start_line: int | None = None
    end_line: int | None = None
