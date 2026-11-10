import logging
from graph.state import JobSearchState
from tools.pdf_tool import extract_pdf_text
from agents.utils import _event

logger = logging.getLogger(__name__)

async def resume_node(state: JobSearchState) -> dict:
    """Extract text from the uploaded PDF resume."""
    logger.info(f"[{state.get('search_id')}] Resume Agent started")
    
    events = [
        _event("resume_agent", "running", "Starting resume parsing..."),
    ]
    
    try:
        events.append(_event("resume_agent", "running", "Extracting text from PDF..."))
        
        resume_text = await extract_pdf_text.ainvoke({"pdf_bytes": state["resume_bytes"]})
        word_count = len(resume_text.split())
        char_count = len(resume_text)
        
        # Extract a preview of the resume text (first 200 chars)
        preview = resume_text[:200].replace('\n', ' ').strip()
        
        logger.info(f"[{state.get('search_id')}] Resume parsed: {word_count} words extracted")
        
        events.append(_event("resume_agent", "done",
                       f"Resume parsed successfully — {word_count} words, {char_count} characters extracted",
                       {
                           "word_count": word_count,
                           "char_count": char_count,
                           "preview": preview + ("..." if len(resume_text) > 200 else ""),
                       }))
        
        return {
            "resume_text": resume_text,
            "events": events,
        }
    except Exception as exc:
        logger.error(f"[{state.get('search_id')}] Resume parsing failed: {exc}", exc_info=True)
        return {
            "resume_text": "",
            "error": str(exc),
            "events": events + [_event("resume_agent", "error", f"Resume parsing failed: {exc}")],
        }
