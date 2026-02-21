# Phase 2: ETF-Flow vereinfachen

## 1. Ziel und Abgrenzung
Der ETF-Erstellungsflow wird fuer den Nutzer klarer, und die Retry-Logik wird auf ein fuer ein Hobby-Projekt sinnvolles Mass reduziert.

Ziele:
1. 2-Stufen-Flow fuer ETF-Erstellung (Methode waehlen → relevante Felder).
2. Retry-Strategie von 20 auf 3 bis 5 Versuche reduzieren.
3. UI zeigt klar an, was synchron/asynchron laeuft.

Unveraendert bleiben:
1. Alle drei Initialisierungsmethoden (`new`, `existing`, `historical`).
2. ETF-Statistik- und Chart-Darstellungen.
3. Kern-Pensionmodelle und API-Contracts.

## 2. Betroffene Dateien
Frontend:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/etf/new/+page.svelte`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/etf/BasicInformationCard.svelte`

Backend:
1. `/Users/axel/Coding/goldfinch-dev/src/backend/app/tasks/etf_pension.py`

## 3. Exakte Aenderungen

### Frontend: 2-Stufen-Erstellungsflow
Schritt 1: Initialisierungsmethode waehlen (`new` / `existing` / `historical`).
Schritt 2: Nur die fuer diese Methode relevanten Felder zeigen.

UI-Hinweise verbessern:
- welcher Schritt gerade laeuft,
- was asynchron passiert (Hintergrundverarbeitung),
- wann man erneut ausloesen kann.

### Backend: Retry reduzieren
In `etf_pension.py`:
- Maximale Retry-Anzahl von 20 auf 3 bis 5 reduzieren.
- Klarer Endstatus nach Erschoepfung der Versuche (`FAILED` mit nachvollziehbarem Fehlertext).
- Backoff-Strategie kann einfacher werden (z. B. fixe 60 Sek. statt exponentiell).

## 4. Was bewusst nicht geaendert wird
1. Keine Entfernung der Methoden `new`, `existing`, `historical`.
2. Keine Aenderung der ETF-Statistikdarstellungen oder Charts.
3. Keine Aenderung der Backend-API-Contracts.
4. `/realize-historical` Endpoint existiert bereits — kein neuer Endpoint noetig.

## 5. Testplan
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

Manuell:
1. ETF erstellen mit Methode `new` — 2-Stufen-Flow laeuft durch.
2. ETF erstellen mit Methode `existing` — nur relevante Felder sichtbar.
3. ETF erstellen mit Methode `historical` — asynchroner Status klar sichtbar.
4. Retry-Erschoepfung endet mit klarem `FAILED`-Status, keine Endlosschleife.

## 6. Akzeptanzkriterien
1. Alle drei Methoden bleiben funktional.
2. Nutzer sieht klar, welche Schritte synchron/asynchron sind.
3. Retry endet nach maximal 5 Versuchen mit eindeutigem Status.
4. Keine Breaking Changes.

## 7. Rollback-Plan
1. Frontend auf alten ETF-Erstellungsflow zuruecksetzen (Git-Revert).
2. `etf_pension.py` Retry-Wert auf alten Stand zuruecksetzen.

## 8. Zeitrahmen
Schaetzung: 2 bis 3 Arbeitstage.

Reihenfolge:
1. Backend: Retry-Reduktion.
2. Frontend: 2-Stufen-Flow.
3. Frontend: UI-Hinweise fuer asynchrone Schritte.
4. E2E-Szenarien fuer die drei Methoden.

## 9. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Alle drei Methoden verifiziert sind,
2. Retry endet sauber (kein Endlos-Loop, klarer Status),
3. Phase-2-Abschluss inkl. Commit-Referenz in `99_ABSCHLUSS.md` dokumentiert ist.
