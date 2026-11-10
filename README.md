# agentic-job-search

**A multi-agent job-hunting assistant: upload a resume, scrape jobs from several boards, let an LLM score every posting against you, and get tailored cover letters for the good matches.**

![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![LangGraph](https://img.shields.io/badge/LangGraph-0.3-purple.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Status](https://img.shields.io/badge/status-v0.1.0%20early-orange.svg)

## Table of contents

- [What problem does it solve?](#what-problem-does-it-solve)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Worked example](#worked-example)
- [Screenshots and demo notes](#screenshots-and-demo-notes)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting and FAQ](#troubleshooting-and-faq)
- [Limitations and known issues](#limitations-and-known-issues)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Credits](#credits)

## What problem does it solve?

Job hunting means reading dozens of postings and asking the same question each time: "does this actually fit my experience and seniority?" Then writing a custom cover letter for the ones that do. `agentic-job-search` automates that loop. You give it a resume (PDF), a job title, a location, your years of experience and target level. A pipeline of five cooperating agents extracts your resume text, scrapes postings, scores each one from 0 to 100 with an LLM (penalising seniority or experience mismatches), writes cover letters for jobs at or above a threshold, and stores everything so you can review it later.

## Features

- Five specialised agents orchestrated as a LangGraph `StateGraph`: Resume, Job Search, Scoring, Cover Letter, Storage.
- Resume parsing from PDF with `pdfplumber`.
- Free multi-site scraping through `python-jobspy`: LinkedIn, Indeed, Google Jobs and Glassdoor by default, ZipRecruiter also supported. No scraping API key needed.
- Heuristic extraction of job level (Entry ... Executive) and years of experience from each description.
- LLM scoring (0-100 plus a short reason) with Azure OpenAI; all jobs are scored concurrently with `asyncio.gather`.
- Level and years-of-experience constraints are put into the scoring prompt so mismatched roles are penalised.
- Configurable suitability threshold (`SCORE_THRESHOLD`, default 60).
- Cover letters generated only for suitable jobs, concurrently (max 5 at a time), in a fixed classical letter format.
- Conditional graph edge: if scoring fails or nothing was found, the pipeline skips straight to storage.
- Results saved in parallel to PostgreSQL and to a colour-coded XLSX file (green = suitable, red = not).
- Live progress over Server-Sent Events (SSE), rendered in the UI as a process flow and a React Flow graph.
- Agents Dashboard that reads agent "cards" (capabilities, tools, inputs, outputs) from the API.
- History page with pagination and filters (job level, suitability, company, score range, search id).
- Cover-letter modal and XLSX download link in the results view.
- Rotating log file plus console logging.

## Architecture

### Components

| Component | Role |
|---|---|
| React + Vite frontend | Search form, live pipeline view, results, agents dashboard, history |
| FastAPI backend | REST + SSE API, starts the pipeline as a background task |
| LangGraph pipeline | Runs five nodes over a shared `JobSearchState` |
| python-jobspy | Scrapes job boards |
| Azure OpenAI | Scores jobs and writes cover letters |
| PostgreSQL (SQLAlchemy async + asyncpg) | Persistent results and history |
| openpyxl | XLSX export |

### Data flow

```mermaid
flowchart LR
    UI[React UI] -- "POST /api/jobs/search (form + PDF)" --> API[FastAPI]
    API -- "search_id" --> UI
    API -- background task --> G[LangGraph pipeline]
    UI -- "GET /api/jobs/stream/{id} (SSE)" --> API

    subgraph G[LangGraph pipeline]
        direction LR
        R[Resume Agent<br/>pdfplumber] --> J[Job Search Agent<br/>python-jobspy]
        J --> S[Scoring Agent<br/>Azure OpenAI]
        S -- "scores exist" --> C[Cover Letter Agent<br/>Azure OpenAI]
        S -- "no jobs / error" --> ST
        C --> ST[Storage Agent]
    end

    ST --> PG[(PostgreSQL)]
    ST --> X[XLSX file]
    UI -- "GET /api/jobs/results/{id}" --> API
    API --> PG
```

1. The UI posts the form (title, location, years of experience, level, job count, resume PDF). The backend returns a `search_id` immediately and runs the pipeline as an `asyncio` task.
2. Each node returns state updates plus a list of events (`node`, `status`, `message`, `timestamp`, `data`). The router pushes those events to an in-memory queue per search, and `/api/jobs/stream/{search_id}` streams them to the browser as SSE.
3. When the graph ends the backend waits one second (so the DB commit lands), sends a `__done__` event, and the UI fetches `/api/jobs/results/{search_id}` from PostgreSQL.

### The agents

| Agent (graph node) | What it does |
|---|---|
| `resume_agent` | Extracts plain text from the PDF bytes |
| `job_search_agent` | Builds the query `"<level> <title>"`, scrapes `job_count` jobs per run, tags each with platform, level and years of experience |
| `scoring_agent` | Scores every job concurrently; returns `score` and `match_reason`; reports average and suitable count |
| `cover_letter_agent` | For jobs with `score >= SCORE_THRESHOLD` generates a cover letter; marks `is_suitable` Yes/No |
| `storage_agent` | Writes to PostgreSQL and XLSX concurrently with `asyncio.gather` |

State (`backend/graph/state.py`) carries: `search_id`, `job_title`, `location`, `yoe`, `job_level`, `job_count`, `resume_bytes`, `resume_text`, `raw_jobs`, `scored_jobs`, `final_jobs`, an append-only `events` list and an optional `error`.

## Tech stack

- **Backend:** Python, FastAPI, Uvicorn, LangGraph, LangChain Core, OpenAI SDK (`AsyncAzureOpenAI`), python-jobspy, pdfplumber, SQLAlchemy 2 (async) with asyncpg, openpyxl, sse-starlette
- **Frontend:** React 19, Vite, React Router, React Flow, Framer Motion, Axios, lucide-react
- **Data:** PostgreSQL
- **Tests/CI:** pytest, pytest-asyncio, GitHub Actions

## Project structure

```
agentic-job-search/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── logger.py               # console + rotating file logging
│   ├── requirements.txt
│   ├── .env.example
│   ├── agents/                 # one module per pipeline node
│   │   ├── resume_agent.py
│   │   ├── job_search_agent.py
│   │   ├── scoring_agent.py
│   │   ├── cover_letter_agent.py
│   │   ├── storage_agent.py
│   │   └── utils.py            # SSE event helper
│   ├── graph/
│   │   ├── state.py            # JobSearchState (TypedDict)
│   │   ├── nodes.py            # re-exports agent nodes
│   │   ├── graph_builder.py    # StateGraph + conditional edge
│   │   └── agent_cards.py      # metadata served by /api/agents
│   ├── tools/
│   │   ├── pdf_tool.py         # extract_pdf_text
│   │   ├── jobspy_tool.py      # scrape_jobs, level/YOE extraction
│   │   ├── openai_tool.py      # score_job, generate_cover_letter
│   │   └── excel_tool.py       # save_to_excel
│   ├── routers/                # jobs.py, history.py, agents.py
│   ├── db/                     # database.py, models.py
│   ├── tests/                  # pytest suite (no network/DB needed)
│   ├── test_openai_azure.py    # manual smoke script for your Azure config
│   └── test_storage_hang.py    # manual script, needs a real database
├── frontend/
│   ├── src/pages/              # SearchPage, AgentsPage, HistoryPage
│   ├── src/components/         # form, pipeline views, job card, modal...
│   └── vite.config.js          # dev server on 5173, proxies /api
├── .github/                    # CI workflow, issue and PR templates
├── .env.example
└── LICENSE, CHANGELOG.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18+ (22 used in CI) and npm
- A PostgreSQL database you can reach (local, Docker, or a hosted service such as Neon)
- An Azure OpenAI resource with a chat-model deployment
- Internet access (job boards and Azure OpenAI)

## Installation

### 1. Clone

```bash
git clone https://github.com/chiranjeevbitm/agentic-job-search.git
cd agentic-job-search
```

### 2. Backend

**macOS / Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # then edit .env
```

**Windows (PowerShell)**

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env    # then edit .env
```

### 3. Database

Create an empty database. Tables are created automatically on startup. Quick local option with Docker:

```bash
docker run --name jobsearch-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobsearch -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/jobsearch
```

### 4. Frontend

```bash
cd frontend
npm install
```

## Configuration

All backend settings live in `backend/.env` (loaded with `python-dotenv`). Copy `backend/.env.example`.

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `DATABASE_URL` | yes | none | SQLAlchemy async URL. Must use the asyncpg driver: `postgresql+asyncpg://user:pass@host:5432/db`. The app fails at startup without it. |
| `AZURE_OPENAI_ENDPOINT` | yes | none | Your Azure OpenAI endpoint, e.g. `https://my-resource.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | yes | none | Key for that resource |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | recommended | `gpt-5-mini` | Name of your chat deployment (used as the `model`) |
| `AZURE_OPENAI_API_VERSION` | no | `2024-12-01-preview` | Azure OpenAI API version |
| `SCORE_THRESHOLD` | no | `60` | Score (0-100) at or above which a job is "suitable" and gets a cover letter |
| `MAX_JOBS` | no | `10` | Fallback jobs-per-scrape when no count is passed (the API normally passes `job_count`) |

Frontend: the three pages call `http://localhost:8000/api` directly (constant `API_BASE`), and Vite also proxies `/api` to port 8000. The backend CORS list allows `localhost:5173-5176` and `127.0.0.1:5173`. To point the UI at another host, change `API_BASE` in `SearchPage.jsx`, `HistoryPage.jsx` and `AgentsPage.jsx`, and extend the CORS list in `backend/main.py`.

## Usage

### Run

Terminal 1 (backend):

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>. Interactive API docs are at <http://localhost:8000/docs>.

### UI walkthrough

1. **Search** - fill in Job Title / Keywords, Location, Years of Experience, Job Level (Intern, Entry Level, Associate, Mid Level, Senior, Lead, Manager, Senior Manager, Director, VP, CXO), Number of Jobs, and drop in your resume PDF. Start the search and watch each agent light up in the live process flow. Results show a score gauge, summary stats, job cards, a cover-letter modal and an XLSX download link.
2. **Agents Dashboard** - the agent registry read from `GET /api/agents`, with capabilities, tools, inputs and outputs, plus the pipeline graph.
3. **History** - every stored result, with filters and pagination.

### API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` , `/health` | Banner and health check |
| POST | `/api/jobs/search` | Multipart form: `job_title`, `location`, `yoe` (default 5), `job_level` (default Senior), `job_count` (default 10), `resume` (PDF). Returns `{"search_id": "...", "status": "started"}` |
| GET | `/api/jobs/stream/{search_id}` | SSE stream of agent events; final event has `node: "__done__"` (or `__error__`) |
| GET | `/api/jobs/results/{search_id}` | Stored results for the search (empty list if none) |
| GET | `/api/jobs/download` | Downloads `output/job_results.xlsx` (see known issues) |
| GET | `/api/history` | Paginated results. Query: `page`, `page_size` (1-100), `job_level`, `is_suitable` (Yes/No), `company` (partial), `min_score`, `max_score`, `search_id` |
| GET | `/api/history/filters` | Distinct job levels, companies (100) and search ids (50) |
| GET | `/api/agents` | Agent cards, pipeline order, graph edges |
| GET | `/api/agents/{agent_id}` | One agent card, e.g. `scoring-agent-v1` |

### Using the API from the command line

```bash
curl -F job_title="Python Developer" -F location="Remote" -F yoe=3 \
     -F job_level="Mid Level" -F job_count=5 -F resume=@my_resume.pdf \
     http://localhost:8000/api/jobs/search
# -> {"search_id":"<uuid>","status":"started"}

curl -N http://localhost:8000/api/jobs/stream/<uuid>      # live events
curl http://localhost:8000/api/jobs/results/<uuid>        # final JSON
```

## Worked example

Request (shape only; your numbers will differ because live job boards change constantly):

```bash
curl -F job_title="Data Engineer" -F location="Bangalore" -F yoe=4 \
     -F job_level="Mid Level" -F job_count=10 -F resume=@resume.pdf \
     http://localhost:8000/api/jobs/search
```

Each SSE message is a JSON object like:

```json
{"node": "scoring_agent", "status": "done",
 "message": "Scored 10 jobs - avg: 54.3, suitable: 4/10",
 "timestamp": "<UTC ISO time>",
 "data": {"avg_score": 54.3, "suitable_count": 4, "total_scored": 10, "threshold": 60, "top_jobs": [...]}}
```

Each stored result (`GET /api/jobs/results/{id}`) has the fields: `id`, `search_id`, `job_title`/`title`, `company`, `location`, `job_url`/`url`, `job_description` (truncated to 2000 chars), `score`, `match_reason`, `cover_letter` (empty for unsuitable jobs), `is_suitable` ("Yes"/"No"), `job_level`, `yoe`, `created_at`.

The numbers above are illustrative of the format, not recorded output.

## Screenshots and demo notes

No screenshots are bundled yet: running the full pipeline needs live Azure OpenAI credentials, a database and real job-board traffic, and fabricated screenshots would be misleading. Contributions of real screenshots are welcome (see [Contributing](#contributing)).

## Testing

```bash
cd backend
python -m pytest
```

The suite (`backend/tests/test_basic.py`) needs no network, database or API key. It checks job-level and years-of-experience extraction, tolerant JSON parsing of LLM output, the conditional graph routing, agent-card consistency and that the LangGraph graph compiles with all five nodes.

Frontend:

```bash
cd frontend
npm run build
npm run lint     # currently reports pre-existing issues, see Known issues
```

Manual scripts (not part of the automated suite): `backend/test_openai_azure.py` sends one request to your Azure deployment to verify credentials; `backend/test_storage_hang.py` exercises the storage agent against a real database.

CI (`.github/workflows/ci.yml`) runs the backend tests and the frontend build; lint is advisory.

## Deployment

There is no packaged deployment yet. A reasonable approach:

- Backend: run `uvicorn main:app --host 0.0.0.0 --port 8000` behind a reverse proxy (nginx, Caddy), with env vars supplied by your platform. Use a managed PostgreSQL.
- Frontend: `npm run build` and serve `frontend/dist` as static files; change `API_BASE` and the backend CORS list to your public URLs first.
- **Add authentication before exposing it publicly.** The API has none, and anyone who can reach it can trigger paid LLM calls and scraping.
- Run a single worker: pipeline events and queues are kept in process memory.

## Troubleshooting and FAQ

**The backend crashes at startup with an error about `create_async_engine` / `NoneType`.** `DATABASE_URL` is not set. Create `backend/.env`.

**`ModuleNotFoundError: asyncpg` or "driver" errors.** Use a URL starting with `postgresql+asyncpg://`, not `postgresql://`.

**OpenAI 401 / 404 errors in the logs.** Check endpoint, key, deployment name and API version; run `python test_openai_azure.py` from `backend/`.

**Scraping returns zero jobs.** Job boards rate-limit and block scrapers; try fewer sites, a smaller `job_count`, or retry later. The scraper looks back 72 hours and uses `country_indeed="india"` (see Limitations).

**The UI shows nothing / network errors.** Make sure the backend is on port 8000 and the UI on 5173-5176.

**Does it apply to jobs for me?** No. It only scores jobs and drafts letters; you apply yourself.

**Which model should I use?** Any Azure OpenAI chat deployment that accepts `temperature=1`; the default deployment name is `gpt-5-mini` but you configure your own.

## Limitations and known issues

- Requires Azure OpenAI specifically (not the plain OpenAI endpoint) and PostgreSQL specifically (the startup migration queries `information_schema`).
- `GET /api/jobs/download` serves `backend/output/job_results.xlsx`, but the storage agent writes timestamped files (`job_results_<Month>_<DD>_<HHMMSS>.xlsx`), so the download link may return 404 until that is reconciled.
- The Indeed search is hard-coded to `country_indeed="india"` and `hours_old=72` in `backend/tools/jobspy_tool.py`.
- Platform selection is supported by the agent (`platforms` in state) but the UI does not expose it; the default set is LinkedIn, Indeed, Google and Glassdoor. Some comments in `job_search_agent.py` still mention platforms that are not wired up.
- The scoring and cover-letter prompts truncate resume text (5000 / 4500 characters) and descriptions.
- Pipeline events and queues live in process memory; a restart loses in-flight searches and multiple workers will not share them.
- No authentication, rate limiting, or retry logic around LLM calls.
- `npm run lint` currently reports errors such as unused imports (e.g. `motion` imported for JSX member use is flagged); the build is unaffected.
- The log timestamp format string in `logger.py` has a typo (`%Y-%m-d`).
- Job-board scraping may violate the terms of service of some sites; use responsibly.

## Roadmap

- Fix the XLSX download endpoint to serve the file produced for a given search
- UI control for choosing job boards, country and recency
- Retry/backoff and concurrency limits for LLM scoring
- Pluggable LLM provider (OpenAI, local models)
- Authentication and per-user history
- Docker Compose for one-command local setup
- Real screenshots and a demo GIF
- More unit tests for routers and storage

## Contributing

Issues and pull requests are welcome - see [CONTRIBUTING.md](CONTRIBUTING.md).

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md). Never commit `.env` files or API keys.

## License

MIT - see [LICENSE](LICENSE). Copyright (c) 2026 Chiranjeev Kumar.

## Credits

- [LangGraph](https://github.com/langchain-ai/langgraph) and [LangChain](https://github.com/langchain-ai/langchain) for agent orchestration
- [python-jobspy](https://github.com/speedyapply/JobSpy) (JobSpy) for job scraping
- [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/), [pdfplumber](https://github.com/jsvine/pdfplumber), [openpyxl](https://openpyxl.readthedocs.io/)
- [React](https://react.dev/), [Vite](https://vite.dev/), [React Flow](https://reactflow.dev/), [Framer Motion](https://www.framer.com/motion/), [lucide](https://lucide.dev/)
- Azure OpenAI Service for the language models
