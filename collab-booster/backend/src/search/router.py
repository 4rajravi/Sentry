from fastapi import APIRouter, Depends

from src.auth.dependencies import get_current_user
from src.search.schemas import SearchRequest, SearchResult
from src.search.service import hybrid_search

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=list[SearchResult])
async def search(body: SearchRequest, _=Depends(get_current_user)):
    return await hybrid_search(body)
