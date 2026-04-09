"""Commit Explainer agent — explains git commits in business language."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from src.agents.outputs.structured import CommitExplanation
from src.agents.state import AgentState
from src.config import settings

SYSTEM = """You are an expert at translating technical git commits into plain business language.
Given a commit SHA, message, and list of changed files, explain:
1. What business functionality was changed
2. Why this matters to the product
3. What a non-technical stakeholder needs to know

RULES:
- No code in the output
- No technical jargon (no "function", "class", "API", "endpoint" — use "feature", "service", "screen")
- Maximum 3 sentences per commit
- Focus on user-visible impact
"""


def create_commit_explainer_graph():
    llm = ChatOpenAI(
        model=settings.fast_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).with_structured_output(CommitExplanation)

    def explain_node(state: AgentState):
        context = state.get("context", {})
        commit_sha = context.get("commit_sha", "")
        commit_message = context.get("commit_message", "")
        files_changed = context.get("files_changed", [])
        diff_summary = context.get("diff_summary", "")

        user_content = (
            f"Commit: {commit_sha}\n"
            f"Message: {commit_message}\n"
            f"Files changed: {', '.join(files_changed[:10])}\n"
            + (f"Diff summary:\n{diff_summary[:1000]}" if diff_summary else "")
        )

        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(content=user_content),
        ]
        result = llm.invoke(messages)
        return {"output": result, "messages": [HumanMessage(content=user_content)]}

    graph = StateGraph(AgentState)
    graph.add_node("explain", explain_node)
    graph.set_entry_point("explain")
    graph.add_edge("explain", END)
    return graph.compile()


commit_explainer_app = create_commit_explainer_graph()
