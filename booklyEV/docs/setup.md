# Setup Instructions

## Option A — Docker Compose (recommended, matches production topology)

Requires Docker Desktop.

```bash
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up --build
```

This starts Postgres, Redis, the backend (`--reload`, port 8000), and the
frontend (port 3000). Then, in a second terminal, apply migrations inside
the running backend container:

```bash
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head
docker compose -f docker/docker-compose.yml exec backend python -m app.seed
```

Visit:
- Frontend: http://localhost:3000
- API health check: http://localhost:8000/api/health
- API docs (Swagger): http://localhost:8000/docs

## Option B — Run services natively

### Prerequisites
- Python 3.12+
- Node.js 20+
- A running PostgreSQL 16 instance and Redis 7 instance (or run just those
  two via `docker compose -f docker/docker-compose.yml up postgres redis`)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env          # then edit DATABASE_URL / REDIS_URL as needed
alembic upgrade head
python -m app.seed             # seeds the fixed role catalog
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

See [environment-variables.md](environment-variables.md) for what each
variable does, [database.md](database.md) for migrations, and
[testing.md](testing.md) for running the test suites.
