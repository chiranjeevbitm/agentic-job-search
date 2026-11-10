"""
Assembles and compiles the LangGraph StateGraph for the Job Search pipeline.
"""
from langgraph.graph import StateGraph, START, END
from graph.state import JobSearchState
from graph.nodes import (
    resume_node,
    job_search_node,
    scoring_node,
    cover_letter_node,
    storage_node,
)


def _should_continue_after_scoring(state: JobSearchState) -> str:
    """Conditional edge: skip cover letters if scoring failed or no jobs found."""
    if state.get("error") or not state.get("scored_jobs"):
        return "storage_agent"
    return "cover_letter_agent"


def build_graph():
    """Build and compile the LangGraph StateGraph."""
    graph = StateGraph(JobSearchState)

    # ── Register nodes ───────────────────────────────────────────────────────
    graph.add_node("resume_agent", resume_node)
    graph.add_node("job_search_agent", job_search_node)
    graph.add_node("scoring_agent", scoring_node)
    graph.add_node("cover_letter_agent", cover_letter_node)
    graph.add_node("storage_agent", storage_node)

    # ── Define edges (pipeline flow) ─────────────────────────────────────────
    graph.add_edge(START, "resume_agent")
    graph.add_edge("resume_agent", "job_search_agent")
    graph.add_edge("job_search_agent", "scoring_agent")

    # Conditional: if scoring produced results → cover letters, else → storage
    graph.add_conditional_edges(
        "scoring_agent",
        _should_continue_after_scoring,
        {
            "cover_letter_agent": "cover_letter_agent",
            "storage_agent": "storage_agent",
        },
    )
    graph.add_edge("cover_letter_agent", "storage_agent")
    graph.add_edge("storage_agent", END)

    return graph.compile()


# Singleton compiled graph — imported by routers
compiled_graph = build_graph()
