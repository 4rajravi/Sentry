from openai import AsyncOpenAI

from src.config import settings


class Embedder:
    """Embeds text chunks using OpenAI text-embedding-3-small.

    Batch size: 100 chunks per API call.
    Dimensions: 1536 (default for text-embedding-3-small).
    """

    BATCH_SIZE = 32
    # Keep well below typical TPM ceilings to reduce 429 risk.
    MAX_BATCH_TOKENS_EST = 24000

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        # Rough heuristic: ~4 chars per token for mixed code/text content.
        return max(1, len(text) // 4)

    def _iter_batches(self, texts: list[str]):
        batch: list[str] = []
        batch_tokens = 0

        for text in texts:
            text_tokens = self._estimate_tokens(text)

            # If single chunk is too large, still send it alone.
            if text_tokens >= self.MAX_BATCH_TOKENS_EST:
                if batch:
                    yield batch
                    batch = []
                    batch_tokens = 0
                yield [text]
                continue

            would_exceed_tokens = batch_tokens + text_tokens > self.MAX_BATCH_TOKENS_EST
            would_exceed_items = len(batch) >= self.BATCH_SIZE
            if batch and (would_exceed_tokens or would_exceed_items):
                yield batch
                batch = []
                batch_tokens = 0

            batch.append(text)
            batch_tokens += text_tokens

        if batch:
            yield batch

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts. Handles batching internally."""
        all_embeddings: list[list[float]] = []
        for batch in self._iter_batches(texts):
            response = await self.client.embeddings.create(model=self.model, input=batch)
            all_embeddings.extend([item.embedding for item in response.data])
        return all_embeddings

    async def embed_one(self, text: str) -> list[float]:
        embeddings = await self.embed_batch([text])
        return embeddings[0]
