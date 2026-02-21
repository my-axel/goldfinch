# 🐦 Goldfinch

Goldfinch is a retirement planning platform for households. It combines pension tracking, projections, and settings-driven financial planning in one application.

## 🚧 Project Status

Goldfinch is in active development.

- Core pension and household management is implemented and usable.
- Dashboard, Compass, and Payout Strategy are available as structured UI scaffolds and are being expanded feature by feature.
- New frontend work is centered in `src/svelte-frontend`.

## ✅ Features Available Today

- Household management (create, edit, delete members)
- Pension management for five types:
  - State pension
  - Company pension
  - Insurance pension
  - ETF pension
  - Savings pension
- Pension status actions (pause/resume)
- Contribution planning and contribution history (where applicable)
- One-time investments (ETF, company, insurance flows)
- ETF search and ETF metrics integration
- Settings with backend persistence:
  - UI language
  - Number/date locale
  - Currency
  - Scenario rates (pessimistic/realistic/optimistic)
  - Inflation rate
  - Theme mode
- Internationalization foundation (English/German)
- Exchange rate backend APIs (latest, historical, update flows)

## 🧭 Coming Next

- Dashboard aggregation with portfolio KPIs and performance views
- Compass gap analysis and recommendation workflows
- Payout strategy simulation and withdrawal planning
- Currency system frontend integration
- Contribution management automation across pension types
- Additional testing and polish for full production hardening

For detailed tracking, see [PROGRESS.md](PROGRESS.md).

## 🧱 Tech Stack

### 🎨 Frontend

- SvelteKit 2
- Svelte 5
- TypeScript
- Tailwind CSS 4
- Paraglide (i18n)

### ⚙️ Backend

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Celery + Redis
- yfinance

## 🗂️ Repository Structure

- `src/svelte-frontend`: active frontend application
- `src/backend`: backend API, models, services, migrations, tests
- `docs`: architecture and migration documentation
- `PROGRESS.md`: roadmap and implementation status

## 🛠️ Local Development

### 📋 Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (for PostgreSQL + Redis)

### ▶️ Setup

1. Copy environment files:
   - `cp .env.example .env`
   - `cp src/svelte-frontend/.env.example src/svelte-frontend/.env`
2. Start infrastructure:
   - `docker-compose up -d`
3. Start backend:
   - `cd src/backend`
   - `python3 -m venv venv`
   - `source venv/bin/activate`
   - `pip install -r requirements.txt`
   - `alembic upgrade head`
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
4. Optional background workers:
   - `celery -A app.core.celery_app.celery_app worker -l info`
   - `celery -A app.core.celery_app.celery_app beat -l info`
5. Start frontend:
   - `cd src/svelte-frontend`
   - `npm install`
   - `npm run dev`

### 🌐 Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## 📚 Documentation

- [PROGRESS.md](PROGRESS.md)
- [docs/frontend-overview.md](docs/frontend-overview.md)
- [docs/svelte_migration_plan.md](docs/svelte_migration_plan.md)
- [docs/file-map.md](docs/file-map.md)

## 📄 License

MIT
