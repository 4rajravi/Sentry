"""Commit chunker — each commit becomes one chunk."""
import re
from datetime import datetime

from src.repo.chunker.base import AbstractChunker, Chunk, ChunkMetadata

TICKET_RE = re.compile(r"(JIRA-\d+)", re.IGNORECASE)


class CommitChunker(AbstractChunker):
    def chunk(self, file_path: str, content: str) -> list[Chunk]:
        """Not used — use chunk_commit directly."""
        return []

    def chunk_commit(
        self,
        commit_sha: str,
        commit_message: str,
        author: str,
        date: datetime,
        files_changed: list[str],
        diff_stat: str = "",
    ) -> Chunk:
        ticket_ids = TICKET_RE.findall(commit_message)
        ticket_ref = ticket_ids[0] if ticket_ids else None

        body = (
            f"Commit: {commit_sha[:12]}\n"
            f"Author: {author}\n"
            f"Date: {date.isoformat()}\n"
            f"Message: {commit_message}\n"
            f"Files changed: {', '.join(files_changed)}\n"
        )
        if diff_stat:
            body += f"Diff stat:\n{diff_stat}\n"

        context_header = (
            f"# Type: commit\n"
            f"# Commit: {commit_sha[:12]}\n"
            f"# Author: {author}\n"
            + (f"# Ticket: {ticket_ref}\n" if ticket_ref else "")
        )

        return Chunk(
            content=context_header + "\n" + body,
            context_header=context_header,
            body=body,
            metadata=ChunkMetadata(
                chunk_type="commit",
                file_path="git://commits",
                commit_id=commit_sha,
                commit_message=commit_message,
            ),
        )
