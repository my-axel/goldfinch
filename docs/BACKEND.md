# Backend-Referenz (FastAPI / Python)

Basis-Pfad: `src/backend/`
Python venv: `src/backend/venv`
API-Basis-URL: `http://localhost:8000/api/v1/`
Interaktive Docs: `http://localhost:8000/docs`

## Starten

```bash
cd src/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

## Verzeichnisstruktur

```
app/
  main.py              # FastAPI-App, CORS, lifespan
  core/
    config.py          # Settings via pydantic_settings (.env)
    logging.py         # Logging-Konfiguration
    startup.py         # Startup-Tasks (Update-Checks)
  api/v1/
    router.py          # Haupt-Router (registered alle Sub-Router)
    deps.py            # Dependency Injection (get_db)
    endpoints/
      household.py     # Haushalt-Endpoints
      pension/         # Pension-Endpoints (1 Datei pro Typ + base.py)
      pension_summaries.py
      etf.py
      exchange_rates.py
      settings.py
  models/              # SQLAlchemy-Modelle (DB-Tabellen)
  schemas/             # Pydantic-Schemas (Request/Response)
  crud/                # Datenbankoperationen
  services/            # Business-Logik
  tasks/               # Celery Background-Tasks
  db/
    base.py            # SQLAlchemy MetaData + alle Models importiert
    base_class.py      # Basis-Klasse für alle Models
    session.py         # DB-Session (SessionLocal, engine)
alembic/               # Datenbank-Migrationen
  versions/            # Migrationsdateien
alembic.ini
```

## API-Endpoints

### Household
```
GET    /api/v1/household/members          # Alle Mitglieder
POST   /api/v1/household/members          # Mitglied anlegen
GET    /api/v1/household/members/{id}     # Einzelnes Mitglied
PUT    /api/v1/household/members/{id}     # Mitglied aktualisieren
DELETE /api/v1/household/members/{id}     # Mitglied löschen
```

### Pension (alle 5 Typen: state, company, savings, insurance, etf)
```
GET    /api/v1/pension/{type}             # Liste
POST   /api/v1/pension/{type}             # Neu anlegen
GET    /api/v1/pension/{type}/{id}        # Detail
PUT    /api/v1/pension/{type}/{id}        # Aktualisieren
DELETE /api/v1/pension/{type}/{id}        # Löschen
POST   /api/v1/pension/{type}/{id}/status # Status ändern (active/paused)
```

### Pension Summaries
```
GET    /api/v1/pension/summaries          # Aggregierte Übersicht aller Pensions
```

### ETF
```
GET    /api/v1/etf/search?q={query}       # ETF-Suche
GET    /api/v1/etf/{symbol}               # ETF-Metadaten
```

### Exchange Rates
```
GET    /api/v1/exchange-rates/latest      # Aktuelle Kurse (EUR-Basis)
GET    /api/v1/exchange-rates/historical  # Historische Kurse
POST   /api/v1/exchange-rates/trigger-update  # Manueller Update-Trigger
```

### Settings
```
GET    /api/v1/settings                   # Einstellungen laden
POST   /api/v1/settings                   # Einstellungen speichern
```

### Health
```
GET    /health                            # {"status": "healthy"}
```

## Datenmodelle (`app/models/`)

```
enums.py             # PensionType, PensionStatus, Currency, Locale, ...
household.py         # HouseholdMember
pension_state.py     # StatePension + StatePensionStatement
pension_company.py   # CompanyPension + CompanyPensionStatement
pension_savings.py   # SavingsPension + SavingsPensionStatement + ContributionPlanStep
pension_insurance.py # InsurancePension + InsurancePensionStatement + ContributionPlanStep
pension_etf.py       # ETFPension + ETFPensionStatement + ContributionPlanStep + OneTimeInvestment
etf.py               # ETFMetadata
exchange_rate.py     # ExchangeRate
settings.py          # UserSettings
task.py              # BackgroundTask
update_tracking.py   # UpdateStatus
```

## Schemas (`app/schemas/`)

Pydantic-Schemas für Request/Response — 1 Datei pro Domain. Typisches Muster:
- `*Base` — gemeinsame Felder
- `*Create` — für POST-Requests
- `*Update` — für PUT-Requests
- `*Response` — für API-Antworten (enthält `id`, `created_at`, etc.)

## CRUD-Layer (`app/crud/`)

Datenbankoperationen pro Domain. Typische Methoden:
- `create(db, obj_in)` → neues Objekt
- `get(db, id)` → einzelnes Objekt
- `get_list(db, ...)` → Liste mit optionalem Filter
- `update(db, db_obj, obj_in)` → aktualisieren
- `delete(db, id)` → löschen
- `update_status(db, id, status_update)` → Status-Wechsel (pause/active)

## Services (`app/services/`)

- `etf_service.py` — ETF-Daten von YFinance, Preis-Updates, Validierung
- `exchange_rate.py` — Währungskonvertierung, ECB-Rate-Fetching
- `pension_savings_projection.py` — Projektionsberechnungen Sparprodukte
- `pension_state_projection.py` — Projektionsberechnungen staatliche Rente
- `yfinance.py` — YFinance-Integration

## Background Tasks (`app/tasks/`)

Celery-Tasks mit Retry-Logik:
- ETF-Preis-Updates
- Exchange-Rate-Updates (täglich von ECB)

Redis läuft auf Port 6379 (Celery-Broker + Result-Backend).

## Alembic Migrationen

```bash
cd src/backend
source venv/bin/activate

# Neue Migration autogenerieren (IMMER autogenerieren, nie manuell erstellen!)
alembic revision --autogenerate -m "kurze beschreibung"

# Generierte Datei in alembic/versions/ prüfen und ggf. anpassen

# Migration anwenden
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Neues Feature — Checkliste

1. [ ] SQLAlchemy-Model in `models/` erstellen
2. [ ] Pydantic-Schemas in `schemas/` definieren (Base/Create/Update/Response)
3. [ ] CRUD-Klasse in `crud/` implementieren
4. [ ] Endpoint in `api/v1/endpoints/` anlegen
5. [ ] Router in `api/v1/router.py` registrieren
6. [ ] Alembic-Migration autogenerieren + prüfen + anwenden
7. [ ] `app/db/base.py` updaten (Model-Import für Alembic-Discovery)

## FastAPI Konventionen

- `async def` für I/O-gebundene Operationen, `def` für synchrone
- Dependency Injection via `Depends(get_db)` für DB-Session
- `HTTPException` für erwartete Fehler (404, 422, etc.)
- Lifespan-Context-Manager statt deprecated `@app.on_event()`
- Kein Business-Logik in Endpoints — delegieren an CRUD/Services

## Bekannte Architektur-Schwächen (geplantes Refactoring)

Laut `docs/backend_refactoring_plan.md`:
- CRUD-Layer hat ~5.000 Zeilen mit Duplikation über 5 Pension-Typen
- `update_status()` und `sync_contribution_steps()` sind identisch in allen Typen → sollen in `crud/pension_helpers.py` extrahiert werden
- Business-Logik (Exchange-Rate-Conversion, Contribution-Date-Calc) sitzt teilweise im CRUD statt in Services
- `etf_service.py` (596 Zeilen) hat zu viele Verantwortlichkeiten
- Endpoints und Schemas sind stabil und werden nicht geändert
