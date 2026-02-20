# Svelte Frontend Overview

## Ziel und Scope
Dieses Dokument beschreibt die aktuelle SvelteKit-Frontend-Architektur in `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend`.
Es dient als schneller Einstieg, damit du bei Erweiterungen (insbesondere ETF-Plan) sofort weisst, wo welche Verantwortung liegt.

## Einstieg in 5 Minuten
1. Einstiegspunkt ist `src/routes/+layout.svelte`.
2. Fachseiten liegen unter `src/routes/**/+page.svelte`.
3. Initialdaten kommen pro Route aus `+page.ts` (SvelteKit `load`).
4. Backend-Zugriffe laufen ueber `src/lib/api/*.ts`.
5. Globale App-Zustaende liegen in `src/lib/stores/*.svelte.ts`.
6. Domaintypen sind in `src/lib/types/*.ts`.
7. Wiederverwendbare UI-Bausteine sind in `src/lib/components/**`.

## Top-Level Struktur
- `src/routes`: Route-UI und route-spezifische `load`-Funktionen.
- `src/lib/api`: HTTP-Client und API-Services pro Domain.
- `src/lib/stores`: Reaktive globale Stores (Settings, Theme, Toast, Pension-Liste).
- `src/lib/types`: Domain-Typen fuer Pension, Household, Settings, ETF.
- `src/lib/utils`: Reine Hilfslogik (Formatierung, Datumslogik, Projektionen).
- `src/lib/components`: UI-Komponenten nach Bereichen (`ui`, `layout`, `household`, `pension`, `settings`).
- `src/lib/paraglide` und `src/paraglide`: Generierte i18n-Dateien (nicht manuell pflegen).

## Laufzeitfluss
1. Route aufrufen:
   - SvelteKit ruft optional `+page.ts` auf.
2. Daten laden:
   - `create*Api(fetch)` nutzt server/route-spezifisches `fetch`.
3. Rendern:
   - `+page.svelte` bekommt `data` und rendert Bereichskomponenten.
4. Interaktion:
   - Komponenten triggern API-Aufrufe direkt oder ueber Stores.
5. Rueckmeldung:
   - Erfolg/Fehler via `toastStore`.
6. Sprache/Format:
   - `settingsStore` steuert Locale, Number/Currency-Format und i18n-Reload-Key.

## Architekturprinzipien im Projekt
- Shared UI zuerst: generische Bausteine in `lib/components/ui`.
- Domain-spezifisch wenn noetig: eigene Komponenten pro Pension-Typ.
- API-Typen zentral: Typdefinitionen in `lib/types`, Nutzung in Routes + Komponenten.
- Rechenlogik aus UI herausziehen: z. B. Projektion in `lib/utils/projection.ts`.
- Load-Pattern beibehalten: `+page.ts` liefert initiale Daten, UI verarbeitet nur Darstellung/Interaktionen.

## Relevante Hotspots fuer ETF-Ausbau
- Route New/Edit:
  - `src/routes/pension/etf/new/+page.svelte`
  - `src/routes/pension/etf/[id]/edit/+page.svelte`
- ETF-Komponenten:
  - `src/lib/components/pension/etf/BasicInformationCard.svelte`
  - `src/lib/components/pension/etf/ProjectionChart.svelte`
  - `src/lib/components/pension/etf/HistoricalPerformanceChart.svelte`
  - `src/lib/components/pension/etf/OneTimeInvestmentModal.svelte`
  - `src/lib/components/pension/etf/ETFSearchInput.svelte`
- Shared Beitraege/Projection:
  - `src/lib/components/pension/ContributionPlanCard.svelte`
  - `src/lib/utils/projection.ts`
- API:
  - `src/lib/api/pension.ts`
  - `src/lib/api/etf.ts`
- Typen:
  - `src/lib/types/pension.ts`
  - `src/lib/types/etf.ts`

## Wichtige Konventionen
- Jede Code-Datei im Svelte-Frontend hat jetzt einen einheitlichen Kopfkommentar (`File` + `Purpose`).
- `src/lib/paraglide/**` und `src/paraglide/**` gelten als generiert.
- Einstellungen fuer Locale/Waehrung immer ueber `settingsStore` beziehen.
- API-Calls in Load-Funktionen ueber `create*Api(fetch)` ausfuehren.
- API-Calls ausserhalb von Load-Funktionen ueber Singleton-Services (`*Api`).

## Aenderungsstrategie fuer neue Features
1. Typen in `lib/types` ergaenzen.
2. API-Methoden in `lib/api` erweitern.
3. Route-Load in `+page.ts` anpassen.
4. UI-Komponenten in `lib/components` anpassen/erganzen.
5. Falls bereichsuebergreifend: Shared-Komponente statt duplizierter Logik.
6. i18n-Keys in `messages/*.json` pflegen und Paraglide neu generieren.

## Do Not Edit
- `src/lib/paraglide/**`
- `src/paraglide/**`
- `node_modules/**`
- `.svelte-kit/**`

## Schnellnavigation
- Detaillierte Dateizuordnung: `/Users/axel/Coding/goldfinch-dev/docs/file-map.md`
- Migrationshistorie: `/Users/axel/Coding/goldfinch-dev/docs/svelte_migration_plan.md`
