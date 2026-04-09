"""Implementation Guidance agent — helps devs understand what to implement for a ticket."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.outputs.structured import ImplementationGuidance
from src.agents.state import AgentState
from src.agents.tools.rag_tool import rag_search
from src.agents.tools.file_tool import read_file
from src.config import settings

SYSTEM = """You are a senior software engineer helping a developer implement a Jira ticket.
Given the ticket details and the existing codebase, provide:
1. A concrete breakdown of what needs to be implemented
2. Which existing files to look at and why
3. Technical hints (patterns to follow, formulas to use)
4. A checklist of sub-tasks

RULES:
- Be very specific and technical
- Reference exact file paths and function names
- Include formulas or algorithms when relevant
- Reference existing patterns in the codebase the dev should follow
- Stay strictly within the ticket scope and the provided technical document.
- Do not invent unrelated systems (e.g., auth/login/JWT) unless explicitly requested by the ticket.
- If evidence is missing, say "Not found in repo evidence" instead of guessing.
"""

tools = [rag_search, read_file]


def create_implementation_guidance_graph():
    llm_with_tools = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools)

    llm_structured = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).with_structured_output(ImplementationGuidance)

    tool_node = ToolNode(tools)

    async def research_node(state: AgentState):
        ctx = state["context"]
        ticket = ctx.get("ticket", {})
        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(
                content=(
                    f"Help implement this Jira ticket:\n"
                    f"ID: {ticket.get('id')}\n"
                    f"Title: {ticket.get('title')}\n"
                    f"Description: {ticket.get('description')}\n"
                    f"Acceptance Criteria: {ticket.get('acceptance_criteria')}\n\n"
                    f"Technical Doc Link: {ticket.get('technical_doc_link')}\n"
                    f"Technical Doc Excerpt:\n{ticket.get('technical_doc_excerpt')}\n\n"
                    f"Search the codebase for relevant files and patterns."
                )
            ),
        ] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return "generate"

    async def generate_guidance(state: AgentState):
        ctx = state["context"]
        ticket = ctx.get("ticket", {})
        result = await llm_structured.ainvoke(
            [SystemMessage(content=SYSTEM)]
            + state["messages"]
            + [
                HumanMessage(
                    content=(
                        f"Now generate the implementation guidance for ticket {ticket.get('id')}.\n"
                        f"Ticket title: {ticket.get('title')}\n"
                        f"Keep all guidance strictly aligned to this ticket and provided repo/doc evidence."
                    )
                )
            ]
        )
        return {"output": result}

    graph = StateGraph(AgentState)
    graph.add_node("research", research_node)
    graph.add_node("tools", tool_node)
    graph.add_node("generate", generate_guidance)
    graph.set_entry_point("research")
    graph.add_conditional_edges(
        "research",
        should_continue,
        {"tools": "tools", "generate": "generate"},
    )
    graph.add_edge("tools", "research")
    graph.add_edge("generate", END)
    return graph.compile()


implementation_guidance_app = create_implementation_guidance_graph()
