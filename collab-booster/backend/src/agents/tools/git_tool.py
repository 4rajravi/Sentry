"""Git tools for LangChain agents."""
import os

import git
from langchain_core.tools import tool

from src.repo.runtime import get_repo_runtime_context

REPO_PATH = os.environ.get("SEED_REPO_PATH", "/app/seed-data/loan-calculator")


@tool
def git_log(max_count: int = 10, since: str | None = None, until: str | None = None) -> str:
    """Get recent git commit history.

    Args:
        max_count: Max number of commits to return
        since: ISO date string, only show commits after this date
        until: ISO date string, only show commits before this date
    """
    try:
        runtime = get_repo_runtime_context()
        repo_path = runtime.repo_path or REPO_PATH
        repo = git.Repo(repo_path)
        kwargs = {"max_count": max_count}
        if since:
            kwargs["after"] = since
        if until:
            kwargs["before"] = until

        commits = list(repo.iter_commits(**kwargs))
        lines = []
        for c in commits:
            lines.append(
                f"{c.hexsha[:8]} | {c.authored_datetime.date()} | {c.author.name} | {c.message.strip()[:80]}"
            )
        return "\n".join(lines) if lines else "No commits found."
    except Exception as e:
        return f"Git error: {e}"


@tool
def git_diff(commit_sha: str) -> str:
    """Get the diff for a specific commit.

    Args:
        commit_sha: The commit SHA to show the diff for
    """
    try:
        runtime = get_repo_runtime_context()
        repo_path = runtime.repo_path or REPO_PATH
        repo = git.Repo(repo_path)
        commit = repo.commit(commit_sha)
        if commit.parents:
            diff = commit.diff(commit.parents[0], create_patch=True)
            parts = []
            for d in diff[:5]:  # limit to 5 files
                parts.append(f"--- {d.a_path}\n+++ {d.b_path}")
                if hasattr(d, "diff"):
                    patch = d.diff.decode("utf-8", errors="ignore")
                    parts.append(patch[:2000])
            return "\n".join(parts) if parts else "Empty diff."
        return f"Commit {commit_sha[:8]}: initial commit (no parent)"
    except Exception as e:
        return f"Git error: {e}"


@tool
def git_show(commit_sha: str) -> str:
    """Show commit metadata (message, author, files changed).

    Args:
        commit_sha: The commit SHA to inspect
    """
    try:
        runtime = get_repo_runtime_context()
        repo_path = runtime.repo_path or REPO_PATH
        repo = git.Repo(repo_path)
        commit = repo.commit(commit_sha)
        files = list(commit.stats.files.keys())[:20]
        return (
            f"Commit: {commit.hexsha}\n"
            f"Author: {commit.author.name} <{commit.author.email}>\n"
            f"Date: {commit.authored_datetime}\n"
            f"Message: {commit.message.strip()}\n"
            f"Files changed: {', '.join(files)}"
        )
    except Exception as e:
        return f"Git error: {e}"
