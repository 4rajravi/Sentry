"""Markdown chunker — splits on headers, preserves tables and code blocks."""
import re

from src.repo.chunker.base import AbstractChunker, Chunk, ChunkMetadata

HEADER_RE = re.compile(r"^(#{1,3})\s+(.+)$")


class MarkdownChunker(AbstractChunker):
    def chunk(self, file_path: str, content: str) -> list[Chunk]:
        lines = content.splitlines()
        sections: list[tuple[str, list[str]]] = []  # (breadcrumb, lines)

        breadcrumb: list[str] = []  # stack: [H1, H2, H3]
        current_lines: list[str] = []
        in_code_block = False

        for line in lines:
            if line.strip().startswith("```"):
                in_code_block = not in_code_block

            if not in_code_block:
                m = HEADER_RE.match(line)
                if m:
                    level = len(m.group(1))
                    title = m.group(2).strip()

                    # Save current section
                    if current_lines:
                        sections.append((" > ".join(breadcrumb), current_lines))
                        current_lines = []

                    # Update breadcrumb
                    breadcrumb = breadcrumb[: level - 1]
                    breadcrumb.append(title)
                    current_lines.append(line)
                    continue

            current_lines.append(line)

        if current_lines:
            sections.append((" > ".join(breadcrumb), current_lines))

        chunks: list[Chunk] = []
        for breadcrumb_str, sec_lines in sections:
            body = "\n".join(sec_lines).strip()
            if not body:
                continue
            context_header = f"# File: {file_path}\n# Section: {breadcrumb_str}"
            chunks.append(
                Chunk(
                    content=context_header + "\n\n" + body,
                    context_header=context_header,
                    body=body,
                    metadata=ChunkMetadata(
                        chunk_type="markdown_section",
                        file_path=file_path,
                        language="markdown",
                        function_name=breadcrumb_str or None,
                    ),
                )
            )

        if not chunks:
            # Whole file as single chunk
            header = f"# File: {file_path}\n# Type: markdown_section"
            chunks.append(
                Chunk(
                    content=header + "\n\n" + content,
                    context_header=header,
                    body=content,
                    metadata=ChunkMetadata(
                        chunk_type="markdown_section",
                        file_path=file_path,
                        language="markdown",
                    ),
                )
            )

        return chunks
