# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's
"Report a vulnerability" (private advisory) on this repository, or contact the
maintainer through the email on their GitHub profile. You should get a reply
within about a week.

## Handling secrets

This project uses an Azure OpenAI key and a database URL. Keep them in
`backend/.env` (git-ignored). If you ever commit a key by accident, revoke it
immediately and rotate it - removing it from git history is not enough.

## Data note

Uploaded resumes are held in memory for the duration of a run; extracted text is
sent to your Azure OpenAI deployment, and job results (including generated cover
letters) are stored in your PostgreSQL database and in XLSX files under
`backend/output/`. Do not run this service on a public host without adding
authentication - the API has none.
