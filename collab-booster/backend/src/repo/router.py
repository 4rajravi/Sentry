import os
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends

from src.auth.dependencies import get_current_user
from src.repo.cloner import clone_repo
from src.repo.schemas import FileTreeNode, IngestRequest, IngestResponse
from src.repo.service import ingest_repo

router = APIRouter(prefix="/repo", tags=["repo"])

SEED_REPO_PATH = os.environ.get("SEED_REPO_PATH", "/app/seed-data/loan-calculator")


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
    _=Depends(get_current_user),
):
    if body.repo_path:
        path = body.repo_path
    elif body.repo_url:
        path = clone_repo(body.repo_url)
    else:
        path = SEED_REPO_PATH

    result = await ingest_repo(path)
    return IngestResponse(**result)


@router.get("/tree", response_model=list[FileTreeNode])
async def get_file_tree(_=Depends(get_current_user)):
    """Return simplified file tree of the seed loan calculator repo."""
    return _build_tree(SEED_REPO_PATH, SEED_REPO_PATH)


def _build_tree(base: str, path: str) -> list[FileTreeNode]:
    ignored = {".git", "node_modules", "__pycache__", ".venv", "venv"}
    nodes = []
    try:
        entries = sorted(os.listdir(path))
    except Exception:
        return []

    for entry in entries:
        if entry.startswith(".") or entry in ignored:
            continue
        full = os.path.join(path, entry)
        rel = os.path.relpath(full, base)
        if os.path.isdir(full):
            nodes.append(
                FileTreeNode(
                    name=entry,
                    path=rel,
                    type="dir",
                    children=_build_tree(base, full),
                )
            )
        else:
            nodes.append(FileTreeNode(name=entry, path=rel, type="file"))
    return nodes
