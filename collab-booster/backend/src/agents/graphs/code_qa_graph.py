"""Code Q&A agent — answers questions about the codebase for both BA and dev roles."""
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.state import AgentState
from src.agents.tools.file_tool import list_files, read_file
from src.agents.tools.rag_tool import rag_search
from src.config import settings

BA_SYSTEM = """You are an expert assistant helping a Business Analyst understand a software codebase.
Your goal is to answer questions about what the code does in plain business language.
RULES:
- Never include raw code in your answers
- Explain technical concepts with business analogies
- Always cite which part of the system you're referring to (file name is fine, no line numbers needed for BA)
- Focus on what the system does, not how it's implemented
- Keep answers concise and actionable
- Ground every answer in repository evidence from tools; do not answer from generic software assumptions
"""

DEV_SYSTEM = """You are an expert assistant helping a Developer understand and work with a codebase.
Your goal is to answer technical questions with precision.
RULES:
- Include relevant code snippets when helpful
- Cite file paths and line numbers
- Explain architectural patterns and data flow
- Be specific about implementation details
- Suggest next steps when relevant
- Ground every answer in repository evidence from tools; do not answer from generic software assumptions
"""

tools = [rag_search, read_file, list_files]


def create_code_qa_graph():
    llm = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools)
    llm_first = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    ).bind_tools(tools, tool_choice="required")
    llm_no_tools = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )

    tool_node = ToolNode(tools)

    async def agent_node(state: AgentState):
        role = state.get("user_role", "developer")
        system_msg = BA_SYSTEM if role == "business_analyst" else DEV_SYSTEM

        messages = [SystemMessage(content=system_msg)] + state["messages"]
        has_tool_results = any(isinstance(m, ToolMessage) for m in state["messages"])
        tool_rounds = sum(1 for m in state["messages"] if isinstance(m, ToolMessage))
        runner = llm_no_tools if tool_rounds >= 2 else (llm if has_tool_results else llm_first)
        response = await runner.ainvoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


code_qa_app = create_code_qa_graph()
