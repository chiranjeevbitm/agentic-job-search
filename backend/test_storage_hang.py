import asyncio
import logging
import sys
from agents.storage_agent import storage_node

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_hang():
    print("Testing storage_node directly...")
    mock_state = {
        "search_id": "test-uuid-hang",
        "final_jobs": [{"title": "Test", "company": "TestCo", "location": "Remote", "score": 100, "is_suitable": "Yes", "description": "some desc", "url": "http://test.com", "match_reason": "none", "cover_letter": "none"}]
    }
    
    task = asyncio.create_task(storage_node(mock_state))
    try:
        result = await asyncio.wait_for(task, timeout=10.0)
        print("DONE storage_node!")
        print(result)
    except asyncio.TimeoutError:
        print("TIMEOUT: storage_node hung!")
        sys.exit(1)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(check_hang())
