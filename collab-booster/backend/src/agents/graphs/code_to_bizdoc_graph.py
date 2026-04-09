"""Code → Business Document agent."""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from src.agents.outputs.structured import BusinessDocument
from src.agents.state import AgentState
from src.config import settings

DOC_TYPE_INSTRUCTIONS = {
    "feature_summary": "Write a Feature Summary — what the feature does, who uses it, business rules.",
    "business_requirements": "Write a Business Requirements Document — objectives, stakeholders, rules, constraints.",
    "process_flow": "Write a Process Flow Description — step-by-step user journey in plain language.",
    "stakeholder_update": "Write a brief Stakeholder Update — progress, what's done, what's next, no tech details.",
}

SYSTEM = """You are an expert technical writer who transforms code into business documentation.

STRICT RULES:
- Zero code in the output (no function names, no variables, no syntax)
- Use plain business language a non-technical manager can understand
- Replace technical terms: endpoint→service, function→feature, class→component, database→data store
- Be concrete: state business rules with actual values (e.g., "minimum loan: $1,000")
- Structure the document clearly with headers
"""


def create_code_to_bizdoc_graph():
    llm = ChatOpenAI(
        model=settings.smart_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    ).with_structured_output(BusinessDocument)

    async def generate_doc(state: AgentState):
        context = state["context"]
        code_content = context.get("code_content", "")
        doc_type = context.get("doc_type", "feature_summary")
        instruction = DOC_TYPE_INSTRUCTIONS.get(doc_type, DOC_TYPE_INSTRUCTIONS["feature_summary"])

        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(
                content=(
                    f"Document type requested: {instruction}\n\n"
                    f"Here is the code to analyze:\n\n{code_content[:8000]}"
                )
            ),
        ]
        result = await llm.ainvoke(messages)
        return {"output": result}

    graph = StateGraph(AgentState)
    graph.add_node("generate", generate_doc)
    graph.set_entry_point("generate")
    graph.add_edge("generate", END)
    return graph.compile()


code_to_bizdoc_app = create_code_to_bizdoc_graph()
