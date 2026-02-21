# Goldfinch — Claude Code Guide

Goldfinch ist eine Altersvorsorge-Planungsapp. **Aktives Frontend**: SvelteKit/Svelte 5 (`src/svelte-frontend/`). **Backend**: FastAPI (Python) mit PostgreSQL und Redis.

## Dev-Befehle

```bash
# Frontend (Port 5173)
cd src/svelte-frontend && npm run dev

# Backend (Port 8000) — Python venv liegt in src/backend/venv
cd src/backend && source venv/bin/activate && uvicorn app.main:app --reload

# i18n neu kompilieren (nach Änderungen in messages/*.json)
npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide

# Tests (Backend)
cd src/backend && python -m pytest
```

## Kritische Verzeichnisse

```
src/svelte-frontend/src/
  routes/          # Seiten (+page.svelte) und Ladedaten (+page.ts)
  lib/api/         # HTTP-Client + API-Services pro Domain
  lib/stores/      # Globale reaktive Stores (Svelte 5 runes)
  lib/types/       # TypeScript Domain-Typen
  lib/components/  # UI-Komponenten (ui/, layout/, household/, pension/, settings/)
  lib/utils/       # Formatierung, Datum, Projektionsberechnungen
  lib/paraglide/   # GENERIERT — nie manuell editieren

src/backend/app/
  api/v1/endpoints/  # FastAPI Router-Dateien
  models/            # SQLAlchemy-Modelle
  schemas/           # Pydantic Request/Response-Schemas
  crud/              # Datenbankoperationen
  services/          # Business-Logik (ETF, Exchange Rate, Projections)
  tasks/             # Celery Background-Tasks

messages/            # i18n-Quelldateien (en.json, de.json)
docs/                # Architektur-Referenz (FRONTEND.md, BACKEND.md, file-map.md)
```

**Ignorieren** (Legacy, wird nicht mehr gepflegt): `/app/`, `/src/frontend/`

## Frontend — Svelte 5 Muster

**Runes** (kein Svelte 4 Store-Syntax):
```typescript
let value = $state(0)
let doubled = $derived(value * 2)
let complex = $derived.by(() => { const _l = locale; return format(_l, value) })
$effect(() => { /* Seiteneffekte */ })
```

**Props und Bindable:**
```typescript
let { label, value = $bindable() }: { label: string, value: number } = $props()
```

**Routing-Pattern:**
- `+page.ts` lädt Initialdaten via `create*Api(fetch)` (route-spezifisches fetch)
- `+page.svelte` empfängt `data` und rendert Komponenten
- API-Calls außerhalb von load-Funktionen: Singleton-Services aus `$lib/api/*.ts`

**Komponenten-Konventionen:**
- Keine Shadcn-Komponenten — eigene Custom-Komponenten
- Modals: natives HTML `<dialog>`-Element
- Für Custom-Inputs (CurrencyInput, ETFSearchInput): `<p>` statt `<label>` (Svelte a11y-Einschränkung)
- Toast-Feedback: `toastStore.success(m.key())` / `toastStore.error(m.key())`

**Globale Stores** (`src/lib/stores/`):
- `settingsStore` — Locale, Währung, Szenario-Raten, Theme
- `pensionStore` — globale Pensionsliste
- `toastStore` — Toast-Nachrichten

**API-Layer** (`src/lib/api/`):
- `client.ts` — generischer HTTP-Client
- `pension.ts` — alle 5 Pension-Typen + Status-Management
- `etf.ts`, `household.ts`, `settings.ts` — Domain-spezifisch

**Formatierung:**
- Alle Formatierungen über `settingsStore` (Locale/Währung)
- `$lib/utils/format.ts` — Zahlen, Währung, Prozent, Datum
- `FormattedCurrency`, `FormattedDate`, `FormattedPercent` — fertige Komponenten

**i18n:**
- Quellen: `messages/en.json`, `messages/de.json`
- Generierte Dateien in `src/lib/paraglide/` — NIE manuell editieren
- Nach Änderungen: Paraglide-Compiler ausführen (s. Dev-Befehle)

## Backend — FastAPI Muster

**API-Basis-URL:** `http://localhost:8000/api/v1/`

**Endpoint-Struktur:**
```
GET/POST   /household/members
GET/PUT/DELETE /household/members/{id}
GET/POST   /pension/{type}           # type: state|company|savings|insurance|etf
GET/PUT/DELETE /pension/{type}/{id}
POST       /pension/{type}/{id}/status
GET        /etf/search
GET/POST   /settings
GET        /exchange-rates/latest
GET        /health
```

**Neues Feature — Reihenfolge:**
1. Types in `lib/types/` (Frontend) / `schemas/` + `models/` (Backend)
2. API-Methoden in `lib/api/` (Frontend) / `endpoints/` (Backend)
3. CRUD in `crud/` (Backend)
4. Route-Load in `+page.ts` anpassen
5. UI-Komponenten in `lib/components/` erstellen/erweitern
6. i18n-Keys ergänzen + Paraglide neu kompilieren

**Alembic-Migrations:**
```bash
cd src/backend
alembic revision --autogenerate -m "beschreibung"
# Generierte Migration prüfen und ggf. anpassen, DANN:
alembic upgrade head
```
Niemals Migrations manuell erstellen — immer autogenerieren.

**Python venv:** `src/backend/venv`

## Wichtige Gotchas

- **Savings Pension — Rate-Format**: API speichert als Prozent (2.0 = 2%), Form/PercentInput als Dezimal (0.02). Im Route-Page dividieren/multiplizieren.
- **Reaktive Closures**: Bei Format-Funktionen in `$derived.by` die locale-Variable vorher erfassen (`const _l = locale`), sonst trackt Svelte 5 die Dependency nicht.
- **Form-Typen**: API-Typen haben `number | undefined`, Form-Komponenten brauchen `number`. Lokale `FormData`-Interfaces definieren, beim Laden mit `?? 0` mappen.

## Detaillierte Referenz

- **Frontend-Architektur**: [docs/FRONTEND.md](docs/FRONTEND.md)
- **Backend-Architektur**: [docs/BACKEND.md](docs/BACKEND.md)
- **Datei-Map (alle Komponenten)**: [docs/file-map.md](docs/file-map.md)
- **Git-Commit-Prefixes**: `fix:`, `feat:`, `perf:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
