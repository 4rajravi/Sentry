from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.common.database import get_db
from src.repo.context_service import resolve_runtime_repo_for_user
from src.search.schemas import SearchRequest, SearchResult
from src.search.service import hybrid_search

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=list[SearchResult])
async def search(
    body: SearchRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    return await hybrid_search(body, user_id=current_user.id, repo_id=repo_id)
