"""Git repo cloner and file walker."""
import os
import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

import git

IGNORED_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build",
    ".next", ".pytest_cache", "*.egg-info",
}
IGNORED_EXTENSIONS = {
    ".pyc", ".pyo", ".so", ".dll", ".exe", ".jpg", ".jpeg", ".png", ".gif",
    ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".zip",
    ".tar", ".gz", ".lock",
}
TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs",
    ".md", ".txt", ".yml", ".yaml", ".toml", ".json", ".env",
    ".ini", ".cfg", ".sh", ".html", ".css",
}
CLONE_PREFIX = "collab_booster_repo_"
CLONE_BASE_DIR = os.environ.get("REPO_CLONE_BASE", "/app/repos")


def _with_github_token(url: str, access_token: str) -> str:
    if not url.startswith("https://github.com/"):
        return url
    token = quote(access_token, safe="")
    return url.replace("https://", f"https://x-access-token:{token}@")


def clone_repo(url: str, target_dir: str | None = None, access_token: str | None = None) -> str:
    """Clone a git repo and return the local path."""
    if target_dir is None:
        base = Path(CLONE_BASE_DIR)
        base.mkdir(parents=True, exist_ok=True)
        target_dir = str(base / f"{CLONE_PREFIX}{uuid.uuid4().hex[:12]}")
    clone_url = _with_github_token(url, access_token) if access_token else url
    git.Repo.clone_from(clone_url, target_dir)
    return target_dir


def walk_repo_files(repo_path: str) -> list[tuple[str, str]]:
    """Walk a local repo and return (relative_path, content) for text files."""
    results = []
    base = Path(repo_path)

    for root, dirs, files in os.walk(base):
        # Prune ignored dirs in-place
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

        for fname in files:
            fpath = Path(root) / fname
            ext = fpath.suffix.lower()

            if ext in IGNORED_EXTENSIONS:
                continue
            if ext not in TEXT_EXTENSIONS and ext != "":
                continue

            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
                relative = str(fpath.relative_to(base))
                results.append((relative, content))
            except Exception:
                continue

    return results


def get_git_commits(repo_path: str, max_count: int = 200) -> list[dict]:
    """Return recent commits as dicts."""
    repo = git.Repo(repo_path)
    commits = []
    for commit in list(repo.iter_commits(max_count=max_count)):
        commits.append(
            {
                "sha": commit.hexsha,
                "message": commit.message.strip(),
                "author": str(commit.author),
                "date": commit.authored_datetime,
                "files_changed": list(commit.stats.files.keys()),
                "diff_stat": commit.stats.total,
            }
        )
    return commits


def list_repo_commits(
    repo_path: str,
    *,
    max_count: int = 200,
    query: str | None = None,
    file_path: str | None = None,
) -> list[dict]:
    """Return recent commits with optional text and file filters."""
    repo = git.Repo(repo_path)
    query_lc = query.lower().strip() if query else ""

    commits = []
    iter_kwargs: dict = {"max_count": max_count}
    if file_path:
        iter_kwargs["paths"] = file_path

    for commit in repo.iter_commits(**iter_kwargs):
        files_changed = list(commit.stats.files.keys())
        item = {
            "sha": commit.hexsha,
            "short_sha": commit.hexsha[:8],
            "message": commit.message.strip(),
            "author": str(commit.author),
            "date": _to_iso(commit.authored_datetime),
            "files_changed": files_changed,
            "files_changed_count": len(files_changed),
        }

        if query_lc:
            haystack = " ".join(
                [
                    item["sha"],
                    item["short_sha"],
                    item["message"],
                    item["author"],
                    " ".join(files_changed),
                ]
            ).lower()
            if query_lc not in haystack:
                continue

        commits.append(item)

    return commits


def get_commit_details(repo_path: str, commit_sha: str) -> dict:
    """Return full commit details and patch text."""
    repo = git.Repo(repo_path)
    commit = repo.commit(commit_sha)
    files_changed = list(commit.stats.files.keys())
    parent = commit.parents[0].hexsha if commit.parents else None

    # `--format=` returns only patch/stat output (without metadata header).
    patch = repo.git.show(
        commit.hexsha,
        "--format=",
        "--no-color",
        "--patch",
        "--stat",
    )

    return {
        "sha": commit.hexsha,
        "short_sha": commit.hexsha[:8],
        "message": commit.message.strip(),
        "author": str(commit.author),
        "date": _to_iso(commit.authored_datetime),
        "parent_sha": parent,
        "files_changed": files_changed,
        "files_changed_count": len(files_changed),
        "patch": patch,
    }


def _to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()
