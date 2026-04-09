"""Agent invocation facade — the single entry point for all agent calls."""
from langchain_core.messages import HumanMessage

from src.agents.state import AgentState


async def run_code_qa(question: str, user_role: str, user_id: str) -> str:
    from src.agents.graphs.code_qa_graph import code_qa_app

    state: AgentState = {
        "messages": [HumanMessage(content=question)],
        "user_role": user_role,
        "user_id": user_id,
        "intent": "code_qa",
        "context": {},
        "output": None,
    }
    result = await code_qa_app.ainvoke(state)
    last = result["messages"][-1]
    return last.content if hasattr(last, "content") else str(last)


async def run_commit_explainer(
    commit_sha: str,
    commit_message: str,
    files_changed: list[str],
    diff_summary: str = "",
) -> dict:
    from src.agents.graphs.commit_explainer_graph import commit_explainer_app

    state: AgentState = {
        "messages": [],
        "user_role": "business_analyst",
        "user_id": "",
        "intent": "commit_explainer",
        "context": {
            "commit_sha": commit_sha,
            "commit_message": commit_message,
            "files_changed": files_changed,
            "diff_summary": diff_summary,
        },
        "output": None,
    }
    result = await commit_explainer_app.ainvoke(state)
    output = result.get("output")
    if output:
        return output.model_dump()
    return {"commit_sha": commit_sha, "business_summary": "Could not explain this commit.", "impact": "", "files_changed": files_changed}


async def run_req_to_jira(requirement_doc: str, user_id: str) -> dict:
    from src.agents.graphs.req_to_jira_graph import req_to_jira_app

    state: AgentState = {
        "messages": [],
        "user_role": "business_analyst",
        "user_id": user_id,
        "intent": "req_to_jira",
        "context": {"requirement_doc": requirement_doc},
        "output": None,
    }
    result = await req_to_jira_app.ainvoke(state)
    output = result.get("output")
    if output:
        return output.model_dump()
    return {"tickets": []}


async def run_code_to_bizdoc(code_content: str, doc_type: str, user_id: str) -> dict:
    from src.agents.graphs.code_to_bizdoc_graph import code_to_bizdoc_app

    state: AgentState = {
        "messages": [],
        "user_role": "business_analyst",
        "user_id": user_id,
        "intent": "code_to_bizdoc",
        "context": {"code_content": code_content, "doc_type": doc_type},
        "output": None,
    }
    result = await code_to_bizdoc_app.ainvoke(state)
    output = result.get("output")
    return output.model_dump() if output else {}


async def run_vacation_catchup(from_date: str, to_date: str, user_id: str) -> dict:
    from src.agents.graphs.vacation_catchup_graph import vacation_catchup_app

    state: AgentState = {
        "messages": [],
        "user_role": "developer",
        "user_id": user_id,
        "intent": "vacation_catchup",
        "context": {"from_date": from_date, "to_date": to_date},
        "output": None,
    }
    result = await vacation_catchup_app.ainvoke(state)
    output = result.get("output")
    return output.model_dump() if output else {}


async def run_onboarding(user_id: str) -> dict:
    from src.agents.graphs.onboarding_graph import onboarding_app

    state: AgentState = {
        "messages": [],
        "user_role": "developer",
        "user_id": user_id,
        "intent": "onboarding",
        "context": {},
        "output": None,
    }
    result = await onboarding_app.ainvoke(state)
    output = result.get("output")
    return output.model_dump() if output else {}


async def run_implementation_guidance(ticket: dict, user_id: str) -> dict:
    from src.agents.graphs.implementation_guidance_graph import implementation_guidance_app

    state: AgentState = {
        "messages": [],
        "user_role": "developer",
        "user_id": user_id,
        "intent": "implementation_guidance",
        "context": {"ticket": ticket},
        "output": None,
    }
    result = await implementation_guidance_app.ainvoke(state)
    output = result.get("output")
    return output.model_dump() if output else {}
