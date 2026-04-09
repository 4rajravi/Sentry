"""RAG search tool for LangChain agents."""
from langchain_core.tools import tool

from src.repo.runtime import get_repo_runtime_context
from src.search.schemas import SearchRequest
from src.search.service import hybrid_search


@tool
async def rag_search(query: str, top_k: int = 3, chunk_type: str | None = None) -> str:
    """Search the codebase using hybrid BM25 + vector search.

    Args:
        query: Natural language search query about the codebase
        top_k: Number of results to return (default 5)
        chunk_type: Optional filter: 'function', 'class', 'file_summary', 'commit', 'markdown_section'
    """
    req = SearchRequest(query=query, top_k=top_k, chunk_type=chunk_type)
    ctx = get_repo_runtime_context()
    results = await hybrid_search(req, user_id=ctx.user_id, repo_id=ctx.repo_id)
    if not results:
        return "No relevant code found for this query."

    formatted = []
    for r in results:
        formatted.append(
            f"**{r.file_path}**"
            + (f" (lines {r.start_line}-{r.end_line})" if r.start_line else "")
            + f"\n```\n{r.body[:450]}\n```"
        )
    return "\n\n---\n\n".join(formatted)
