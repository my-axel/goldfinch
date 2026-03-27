# 07 — Contribution Plan vs. History klarer trennen

**Priorität:** P2
**Bereich:** Pension Edit-Seiten (ETF, Insurance, Company, Savings)
**Betroffene Dateien:**
- `src/frontend/src/lib/components/pension/ContributionPlanCard.svelte`
- `src/frontend/src/lib/components/pension/ContributionHistoryCard.svelte`
- Alle Edit-Seiten der Pension-Typen mit Contributions
- `messages/en.json`, `messages/de.json`

---

## Problem

Zwei verwandte aber unterschiedliche Konzepte verwirren den User:

1. **Contribution Plan** = Was du in Zukunft planst einzuzahlen (wird für Projektionen verwendet)
2. **Contribution History** = Was du tatsächlich eingezahlt hast (vergangene Buchungen)

Probleme:
- Die Begriffe sind nicht selbsterklärend
- Warum brauche ich beides? Reicht nicht eins?
- "Realize Historical Contributions" (Checkbox bei ETF) ist besonders verwirrend — sie generiert History-Einträge aus dem Plan für die Vergangenheit
- Manche Typen haben Plan + History, andere nur eines davon
- Es ist unklar, welchen Einfluss Plan vs. History auf die Berechnungen hat

## Lösung

### 1. Klarere Bezeichnungen

| Aktuell | Neu (EN) | Neu (DE) |
|---------|----------|----------|
| Contribution Plan | Savings Plan | Sparplan |
| Contribution History | Payment History | Zahlungshistorie |
| Realize Historical Contributions | Generate past payments from plan | Vergangene Zahlungen aus Sparplan generieren |

### 2. Erklärung des Zusammenspiels

Auf jeder Edit-Seite, die beides hat, ein kurzer Hinweis:

```
Dein Sparplan definiert, wie viel du regelmäßig einzahlst.
Er wird für die Zukunftsprojektion verwendet.

Die Zahlungshistorie zeigt alle tatsächlichen Zahlungen.
Sie wird für den aktuellen Portfoliowert und die Performance-Berechnung verwendet.
```

### 3. Visuelle Trennung

**Sparplan (Zukunft):**
- Icon: CalendarClock oder Repeat
- Farblich: Blau/Neutral (zukunftsgerichtet)
- Header: "Sparplan — wird für Projektionen verwendet"

**Zahlungshistorie (Vergangenheit):**
- Icon: History oder Receipt
- Farblich: Neutral/Grau (vergangen)
- Header: "Zahlungshistorie — tatsächliche Buchungen"

### 4. "Realize Historical Contributions" umgestalten

Die Checkbox wird ersetzt durch eine klarere Aktion:

Wenn ein Sparplan existiert und Zeiträume in der Vergangenheit abdeckt:

```
┌────────────────────────────────────────────────────────┐
│ ℹ Dein Sparplan enthält vergangene Zeiträume.           │
│   Möchtest du die entsprechenden Zahlungen              │
│   automatisch in die Historie übernehmen?               │
│                                                          │
│   [Vergangene Zahlungen generieren]                     │
│                                                          │
│   Dies erstellt X Einträge für den Zeitraum             │
│   01/2020 bis 03/2026 (150€/Monat).                    │
└────────────────────────────────────────────────────────┘
```

Das ist kein Checkbox-State mehr, sondern eine einmalige Aktion mit klarer Erklärung des Ergebnisses.

### 5. Konsistenz über Typen hinweg

Welche Typen haben was:

| Typ | Sparplan | Zahlungshistorie | Begründung |
|-----|----------|-------------------|------------|
| ETF | ✓ | ✓ | Regelmäßige Einzahlung, Kursentwicklung abhängig von Zeitpunkt |
| Insurance | ✓ | ✓ | Regelmäßige Prämie |
| Company | ✓ | ✓ | Regelmäßiger Arbeitgeber/Arbeitnehmer-Beitrag |
| Savings | ✓ | ✓ | Regelmäßige Einzahlung + Einmalzahlungen |
| State | ✗ | ✗ | Beiträge werden automatisch über Gehalt abgeführt |

State hat keines von beiden — das ist korrekt und muss so bleiben.

---

## Implementierung

### ContributionPlanCard.svelte

```svelte
<CollapsibleCard
  title={m.savings_plan()}
  description={m.savings_plan_description()}
>
  <ExplanationAlert>
    {m.savings_plan_explanation()}
  </ExplanationAlert>
  <!-- bestehende Tabelle mit Steps -->
</CollapsibleCard>
```

### ContributionHistoryCard.svelte

```svelte
<CollapsibleCard
  title={m.payment_history()}
  description={m.payment_history_description()}
>
  <!-- bestehende Jahr-gruppierte Liste -->

  {#if hasPastPlanPeriods}
    <div class="border rounded p-4 bg-muted/50">
      <p>{m.realize_contributions_hint({ count: pastCount, period: pastPeriod, amount: planAmount })}</p>
      <button onclick={generatePastPayments}>
        {m.generate_past_payments()}
      </button>
    </div>
  {/if}
</CollapsibleCard>
```

### Keine Backend-Änderungen nötig

Die Trennung ist rein visuell/UX. Die Datenmodelle bleiben wie sie sind.

---

## i18n Keys

```json
{
  "savings_plan": "Savings Plan",
  "savings_plan_description": "Used for future projections",
  "savings_plan_explanation": "Your savings plan defines how much you regularly contribute. It's used to project your future portfolio value.",
  "payment_history": "Payment History",
  "payment_history_description": "Actual recorded payments",
  "payment_history_explanation": "Your payment history shows all actual contributions. It's used to calculate your current portfolio value and performance.",
  "realize_contributions_hint": "Your savings plan covers past periods. Would you like to automatically generate {count} payment entries for {period} ({amount}/month)?",
  "generate_past_payments": "Generate past payments"
}
```

---

## Akzeptanzkriterien

- [ ] "Contribution Plan" umbenannt in "Sparplan" / "Savings Plan"
- [ ] "Contribution History" umbenannt in "Zahlungshistorie" / "Payment History"
- [ ] Beide Sections haben erklärende Hinweistexte
- [ ] "Realize Historical Contributions"-Checkbox ersetzt durch einmalige Aktion mit Vorschau
- [ ] Visuelle Trennung: unterschiedliche Icons/Badges für Zukunft vs. Vergangenheit
- [ ] Konsistentes Verhalten über alle Pension-Typen hinweg
- [ ] Alle Texte in EN und DE
