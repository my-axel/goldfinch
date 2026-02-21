#!/bin/bash
# Migration script: LXC PostgreSQL → Local Docker PostgreSQL
# Author: Claude Sonnet 4.5
# Date: 2026-02-14

set -e  # Exit on error

# Add PostgreSQL to PATH (for Homebrew installations)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

echo "🔄 Goldfinch Database Migration: LXC → Local Docker"
echo "=================================================="
echo ""

# Configuration
LXC_HOST="192.168.20.110"
LXC_PORT="5432"
LXC_USER="goldfinch_dev"
LXC_DB="goldfinch_dev"

LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="goldfinch_dev"
LOCAL_DB="goldfinch_dev"

# Credentials: never hardcode secrets in repository.
# Preferred usage:
#   export LXC_PASSWORD="<source-db-password>"
#   export LOCAL_PASSWORD="<local-db-password>"   # optional
LXC_PASSWORD="${LXC_PASSWORD:-}"
LOCAL_PASSWORD="${LOCAL_PASSWORD:-$LXC_PASSWORD}"

BACKUP_FILE="goldfinch_backup_$(date +%Y%m%d_%H%M%S).sql"

# Read passwords securely if not set via environment
if [ -z "$LXC_PASSWORD" ]; then
    read -s -p "🔐 Enter LXC PostgreSQL password for $LXC_USER@$LXC_HOST: " LXC_PASSWORD
    echo ""
fi

if [ -z "$LOCAL_PASSWORD" ]; then
    read -s -p "🔐 Enter local PostgreSQL password for $LOCAL_USER@$LOCAL_HOST (press Enter to reuse LXC password): " LOCAL_PASSWORD
    echo ""
    if [ -z "$LOCAL_PASSWORD" ]; then
        LOCAL_PASSWORD="$LXC_PASSWORD"
    fi
fi

# Check if Docker is running
echo "✅ Checking Docker..."
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if PostgreSQL container is running
echo "✅ Checking if PostgreSQL container is running..."
if ! docker ps | grep -q goldfinch-postgres; then
    echo "⚠️  PostgreSQL container not running. Starting it now..."
    docker-compose up -d postgres
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Test LXC connection
echo "✅ Testing connection to LXC PostgreSQL..."
if ! PGPASSWORD="$LXC_PASSWORD" psql -h "$LXC_HOST" -p "$LXC_PORT" -U "$LXC_USER" -d "$LXC_DB" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to LXC PostgreSQL at $LXC_HOST:$LXC_PORT"
    echo "   Please check:"
    echo "   - Is the LXC server running?"
    echo "   - Is PostgreSQL accessible from this machine?"
    echo "   - Are the credentials correct?"
    exit 1
fi

# Dump from LXC
echo ""
echo "📦 Step 1: Dumping database from LXC server..."
echo "   Source: $LXC_USER@$LXC_HOST:$LXC_PORT/$LXC_DB"
echo "   Backup: $BACKUP_FILE"
PGPASSWORD="$LXC_PASSWORD" pg_dump -h "$LXC_HOST" -p "$LXC_PORT" -U "$LXC_USER" -d "$LXC_DB" \
    --verbose \
    --no-owner \
    --no-acl \
    -F p \
    -f "$BACKUP_FILE" 2>&1 | grep -v '^$'

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file was not created"
    exit 1
fi

echo "✅ Backup created successfully: $(du -h $BACKUP_FILE | cut -f1)"

# Drop and recreate local database (clean slate)
echo ""
echo "🗑️  Step 2: Preparing local database..."
echo "   Dropping existing database (if exists)..."
docker exec -e PGPASSWORD="$LOCAL_PASSWORD" -i goldfinch-postgres psql -U "$LOCAL_USER" -c "DROP DATABASE IF EXISTS $LOCAL_DB;" 2>&1 | grep -v '^$' || true
echo "   Creating fresh database..."
docker exec -e PGPASSWORD="$LOCAL_PASSWORD" -i goldfinch-postgres psql -U "$LOCAL_USER" -c "CREATE DATABASE $LOCAL_DB;" 2>&1 | grep -v '^$'

# Restore to local Docker
echo ""
echo "📥 Step 3: Restoring database to local Docker..."
echo "   Target: $LOCAL_USER@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB"
docker exec -e PGPASSWORD="$LOCAL_PASSWORD" -i goldfinch-postgres psql -U "$LOCAL_USER" -d "$LOCAL_DB" < "$BACKUP_FILE" 2>&1 | grep -E '(ERROR|CREATE|ALTER|COPY|INSERT)' || true

# Verify migration
echo ""
echo "✅ Step 4: Verifying migration..."
TABLE_COUNT=$(docker exec -e PGPASSWORD="$LOCAL_PASSWORD" -i goldfinch-postgres psql -U "$LOCAL_USER" -d "$LOCAL_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "   Tables found: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo ""
    echo "🎉 Migration completed successfully!"
    echo ""
    echo "📊 Database Statistics:"
    docker exec -e PGPASSWORD="$LOCAL_PASSWORD" -i goldfinch-postgres psql -U "$LOCAL_USER" -d "$LOCAL_DB" -c "
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    "
    echo ""
    echo "✅ Backup file saved: $BACKUP_FILE"
    echo "   You can delete it once you've verified everything works."
else
    echo "❌ Warning: No tables found in the database. Something might have gone wrong."
    exit 1
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Start backend: cd src/backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   2. Start Celery: celery -A app.core.celery_app.celery_app worker -l info"
echo "   3. Start Celery Beat: celery -A app.core.celery_app.celery_app beat -l info"
echo "   4. Verify data in your application"
echo ""
