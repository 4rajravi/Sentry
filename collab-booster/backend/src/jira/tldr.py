"""Utilities for loading TLDR/technical-doc content from links."""
import re

import httpx


def _google_doc_id(url: str) -> str | None:
    match = re.search(r"/document/d/([a-zA-Z0-9_-]+)", url)
    return match.group(1) if match else None


async def fetch_tldr_text(url: str | None, max_chars: int = 6000) -> str:
    """Fetch text content for a TLDR/technical document link.

    Supports public Google Docs links via export endpoint.
    Returns empty string on failure.
    """
    if not url:
        return ""

    try:
        doc_id = _google_doc_id(url)
        target = (
            f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
            if doc_id
            else url
        )
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(target)
            if resp.status_code >= 400:
                return ""
            text = resp.text.strip()
            return text[:max_chars]
    except Exception:
        return ""
