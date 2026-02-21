# Phase 4: Backend-Tasks und Konsistenz ueber alle Pension-Typen

## 1. Ziel und Abgrenzung
Diese Phase reduziert operative Komplexitaet im Backend und bringt Endpunkt- sowie Statusverhalten auf eine konsistente Basis.

Ziele:
1. Task-Minimalbetrieb statt breit verteilter Automatismen.
2. Startup- und Beat-Orchestrierung verschlanken.
3. Tracking-Strukturen klar trennen und konsolidieren.
4. Status- und Statement-Endpunkte ueber alle Pension-Typen angleichen.

Abgrenzung:
1. Kein kompletter Ersatz von Celery.
2. Keine grossflaechige Domain-Neuarchitektur.
3. Keine Breaking Changes.

## 2. Betroffene Dateien (absolute Pfade)
Task/Orchestrierung:
1. `/Users/axel/Coding/goldfinch-dev/src/backend/app/core/celery_app.py`
2. `/Users/axel/Coding/goldfinch-dev/src/backend/app/core/startup.py`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/tasks/exchange_rates.py`
4. `/Users/axel/Coding/goldfinch-dev/src/backend/app/tasks/etf.py`
5. `/Users/axel/Coding/goldfinch-dev/src/backend/app/tasks/etf_pension.py`

Tracking/Modelle:
1. `/Users/axel/Coding/goldfinch-dev/src/backend/app/models/task.py`
2. `/Users/axel/Coding/goldfinch-dev/src/backend/app/models/update_tracking.py`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/models/pension_insurance.py`
4. `/Users/axel/Coding/goldfinch-dev/src/backend/alembic/versions/*` (additive Migration falls noetig)

Endpoints/CRUD/Schemas:
1. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/insurance.py`
2. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/savings.py`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/state.py`
4. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/company.py`
5. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/etf.py`
6. `/Users/axel/Coding/goldfinch-dev/src/backend/app/crud/pension_*.py`
7. `/Users/axel/Coding/goldfinch-dev/src/backend/app/schemas/pension_*.py`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
1. Periodische Jobs auf essentielle Menge begrenzen:
   - taegliche Exchange-Rate-Aktualisierung,
   - notwendige Cleanup-Jobs.
2. Startup-Checks reduzieren:
   - keine breit gestreuten Catch-up-Ketten ohne klare Business-Notwendigkeit.
3. ETF-Pension-Retry- und Task-Flows konsolidieren:
   - ein klarer Statusfluss,
   - begrenzte und nachvollziehbare Wiederholungen.
4. Endpunktkonsistenz:
   - Statement-Delete-Routen je Typ einheitlich,
   - Status-Update-Payloads je Typ konsistent typisiert.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`:
   - bestehende CRUD-Endpunkte aller Pension-Typen.
2. `harmonisiert`:
   - Statement-Endpunktformen (insbesondere Delete-Pattern),
   - Status-Update-Bodies und Rueckgaben.
3. `deprecated-intern`:
   - uneinheitliche Altpfade, die intern nicht mehr genutzt werden.

### Datenmodell
1. Additive Konsistenz fuer Statusfelder:
   - `paused_at` und `resume_at` fuer Insurance analog zu den anderen Typen.
2. Keine destruktive Migration.
3. Tracking-Tabellen nur additiv anpassen oder interne Nutzung vereinheitlichen.

### Doku
1. Task-Landschaft dokumentieren: "periodisch" vs. "on-demand".
2. Endpoint-Matrix je Pension-Typ mit konsistenten Mustern.
3. Betriebsnotiz fuer Minimalbetrieb und Failure-Handling.

## 4. Was bewusst nicht geaendert wird
1. Celery bleibt als Mechanismus bestehen.
2. Keine vollstaendige Ersetzung aller Tracking-Objekte in einem Schritt.
3. Keine Entfernung historischer Endpunkte ohne Deprecation-Phase.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Harmonisierung additiv einfuehren.
2. Alte Pfade weiterhin erreichbar lassen.
3. Interne Clients auf harmonisierte Pfade migrieren.
4. Erst nach stabiler Nutzung als deprecated-intern markieren.

## 6. Testplan mit konkreten Befehlen
Backend:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

Svelte-Schnittstellencheck:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Task-Szenarien:
1. nur essentielle periodische Jobs aktiv.
2. on-demand Flows idempotent.
3. Retry endet mit klarem finalem Status.

API-Szenarien:
1. Status-Update fuer ETF/Company/Insurance/State/Savings konsistent.
2. Statement Delete/Update pro Typ konsistent aufrufbar.

## 7. Akzeptanzkriterien
1. Task-Minimalbetrieb ist umgesetzt und dokumentiert.
2. Startup-Orchestrierung ist nachvollziehbar reduziert.
3. Status- und Statement-Endpunkte sind im Verhalten vereinheitlicht.
4. Keine Breaking Changes fuer bestehende Clients.

## 8. Rollback-Plan
1. Beat-Schedule auf vorherigen Stand zuruecksetzen.
2. Harmonisierte Endpunktnutzung intern auf Altpfade zurueckschalten.
3. Additive Schemaerweiterungen bleiben kompatibel, auch bei teilweisem Rollback.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 5 bis 7 Arbeitstage.

Reihenfolge:
1. Task-Minimalbetrieb und Startup-Reduktion.
2. Endpunkt-Harmonisierung.
3. Additive Status-Konsistenz im Modell.
4. Regressionstest und Betriebsdoku.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Task-Minimalbetrieb verifiziert ist,
2. API-Konsistenz nachgewiesen ist,
3. alle Akzeptanzkriterien erfuellt sind,
4. Abschluss inkl. Commit-Referenz in `99_ABSCHLUSS.md` dokumentiert wurde.
