"""Requirements → Jira Tickets agent."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.outputs.structured import JiraTicketProposalList
from src.agents.state import AgentState
from src.agents.tools.rag_tool import rag_search
from src.config import settings

SYSTEM = """You are an expert product analyst who converts technical/business requirement documents into Jira tickets.

Your process:
1. Read the requirement document carefully
2. Search the codebase to understand which files will be affected
3. Break the requirements into discrete, implementable work items
4. For each item, produce a well-formed Jira ticket

TICKET FORMAT RULES:
- Title: Short, action-oriented (max 60 chars)
- Description: User story format "As a [role], I want [action], so that [benefit]"
- Acceptance criteria: Specific, testable, minimum 2 criteria
- Story points: 1, 2, 3, 5, 8, or 13 (Fibonacci)
- Priority: low | medium | high | critical
- Affected files: list files that will likely need changes based on codebase search
"""

tools = [rag_search]


def create_req_to_jira_graph():
    llm_with_tools = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools)

    llm_structured = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).with_structured_output(JiraTicketProposalList)

    tool_node = ToolNode(tools)

    async def research_node(state: AgentState):
        """First pass: use tools to research the codebase."""
        doc = state["context"].get("requirement_doc", "")
        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(
                content=f"Analyze this requirement document and search the codebase for relevant files:\n\n{doc}"
            ),
        ] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "generate"

    async def generate_tickets(state: AgentState):
        """Second pass: generate structured tickets from research."""
        doc = state["context"].get("requirement_doc", "")
        all_msgs = state["messages"]
        result = await llm_structured.ainvoke(
            [SystemMessage(content=SYSTEM)]
            + all_msgs
            + [
                HumanMessage(
                    content=f"Now generate the Jira ticket proposals for this requirement:\n\n{doc}"
                )
            ]
        )
        return {"output": result}

    graph = StateGraph(AgentState)
    graph.add_node("research", research_node)
    graph.add_node("tools", tool_node)
    graph.add_node("generate", generate_tickets)
    graph.set_entry_point("research")
    graph.add_conditional_edges(
        "research",
        should_continue,
        {"tools": "tools", "generate": "generate"},
    )
    graph.add_edge("tools", "research")
    graph.add_edge("generate", END)
    return graph.compile()


req_to_jira_app = create_req_to_jira_graph()
