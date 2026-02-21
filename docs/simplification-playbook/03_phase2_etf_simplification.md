# Phase 2: ETF-Vereinfachung bei Erhalt der Initialisierungsmethoden

## 1. Ziel und Abgrenzung
Die ETF-Fachlichkeit bleibt erhalten, aber der Ablauf wird fuer ein Hobby-Projekt deutlich leichter betreibbar.

Ziele:
1. Drei Initialisierungsmethoden bleiben: `new`, `existing`, `historical`.
2. UI-Flow klarer machen und Overload vermeiden.
3. Schwere Hintergrundkette beim Erstellen entkoppeln.
4. Retry-Strategie im ETF-Kontext auf robustes Minimum bringen.

Abgrenzung:
1. Keine Entfernung der ETF-Initialisierungsmethoden.
2. Keine komplette Neuimplementierung der ETF-Bewertungslogik.
3. Keine API-Breaks.

## 2. Betroffene Dateien (absolute Pfade)
Frontend ETF:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/etf/new/+page.svelte`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/etf/[id]/edit/+page.svelte`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/etf/BasicInformationCard.svelte`
4. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/etf/ProjectionChart.svelte`
5. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/etf/HistoricalPerformanceChart.svelte`
6. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/etf/OneTimeInvestmentModal.svelte`

Backend ETF:
1. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension/etf.py`
2. `/Users/axel/Coding/goldfinch-dev/src/backend/app/tasks/etf_pension.py`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/crud/pension_etf.py`
4. `/Users/axel/Coding/goldfinch-dev/src/backend/app/models/task.py`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
1. ETF-New-Flow als 2-Stufen-Flow gestalten:
   - Schritt 1: Initialisierungsmethode,
   - Schritt 2: nur relevante Felder.
2. `historical` explizit als nachgelagerte Aktion erlauben:
   - Erstellen ohne sofortige Vollkette,
   - manuell ausloesbarer Realisierungslauf.
3. Retry-Strategie in `etf_pension.py` vereinfachen:
   - begrenzte Anzahl,
   - klarer Endstatus,
   - nachvollziehbare Fehlertexte.
4. UI-Hinweise verbessern:
   - welcher Schritt laeuft,
   - was asynchron ist,
   - wann man erneut ausloesen kann.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`:
   - create/get/update/delete ETF-Pension,
   - Statistik-Endpunkte,
   - One-time-Investment.
2. `harmonisiert`:
   - optionaler expliziter Trigger fuer historische Realisierung, falls noch nicht vorhanden.
3. `deprecated-intern`:
   - implizite Kettenstart-Logik beim Create ohne expliziten Nutzerkontext.

### Datenmodell
1. Keine zwingende Migration fuer Methodenerhalt.
2. Falls noetig: nur additive Task-Status-Felder, keine breaking Schemaaenderung.

### Doku
1. Nutzerfluss je Initialisierungsmethode in kurzer Tabelle.
2. Hintergrundverhalten und Retry-Regeln dokumentieren.

## 4. Was bewusst nicht geaendert wird
1. Keine Entfernung der Methoden `new`, `existing`, `historical`.
2. Keine Loeschung von ETF-Statistikdarstellungen.
3. Keine Aenderung der Kern-Pensionmodelle.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Bestehende Create-Payloads bleiben gueltig.
2. Neue explizite Trigger sind additiv.
3. Alte interne Triggerpfade bleiben temporaer nutzbar, bis Umstellung komplett ist.

## 6. Testplan mit konkreten Befehlen
Svelte:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Backend:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

ETF-Szenarien:
1. Create/Edit fuer `new`.
2. Create/Edit fuer `existing`.
3. Create/Edit fuer `historical`.
4. Ausfuehrung und Wiederanlauf von asynchronen Schritten ohne Duplikate.

## 7. Akzeptanzkriterien
1. Alle drei Methoden bleiben funktional.
2. Nutzer sieht klar, welche Schritte synchron/asynchron sind.
3. Retry-Strategie produziert keine unendlichen oder intransparenten Schleifen.
4. Keine Breaking Changes.

## 8. Rollback-Plan
1. UI auf alten ETF-Flow zuruecksetzen.
2. Neue Trigger- und Retry-Logik auf bisherigen Task-Pfad zurueckschalten.
3. Additive Felder bleiben unkritisch, keine harte DB-Rueckmigration noetig.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 4 bis 6 Arbeitstage.

Reihenfolge:
1. UI-Flow vereinfachen.
2. Task- und Retry-Entkopplung.
3. API-Harmonisierung.
4. E2E-Szenarien fuer die drei Methoden.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. alle drei Initialisierungsmethoden verifiziert sind,
2. asynchrone ETF-Ablaufe nachvollziehbar und stabil sind,
3. Phase-2-Abschluss inkl. Commit-Referenz in `99_ABSCHLUSS.md` dokumentiert ist.
