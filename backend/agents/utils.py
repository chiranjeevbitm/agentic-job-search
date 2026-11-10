from datetime import datetime

def _event(node: str, status: str, message: str, data: dict | None = None) -> dict:
    """Helper to generate SSE-ready event dictionaries."""
    return {
        "node": node,
        "status": status,   # "running" | "done" | "error"
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data or {},
    }
