"""
Database configuration.

Dev: SQLite (file: ./dev.db) — zero-config, works offline.
Prod: PostgreSQL — set DATABASE_URL=postgresql://user:pass@host:5432/dbname

The swap is automatic: if DATABASE_URL is set, use Postgres; otherwise SQLite.
SQLAlchemy handles the dialect difference — same models, same queries.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Postgres when online, SQLite for local dev/offline.
# Handle both SQLAlchemy format (sqlite:///path) and Prisma format (file:path).
_raw_db_url = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR}/dev.db")
if _raw_db_url.startswith("file:"):
    # Prisma format: file:/absolute/path → sqlite:////absolute/path
    _path = _raw_db_url[5:]  # strip "file:"
    _raw_db_url = f"sqlite:///{_path}"
DATABASE_URL = _raw_db_url

# JWT settings for auth tokens.
SECRET_KEY = os.environ.get("SECRET_KEY", "delta-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# CORS — the Next.js app runs on port 3000, the gateway on 81.
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:81",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:81",
]
