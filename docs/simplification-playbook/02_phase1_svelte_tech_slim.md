# Phase 1: Svelte technisch entschlacken

## 1. Ziel und Abgrenzung
Ziel ist eine deutlich wartbarere Svelte-Codebasis durch Deduplizierung und klarere Trennung von UI, Mappern und API-Client-Schichten.

Ziele:
1. Statement-UI-Muster vereinheitlichen.
2. Prozent-/Dezimal-Mapping zentralisieren.
3. Grosse Edit-Seiten in kleinere Module schneiden.
4. Monolithischen Pension-API-Client aufteilen.

Abgrenzung:
1. Keine funktionale Neudefinition der Domainenlogik.
2. Keine API-Breaks.
3. Kein visueller Redesign-Schwerpunkt.

## 2. Betroffene Dateien (absolute Pfade)
Statement-Komponenten:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/state/StatementsCard.svelte`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/savings/StatementsCard.svelte`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/company/StatementsCard.svelte`
4. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/pension/insurance/StatementsCard.svelte`

Edit-Seiten:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/etf/[id]/edit/+page.svelte`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/insurance/[id]/edit/+page.svelte`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/company/[id]/edit/+page.svelte`
4. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/savings/[id]/edit/+page.svelte`
5. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/pension/state/[id]/edit/+page.svelte`

API/Mapper:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/api/pension.ts`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/types/pension.ts`
3. neue Mapper-Dateien unter `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/mappers/`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
1. Gemeinsame Statement-Shell einfuehren (latest/previous/collapse/add/delete-dialog).
2. Typspezifische Teile als gerenderte Slots oder Unterkomponenten belassen.
3. Mapper-Schicht einfuehren fuer:
   - API Prozentwerte -> Form Dezimalwerte,
   - Form Dezimalwerte -> API Prozentwerte,
   - optionales Statement-Splitting (inline vs. separate Endpunkte).
4. Edit-Seiten aufteilen in:
   - `form-state` Modul,
   - `submit` Modul,
   - `view` Modul.
5. `pension.ts` API-Client in Domain-Teile splitten, z. B.:
   - `pension-core` (CRUD, status),
   - `pension-statements`,
   - `pension-etf-specials`,
   - `pension-projections`.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`:
   - alle bestehenden `/api/v1/pension/*` CRUD-Endpunkte,
   - `/api/v1/pension-summaries/*`.
2. `harmonisiert`:
   - interne Frontend-Nutzung der Endpunkte wird einheitlich ueber neue API-Module gefuehrt.
3. `deprecated-intern`:
   - direkte breit gestreute Nutzung von `pensionApi` als Mega-Fassade.

### Datenmodell
1. Keine Migration.
2. Keine DB-Aenderung.

### Doku
1. Kurzleitfaden fuer neue Mapper- und API-Modulstruktur.
2. Datei-Mapping um neue Module ergaenzen.

## 4. Was bewusst nicht geaendert wird
1. Kein Endpoint wird entfernt.
2. Kein bestehender Payload-Contract wird gebrochen.
3. Keine Neudefinition der fachlichen Aussagen in den Formularen.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Neue API-Module zuerst parallel einfuehren.
2. Alte Zugriffe schrittweise umstellen.
3. Nach kompletter Umstellung alte interne Utility-Wege als deprecated-intern markieren.

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

Manuell:
1. Edit und Save fuer alle 5 Pension-Typen.
2. Statement Add/Edit/Delete fuer State, Savings, Company, Insurance.
3. Prozent-Felder in Insurance und Savings pruefen (Roundtrip korrekt).

## 7. Akzeptanzkriterien
1. Statement-Shell ist technisch wiederverwendet.
2. Prozent-/Dezimal-Mapping ist zentralisiert.
3. Grosse Edit-Seiten sind klar in Module geschnitten.
4. Keine Regression in bestehenden CRUD-Flows.

## 8. Rollback-Plan
1. Neue Statement-Shell ausbauen und auf alte Komponenten zurueckschwenken.
2. Mapper-Einbindung je Route rueckgaengig machen.
3. API-Modulsplit rueckbauen auf alte `pensionApi`-Nutzung.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 5 bis 7 Arbeitstage.

Reihenfolge:
1. Mapper-Layer.
2. API-Modulsplit.
3. Statement-Shell.
4. Edit-Seiten-Aufteilung.
5. Regressionstest.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. alle Akzeptanzkriterien erfuellt sind,
2. Testresultate dokumentiert sind,
3. `99_ABSCHLUSS.md` einen abgeschlossenen Phase-1-Eintrag inkl. Commit-Referenz enthaelt.
