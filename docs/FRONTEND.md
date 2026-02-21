# Frontend-Referenz (SvelteKit / Svelte 5)

Basis-Pfad: `src/svelte-frontend/src/`

## Routing-Struktur

```
routes/
  +layout.svelte               # App-Shell: Sidebar, Dokumentsprache, globales Layout
  +page.svelte                 # Dashboard
  compass/+page.svelte         # Rentenluecken-Analyse (in Entwicklung)
  household/
    +page.svelte               # Haushaltsverwaltung
    +page.ts                   # Laedt Haushaltsmitglieder
  pension/
    +page.svelte               # Pensionsübersicht (Liste aller Pensions)
    +page.ts                   # Laedt Pensionsliste
    state/new/                 # Neue staatliche Rente anlegen
    state/[id]/edit/           # Staatliche Rente bearbeiten
    company/new/               # Neue betriebliche Rente anlegen
    company/[id]/edit/         # Betriebliche Rente bearbeiten
    savings/new/               # Neues Sparprodukt anlegen
    savings/[id]/edit/         # Sparprodukt bearbeiten
    insurance/new/             # Neue Rentenversicherung anlegen
    insurance/[id]/edit/       # Rentenversicherung bearbeiten
    etf/new/                   # Neuen ETF-Sparplan anlegen
    etf/[id]/edit/             # ETF-Sparplan bearbeiten
  payout-strategy/+page.svelte # Auszahlungsstrategie (in Entwicklung)
  settings/+page.svelte        # Einstellungen (Locale, Währung, Raten, Theme)
```

Jede Route hat ein `+page.svelte` (UI) und meist ein `+page.ts` (Datenladen via `load()`).

## Komponenten (`lib/components/`)

### UI (shared, domain-agnostisch)
- `ui/Card.svelte` — Basis-Karten-Container
- `ui/PageHeader.svelte` — Einheitlicher Seitenkopf mit Titel/Beschreibung
- `ui/ContentSection.svelte` — Haupt/Aside-Layout für Seiteninhalt
- `ui/CurrencyInput.svelte` — Währungs-Eingabefeld (locale-aware)
- `ui/NumberInput.svelte` — Zahlen-Eingabefeld
- `ui/PercentInput.svelte` — Prozent-Eingabefeld (arbeitet intern mit Dezimal: 0.02 = 2%)
- `ui/FormattedCurrency.svelte` — Formatierte Währungsanzeige
- `ui/FormattedDate.svelte` — Formatiertes Datum
- `ui/FormattedPercent.svelte` — Formatierter Prozentwert
- `ui/ConfirmDeleteDialog.svelte` — Wiederverwendbarer Lösch-Dialog
- `ui/ToastViewport.svelte` — Toast-Anzeige (konsumiert toastStore)
- `ui/Explanation.svelte` + `ExplanationAlert/List/ListItem/Stat/Stats.svelte` — Hilfe-/Erklärungsbausteine

### Layout
- `layout/Sidebar.svelte` — Hauptnavigation
- `layout/ThemeToggle.svelte` — Light/Dark/System-Umschalter

### Household
- `household/MemberCard.svelte` — Haushaltsmitglied-Karte
- `household/MemberForm.svelte` — Formular für Mitglied-Daten
- `household/MemberModal.svelte` — Dialog zum Erstellen/Bearbeiten

### Pension (shared)
- `pension/PensionCard.svelte` — Pension-Übersichtskarte
- `pension/PensionTypeSelectionModal.svelte` — Typ-Auswahl beim Anlegen
- `pension/PensionStatusActions.svelte` — Pause/Fortsetzen mit Datumsauswahl
- `pension/ContributionPlanCard.svelte` — Beitragsplan-Editor
- `pension/ContributionHistoryTable.svelte` — Beitragshistorie-Tabelle

### Pension (typ-spezifisch)
- `pension/state/BasicInformationCard.svelte` — Stammdaten staatliche Rente
- `pension/state/ScenarioViewer.svelte` — Szenariovergleich
- `pension/state/StatementsCard.svelte` — Jahresauszüge
- `pension/company/BasicInformationCard.svelte` — Stammdaten betriebliche Rente
- `pension/company/StatementsCard.svelte`
- `pension/savings/BasicInformationCard.svelte`
- `pension/savings/InterestRatesCard.svelte` — Zinssatz-Verwaltung
- `pension/savings/StatementsCard.svelte`
- `pension/insurance/BasicInformationCard.svelte`
- `pension/insurance/StatementsCard.svelte`
- `pension/etf/BasicInformationCard.svelte`
- `pension/etf/ETFSearchInput.svelte` — ETF-Suche mit Autocomplete
- `pension/etf/HistoricalPerformanceChart.svelte` — LayerChart-Diagramm
- `pension/etf/ProjectionChart.svelte` — Szenario-Projektionsdiagramm
- `pension/etf/OneTimeInvestmentModal.svelte` — Einmalinvestment-Dialog

### Settings
- `settings/ScenarioRatesGrid.svelte` — Raten für pessimistisch/realistisch/optimistisch
- `settings/RateInput.svelte` — Einzelne Raten-Eingabe
- `settings/NumberFormatPreview.svelte` — Vorschau Zahlenformat
- `settings/ProjectionPreview.svelte` — Vorschau Projektionsraten

## API-Layer (`lib/api/`)

- `client.ts` — Generischer HTTP-Client mit Fehlerbehandlung und JSON-Handling
- `pension.ts` — Alle 5 Pension-Typen, Status-Wechsel, Beitragsplan-Endpoints
- `etf.ts` — ETF-Suche und Metadaten
- `household.ts` — Haushaltsmitglieder CRUD, Form-zu-Backend-Mapping
- `settings.ts` — Settings laden/speichern, Backend-Wert-Normalisierung

**Pattern in `+page.ts`:**
```typescript
export const load: PageLoad = async ({ fetch, params }) => {
  const api = createPensionApi(fetch)  // route-spezifisches fetch
  return { pension: await api.getById(params.id) }
}
```

**Pattern außerhalb von load:**
```typescript
import { pensionApi } from '$lib/api/pension'  // Singleton
await pensionApi.update(id, data)
```

## Stores (`lib/stores/`)

- `settings.svelte.ts` — `settingsStore`: Locale, Währung, Szenario-Raten, Theme-Präferenz. Persistenz via localStorage + API-Sync.
- `pension.svelte.ts` — `pensionStore`: Globale Pensionsliste, Laden/Löschen/Status-Wechsel
- `theme.svelte.ts` — `themeStore`: Light/Dark/System, localStorage-Sync
- `toast.svelte.ts` — `toastStore`: Queue mit TTL, `success()` / `error()` Methoden

## Types (`lib/types/`)

- `pension.ts` — Zentrale Domain-Modelle für alle 5 Pension-Typen, Enums, Projektionstypen
- `household.ts` — Household + Member-Modelle
- `etf.ts` — ETF-Metadaten und Suchergebnis-Typen
- `settings.ts` — Settings-Modelle, Locale/Währungs-Enums mit Labels

## Utils (`lib/utils/`)

- `format.ts` — Locale-sensitive Formatierung: `formatCurrency()`, `formatNumber()`, `formatPercent()`, `formatDate()`
- `projection.ts` — Szenario-Berechnungen (pessimistisch/realistisch/optimistisch)
- `date-only.ts` — ISO-Datums-Helfer ohne Zeitzonenprobleme

## Svelte 5 Code-Patterns

### Reaktiver State
```svelte
<script lang="ts">
  let count = $state(0)
  let doubled = $derived(count * 2)

  // Reaktive Closures: locale vorher erfassen!
  const formatValue = $derived.by(() => {
    const _locale = $settingsStore.locale
    return formatCurrency(_locale, amount)
  })
</script>
```

### Props
```svelte
<script lang="ts">
  interface Props { label: string; value?: number }
  let { label, value = 0 }: Props = $props()
</script>
```

### Bindable Props
```svelte
let { value = $bindable(0) }: { value: number } = $props()
```

### Effects
```svelte
$effect(() => {
  console.log('value changed:', count)
  return () => { /* cleanup */ }
})
```

## i18n Workflow (Paraglide)

1. Keys in `messages/en.json` und `messages/de.json` hinzufügen/ändern
2. Kompilieren: `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide`
3. In Komponenten verwenden:
```svelte
<script>
  import * as m from '$lib/paraglide/messages'
</script>
<p>{m.pension_name()}</p>
```
4. `src/lib/paraglide/` und `src/paraglide/` — NIE manuell editieren

## Neue Feature — Checkliste

1. [ ] Types in `lib/types/*.ts` ergänzen
2. [ ] API-Methoden in `lib/api/*.ts` hinzufügen
3. [ ] `+page.ts` load-Funktion anpassen
4. [ ] UI-Komponenten erstellen/erweitern
5. [ ] i18n-Keys in `messages/*.json` ergänzen
6. [ ] Paraglide neu kompilieren
7. [ ] Toast-Feedback für Erfolg/Fehler einbauen

## Bibliotheken

- **Charts**: `layerchart` (für ETF-Diagramme)
- **Icons**: `@lucide/svelte` (NICHT `lucide-svelte`)
- **CSS**: Tailwind CSS 4
- **i18n**: Paraglide JS
