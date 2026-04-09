from typing import Annotated, Any
from typing import TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_role: str          # "business_analyst" | "developer"
    user_id: str
    intent: str | None      # detected intent from router
    context: dict[str, Any] # additional context passed between nodes
    output: Any             # final structured output
