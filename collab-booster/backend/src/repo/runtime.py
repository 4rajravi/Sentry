from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass


@dataclass
class RepoRuntimeContext:
    user_id: str | None = None
    repo_id: str | None = None
    repo_path: str | None = None


_repo_runtime_ctx: ContextVar[RepoRuntimeContext] = ContextVar(
    "repo_runtime_ctx",
    default=RepoRuntimeContext(),
)


@contextmanager
def repo_runtime_scope(
    user_id: str | None = None,
    repo_id: str | None = None,
    repo_path: str | None = None,
):
    token = _repo_runtime_ctx.set(
        RepoRuntimeContext(user_id=user_id, repo_id=repo_id, repo_path=repo_path)
    )
    try:
        yield
    finally:
        _repo_runtime_ctx.reset(token)


def get_repo_runtime_context() -> RepoRuntimeContext:
    return _repo_runtime_ctx.get()
