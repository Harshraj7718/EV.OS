# Environment Variables

Each service has its own `.env.example` — copy it to `.env` in the same
folder and adjust values. `docker/.env.example` covers Compose-level
overrides (Postgres credentials/ports, etc).

## Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `booklynk-ev` | Service name, also returned by `/api/health`. |
| `ENVIRONMENT` | `development` | `development` \| `staging` \| `production`. |
| `DEBUG` | `true` | Enables FastAPI debug mode. |
| `API_V1_PREFIX` | `/api/v1` | Prefix for versioned domain routers. |
| `LOG_LEVEL` | `INFO` | Python logging level. |
| `DATABASE_URL` | `postgresql+psycopg://booklynk:booklynk@localhost:5432/booklynk_ev` | SQLAlchemy connection string (sync `psycopg` driver). |
| `DATABASE_ECHO` | `false` | Log every SQL statement (debugging only). |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string. |
| `SECRET_KEY` | *(dev placeholder)* | Signs JWT access/refresh tokens. **Must** be a long random value in staging/production. |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed origins. |

## Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Base URL the browser uses to call the backend. Exposed client-side — never put secrets in `NEXT_PUBLIC_*` vars. |
| `NEXT_PUBLIC_PORTAL` | *(unset)* | Only set on a portal-scoped Vercel deployment: `super-admin` \| `admin` \| `investor` \| `rider` \| `business`. Leave unset locally/Docker — see [vercel-deployment.md](vercel-deployment.md). |

## Docker Compose (`docker/.env`)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `booklynk` / `booklynk` / `booklynk_ev` | Postgres container credentials. |
| `POSTGRES_PORT` | `5432` | Host port mapped to Postgres. |
| `REDIS_PORT` | `6379` | Host port mapped to Redis. |
| `BACKEND_PORT` | `8000` | Host port mapped to the API. |
| `SECRET_KEY` | *(dev placeholder)* | Passed through to the backend container. |
| `FRONTEND_PORT` | `3000` | Host port mapped to the frontend. |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Baked into the frontend build/runtime. |

**Never commit a real `.env` file.** Only `.env.example` files are tracked.
