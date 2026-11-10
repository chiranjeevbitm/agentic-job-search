import os
import json
import re
import asyncio
from openai import AsyncAzureOpenAI
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

# Async Azure OpenAI client (shared across calls)
_client = AsyncAzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
)
DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5-mini")


def _parse_json_response(raw: str) -> dict:
    """Safely parse JSON from LLM output, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else parts[0]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text.strip())
    except Exception:
        match = re.search(r'"score"\s*:\s*(\d+)', text)
        score = int(match.group(1)) if match else 0
        return {"score": score, "reason": text}


@tool
async def score_job(resume_text: str, job_title: str, company: str, job_description: str, yoe_requirement: int, job_level_requirement: str) -> dict:
    """Score how well a candidate's resume matches a specific job posting. Returns score (0-100) and reason."""
    system_prompt = (
        "You are an expert career coach and recruiter. Evaluate how well a candidate's resume "
        "matches a job posting. Respond ONLY with valid JSON: "
        '{"score": <integer 0-100>, "reason": "<2-3 sentence explanation>"}'
    )
    user_prompt = (
        f"## Job Title: {job_title}\n## Company: {company}\n"
        f"## Job Description:\n{job_description}\n\n"
        f"## Candidate Resume:\n{resume_text[:5000]}\n\n"
        f"CRITICAL REQUIREMENT: This candidate restricts their search strictly to '{job_level_requirement}' level roles requiring at least {yoe_requirement} Years of Experience. "
        "Score the match (0-100) and explain the key factors. Severely penalize the score if the candidate lacks the requested experience or if the job violates the seniority constraint."
    )

    response = await _client.chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=1,
    )
    return _parse_json_response(response.choices[0].message.content)


@tool
async def generate_cover_letter(
    resume_text: str, job_title: str, company: str, job_description: str
) -> str:
    """Generate a tailored, professional cover letter for a job application."""
    system_prompt = (
        "You are an expert career coach writing a crisp, compelling cover letter. "
        "You MUST strictly follow this exact classical format without deviation:\n\n"
        "[Candidate Name]\n[Email Address]\n\n"
        "[Today's Date]\n\n"
        "[Hiring Manager Name or 'Hiring Manager']\n[Company Name]\n\n"
        "Dear [Name of Recipient],\n\n"
        "[Paragraph 1: Introduce yourself and the exact job you are applying for.]\n\n"
        "[Paragraph 2: Discuss 3-4 crisp characteristics/skills that set you apart. Use brief bullets if helpful.]\n\n"
        "[Paragraph 3: Close by wrapping it up and calling the reader to action (ask for an interview).]\n\n"
        "Sincerely,\n\n[Candidate Name]\n\nEnclosure"
    )
    user_prompt = (
        f"Write a crisp, tailored cover letter strictly following the required template format for:\n\n"
        f"## Job Title: {job_title}\n## Company: {company}\n"
        f"## Job Description:\n{job_description[:3000]}\n\n"
        f"## Candidate Resume:\n{resume_text[:4500]}\n\n"
        "Fill in the bracketed template fields with the actual resume/job context. "
        "Use placeholders like [Date] or [Address] ONLY if the information is entirely missing from the resume."
    )

    response = await _client.chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=1,
    )
    return response.choices[0].message.content.strip()


async def score_jobs_parallel(resume_text: str, jobs: list[dict], yoe: int, job_level: str) -> list[dict]:
    """Score all jobs in parallel using asyncio.gather."""
    async def _score_one(job: dict) -> dict:
        result = await score_job.ainvoke({
            "resume_text": resume_text,
            "job_title": job["title"],
            "company": job["company"],
            "job_description": job["description"],
            "yoe_requirement": yoe,
            "job_level_requirement": job_level,
        })
        return {**job, "score": result.get("score", 0), "match_reason": result.get("reason", "")}

    return await asyncio.gather(*[_score_one(j) for j in jobs])


async def generate_cover_letters_parallel(resume_text: str, jobs: list[dict]) -> list[dict]:
    """Generate cover letters for all suitable jobs in parallel using asyncio.gather."""
    import asyncio
    sem = asyncio.Semaphore(5)

    async def _cover_one(job: dict) -> dict:
        async with sem:
            letter = await generate_cover_letter.ainvoke({
                "resume_text": resume_text,
                "job_title": job["title"],
                "company": job["company"],
                "job_description": job["description"],
            })
            return {**job, "cover_letter": letter}

    return await asyncio.gather(*[_cover_one(j) for j in jobs])
