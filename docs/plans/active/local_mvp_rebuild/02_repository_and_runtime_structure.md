# 02 Repository and Runtime Structure

Status: 🟡 Planning

## 1. Monorepo Structure (Target)

```text
goldfinch/
  apps/
    web/
      app/
      src/
      package.json
    api/
      app/
      alembic/
      pyproject.toml
  infra/
    docker/
      web.Dockerfile
      api.Dockerfile
    docker-compose.yml
    .env.example
    scripts/
      backup.sh
      restore.sh
      healthcheck.sh
  docs/
    plans/active/local_mvp_rebuild/
```

## 2. Boundary Rules

1. `apps/web` contains no database logic.
2. `apps/api` contains no UI rendering logic.
3. `apps/web` talks only to HTTP API endpoints.
4. All infrastructure scripts live in `infra/`.
5. No credentials or host addresses committed in application code.

## 3. Runtime Services (MVP)

1. `web`: Next.js application.
2. `api`: FastAPI application.
3. `worker`: Celery worker process.
4. `scheduler`: Celery beat process (can be merged with worker in MVP if needed).
5. `postgres`: primary database.
6. `redis`: broker/cache used by jobs.

## 4. Ports and Access Model

Recommended local/LAN model:

1. `web`: exposed on `3000` (LAN-restricted).
2. `api`: internal only (`8000` inside compose network).
3. `postgres`: internal only.
4. `redis`: internal only.

Optional reverse proxy can be added later; not required for MVP.

## 5. Configuration Model

Environment variables only, loaded from `.env`:

1. `APP_ENV=local`
2. `POSTGRES_DB`
3. `POSTGRES_USER`
4. `POSTGRES_PASSWORD`
5. `DATABASE_URL`
6. `REDIS_URL`
7. `CELERY_BROKER_URL`
8. `CELERY_RESULT_BACKEND`
9. `API_HOST`
10. `API_PORT`
11. `WEB_PORT`
12. `ALLOW_INTERNET_SYNC=true|false`
13. `ETF_SYNC_SCHEDULE_CRON`
14. `FX_SYNC_SCHEDULE_CRON`
15. `BACKUP_DIR`

## 6. Compose Blueprint (Conceptual)

```yaml
services:
  postgres:
    image: postgres:16
  redis:
    image: redis:7
  api:
    build: ./infra/docker/api.Dockerfile
    env_file: ./infra/.env
    depends_on: [postgres, redis]
  worker:
    build: ./infra/docker/api.Dockerfile
    command: celery -A app.core.celery_app.celery_app worker -l info
    env_file: ./infra/.env
    depends_on: [api, redis]
  scheduler:
    build: ./infra/docker/api.Dockerfile
    command: celery -A app.core.celery_app.celery_app beat -l info
    env_file: ./infra/.env
    depends_on: [api, redis]
  web:
    build: ./infra/docker/web.Dockerfile
    env_file: ./infra/.env
    depends_on: [api]
    ports:
      - "3000:3000"
```

## 7. Refactor Targets in Current Codebase

1. Remove hardcoded DB URL in `/Users/axel/Coding/goldfinch-dev/src/backend/app/core/config.py`.
2. Remove hardcoded Celery broker in `/Users/axel/Coding/goldfinch-dev/src/backend/app/core/celery_app.py`.
3. Remove host guessing in `/Users/axel/Coding/goldfinch-dev/src/frontend/lib/api-client.ts` and use env-based base URL.

## 8. Definition of Done for This Area

1. One command boots all required services.
2. Config values are externalized.
3. Web and API communicate over internal network cleanly.
4. Worker and scheduler can run independently.
5. Local restart after reboot is documented.

