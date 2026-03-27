# 04 — Progressive Disclosure in Pension-Formularen

**Priorität:** P1
**Bereich:** Pension Create/Edit Formulare (alle 5 Typen)
**Betroffene Dateien:**
- `src/frontend/src/routes/pension/etf/new/+page.svelte`
- `src/frontend/src/routes/pension/insurance/new/+page.svelte`
- `src/frontend/src/routes/pension/company/new/+page.svelte`
- `src/frontend/src/routes/pension/state/new/+page.svelte`
- `src/frontend/src/routes/pension/savings/new/+page.svelte`
- Alle zugehörigen Edit-Seiten (`[id]/edit/+page.svelte`)
- Pension-spezifische Komponenten in `src/frontend/src/lib/components/pension/`
- `messages/en.json`, `messages/de.json`

---

## Problem

Die Pension-Formulare (besonders Insurance und Company) verlangen beim Erstellen sehr viele Informationen auf einmal:

**Insurance (Erstellen):**
1. Basic Info (Name, Provider, Contract Number, Start Date, Notes)
2. Statements (Date, Value, Contributions, Benefits, Costs, Projections mit mehreren Sub-Feldern)
3. Szenario-Raten (Pessimistic, Realistic, Optimistic)
4. Contribution Plan (Amount, Frequency, Start, End)

**Company (Erstellen):**
1. Basic Info (Name, Employer, Start Date, Contribution Amount/Frequency, Notes)
2. Statements (Date, Value, Retirement Projections mit Age/Monthly Payout/Total Capital)
3. Szenario-Raten
4. Contribution Plan

Ein User, der gerade seine Versicherungspolice aus der Schublade holt, wird von der Menge an Feldern erschlagen. Viele Felder sind optional, aber das ist nicht auf den ersten Blick klar.

## Lösung

### Grundprinzip: "Erst anlegen, dann vertiefen"

**Phase 1 — Erstellen (Minimum Viable Pension):**
Nur die essentiellen Felder, die man sofort weiß.

**Phase 2 — Vertiefen (Edit-Seite):**
Alle weiteren Details, aufgegliedert in logische Abschnitte mit CollapsibleCards.

### Was ist "essentiell" pro Typ?

| Typ | Phase 1 (Create) | Phase 2 (Edit) |
|-----|-------------------|-----------------|
| **ETF** | Name, ETF-Auswahl, (optional: Existing Holdings, Contribution Plan) | Historical Performance, Projection, Contribution History, Status |
| **State** | Name, (optional: Start Date, erstes Statement) | Statements, Szenario-Viewer |
| **Company** | Name, Employer, (optional: Contribution Amount) | Statements + Projections, Contribution Plan, History, Status |
| **Insurance** | Name, Provider, (optional: Contract Number) | Statements + Projections + Costs, Contribution Plan, History, Status |
| **Savings** | Name, (optional: erster Kontostand, Zinssätze) | Statements, Contribution Plan, History, One-Time Investments, Status |

### Konkrete Umsetzung

#### Create-Formulare: Auf das Wesentliche reduzieren

Jedes Create-Formular bekommt zwei Bereiche:

```
┌─────────────────────────────────────────┐
│  Neue Versicherung anlegen              │
│                                          │
│  Name:        [Allianz Riester        ] │
│  Anbieter:    [Allianz                ] │
│  Start:       [01.01.2015             ] │
│                                          │
│  ▸ Weitere Details hinzufügen            │  ← Collapsed
│    (Vertragsnummer, Beitrag, Raten...)   │
│                                          │
│  [Abbrechen]            [Speichern]     │
└─────────────────────────────────────────┘
```

Der "Weitere Details"-Bereich ist ein `CollapsibleCard` und enthält:
- Statements (mit Hinweis: "Du kannst Bescheinigungen auch später hinzufügen")
- Szenario-Raten (mit Hinweis: "Standard-Raten aus den Einstellungen werden verwendet")
- Contribution Plan (mit Hinweis: "Kannst du jederzeit auf der Detail-Seite ergänzen")

**Wichtig:** Kein Feld im Collapsed-Bereich ist required. Der User kann die Pension mit nur Name + Anbieter/Employer anlegen.

#### Edit-Formulare: Logisch strukturierte Abschnitte

Die Edit-Seiten bleiben umfangreich, aber besser strukturiert:

1. **Basic Info** — Immer offen, kompakt
2. **Bescheinigungen** — CollapsibleCard, offen wenn Daten vorhanden
3. **Szenario-Raten** — CollapsibleCard, collapsed mit Summary ("Realistisch: 6%")
4. **Sparplan** — CollapsibleCard, collapsed mit Summary ("150€/Monat seit 01/2020")
5. **Beitragshistorie** — CollapsibleCard, collapsed mit Summary ("42 Beiträge, 6.300€ gesamt")
6. **Status** — Immer sichtbar am Ende (Pause/Resume)

#### Hilfe-Texte pro Typ

Jeder Pension-Typ bekommt einen kurzen Hilfetext am Anfang des Create-Formulars:

**ETF:** "Erstelle einen ETF-Sparplan. Du brauchst nur den Namen und die ETF-Auswahl. Bestehende Anteile und Sparplan-Details kannst du danach hinzufügen."

**Insurance:** "Leg deine Versicherung an. Name und Anbieter reichen für den Anfang — Vertragsdaten und Bescheinigungen kannst du jederzeit nachtragen."

**Company:** "Erfasse deine Betriebsrente. Arbeitgeber und Name genügen zunächst — Details wie Beitragshöhe und Bescheinigungen fügst du später hinzu."

**State:** "Erfasse deine gesetzliche Rente. Trag am besten gleich die Werte aus deiner Renteninformation ein."

**Savings:** "Erstelle ein Sparkonto für die Altersvorsorge. Name und aktueller Stand reichen für den Start."

---

## Implementierung

### Create-Seiten: Struktur-Anpassung

Am Beispiel Insurance (`src/frontend/src/routes/pension/insurance/new/+page.svelte`):

**Aktuell:**
```
BasicInformationCard (Name, Provider, Contract, Start, Notes)
StatementsCard (Statement Date, Value, Contributions, ...)
ScenarioRatesCard (3 Raten)
ContributionPlanCard (Amount, Frequency, ...)
[Speichern]
```

**Neu:**
```
PageHeader + Hilfetext
BasicInformationCard (Name, Provider — nur essentielles)
CollapsibleCard "Weitere Details" (collapsed):
  - Contract Number, Start Date, Notes
  - StatementsCard mit Hinweis "optional"
  - ScenarioRatesCard mit Hinweis "Standard: X%/Y%/Z%"
  - ContributionPlanCard mit Hinweis "optional"
[Speichern]
```

### Backend: Keine Änderung nötig

Die Create-Endpoints akzeptieren bereits optionale Felder. Statements, Contribution Steps etc. sind alle optional in den Pydantic-Schemas. Es sind rein Frontend-Änderungen.

### Validierung

- Create: Nur Name + typ-spezifisches Minimum validieren
- Edit: Volle Validierung wie bisher

### Neue i18n Keys

```json
{
  "pension_create_help_etf": "Create an ETF plan. You only need the name and ETF selection. You can add existing holdings and savings plan details afterwards.",
  "pension_create_help_insurance": "Add your insurance. Name and provider are enough to start — you can add contract details and statements at any time.",
  "pension_create_help_company": "Record your company pension. Employer and name are enough to begin — add contribution details and statements later.",
  "pension_create_help_state": "Record your state pension. It's best to enter the values from your pension statement right away.",
  "pension_create_help_savings": "Create a savings account for retirement. Name and current balance are enough to start.",
  "pension_more_details": "More details",
  "pension_more_details_hint": "You can add these details at any time on the detail page.",
  "pension_statements_optional_hint": "You can add statements later.",
  "pension_rates_default_hint": "Default rates from settings will be used: {pessimistic}% / {realistic}% / {optimistic}%",
  "pension_contribution_optional_hint": "You can set up a contribution plan later."
}
```

---

## Akzeptanzkriterien

- [ ] Create-Formulare zeigen nur essenzielle Felder standardmäßig
- [ ] Optionale Felder sind in einem collapsed "Weitere Details"-Bereich
- [ ] Jeder Pension-Typ hat einen kurzen Hilfetext am Anfang
- [ ] Pension kann mit Minimum-Daten angelegt werden (Name + typ-spezifisch)
- [ ] Nach Anlegen wird zur Edit-Seite weitergeleitet, wo alle Details ergänzt werden können
- [ ] Edit-Seiten: Abschnitte sind in CollapsibleCards organisiert
- [ ] Keine Backend-Änderungen nötig (Schemas akzeptieren bereits optionale Felder)
- [ ] Alle Texte in EN und DE
