# 11 — Was-wäre-wenn Simulationsmodus

**Priorität:** P2
**Bereich:** Plan-Seite
**Betroffene Dateien:**
- `src/frontend/src/routes/plan/[member_id]/+page.svelte`
- `src/frontend/src/lib/components/compass/` (neue Komponenten)
- `src/backend/app/api/v1/endpoints/compass.py` (neuer Endpunkt)
- `src/backend/app/services/gap_analysis.py` (Simulation-Logik)
- `messages/en.json`, `messages/de.json`

---

## Problem

Der User kann aktuell nicht simulieren, was sich ändern würde, wenn er:
- Mehr spart ("Was wenn ich 200€ mehr in meinen ETF einzahle?")
- Früher/später in Rente geht ("Was wenn ich mit 63 statt 67 gehe?")
- Seinen Lebensstil anpasst ("Was wenn ich nur 70% statt 80% brauche?")

Um solche Szenarien durchzuspielen, müsste er seine echten Daten ändern — das will niemand.

## Lösung

### Simulations-Panel auf der Plan-Detail-Seite

Ein "Was wäre wenn?"-Bereich auf der Plan-Detail-Seite (`/plan/[member_id]`), der temporäre Overrides erlaubt:

```
┌─────────────────────────────────────────────────────────┐
│  Was wäre wenn...                                        │
│                                                          │
│  Rentenalter:        [63 ▼]  (aktuell: 67)              │
│  Zusätzl. Sparrate:  [200 €/Monat]  (aktuell: 0€)      │
│  Ersatzrate:         [70%]  (aktuell: 80%)               │
│  Auszahlung bis:     [95]  (aktuell: 90)                │
│                                                          │
│  [Simulation berechnen]    [Zurücksetzen]                │
│                                                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                          │
│  Simulation vs. Aktuell:                                 │
│                                                          │
│  Benötigtes Kapital:  195.000€  →  142.000€  (↓ 27%)   │
│  Monatl. Lücke:       520€      →  180€      (↓ 65%)   │
│  Deckungsgrad:        73%       →  91%        (↑ 18pp)  │
│                                                          │
│  💡 Tipp: 200€ mehr pro Monat und 70% Ersatzrate         │
│     verbessern deinen Deckungsgrad um 18 Prozentpunkte.  │
└─────────────────────────────────────────────────────────┘
```

### Was kann simuliert werden?

| Parameter | Override | Quelle |
|-----------|----------|--------|
| Rentenalter | Zahl (55-75) | Member.retirement_age_planned |
| Zusätzliche Sparrate | Betrag €/Monat | Wird auf projected_capital addiert |
| Ersatzrate | Prozent (50-100%) | GapConfig.replacement_rate |
| Auszahlung bis Alter | Zahl (70-105) | GapConfig.withdrawal_until_age |
| Kapitalverzehr | Ja/Nein | GapConfig.capital_depletion |

### Was wird NICHT simuliert?

- Keine Änderung einzelner Pension-Werte (zu granular)
- Keine Änderung der Szenario-Raten (gehört in Settings)
- Keine Steuereffekte (noch nicht modelliert)

---

## Implementierung

### Option A: Frontend-only (empfohlen als erster Schritt)

Die Gap-Analyse-Ergebnisse liegen bereits im Frontend vor. Die Simulation kann die Berechnung im Frontend nachbilden:

```typescript
interface SimulationParams {
  retirement_age_override?: number
  additional_monthly_savings?: number
  replacement_rate_override?: number
  withdrawal_until_age_override?: number
  capital_depletion_override?: boolean
}

function simulateGap(
  currentResult: GapAnalysisResult,
  config: RetirementGapConfig,
  member: HouseholdMember,
  params: SimulationParams
): GapAnalysisResult {
  // 1. Adjust retirement age → changes years_to_retirement → changes needed_monthly, projected_capital
  // 2. Adjust replacement_rate → changes needed_monthly
  // 3. Adjust withdrawal_until_age → changes required_capital calculation
  // 4. Add additional savings → compound to retirement, add to projected_capital
  // 5. Recalculate gap
}
```

**Vorteil:** Sofortiges Feedback, kein API-Call nötig.
**Nachteil:** Vereinfachte Berechnung (z.B. State-Pension-Szenarios nicht neu berechnet).

### Option B: Backend-Endpunkt (genauer, aber aufwändiger)

```python
@router.post("/gap-analysis/{member_id}/simulate")
async def simulate_gap(
    member_id: int,
    params: SimulationParams,
    db: Session = Depends(get_db)
):
    """
    Berechnet eine Gap-Analyse mit temporären Overrides.
    Ändert keine Daten — rein hypothetisch.
    """
    member = crud_household.get(db, member_id)
    config = crud_gap_config.get_by_member_id(db, member_id)

    # Apply overrides
    if params.retirement_age_override:
        member.retirement_age_planned = params.retirement_age_override
    if params.replacement_rate_override:
        config.replacement_rate = params.replacement_rate_override
    # ... etc.

    return gap_analysis_service.calculate(db, member, config)
```

**Empfehlung:** Mit Option A starten, Option B nachrüsten wenn nötig.

### Neue Komponente: `SimulationPanel.svelte`

```typescript
// Props
{
  currentResult: GapAnalysisResult
  config: RetirementGapConfig
  member: HouseholdMember
}
```

**State:**
```typescript
let retirementAge = $state(member.retirement_age_planned)
let additionalSavings = $state(0)
let replacementRate = $state(config.replacement_rate)
let withdrawalAge = $state(config.withdrawal_until_age)
let capitalDepletion = $state(config.capital_depletion)

let simulationResult = $derived.by(() => {
  return simulateGap(currentResult, config, member, {
    retirement_age_override: retirementAge,
    additional_monthly_savings: additionalSavings,
    replacement_rate_override: replacementRate,
    withdrawal_until_age_override: withdrawalAge,
    capital_depletion_override: capitalDepletion,
  })
})
```

**Vergleichsanzeige:**
Zeigt "Aktuell → Simulation" mit Diff-Markierung (↑ grün / ↓ rot):
- Benötigtes Kapital
- Monatliche Lücke
- Deckungsgrad (%)

### Platzierung auf der Seite

Auf der Plan-Detail-Seite als neuer Tab oder CollapsibleCard:

```
[Analyse]  [Auszahlung]  [Simulation]
```

Oder als CollapsibleCard unter den Ergebnissen:
```
▸ Was wäre wenn... (Simulation)
```

---

## i18n Keys

```json
{
  "simulation_title": "What if...",
  "simulation_retirement_age": "Retirement age",
  "simulation_additional_savings": "Additional savings",
  "simulation_replacement_rate": "Replacement rate",
  "simulation_withdrawal_age": "Withdrawal until age",
  "simulation_calculate": "Calculate simulation",
  "simulation_reset": "Reset",
  "simulation_vs_current": "Simulation vs. Current",
  "simulation_required_capital": "Required capital",
  "simulation_monthly_gap": "Monthly gap",
  "simulation_coverage": "Coverage rate",
  "simulation_current": "Current",
  "simulation_simulated": "Simulated",
  "simulation_tip": "Tip: {description} improves your coverage by {improvement} percentage points."
}
```

---

## Akzeptanzkriterien

- [ ] "Was wäre wenn"-Bereich auf der Plan-Detail-Seite
- [ ] Simulierbare Parameter: Rentenalter, Zusatzsparen, Ersatzrate, Auszahlungsalter, Kapitalverzehr
- [ ] Sofortiges Ergebnis (kein API-Call nötig bei Frontend-Berechnung)
- [ ] Vergleich Aktuell vs. Simulation mit Diff-Markierungen
- [ ] Reset-Button setzt alle Overrides auf aktuelle Werte zurück
- [ ] Keine Änderung an echten Daten (rein hypothetisch)
- [ ] Alle Texte in EN und DE
