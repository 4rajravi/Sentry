"""AST-aware chunker using tree-sitter for Python files."""
import re
from pathlib import Path

from src.repo.chunker.base import AbstractChunker, Chunk, ChunkMetadata


def _build_context_header(
    file_path: str,
    class_name: str | None = None,
    function_name: str | None = None,
    chunk_type: str = "file_summary",
) -> str:
    lines = [f"# File: {file_path}"]
    if class_name:
        lines.append(f"# Class: {class_name}")
    if function_name:
        lines.append(f"# Function: {function_name}")
    lines.append(f"# Type: {chunk_type}")
    return "\n".join(lines)


class ASTChunker(AbstractChunker):
    """Chunks Python source files using tree-sitter AST parsing.

    Falls back to regex-based parsing if tree-sitter grammars are unavailable.
    """

    SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".tsx", ".jsx", ".java"}

    def chunk(self, file_path: str, content: str) -> list[Chunk]:
        ext = Path(file_path).suffix.lower()
        if ext == ".py":
            return self._chunk_python(file_path, content)
        return self._chunk_generic(file_path, content)

    def _chunk_python(self, file_path: str, content: str) -> list[Chunk]:
        """Parse Python with tree-sitter, falling back to regex."""
        try:
            return self._chunk_python_treesitter(file_path, content)
        except Exception:
            return self._chunk_python_regex(file_path, content)

    def _chunk_python_treesitter(self, file_path: str, content: str) -> list[Chunk]:
        import tree_sitter_python as tspython
        from tree_sitter import Language, Parser

        PY_LANGUAGE = Language(tspython.language())
        parser = Parser(PY_LANGUAGE)
        tree = parser.parse(bytes(content, "utf8"))
        lines = content.splitlines()

        chunks: list[Chunk] = []
        classes: list[str] = []
        functions: list[str] = []
        imports: list[str] = []

        def get_text(node) -> str:
            return content[node.start_byte : node.end_byte]

        def extract_name(node) -> str:
            for child in node.children:
                if child.type == "identifier":
                    return get_text(child)
            return "unknown"

        def walk(node, current_class: str | None = None):
            if node.type == "import_statement" or node.type == "import_from_statement":
                imports.append(get_text(node))

            elif node.type == "class_definition":
                class_name = extract_name(node)
                classes.append(class_name)
                body = get_text(node)
                header = _build_context_header(file_path, class_name=class_name, chunk_type="class")
                chunks.append(
                    Chunk(
                        content=header + "\n\n" + body,
                        context_header=header,
                        body=body,
                        metadata=ChunkMetadata(
                            chunk_type="class",
                            file_path=file_path,
                            language="python",
                            class_name=class_name,
                            start_line=node.start_point[0] + 1,
                            end_line=node.end_point[0] + 1,
                        ),
                    )
                )
                for child in node.children:
                    walk(child, current_class=class_name)

            elif node.type == "function_definition":
                func_name = extract_name(node)
                functions.append(func_name)
                body = get_text(node)
                header = _build_context_header(
                    file_path,
                    class_name=current_class,
                    function_name=func_name,
                    chunk_type="function",
                )
                chunks.append(
                    Chunk(
                        content=header + "\n\n" + body,
                        context_header=header,
                        body=body,
                        metadata=ChunkMetadata(
                            chunk_type="function",
                            file_path=file_path,
                            language="python",
                            class_name=current_class,
                            function_name=func_name,
                            start_line=node.start_point[0] + 1,
                            end_line=node.end_point[0] + 1,
                        ),
                    )
                )
            else:
                for child in node.children:
                    walk(child, current_class=current_class)

        walk(tree.root_node)

        # Build file-level summary chunk
        import_block = "\n".join(imports)
        func_sigs = [f"def {f}(...)" for f in functions]
        summary_body = (
            f"# Imports:\n{import_block}\n\n"
            f"# Classes: {', '.join(classes) or 'none'}\n"
            f"# Functions: {', '.join(functions) or 'none'}\n"
            f"# Function signatures:\n" + "\n".join(func_sigs)
        )
        summary_header = _build_context_header(file_path, chunk_type="file_summary")
        summary = Chunk(
            content=summary_header + "\n\n" + summary_body,
            context_header=summary_header,
            body=summary_body,
            metadata=ChunkMetadata(
                chunk_type="file_summary",
                file_path=file_path,
                language="python",
            ),
        )
        return [summary] + chunks

    def _chunk_python_regex(self, file_path: str, content: str) -> list[Chunk]:
        """Regex-based fallback Python chunker."""
        chunks: list[Chunk] = []
        lines = content.splitlines()

        class_pattern = re.compile(r"^class\s+(\w+)")
        func_pattern = re.compile(r"^(\s*)def\s+(\w+)")

        classes: list[str] = []
        functions: list[str] = []
        imports: list[str] = []

        current_class: str | None = None
        current_block: list[str] = []
        current_start = 0
        current_func: str | None = None
        current_class_indent = -1

        i = 0
        while i < len(lines):
            line = lines[i]

            # Track imports
            if line.strip().startswith(("import ", "from ")):
                imports.append(line.strip())

            cm = class_pattern.match(line)
            if cm:
                # Save previous block
                if current_func and current_block:
                    body = "\n".join(current_block)
                    header = _build_context_header(
                        file_path,
                        class_name=current_class,
                        function_name=current_func,
                        chunk_type="function",
                    )
                    chunks.append(
                        Chunk(
                            content=header + "\n\n" + body,
                            context_header=header,
                            body=body,
                            metadata=ChunkMetadata(
                                chunk_type="function",
                                file_path=file_path,
                                language="python",
                                class_name=current_class,
                                function_name=current_func,
                                start_line=current_start + 1,
                                end_line=i,
                            ),
                        )
                    )
                current_class = cm.group(1)
                classes.append(current_class)
                current_class_indent = 0
                current_func = None
                current_block = []
                i += 1
                continue

            fm = func_pattern.match(line)
            if fm:
                if current_func and current_block:
                    body = "\n".join(current_block)
                    header = _build_context_header(
                        file_path,
                        class_name=current_class,
                        function_name=current_func,
                        chunk_type="function",
                    )
                    chunks.append(
                        Chunk(
                            content=header + "\n\n" + body,
                            context_header=header,
                            body=body,
                            metadata=ChunkMetadata(
                                chunk_type="function",
                                file_path=file_path,
                                language="python",
                                class_name=current_class,
                                function_name=current_func,
                                start_line=current_start + 1,
                                end_line=i,
                            ),
                        )
                    )
                    functions.append(current_func)
                current_func = fm.group(2)
                functions.append(current_func)
                current_block = [line]
                current_start = i
                i += 1
                continue

            if current_func is not None:
                current_block.append(line)
            i += 1

        # Save last block
        if current_func and current_block:
            body = "\n".join(current_block)
            header = _build_context_header(
                file_path,
                class_name=current_class,
                function_name=current_func,
                chunk_type="function",
            )
            chunks.append(
                Chunk(
                    content=header + "\n\n" + body,
                    context_header=header,
                    body=body,
                    metadata=ChunkMetadata(
                        chunk_type="function",
                        file_path=file_path,
                        language="python",
                        class_name=current_class,
                        function_name=current_func,
                        start_line=current_start + 1,
                        end_line=len(lines),
                    ),
                )
            )

        # File summary
        import_block = "\n".join(imports)
        summary_body = (
            f"# Imports:\n{import_block}\n\n"
            f"# Classes: {', '.join(set(classes)) or 'none'}\n"
            f"# Functions: {', '.join(set(functions)) or 'none'}"
        )
        summary_header = _build_context_header(file_path, chunk_type="file_summary")
        return [
            Chunk(
                content=summary_header + "\n\n" + summary_body,
                context_header=summary_header,
                body=summary_body,
                metadata=ChunkMetadata(
                    chunk_type="file_summary",
                    file_path=file_path,
                    language="python",
                ),
            )
        ] + chunks

    def _chunk_generic(self, file_path: str, content: str) -> list[Chunk]:
        """Simple chunker for non-Python files — whole file as one chunk."""
        header = _build_context_header(file_path, chunk_type="file_summary")
        return [
            Chunk(
                content=header + "\n\n" + content,
                context_header=header,
                body=content,
                metadata=ChunkMetadata(
                    chunk_type="file_summary",
                    file_path=file_path,
                    language=Path(file_path).suffix.lstrip(".") or None,
                ),
            )
        ]
