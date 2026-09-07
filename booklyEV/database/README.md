# Database

Booklynk EV uses **PostgreSQL** as its system of record, accessed from the
backend through **SQLAlchemy** (ORM) and **Alembic** (migrations).

- Schema/table definitions live as SQLAlchemy models inside
  `backend/app/modules/<module>/models.py` (added as each module is
  implemented).
- Migrations live in `backend/alembic/versions/` and are generated from
  those models — see [`docs/database.md`](../docs/database.md).
- `database/init/` holds SQL that Postgres runs **once**, automatically, the
  first time its Docker volume is created (e.g. enabling extensions). It is
  not a substitute for Alembic migrations — application schema changes
  always go through Alembic.

This directory intentionally does not contain a duplicate schema — the
SQLAlchemy models are the single source of truth, and Alembic migrations are
generated from them.
