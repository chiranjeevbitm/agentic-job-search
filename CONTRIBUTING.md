# Contributing

Thanks for your interest! Bug reports, fixes and ideas are welcome.

## Workflow

1. Fork the repo and create a branch: `git checkout -b fix/short-description`.
2. Make your change. Keep PRs focused.
3. Run the checks:
   ```bash
   cd backend && pip install -r requirements.txt && python -m pytest
   cd ../frontend && npm ci && npm run build
   ```
4. Open a pull request describing what changed and why.

## Guidelines

- Never commit `.env` files, API keys, resumes, or generated spreadsheets.
- Add or update tests for backend logic when you can (`backend/tests`).
- Follow the existing code style; keep functions small and typed where practical.
- By contributing you agree your work is released under the MIT License.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.
