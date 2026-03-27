# 06 — Statements-Konzept verständlicher machen

**Priorität:** P2
**Bereich:** Pension Forms (alle Typen mit Statements)
**Betroffene Dateien:**
- `src/frontend/src/lib/components/pension/company/StatementsCard.svelte`
- `src/frontend/src/lib/components/pension/insurance/StatementsCard.svelte`
- `src/frontend/src/lib/components/pension/state/StatementsCard.svelte`
- `src/frontend/src/lib/components/pension/savings/StatementsCard.svelte`
- Alle zugehörigen Edit-Seiten
- `messages/en.json`, `messages/de.json`

---

## Problem

Der Begriff "Statement" ist für deutsche Nutzer nicht selbsterklärend. Gemeint ist ein Auszug/Bescheinigung (z.B. Renteninformation, Versicherungsstandmitteilung, Kontoauszug), aber:

1. **Kein Kontext**: Was soll ich hier eingeben? Wann? Von welchem Dokument?
2. **Kein Beispiel**: Wie sieht ein typischer Eintrag aus?
3. **Keine Anleitung**: Wo finde ich diese Informationen?
4. **Felder unklar**: "Current Value", "Projected Monthly Amount" — was genau?

## Lösung

### 1. Bessere Bezeichnungen

| Aktuell (EN) | Neu (EN) | Deutsch |
|---------------|----------|---------|
| Statements | Annual Statements | Jahresbescheinigungen |
| Statement Date | Date of Statement | Datum der Bescheinigung |
| Add Statement | Add Statement from Document | Bescheinigung hinzufügen |

### 2. Typ-spezifische Hilfe-Texte

Jede StatementsCard bekommt einen Hilfetext, der erklärt, woher die Daten kommen:

**State Pension:**
```
"Trag hier die Werte aus deiner Renteninformation ein.
Du findest sie im Brief der Deutschen Rentenversicherung, den du jährlich erhältst.
• 'Aktueller Monatsbetrag' → steht unter 'Rente wegen Alters'
• 'Projizierter Monatsbetrag' → steht unter 'bei zukünftiger Rentensteigerung'"
```

**Insurance:**
```
"Trag hier die Werte aus der Standmitteilung deiner Versicherung ein.
Du erhältst diese jährlich per Post oder online.
• 'Aktueller Wert' → Rückkaufswert oder Fondsguthaben
• 'Eingezahlte Beiträge' → Summe aller bisherigen Beiträge
• 'Kosten' → entnimmst du der Kostenaufstellung"
```

**Company:**
```
"Trag hier die Werte aus der Mitteilung deines Arbeitgebers ein.
Falls du eine 'Anwartschaftsmitteilung' bekommst, findest du dort:
• 'Wert' → aktueller Anspruch/Rückkaufswert
• 'Rentenhöhe bei Alter X' → projizierte monatliche Rente"
```

**Savings:**
```
"Trag hier deinen aktuellen Kontostand ein.
Du findest ihn im Online-Banking oder auf dem letzten Kontoauszug."
```

### 3. Inline-Feld-Labels mit Kontext

Statt nur "Current Monthly Amount" → "Aktuelle monatliche Rente (aus Renteninformation)"

Jedes Feld im Statement bekommt einen kleinen Hinweistext darunter (muted text, `text-sm text-muted-foreground`), der erklärt, wo der Wert zu finden ist.

### 4. Chronologische Anzeige mit Trend

Wenn mehrere Statements existieren, eine kleine Trend-Anzeige:
- "Letzte Bescheinigung: 01/2025 — Wert: 12.450€ (+3,2% ggü. Vorjahr)"
- Das motiviert den User, regelmäßig Updates einzutragen

---

## Implementierung

### StatementsCard-Erweiterung

Jede StatementsCard (alle 4 Typen) bekommt:

1. **Header-Bereich** mit Titel + Hilfetext (als `Explanation`-Komponente oder ExplanationAlert)
2. **Feld-Labels** mit Subtitles (text-sm, muted)
3. **Optional: Trend-Badge** bei bestehenden Statements

Beispiel für State Pension StatementsCard:

```svelte
<Card title={m.statements_title()}>
  <ExplanationAlert>
    {m.statements_help_state()}
  </ExplanationAlert>

  {#each statements as statement, i}
    <div class="grid gap-4">
      <div>
        <label>{m.statement_date()}</label>
        <p class="text-sm text-muted-foreground">{m.statement_date_hint_state()}</p>
        <input type="date" bind:value={statement.statement_date} />
      </div>
      <div>
        <label>{m.current_monthly_amount()}</label>
        <p class="text-sm text-muted-foreground">{m.current_monthly_hint_state()}</p>
        <CurrencyInput bind:value={statement.current_monthly_amount} />
      </div>
      <!-- ... -->
    </div>
  {/each}
</Card>
```

### Keine Backend-Änderungen nötig

Alle Änderungen sind rein im Frontend — Labels, Hilfetexte und Layout.

---

## i18n Keys (Auswahl)

```json
{
  "statements_title": "Annual Statements",
  "statements_help_state": "Enter the values from your pension statement (Renteninformation). You receive this letter annually from the German Pension Insurance (Deutsche Rentenversicherung).",
  "statements_help_insurance": "Enter the values from your insurance's annual statement (Standmitteilung). You receive this yearly by mail or online.",
  "statements_help_company": "Enter the values from your employer's pension notification. Look for the benefit statement (Anwartschaftsmitteilung).",
  "statements_help_savings": "Enter your current account balance from online banking or your latest statement.",
  "statement_date_hint_state": "The date printed on your pension statement.",
  "current_monthly_hint_state": "Found under 'Rente wegen Alters' — your current monthly entitlement.",
  "projected_monthly_hint_state": "Found under 'bei zukünftiger Rentensteigerung' — your projected monthly amount.",
  "statement_trend": "{change}% compared to previous statement"
}
```

---

## Akzeptanzkriterien

- [ ] Jede StatementsCard hat einen typ-spezifischen Hilfetext
- [ ] Hilfetext erklärt, welches Dokument und wo die Werte zu finden sind
- [ ] Feld-Labels haben erklärende Sub-Labels
- [ ] Deutsche Texte referenzieren die korrekten deutschen Begriffe (Renteninformation, Standmitteilung, etc.)
- [ ] Bei mehreren Statements: Trend-Anzeige (% Veränderung zum Vorgänger)
- [ ] Alle Texte in EN und DE
