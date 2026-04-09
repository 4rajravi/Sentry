"""File reading tool for LangChain agents."""
import os
from pathlib import Path

from langchain_core.tools import tool

REPO_PATH = os.environ.get("SEED_REPO_PATH", "/app/seed-data/loan-calculator")


@tool
def read_file(file_path: str) -> str:
    """Read the content of a file from the loan calculator repository.

    Args:
        file_path: Relative path from repo root (e.g. 'src/calculator.py')
    """
    full_path = Path(REPO_PATH) / file_path
    if not full_path.exists():
        return f"File not found: {file_path}"
    if not full_path.is_file():
        return f"Not a file: {file_path}"
    try:
        content = full_path.read_text(encoding="utf-8", errors="ignore")
        return f"# {file_path}\n\n{content[:5000]}"  # limit to 5000 chars
    except Exception as e:
        return f"Error reading {file_path}: {e}"


@tool
def list_files(directory: str = "") -> str:
    """List files in a directory of the loan calculator repository.

    Args:
        directory: Relative directory path (empty = repo root)
    """
    full_path = Path(REPO_PATH) / directory
    if not full_path.exists():
        return f"Directory not found: {directory}"

    ignored = {".git", "node_modules", "__pycache__", ".venv"}
    entries = []
    for entry in sorted(full_path.iterdir()):
        if entry.name in ignored or entry.name.startswith("."):
            continue
        marker = "/" if entry.is_dir() else ""
        entries.append(f"  {entry.name}{marker}")
    return "\n".join(entries) if entries else "Empty directory."
