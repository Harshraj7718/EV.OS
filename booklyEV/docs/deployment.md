# Deploying the backend to Render

Covers deploying `backend/` as a Render web service, backed by Render's
managed Postgres. The frontend isn't covered here — deploy it separately
(Render static site / Vercel / another host) and point `CORS_ORIGINS` (on
the backend) and `NEXT_PUBLIC_API_BASE_URL` (on the frontend) at each
other once both URLs are known.

## Prerequisite: a Git repository

Render deploys from a Git repo (GitHub, GitLab, or Bitbucket) it can pull
from on every push. This project isn't a Git repo yet — initialize one
and push it somewhere Render can reach before starting below:

```bash
cd "C:\Users\HASH\OneDrive\Desktop\booklyEV"
git init
git add .
git commit -m "Initial commit"
# then create a repo on GitHub/GitLab and:
git remote add origin <your-repo-url>
git push -u origin main
```

## Option A — Blueprint (`render.yaml`, recommended)

The repo root has a `render.yaml` that provisions both the backend web
service and a managed Postgres database in one step, wired together:

1. In the Render dashboard: **New +** → **Blueprint** → connect the repo.
2. Render reads `render.yaml` and shows a preview of what it'll create
   (`booklynk-ev-backend` web service + `booklynk-ev-db` database). Apply it.
3. Render prompts for the one variable the blueprint deliberately leaves
   blank — `CORS_ORIGINS`. If you don't have a frontend URL yet, put in
   a placeholder (e.g. `http://localhost:3000`) and update it later from
   the service's **Environment** tab; no redeploy of the blueprint is
   needed; a plain env var change just restarts the service.
4. Everything else — `SECRET_KEY` (random-generated), `DATABASE_URL`
   (wired to the new database, with the driver prefix normalized
   automatically — see below), `ENVIRONMENT=production` — is already set.
5. First deploy runs `alembic upgrade head && python -m app.seed` ahead
   of starting the server (see `render.yaml`'s `dockerCommand`), so the
   schema and baseline seed data (roles, permissions, EV assets, jobs)
   are ready the moment it's live. Both are idempotent, so this also runs
   safely on every later deploy/restart.

## Option B — Manual dashboard setup

If you'd rather not use the Blueprint:

1. **New +** → **PostgreSQL**. Name it, pick the Free plan, create it.
   Copy its **Internal Connection String** (use the internal one if the
   web service will live in the same Render region — it's faster and
   doesn't count against external bandwidth).
2. **New +** → **Web Service** → connect the repo.
   - **Runtime**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Build Context Directory**: `backend`
   - **Health Check Path**: `/api/health`
3. Add environment variables:

   | Key | Value |
   |---|---|
   | `ENVIRONMENT` | `production` |
   | `DEBUG` | `false` |
   | `SECRET_KEY` | a real random string, 32+ chars (`openssl rand -hex 32`) — **not** the `.env.example` placeholder, see below |
   | `DATABASE_URL` | the connection string from step 1, pasted in as-is |
   | `CORS_ORIGINS` | your frontend's URL(s), comma-separated |

4. Under **Settings** → **Docker Command**, override the default to also
   run migrations and the seed script first:

   ```
   sh -c "alembic upgrade head && python -m app.seed && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT"
   ```

5. Deploy.

## Two things that would otherwise break a first deploy

Both are already fixed in this codebase (verified by
`backend/tests/test_config.py`), but matter if you're comparing this
setup against a from-scratch FastAPI deploy elsewhere:

- **Render assigns `$PORT` dynamically per instance** — the app must
  bind to whatever it is, not a hardcoded port. `backend/Dockerfile`'s
  `CMD` reads `${PORT:-8000}` (shell form, so the expansion actually
  happens); Option B's Docker Command override does the same with `$PORT`.
- **Render's Postgres connection string has no driver suffix**
  (`postgresql://...`), but this app's SQLAlchemy engine needs the
  `+psycopg` dialect it actually ships (only `psycopg` v3 is installed,
  not `psycopg2`). `Settings` normalizes `postgres://`/`postgresql://` to
  `postgresql+psycopg://` automatically on load
  (`app/core/config.py::_normalize_database_url_driver`), so pasting
  Render's string in unmodified just works.

## Verifying the deploy

```bash
curl https://<your-service>.onrender.com/api/health
# {"status":"ok","service":"booklynk-ev"}
```

Then register a user, confirm the response includes a real token pair
and the account defaults to `RIDER` — the same smoke test used in local
verification throughout this project (see [testing.md](testing.md)).

If you need a `SUPER_ADMIN` account to reach `/admin`, there's no
bootstrap endpoint for that by design (see [admin.md](admin.md)) —
register normally, then promote the account directly in the database
(Render's dashboard has a **Connect** → **PSQL** shell for exactly this):

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
WHERE email = 'you@example.com';
```

## What this doesn't set up

- **The frontend.** Deploy it separately; see the note at the top.
- **Redis.** `REDIS_URL` is reserved for future use (rate limiting,
  caching) and nothing in the app calls it yet — no Redis instance is
  needed to run this backend today. Add one later if/when that lands.
- **A custom domain, autoscaling, or a paid plan.** The Free plan spins
  down after inactivity and cold-starts on the next request (expect a
  ~30–60s delay after idle) — fine for a demo, not for production traffic.
- **CI.** Render redeploys automatically on every push to the connected
  branch; there's no separate test/lint gate before that happens. Run
  `pytest` / `ruff check .` / `mypy app` locally (or wire up a CI
  workflow) before pushing if you want that gate.
