# Phase 5: Svelte-Standardisierung, Legacy-Abbau und Cleanup

## 1. Ziel und Abgrenzung
Diese Phase setzt Svelte final als Standard und reduziert verbleibende Altlasten.

Ziele:
1. Svelte-Frontend ist der klare Standardpfad.
2. Legacy-React/Next wird in den Wartungs- oder Entfernungsmodus ueberfuehrt.
3. Abhaengigkeiten und Dokumentation werden auf den neuen Soll-Zustand bereinigt.
4. Offene Tech-Debt wird sauber als Nachfolge-Arbeit dokumentiert.

Abgrenzung:
1. Kein gleichzeitiger neuer Feature-Grossausbau.
2. Keine riskanten Big-Bang-Loeschungen ohne Absicherung.

## 2. Betroffene Dateien (absolute Pfade)
Frontend-Struktur:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/**`
2. `/Users/axel/Coding/goldfinch-dev/app/**` (Legacy)
3. `/Users/axel/Coding/goldfinch-dev/src/frontend/**` (Legacy)

Build/Dependencies:
1. `/Users/axel/Coding/goldfinch-dev/package.json`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/package.json`
3. `/Users/axel/Coding/goldfinch-dev/package-lock.json`
4. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/package-lock.json`

Doku:
1. `/Users/axel/Coding/goldfinch-dev/README.md`
2. `/Users/axel/Coding/goldfinch-dev/PROGRESS.md`
3. `/Users/axel/Coding/goldfinch-dev/docs/frontend-overview.md`
4. `/Users/axel/Coding/goldfinch-dev/docs/svelte_migration_plan.md`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
1. Svelte als primaerer Entwicklungs- und Startpfad festschreiben.
2. Legacy-Pfade:
   - entweder in "archive"/"legacy" verschieben,
   - oder schrittweise entfernen, sobald abgesichert.
3. Build- und Dev-Skripte vereinheitlichen.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`:
   - harmonisierte APIs aus vorherigen Phasen.
2. `harmonisiert`:
   - keine neuen grossen API-Aenderungen; Fokus auf Konsolidierung.
3. `deprecated-intern`:
   - verbleibende interne Legacy-Aufrufer, die nicht mehr Svelte-konform sind.

### Datenmodell
1. Keine neue inhaltliche DB-Aenderung als Pflicht.
2. Nur Abschluss bestehender additiver Migrationen aus frueheren Phasen.

### Doku
1. Alle Hauptdokumente auf Svelte-Standard aktualisieren.
2. Veraltete Plan-Dokumente als "historisch" markieren oder archivieren.
3. Abschlussstatus in `99_ABSCHLUSS.md` finalisieren.

## 4. Was bewusst nicht geaendert wird
1. Keine ungesicherte Loeschung produktiv relevanter Routen.
2. Kein Entfernen aktiver API-Endpunkte ohne Deprecation-Regel.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Legacy bleibt waehrend der Cutover-Pruefung erreichbar.
2. Umschaltung in kontrollierten Schritten.
3. Erst nach erfolgreicher Verifikation wird Legacy final entfernt oder dauerhaft archiviert.

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

Smoke:
1. Hauptnavigation und Kernflows in Svelte.
2. Build-/Startpfad fuer den Standard-Frontend-Stack.
3. Keine Verweise mehr auf veraltete Primarpfade in README/PROGRESS.

## 7. Akzeptanzkriterien
1. Svelte ist technisch und dokumentativ der Standard.
2. Legacy ist entweder klar archiviert oder entfernt.
3. Abhaengigkeiten sind bereinigt und konsistent.
4. Abschlussdokument ist vollstaendig.

## 8. Rollback-Plan
1. Legacy-Pfade bis zur finalen Loeschentscheidung rueckschaltbar halten.
2. Skript- und Doku-Aenderungen per Git-Revert rueckholbar.
3. Keine irreversible DB-Migration in dieser Phase.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 3 bis 5 Arbeitstage.

Reihenfolge:
1. Doku-Sollzustand.
2. Skript- und Dependency-Konsolidierung.
3. Legacy-Archivierung/Entfernung.
4. Finaler Smoke-Test.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Svelte als Standard verifiziert ist,
2. Legacy-Zustand eindeutig geklaert ist,
3. Abschluss inklusive Commit-Referenz in `99_ABSCHLUSS.md` steht.
