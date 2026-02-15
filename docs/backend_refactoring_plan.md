# Goldfinch: Backend Refactoring Plan

## Context

Das Backend (FastAPI + SQLAlchemy + PostgreSQL + Celery/Redis) ist funktional und liefert korrekte Daten. Die API-Schicht und Schemas sind sauber designed. Allerdings hat der CRUD-Layer massive Duplikation (5.000+ Zeilen) und Business-Logik sitzt am falschen Ort. Dieses Refactoring hat **niedrigere Priorität als die Svelte-Migration** — das Backend funktioniert und kann iterativ verbessert werden.

---

## Was gut ist (nicht anfassen)

### API-Endpoints — Sauber
`src/backend/app/api/v1/endpoints/`

- Endpoints sind dünn und delegieren korrekt an CRUD/Services
- Saubere Dependency Injection (`Depends(get_db)`)
- Konsistente HTTP-Statuscodes und Response-Models
- Kein Business-Logik-Leak (mit kleinen Ausnahmen)

### Schemas — Sauber
`src/backend/app/schemas/`

- Klare Request/Response-Trennung
- Konsistente Pydantic-Modelle
- Gut organisiert (1 Datei pro Domain)

### Database Setup — Sauber
`src/backend/app/db/`

- Einfaches, korrektes SQLAlchemy-Setup
- Session-Management mit Context-Manager
- Alembic-Migrations korrekt konfiguriert

### Models — Solide Basis
`src/backend/app/models/`

- Gut strukturierte SQLAlchemy-Modelle
- Saubere Relationships und Cascades
- Gute Enum-Definitionen
- Problem: Duplikation über Pension-Typen (aber weniger schlimm als im CRUD)

### Tasks — Funktional
`src/backend/app/tasks/`

- Celery-Tasks mit Retry-Logik
- Korrekte Session-Verwaltung
- Exchange-Rate und ETF-Updates funktionieren zuverlässig

### Config & Logging — Sauber
`src/backend/app/core/`

- pydantic_settings mit .env Support
- Zentralisierte Konfiguration
- Einfaches, funktionales Logging

---

## Was refactored werden muss

### Problem 1: CRUD — Geteilte Helper extrahieren (Hoch)
`src/backend/app/crud/`

**Status:** 5.000+ Zeilen über 5 CRUD-Dateien

Die detaillierte Analyse zeigt: Die 5 Pension-Typen haben **grundlegend verschiedene** `create()`, `update()` und `get_list()` Implementierungen — verschiedene verschachtelte Objekte, verschiedene Queries, verschiedene Business-Logik. Ein generischer `PensionCRUDBase` würde mehr Komplexität schaffen als er löst.

**Was wirklich identisch ist (und extrahiert werden kann):**

| Methode/Logik | Identisch in | Extrahieren als |
|---------------|-------------|-----------------|
| `update_status()` | Alle 5 Typen | Shared Helper in `crud/pension_helpers.py` |
| `_sync_contribution_steps()` | ETF, Company, Insurance, Savings | Shared Helper |
| Contribution Step CRUD (create/update/delete) | 4 von 5 Typen | Shared Helper |

**Was typ-spezifisch bleibt (und warum):**

| Methode | Warum verschieden |
|---------|------------------|
| `create()` | ETF erstellt History + berechnet Units, Insurance erstellt Benefits + Statements mit Projections, Company hat einfache Steps, State hat keine Steps |
| `get_list()` | ETF: 3-Query-Optimierung mit ETF-Joins, Company: 4 Queries mit Retirement-Projections, jeder Typ braucht andere Daten |
| Statement-Handling | ETF hat keine, Insurance hat Projections + Benefits, Company hat Retirement-Projections, State/Savings haben einfache Wert-Statements |

**Betroffene Dateien:**
- `crud/pension_etf.py` (~550 Zeilen)
- `crud/pension_insurance.py` (~400 Zeilen)
- `crud/pension_company.py` (~400 Zeilen)
- `crud/pension_state.py` (~350 Zeilen)
- `crud/pension_savings.py` (~350 Zeilen)

**Lösung:** Shared Helper-Funktionen extrahieren für die identischen Teile. CRUD-Klassen bleiben typ-spezifisch.

```python
# crud/pension_helpers.py — Geteilte Helper

def update_pension_status(db: Session, pension, status_update):
    """Identisch für alle 5 Pension-Typen."""
    pension.status = status_update.status
    if status_update.status == PensionStatus.PAUSED:
        pension.paused_at = status_update.paused_at
    elif status_update.status == PensionStatus.ACTIVE:
        pension.resume_at = None
        pension.paused_at = None
    db.add(pension)
    db.commit()
    return pension

def sync_contribution_steps(db: Session, pension, steps, step_model):
    """Identisch für ETF, Company, Insurance, Savings."""
    existing = {s.id: s for s in pension.contribution_plan_steps}
    # Create/Update/Delete Logik...
```

### Problem 2: Business-Logik im CRUD (Hoch)

Mehrere CRUD-Dateien enthalten Logik, die in Services gehört:

| Logik | Aktuell in | Gehört in |
|-------|-----------|-----------|
| Exchange Rate Conversion | `crud/etf.py` (`_convert_to_eur`) | `services/exchange_rate.py` |
| Contribution Date Calculation | `crud/pension_etf.py` | `services/contribution.py` |
| Statement-Projektionen | Mehrere CRUD-Dateien | `services/projection.py` |
| Historical Contributions | `crud/pension_etf.py` (`realize_historical_contributions`) | `services/contribution.py` |

### Problem 3: ETF Service aufteilen (Mittel)
`src/backend/app/services/etf_service.py` — 596 Zeilen

Enthält zu viele Verantwortlichkeiten:
- ETF-Daten von YFinance holen
- Preise aktualisieren
- Exchange Rate Conversions
- Validierung (Asset-Klassen, Prozente)
- Info-Extraktion

**Lösung:** Aufteilen in:
- `services/etf_data.py` — YFinance-Integration, Preise holen
- `services/etf_validation.py` — Validierung und Info-Extraktion
- Exchange Rate Logik → `services/exchange_rate.py` (existiert teilweise)

### Problem 4: Exchange Rate Duplikation (Mittel)

Exchange Rate Conversion ist an 2 Stellen implementiert:
- `crud/etf.py` — `_convert_to_eur()` Methode
- `services/etf_service.py` — `_convert_field_to_eur()`

**Lösung:** Eine einzige `services/exchange_rate.py` mit einer `convert()` Funktion.

### Problem 5: Ungenutzte Models (Niedrig)
- `PensionInsuranceBenefit` — im Schema definiert aber nie verwendet
- Entweder implementieren oder aus dem Schema entfernen

---

## Refactoring-Phasen

### Phase 1: Shared CRUD-Helper extrahieren (~3-4 Tage)

1. `crud/pension_helpers.py` erstellen mit:
   - `update_pension_status()` — aus allen 5 CRUD-Dateien extrahieren
   - `sync_contribution_steps()` — aus 4 CRUD-Dateien extrahieren
2. Jeden Pension-CRUD umstellen (einer nach dem anderen, Tests nach jedem)
3. CRUD-Klassen bleiben eigenständig — nur die identischen Teile werden zu Aufrufen des Helpers

**Erwartetes Ergebnis:** ~500-800 Zeilen weniger Code, deutlich weniger Wartungsaufwand für identische Logik

### Phase 2: Service-Layer aufbauen (~3-4 Tage)

1. `services/exchange_rate.py` — deduplizierte Conversion-Logik
2. `services/contribution.py` — Date Calculation + History
3. `services/projection.py` — Statement-Projektionen (wenn nicht schon vorhanden)
4. Business-Logik aus CRUD in Services verschieben
5. CRUD ruft Services auf, nicht umgekehrt

### Phase 3: ETF Service aufteilen (~2 Tage)

1. `services/etf_data.py` — YFinance-Integration
2. `services/etf_validation.py` — Validierung
3. Exchange Rate Logik → `services/exchange_rate.py`
4. Alten `etf_service.py` entfernen

### Phase 4: Cleanup (~1 Tag)

1. Ungenutzte Models entfernen oder implementieren
2. Recursion-Prevention-Hacks in `pension_company.py` sauber lösen
3. Konsistente Error-Handling-Patterns in allen CRUD-Dateien

---

## Betroffene Dateien

**Neue Dateien:**
- `crud/pension_helpers.py` — Geteilte Helper (update_status, sync_steps)
- `services/contribution.py` — Contribution-Logik
- `services/etf_data.py` — YFinance-Integration
- `services/etf_validation.py` — ETF-Validierung

**Geändert (nutzen neue Helper):**
- `crud/pension_etf.py` — update_status + sync_steps durch Helper ersetzen
- `crud/pension_insurance.py` — update_status + sync_steps durch Helper ersetzen
- `crud/pension_company.py` — update_status + sync_steps durch Helper ersetzen
- `crud/pension_state.py` — update_status durch Helper ersetzen
- `crud/pension_savings.py` — update_status + sync_steps durch Helper ersetzen
- `services/etf_service.py` — aufteilen und entfernen
- `services/exchange_rate.py` — erweitern

**Nicht geändert:**
- `api/v1/endpoints/` — Endpoints bleiben stabil
- `schemas/` — Schemas bleiben stabil
- `models/` — Models bleiben stabil
- `db/` — DB-Setup bleibt stabil
- `tasks/` — Tasks bleiben stabil (nutzen Services)

---

## Verifikation

Nach jeder Phase:
1. `cd src/backend && python -m pytest` — alle Tests müssen grün sein
2. Backend starten und API manuell testen (Health, CRUD-Flows)
3. `curl` Tests gegen alle Pension-Endpoints
4. Celery-Tasks starten und prüfen, dass ETF/Exchange-Rate-Updates laufen

---

## Zeitplanung

| Phase | Aufwand | Priorität |
|-------|---------|-----------|
| Phase 1: Shared CRUD-Helper | ~3-4 Tage | Hoch |
| Phase 2: Service-Layer | ~3-4 Tage | Hoch |
| Phase 3: ETF Service aufteilen | ~2 Tage | Mittel |
| Phase 4: Cleanup | ~1 Tag | Niedrig |
| **Gesamt** | **~2 Wochen** | |

**Empfehlung:** Dieses Refactoring nach oder parallel zur Svelte-Migration durchführen. Das Backend funktioniert — die API-Contracts ändern sich nicht.
