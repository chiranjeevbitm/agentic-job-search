"""Test setup: dummy env vars so modules that build clients at import time can load.
No network or database connection is made by these tests."""
import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test")
os.environ.setdefault("AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com")
os.environ.setdefault("AZURE_OPENAI_API_KEY", "test-key-not-real")
os.environ.setdefault("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
os.environ.setdefault("AZURE_OPENAI_DEPLOYMENT_NAME", "test-deployment")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
