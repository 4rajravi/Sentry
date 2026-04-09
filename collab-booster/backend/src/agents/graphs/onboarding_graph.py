"""New Developer Onboarding agent."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.outputs.structured import OnboardingGuide
from src.agents.state import AgentState
from src.agents.tools.file_tool import list_files, read_file
from src.agents.tools.jira_tool import jira_query
from src.agents.tools.rag_tool import rag_search
from src.config import settings

SYSTEM = """You are an expert engineering mentor helping a new developer get up to speed on a project.
Your goal is to create a personalized onboarding guide that:
1. Explains the project architecture in plain terms
2. Identifies the most important files to read first
3. Connects their assigned tickets to the existing code patterns
4. Gives concrete getting-started steps

RULES:
- Be encouraging and concrete
- Reference real files and patterns in the repo
- Prioritize their assigned tickets as context
- Include a recommended reading order
"""

tools = [rag_search, list_files, read_file, jira_query]


def create_onboarding_graph():
    llm_with_tools = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools)

    llm_structured = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
    ).with_structured_output(OnboardingGuide)

    tool_node = ToolNode(tools)

    async def explore_node(state: AgentState):
        user_id = state.get("user_id", "")
        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(
                content=(
                    f"New developer (user_id={user_id}) just joined. "
                    f"Explore the project structure, understand the architecture, "
                    f"and look up their assigned Jira tickets."
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

    async def generate_guide(state: AgentState):
        result = await llm_structured.ainvoke(
            [SystemMessage(content=SYSTEM)]
            + state["messages"]
            + [HumanMessage(content="Now generate the complete personalized onboarding guide.")]
        )
        return {"output": result}

    graph = StateGraph(AgentState)
    graph.add_node("explore", explore_node)
    graph.add_node("tools", tool_node)
    graph.add_node("generate", generate_guide)
    graph.set_entry_point("explore")
    graph.add_conditional_edges(
        "explore",
        should_continue,
        {"tools": "tools", "generate": "generate"},
    )
    graph.add_edge("tools", "explore")
    graph.add_edge("generate", END)
    return graph.compile()


onboarding_app = create_onboarding_graph()
