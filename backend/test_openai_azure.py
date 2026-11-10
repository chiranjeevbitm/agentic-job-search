import asyncio
import logging
import os
from dotenv import load_dotenv

# We need to temporarily add backend to sys.path so we can import tools
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from tools.openai_tool import _client, DEPLOYMENT

async def test_api():
    system_prompt = "You are a helpful assistant."
    user_prompt = "Hello, reply with exactly the word 'testing' and nothing else."
    
    print(f"Deployment is {DEPLOYMENT}")
    try:
        response = await _client.chat.completions.create(
            model=DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=1,
        )
        print("Raw response:")
        print(response)
        print("Content:")
        print(repr(response.choices[0].message.content))
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
