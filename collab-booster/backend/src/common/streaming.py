import json
from typing import AsyncGenerator

from sse_starlette.sse import EventSourceResponse


async def stream_text(generator: AsyncGenerator[str, None]) -> EventSourceResponse:
    async def event_generator():
        async for chunk in generator:
            yield {"data": json.dumps({"token": chunk})}
        yield {"data": json.dumps({"done": True})}

    return EventSourceResponse(event_generator())
