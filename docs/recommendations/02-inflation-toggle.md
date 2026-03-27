# 02 — Inflation-Toggle ("In heutigen Euros anzeigen")

**Priorität:** P1
**Bereich:** Dashboard, Projektionscharts, Plan-Seite
**Betroffene Dateien:**
- `src/frontend/src/lib/stores/settings.svelte.ts` (neues Toggle-State)
- `src/frontend/src/lib/components/dashboard/ScenarioProjectionChart.svelte`
- `src/frontend/src/lib/components/pension/etf/ProjectionChart.svelte`
- `src/frontend/src/lib/components/compass/GapResultDisplay.svelte`
- `src/frontend/src/lib/components/compass/GapTimelineChart.svelte`
- `src/frontend/src/lib/components/payout/CapitalOverview.svelte`
- `src/frontend/src/lib/components/payout/IncomeBreakdown.svelte`
- `src/frontend/src/lib/components/payout/DrawdownChart.svelte`
- `src/backend/app/services/gap_analysis.py` (ggf. Anpassung)
- `src/backend/app/services/pension_series_projection.py` (ggf. Anpassung)
- `messages/en.json`, `messages/de.json`

---

## Problem

Alle Projektionen und Gap-Analysen zeigen **Nominalwerte** (zukünftige Euros). "Du brauchst 450.000€ Kapital" klingt nach viel — aber in 30 Jahren hat dieses Geld deutlich weniger Kaufkraft. User können die Zahlen nicht intuitiv einordnen.

Die Inflationsrate ist bereits in den Settings gespeichert (`inflation_rate`, Default 2%), wird aber aktuell nur in der Gap-Analyse für die `needed_monthly_at_retirement`-Berechnung verwendet — nicht für die Darstellung.

## Lösung

### Grundprinzip

Ein Toggle-Button an allen Stellen, die Zukunftswerte zeigen:
- **Default: Nominalwerte** (wie bisher, "Zukünftige Euros")
- **Toggle: Realwerte** ("In heutigen Euros", inflationsbereinigt)

Die Umrechnung ist simpel:
```
realValue = nominalValue / (1 + inflationRate)^yearsFromNow
```

### Wo der Toggle erscheint

1. **Dashboard: ScenarioProjectionChart** — Toggle im Chart-Header
2. **ETF Detail: ProjectionChart** — Toggle im Chart-Header
3. **Plan: GapResultDisplay** — Toggle neben den Ergebniszahlen
4. **Plan: GapTimelineChart** — Toggle im Chart-Header
5. **Plan/Payout: CapitalOverview, IncomeBreakdown, DrawdownChart** — Toggle

### Wo der Toggle NICHT erscheint

- Historische Daten (HistoricalPerformanceChart) — das sind reale vergangene Werte
- Aktuelle Werte (Portfolio-Wert heute) — kein Diskontieren nötig
- Formulare/Inputs — da wird immer in heutigen Euros gedacht

---

## Implementierung

### 1. Globaler Toggle-State

Im `settingsStore` ein neues reaktives Feld:

```typescript
// In src/frontend/src/lib/stores/settings.svelte.ts
let showRealValues = $state(false) // Default: Nominalwerte

// Public API
export const settingsStore = {
  // ... bestehende Felder ...
  get showRealValues() { return showRealValues },
  toggleRealValues() { showRealValues = !showRealValues },
}
```

Dieses Feld wird NICHT auf dem Backend gespeichert — es ist ein reines UI-Preference, das per Session gilt. Optional kann es in `localStorage` persistiert werden.

### 2. Utility-Funktion für Diskontierung

```typescript
// In src/frontend/src/lib/utils/format.ts oder neue Datei src/frontend/src/lib/utils/inflation.ts

/**
 * Diskontiert einen Nominalwert auf heutige Kaufkraft.
 * @param nominalValue - Wert in zukünftigen Euros
 * @param yearsFromNow - Jahre in der Zukunft (kann Dezimal sein)
 * @param annualInflationRate - Inflationsrate als Dezimal (0.02 = 2%)
 * @returns Wert in heutigen Euros
 */
export function toRealValue(
  nominalValue: number,
  yearsFromNow: number,
  annualInflationRate: number
): number {
  if (yearsFromNow <= 0) return nominalValue
  return nominalValue / Math.pow(1 + annualInflationRate, yearsFromNow)
}

/**
 * Berechnet Jahre von heute bis zu einem Datum.
 */
export function yearsUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  return (target.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}
```

### 3. Toggle-Komponente

Neue Komponente `InflationToggle.svelte`:

```svelte
<!-- Kleiner Toggle-Button für Chart-Header -->
<button
  onclick={() => settingsStore.toggleRealValues()}
  class="text-xs px-2 py-1 rounded border ..."
  title={settingsStore.showRealValues ? 'Nominalwerte anzeigen' : 'In heutigen Euros anzeigen'}
>
  {settingsStore.showRealValues ? m.nominal_values() : m.real_values_today()}
</button>
```

Platzierung: In den Chart-Headern neben dem Titel, rechts ausgerichtet. Kleiner Button, nicht dominant.

### 4. Anpassung der Charts

Am Beispiel `ScenarioProjectionChart.svelte`:

```typescript
// Bestehende Daten: projectionData mit {date, pessimistic, realistic, optimistic}
// Neue abgeleitete Daten:
let displayData = $derived.by(() => {
  if (!settingsStore.showRealValues) return projectionData

  const inflationRate = settingsStore.current.inflation_rate / 100
  return projectionData.map(point => ({
    date: point.date,
    pessimistic: toRealValue(point.pessimistic, yearsUntil(point.date), inflationRate),
    realistic: toRealValue(point.realistic, yearsUntil(point.date), inflationRate),
    optimistic: toRealValue(point.optimistic, yearsUntil(point.date), inflationRate),
  }))
})
```

Der Chart rendert dann `displayData` statt `projectionData`.

### 5. Visuelle Kennzeichnung

Wenn der Toggle aktiv ist (Realwerte), sollte klar erkennbar sein:
- Chart-Titel ergänzen: "(in heutigen Euros)" / "(in today's euros)"
- Leichte visuelle Änderung (z.B. gestrichelte statt durchgezogene Linien, oder ein kleines Badge)
- Tooltip in Charts: "142.350€ (heute) / 215.000€ (nominal)" — beide Werte zeigen

### 6. Gap-Analyse-Anpassung

Die Gap-Analyse-Ergebnisse (`required_capital`, `projected_capital`, `remaining_monthly_gap`) sind bereits Nominalwerte zum Zeitpunkt Renteneintritt. Für die Realwert-Darstellung:

```typescript
// In GapResultDisplay.svelte
let yearsToRetirement = $derived(yearsUntil(member.retirement_date_planned))
let inflationRate = $derived(settingsStore.current.inflation_rate / 100)

let displayedRequiredCapital = $derived(
  settingsStore.showRealValues
    ? toRealValue(gapResult.required_capital.realistic, yearsToRetirement, inflationRate)
    : gapResult.required_capital.realistic
)
```

---

## i18n Keys

```json
{
  "inflation_toggle_nominal": "Future euros",
  "inflation_toggle_real": "Today's euros",
  "inflation_toggle_tooltip": "Show values adjusted for {rate}% annual inflation",
  "in_todays_euros": "(in today's euros)",
  "in_future_euros": "(in future euros)"
}
```

Deutsche Entsprechungen:
```json
{
  "inflation_toggle_nominal": "Zukünftige Euros",
  "inflation_toggle_real": "Heutige Euros",
  "inflation_toggle_tooltip": "Werte um {rate}% jährliche Inflation bereinigt anzeigen",
  "in_todays_euros": "(in heutigen Euros)",
  "in_future_euros": "(in zukünftigen Euros)"
}
```

---

## Akzeptanzkriterien

- [ ] Toggle-Button erscheint in allen Projektions-Charts und Gap-Ergebnissen
- [ ] Default ist "Nominalwerte" (bestehendes Verhalten)
- [ ] Toggle wechselt global (einmal klicken ändert alle Ansichten)
- [ ] Realwerte werden korrekt berechnet: `nominal / (1 + inflation)^years`
- [ ] Inflationsrate kommt aus Settings (`inflation_rate`)
- [ ] Visuelle Kennzeichnung wenn Realwerte aktiv (Label im Chart-Titel)
- [ ] Historische Daten werden NICHT angepasst
- [ ] Aktuelle Werte (heute) werden NICHT angepasst
- [ ] Alle Texte in EN und DE
- [ ] Toggle-State überlebt Page-Navigation (globaler Store oder localStorage)
