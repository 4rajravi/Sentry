"""Vacation Catchup agent — summarizes what happened during a date range."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.outputs.structured import CatchupSummary
from src.agents.state import AgentState
from src.agents.tools.git_tool import git_log
from src.agents.tools.jira_tool import jira_query
from src.config import settings

SYSTEM = """You are an expert at summarizing software project activity for returning team members.
Given a date range, you will:
1. Check the git commit history for that period
2. Check Jira ticket status changes
3. Produce a concise, human-readable catchup summary

OUTPUT RULES:
- Use plain language, avoid code
- Group changes by theme/ticket
- Highlight what's most important for the dev to know right away
- List any new tickets assigned to them
"""

tools = [git_log, jira_query]


def create_vacation_catchup_graph():
    llm_with_tools = ChatOpenAI(
        model=settings.fast_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools)

    llm_structured = ChatOpenAI(
        model=settings.fast_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).with_structured_output(CatchupSummary)

    tool_node = ToolNode(tools)

    async def gather_node(state: AgentState):
        ctx = state["context"]
        from_date = ctx.get("from_date", "")
        to_date = ctx.get("to_date", "")
        user_id = state.get("user_id", "")

        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(
                content=(
                    f"The developer (user_id={user_id}) was away from {from_date} to {to_date}. "
                    f"Please gather commit history and ticket changes for this period, "
                    f"especially any tickets assigned to them."
                )
            ),
        ] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "summarize"

    async def summarize_node(state: AgentState):
        ctx = state["context"]
        result = await llm_structured.ainvoke(
            [SystemMessage(content=SYSTEM)]
            + state["messages"]
            + [
                HumanMessage(
                    content=(
                        f"Now produce the catchup summary for period "
                        f"{ctx.get('from_date')} to {ctx.get('to_date')}."
                    )
                )
            ]
        )
        return {"output": result}

    graph = StateGraph(AgentState)
    graph.add_node("gather", gather_node)
    graph.add_node("tools", tool_node)
    graph.add_node("summarize", summarize_node)
    graph.set_entry_point("gather")
    graph.add_conditional_edges(
        "gather",
        should_continue,
        {"tools": "tools", "summarize": "summarize"},
    )
    graph.add_edge("tools", "gather")
    graph.add_edge("summarize", END)
    return graph.compile()


vacation_catchup_app = create_vacation_catchup_graph()
