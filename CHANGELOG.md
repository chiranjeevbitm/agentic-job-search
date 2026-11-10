# Changelog

## [0.1.0] - 2026-11-10

Initial public release.

- LangGraph pipeline: Resume, Job Search, Scoring, Cover Letter and Storage agents
- FastAPI backend with SSE progress streaming, history and agent-registry endpoints
- Multi-site scraping through python-jobspy (LinkedIn, Indeed, Google, Glassdoor, ZipRecruiter)
- Azure OpenAI scoring and cover-letter generation, run in parallel
- Persistence to PostgreSQL and timestamped XLSX files
- React + Vite UI with Search, Agents Dashboard and History pages
- Basic pytest suite and GitHub Actions CI
