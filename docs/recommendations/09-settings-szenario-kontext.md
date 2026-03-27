# 09 — Szenario-Raten mit Kontext versehen

**Priorität:** P2
**Bereich:** Settings
**Betroffene Dateien:**
- `src/frontend/src/lib/components/settings/ScenarioRatesGrid.svelte`
- `src/frontend/src/routes/settings/+page.svelte`
- `messages/en.json`, `messages/de.json`

---

## Problem

Die Settings-Seite zeigt Szenario-Raten (Pessimistic: 4%, Realistic: 6%, Optimistic: 8% für ETF; 1%/1.5%/2% für State Pension), aber:

1. Ein normaler User weiß nicht, ob 6% "gut" oder "schlecht" ist
2. Es fehlt historischer Kontext ("Was war der Durchschnitt der letzten 30 Jahre?")
3. Die Begriffe "Pessimistic/Realistic/Optimistic" sind Fach-Jargon
4. Die Unterscheidung ETF-Raten vs. State-Pension-Raten ist nicht erklärt

## Lösung

### 1. Kontext-Boxen neben den Raten

Neben oder unter dem ScenarioRatesGrid:

**Für ETF/Allgemeine Pensionen:**
```
ℹ Historische Einordnung:
• Der MSCI World hat in den letzten 30 Jahren durchschnittlich ~7-8% p.a. erzielt.
• Nach Inflation (real) waren es ca. 5-6% p.a.
• Einzelne Jahrzehnte schwankten zwischen 0% und 14%.

Die Standardwerte (4% / 6% / 8%) bilden eine konservative bis optimistische Spanne ab.
```

**Für Staatliche Rente:**
```
ℹ Historische Einordnung:
• Die Rentenanpassung lag in den letzten 20 Jahren bei durchschnittlich ~1,5% p.a.
• In manchen Jahren gab es Nullrunden, in anderen über 3%.
• Die Bundesregierung koppelt die Anpassung an die Lohnentwicklung.

Die Standardwerte (1% / 1,5% / 2%) bilden die wahrscheinliche Bandbreite ab.
```

**Für Inflation:**
```
ℹ Die EZB hat ein Inflationsziel von 2% p.a.
Die langfristige Inflation in Deutschland lag bei ca. 1,5-2,5%.
2% ist ein sinnvoller Standardwert.
```

### 2. Bessere Labels

| Aktuell | Neu (EN) | Neu (DE) |
|---------|----------|----------|
| Pessimistic | Conservative | Vorsichtig |
| Realistic | Expected | Erwartet |
| Optimistic | Favorable | Günstig |

Die neuen Begriffe sind weniger emotional geladen und verständlicher.

### 3. Visuelle Hilfe: Auswirkung auf Beispiel-Betrag

Unter den Raten eine kleine Live-Berechnung:

```
Bei 200€/Monat und 30 Jahren Ansparzeit:
• Vorsichtig (4%): 137.500€
• Erwartet (6%):   195.000€
• Günstig (8%):    283.000€
```

Dies macht die Raten greifbar. Die bestehende `ProjectionPreview`-Komponente tut etwas Ähnliches, könnte aber mit echten Beträgen statt abstrakten Kurven arbeiten.

---

## Implementierung

### Kontext als ExplanationAlert

Neben dem `ScenarioRatesGrid` (innerhalb einer `ContentSection` mit Aside):

```svelte
<ContentSection>
  <ScenarioRatesGrid {rates} {errors} onchange={handleChange} />

  {#snippet aside()}
    <Explanation title={m.settings_rates_context_title()}>
      <ExplanationAlert>
        {m.settings_rates_context_etf()}
      </ExplanationAlert>
      <div class="mt-4 text-sm">
        <p class="font-medium">{m.settings_rates_example_title()}</p>
        <p>{m.settings_rates_example_conservative({ amount: formatCurrency(conservativeResult) })}</p>
        <p>{m.settings_rates_example_expected({ amount: formatCurrency(expectedResult) })}</p>
        <p>{m.settings_rates_example_favorable({ amount: formatCurrency(favorableResult) })}</p>
      </div>
    </Explanation>
  {/snippet}
</ContentSection>
```

### Live-Berechnung

```typescript
let conservativeResult = $derived.by(() => {
  const monthly = 200
  const years = 30
  const rate = rates.projection_pessimistic_rate / 100
  const monthlyRate = Math.pow(1 + rate, 1/12) - 1
  const months = years * 12
  return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
})
```

### Keine Backend-Änderungen nötig

Rein Frontend — Labels, Hilfetexte, Berechnungen.

---

## i18n Keys

```json
{
  "scenario_conservative": "Conservative",
  "scenario_expected": "Expected",
  "scenario_favorable": "Favorable",
  "settings_rates_context_title": "What do these rates mean?",
  "settings_rates_context_etf": "The MSCI World has averaged ~7-8% p.a. over the last 30 years. After inflation, that's about 5-6%. The default values (4%/6%/8%) represent a conservative to optimistic range.",
  "settings_rates_context_state": "Pension adjustments in Germany have averaged ~1.5% p.a. over the last 20 years. Some years had zero adjustment, others over 3%. The defaults (1%/1.5%/2%) cover the likely range.",
  "settings_rates_context_inflation": "The ECB targets 2% inflation. Germany's long-term average is 1.5-2.5%. 2% is a sensible default.",
  "settings_rates_example_title": "Example: 200€/month over 30 years",
  "settings_rates_example_conservative": "Conservative ({rate}%): {amount}",
  "settings_rates_example_expected": "Expected ({rate}%): {amount}",
  "settings_rates_example_favorable": "Favorable ({rate}%): {amount}"
}
```

---

## Akzeptanzkriterien

- [ ] Historische Kontext-Box neben ETF-Raten
- [ ] Historische Kontext-Box neben State-Pension-Raten
- [ ] Kontext-Box für Inflationsrate
- [ ] Labels umbenannt: Pessimistic → Conservative, Realistic → Expected, Optimistic → Favorable
- [ ] Live-Beispielrechnung mit 200€/Monat über 30 Jahre
- [ ] Alle Texte in EN und DE
