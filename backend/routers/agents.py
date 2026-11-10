"""Agents router — returns agent card metadata and the pipeline graph definition."""
from fastapi import APIRouter
from graph.agent_cards import AGENT_CARDS, PIPELINE_ORDER

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Graph edges for React Flow visualization
GRAPH_EDGES = [
    {"id": "e1", "source": "resume_agent", "target": "job_search_agent", "animated": False},
    {"id": "e2", "source": "job_search_agent", "target": "scoring_agent", "animated": False},
    {"id": "e3", "source": "scoring_agent", "target": "cover_letter_agent",
     "animated": False, "label": "≥60 score"},
    {"id": "e3b", "source": "scoring_agent", "target": "storage_agent",
     "animated": False, "label": "no suitable", "style": {"strokeDasharray": "5,5"}},
    {"id": "e4", "source": "cover_letter_agent", "target": "storage_agent", "animated": False},
]


@router.get("")
async def list_agents():
    """Return all agent cards and the pipeline graph topology for React Flow."""
    return {
        "agents": AGENT_CARDS,
        "pipeline_order": PIPELINE_ORDER,
        "graph_edges": GRAPH_EDGES,
    }


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Return a single agent card by ID."""
    card = next((a for a in AGENT_CARDS if a["id"] == agent_id), None)
    if not card:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Agent not found")
    return card
