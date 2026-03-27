# 03 — Plan-Seite als Renten-Check repositionieren

**Priorität:** P1
**Bereich:** Plan-Seite
**Betroffene Dateien:**
- `src/frontend/src/routes/plan/+page.svelte` (Übersicht)
- `src/frontend/src/routes/plan/+page.ts` (Daten laden)
- `src/frontend/src/routes/plan/[member_id]/+page.svelte` (Detail)
- `src/frontend/src/routes/plan/[member_id]/+page.ts` (Daten laden)
- `src/frontend/src/lib/components/compass/GapConfigForm.svelte`
- `src/frontend/src/lib/components/compass/GapResultDisplay.svelte`
- `src/frontend/src/lib/components/compass/GapMemberCard.svelte`
- `src/frontend/src/lib/components/layout/Sidebar.svelte` (ggf. Rename)
- `messages/en.json`, `messages/de.json`

---

## Problem

Die Plan-Seite hat drei UX-Probleme:

1. **Naming**: "Plan" ist generisch. Der User weiß nicht, was ihn erwartet. Besser: "Renten-Check" / "Retirement Check" — das sagt sofort, worum es geht.

2. **Config-First**: Bevor der User etwas sieht, muss er eine Gap-Config anlegen (Net Monthly Income, Replacement Rate, etc.). Viele User wissen nicht, was "Replacement Rate" ist oder welchen Wert sie eingeben sollen. Das ist eine hohe Einstiegshürde.

3. **Fehlender Kontext**: Die Ergebniszahlen stehen ohne Einordnung da. "Du brauchst 1.850€/Monat" — ist das viel? Verglichen mit was?

## Lösung

### 1. Umbenennung: "Plan" → "Renten-Check"

- Sidebar: Icon beibehalten, Text ändern zu "Renten-Check" / "Retirement Check"
- PageHeader: Neuer Titel + beschreibende Subline
- Route bleibt `/plan` (URL-Änderung nicht nötig)

### 2. Bessere Defaults und Smart Prefill

Die GapConfigForm sollte mit sinnvollen Defaults vorausgefüllt sein, damit der User sofort ein Ergebnis sieht und dann feinjustieren kann:

| Feld | Aktueller Default | Neuer Default | Begründung |
|------|-------------------|---------------|------------|
| Net Monthly Income | leer (required) | leer, ABER prominenter Hinweis | Muss vom User kommen |
| Replacement Rate | 80% | 80% (beibehalten) | Standard-Empfehlung |
| Withdrawal Until Age | 90 | 90 (beibehalten) | Konservativ, gut |
| Capital Depletion | false | true | Für die meisten relevanter (Kapitalverzehr) |
| Salary Growth Rate | 2% | 2% (beibehalten) | Inflationsnahe Gehaltssteigerung |

**Wichtigste Änderung**: Der User sollte NUR `Net Monthly Income` eingeben müssen. Alles andere hat Defaults. Ein "Erweitert"-Bereich zeigt die restlichen Felder.

### 3. Inline-Erklärungen bei jedem Feld

Aktuelle Feldlabels:
- "Replacement Rate" → Unverständlich

Neue Labels mit Kontext:
- "Replacement Rate" → "Anteil deines Einkommens im Ruhestand" mit Erklärung: "Die meisten Experten empfehlen 70-80%. Das bedeutet: Bei 3.000€ netto brauchst du 2.400€/Monat im Ruhestand."
- "Withdrawal Until Age" → "Auszahlung bis Alter" mit Erklärung: "Bis zu welchem Alter soll dein Kapital reichen? 90 Jahre ist eine konservative Annahme."
- "Capital Depletion" → "Kapital aufbrauchen?" mit Erklärung: "Ja = Kapital wird bis zum gewählten Alter komplett aufgebraucht. Nein = Nur die Erträge werden entnommen, das Kapital bleibt erhalten."

Diese Erklärungen können als `Explanation`-Komponente neben den Feldern stehen (das Pattern existiert bereits mit `ContentSection` + Aside).

### 4. Sofort-Ergebnis nach Eingabe des Einkommens

Sobald der User sein Netto-Einkommen eingibt und speichert, wird sofort die Gap-Analyse berechnet und angezeigt — mit den Defaults. Kein zweiter Schritt nötig.

Die Ergebnisanzeige zeigt dann:

```
┌─────────────────────────────────────────────────────────┐
│  Dein Renten-Check                                       │
│                                                          │
│  Du brauchst ca. 2.400 €/Monat im Ruhestand             │
│  (80% von 3.000 € Netto, inflationsbereinigt: 3.180 €)  │
│                                                          │
│  Deine bisherige Vorsorge deckt:                         │
│  ████████████████████░░░░░░░░  68%                       │
│  = 1.632 €/Monat                                         │
│                                                          │
│  Davon:                                                  │
│  • Staatliche Rente:    820 €   (fest)                   │
│  • Betriebsrente:       350 €   (fest)                   │
│  • Versicherung:        180 €   (fest)                   │
│  • Aus Kapital (ETF):   282 €   (variabel)               │
│                                                          │
│  ⚠ Es fehlen noch ca. 768 €/Monat                       │
│  (realistisches Szenario)                                │
└─────────────────────────────────────────────────────────┘
```

### 5. Übersichtsseite (`/plan`) verbessern

Die Übersichtsseite zeigt aktuell pro Member eine GapMemberCard. Verbesserungen:

- **Household-Zusammenfassung** am Anfang: "Als Haushalt braucht ihr zusammen X€/Monat, eure Vorsorge deckt Y€" (→ verknüpft mit Recommendation 05)
- **Klarer CTA** pro Member: "Noch nicht eingerichtet" → "Jetzt Renten-Check starten" Button
- **Status-Icons** klarer: Ampel-Farben (grün/gelb/rot) statt nur Text

---

## Implementierung

### GapConfigForm.svelte — Umstrukturierung

Aktuelle Struktur: Alle Felder auf einer Ebene.

**Neue Struktur:**

```
1. Pflichtfeld (prominent):
   - Net Monthly Income (CurrencyInput, groß)

2. Voreingestellt (collapsed "Einstellungen anpassen"):
   - Replacement Rate (PercentInput) + Erklärung
   - Withdrawal Until Age (StepperInput) + Erklärung
   - Capital Depletion (Checkbox) + Erklärung
   - Salary Growth Rate (PercentInput) + Erklärung
   - Pension Deduction Rate (optional, PercentInput)
   - Desired Monthly Pension (optional override)
```

Der "Einstellungen anpassen"-Bereich ist standardmäßig collapsed wenn bereits eine Config existiert. Bei Neu-Erstellung ist er auch collapsed, aber mit einem Hinweis: "Du kannst die Standardwerte jederzeit anpassen."

### Ergebnis-Darstellung

Die bestehende `GapResultDisplay.svelte` sollte erweitert werden um:
- Prozentuale Abdeckung (pension_income / needed_monthly als %)
- Visuelle Fortschrittsanzeige (bar)
- Klarere Einordnung: Grün ("Du bist auf Kurs"), Gelb ("Fast da, aber..."), Rot ("Es fehlt noch einiges")
- Breakdown mit Labels pro Einkommensquelle

### Sidebar-Anpassung

In `Sidebar.svelte` den Nav-Eintrag umbenennen:
```typescript
// Aktuell:
{ name: 'Plan', path: '/plan', icon: Compass }
// Neu:
{ name: m.nav_retirement_check(), path: '/plan', icon: Compass }
```

---

## i18n Keys (neu/geändert)

```json
{
  "nav_retirement_check": "Retirement Check",
  "plan_page_title": "Retirement Check",
  "plan_page_description": "Check whether your current retirement savings will be enough.",
  "plan_income_label": "Your net monthly income",
  "plan_income_hint": "Your current net salary after taxes and social contributions.",
  "plan_replacement_rate_hint": "Most experts recommend 70-80%. At {income}, that means {amount}/month in retirement.",
  "plan_withdrawal_age_hint": "How old do you want your capital to last? 90 is a conservative assumption.",
  "plan_capital_depletion_hint": "Yes = capital is fully consumed by the target age. No = only returns are withdrawn, capital is preserved.",
  "plan_adjust_settings": "Adjust settings",
  "plan_default_hint": "You can adjust the default values at any time.",
  "plan_result_you_need": "You'll need approx. {amount}/month in retirement",
  "plan_result_coverage": "Your current savings cover {percent}",
  "plan_result_gap": "There's a gap of approx. {amount}/month",
  "plan_result_surplus": "You have a surplus of approx. {amount}/month",
  "plan_not_configured": "Not set up yet",
  "plan_start_check": "Start Retirement Check",
  "plan_on_track": "On track",
  "plan_needs_attention": "Needs attention",
  "plan_critical": "Action needed"
}
```

---

## Akzeptanzkriterien

- [ ] Sidebar zeigt "Renten-Check" / "Retirement Check" statt "Plan"
- [ ] Config-Form: Nur Netto-Einkommen ist Pflicht, alles andere hat sichtbare Defaults
- [ ] Config-Form: Erweiterte Felder sind in einem collapsible Bereich
- [ ] Jedes Feld hat eine verständliche Inline-Erklärung
- [ ] Nach Speichern des Einkommens wird sofort ein Ergebnis angezeigt
- [ ] Ergebnis zeigt prozentuale Abdeckung + Fortschrittsbalken
- [ ] Ergebnis zeigt Breakdown pro Einkommensquelle
- [ ] Farbliche Einordnung: Grün/Gelb/Rot
- [ ] Übersichtsseite hat klaren CTA für nicht-konfigurierte Members
- [ ] Alle Texte in EN und DE
