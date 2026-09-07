FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY . .

EXPOSE 8000

# $PORT is read at container start, not build time — hosts like Render
# assign it dynamically per-instance and route traffic to whatever value
# it holds, so the app must bind there rather than a hardcoded port.
# Shell form (not exec/JSON-array form) is required for that expansion;
# HEALTHCHECK's CMD already runs under /bin/sh -c so it expands the same
# way. Defaults to 8000 when unset, matching docker-compose's local setup.
# `exec` replaces the shell with uvicorn (PID 1) instead of leaving the
# shell as a wrapper process, so SIGTERM on shutdown/redeploy reaches
# uvicorn directly for a clean stop rather than a SIGKILL after the grace
# period.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
