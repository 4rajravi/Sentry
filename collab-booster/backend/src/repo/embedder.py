from openai import AsyncOpenAI

from src.config import settings


class Embedder:
    """Embeds text chunks using OpenAI text-embedding-3-small.

    Batch size: 100 chunks per API call.
    Dimensions: 1536 (default for text-embedding-3-small).
    """

    BATCH_SIZE = 100

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts. Handles batching internally."""
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[i : i + self.BATCH_SIZE]
            response = await self.client.embeddings.create(model=self.model, input=batch)
            all_embeddings.extend([item.embedding for item in response.data])
        return all_embeddings

    async def embed_one(self, text: str) -> list[float]:
        embeddings = await self.embed_batch([text])
        return embeddings[0]
