# Goldfinch: Local Docker Development Setup

This guide explains how to run Goldfinch locally using Docker for PostgreSQL and Redis.

## Prerequisites

- **Docker Desktop** installed and running
- **Python 3.9+** (for backend development)
- **Node.js 20+** (for frontend development)

---

## Quick Start

### 1. Start Docker Services

```bash
# From project root
docker-compose up -d

# Check services are running
docker ps
```

You should see:
- `goldfinch-postgres` on port 5432
- `goldfinch-redis` on port 6379

### 2. Migrate Data from LXC (One-time)

If you have existing data on your LXC server:

```bash
./scripts/migrate-from-lxc.sh
```

This will:
- Dump database from LXC server (192.168.20.110)
- Import into local Docker PostgreSQL
- Verify migration

**Note:** Requires `psql` and `pg_dump` installed locally:
```bash
# macOS
brew install postgresql@15

# Verify
psql --version
pg_dump --version
```

### 3. Start Backend

```bash
cd src/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on: http://localhost:8000

### 4. Start Celery Worker

```bash
# New terminal
cd src/backend
source venv/bin/activate
celery -A app.core.celery_app.celery_app worker -l info
```

### 5. Start Celery Beat (Scheduler)

```bash
# New terminal
cd src/backend
source venv/bin/activate
celery -A app.core.celery_app.celery_app beat -l info
```

### 6. Start Frontend

```bash
# New terminal, from project root
npm run dev
```

Frontend runs on: http://localhost:3000

---

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop & Remove Data (⚠️ Deletes all data!)
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Access PostgreSQL Shell
```bash
docker exec -it goldfinch-postgres psql -U goldfinch_dev -d goldfinch_dev
```

### Access Redis Shell
```bash
docker exec -it goldfinch-redis redis-cli
```

---

## Database Management

### Run Migrations
```bash
cd src/backend
source venv/bin/activate
alembic upgrade head
```

### Create Migration
```bash
alembic revision --autogenerate -m "description"
```

### Database Backup (Local)
```bash
docker exec goldfinch-postgres pg_dump -U goldfinch_dev goldfinch_dev > backup_$(date +%Y%m%d).sql
```

### Database Restore (Local)
```bash
docker exec -i goldfinch-postgres psql -U goldfinch_dev -d goldfinch_dev < backup.sql
```

---

## Troubleshooting

### Docker Services Won't Start

**Check if ports are already in use:**
```bash
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

**Kill conflicting processes:**
```bash
kill -9 <PID>
```

### Cannot Connect to Database

**Check if container is running:**
```bash
docker ps | grep postgres
```

**Check logs:**
```bash
docker logs goldfinch-postgres
```

**Restart container:**
```bash
docker-compose restart postgres
```

### Celery Cannot Connect to Redis

**Check Redis is running:**
```bash
docker exec goldfinch-redis redis-cli ping
# Should return: PONG
```

**Check connection in Python:**
```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
r.ping()  # Should return True
```

### Database Connection Refused

Make sure Docker services are started **before** running the backend:
```bash
# 1. Start Docker services first
docker-compose up -d

# 2. Wait for health checks (10 seconds)
sleep 10

# 3. Then start backend
cd src/backend && uvicorn app.main:app --reload
```

---

## Configuration

### Database Connection
Located in: `src/backend/app/core/config.py`
```python
DATABASE_URL = "postgresql+psycopg2://goldfinch_dev:changeme@localhost:5432/goldfinch_dev"
```

### Redis Connection
Located in: `src/backend/app/core/celery_app.py`
```python
broker = "redis://localhost:6379/0"
backend = "redis://localhost:6379/1"
```

---

## Development Workflow

### Typical Daily Workflow

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Open 4 terminals:

# Terminal 1: Backend
cd src/backend && source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Celery Worker
cd src/backend && source venv/bin/activate
celery -A app.core.celery_app.celery_app worker -l info

# Terminal 3: Celery Beat
cd src/backend && source venv/bin/activate
celery -A app.core.celery_app.celery_app beat -l info

# Terminal 4: Frontend
npm run dev
```

### End of Day
```bash
# Stop Docker services (keeps data)
docker-compose down

# Or keep them running (uses ~200MB RAM)
```

---

## Migration from LXC to Local

The migration script (`scripts/migrate-from-lxc.sh`) does the following:

1. ✅ Checks Docker is running
2. ✅ Starts PostgreSQL container if needed
3. ✅ Tests connection to LXC server (192.168.20.110)
4. ✅ Creates backup from LXC PostgreSQL
5. ✅ Drops and recreates local database
6. ✅ Restores backup to local Docker
7. ✅ Verifies migration success

**Manual Migration (if script fails):**
```bash
# Set password once for this shell session
export LXC_DB_PASSWORD="<set-your-password>"

# 1. Dump from LXC
PGPASSWORD="$LXC_DB_PASSWORD" pg_dump \
  -h 192.168.20.110 \
  -U goldfinch_dev \
  -d goldfinch_dev \
  > lxc_backup.sql

# 2. Restore to local Docker
docker exec -i goldfinch-postgres psql \
  -U goldfinch_dev \
  -d goldfinch_dev < lxc_backup.sql
```

---

## Benefits of Local Docker Setup

✅ **Faster Development**
- No network latency
- Instant feedback on changes

✅ **Easier Debugging**
- All logs locally accessible
- Can pause/inspect containers

✅ **Offline Development**
- No dependency on LXC server
- Work anywhere

✅ **Consistent Environment**
- Same Docker images as production
- No "works on my machine" issues

✅ **Easy Reset**
- `docker-compose down -v` for fresh start
- No server cleanup needed

---

## Production Deployment (LXC Server)

For production deployment to your LXC server, see separate deployment docs.

The local Docker setup is for **development only**.

---

## Next Steps

After successful setup:

1. ✅ Verify all services are running
2. ✅ Test backend API: http://localhost:8000/docs
3. ✅ Test frontend: http://localhost:3000
4. ✅ Trigger an ETF update to test Celery
5. ✅ Check Celery logs for scheduled tasks

---

## Support

If you encounter issues:

1. Check Docker logs: `docker-compose logs -f`
2. Check service status: `docker ps`
3. Restart services: `docker-compose restart`
4. Reset everything: `docker-compose down -v && docker-compose up -d`
