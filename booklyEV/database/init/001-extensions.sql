-- Runs once, automatically, when the postgres container's data volume is
-- first initialized (see docker/docker-compose.yml).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
