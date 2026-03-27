# 01 — Dashboard als emotionales Zuhause stärken

**Priorität:** P1
**Bereich:** Dashboard
**Betroffene Dateien:**
- `src/frontend/src/routes/+page.svelte` (Haupt-Dashboard)
- `src/frontend/src/routes/+page.ts` (Daten laden)
- `src/frontend/src/lib/components/dashboard/` (Dashboard-Komponenten)
- `src/backend/app/api/v1/endpoints/dashboard.py` (ggf. neue Aggregate)
- `messages/en.json`, `messages/de.json` (i18n)

---

## Problem

Das Dashboard zeigt viele Charts und Karten, aber keine klare, emotionale "Headline". Der User öffnet die App und muss sich durch mehrere Abschnitte lesen, um ein Gefühl zu bekommen: "Wie stehe ich da?"

Es fehlt:
- **Eine prominente Headline-Zahl** ("Euer Vorsorgevermögen: 142.350€")
- **Ein einfacher Fortschrittsbalken** zum Zielkapital (projected_capital / required_capital)
- **Trend-Indikator** auf einen Blick ("+2,3% diesen Monat" / "auf Kurs" / "Achtung")
- Die "All"-Ansicht (HouseholdSwitcher) summiert Zahlen, zeigt aber keinen echten gemeinsamen Überblick

## Lösung

### 1. Hero-Section am Seitenanfang

Direkt unter dem PageHeader eine neue Hero-Komponente mit:

```
┌──────────────────────────────────────────────────────┐
│  Euer Vorsorgevermögen                               │
│  ████████████████████████████████████████████████████ │
│  142.350 €                            +2,3% / Monat  │
│                                                       │
│  ████████████████████░░░░░░░░  73% vom Zielkapital   │
│  142.350 € von 195.000 € (realistisches Szenario)   │
└──────────────────────────────────────────────────────┘
```

**Bestandteile:**
- Gesamtvermögen als große Zahl (FormattedCurrency, prominent)
- Monatliche Veränderung in % und absolut (aus bestehenden `growth`-Daten)
- Fortschrittsbalken: `projected_capital.realistic / required_capital.realistic` aus Gap-Analyse
- Textuelle Einordnung: "73% vom Zielkapital (realistisches Szenario)"

**Fallback wenn keine Gap-Config existiert:**
- Nur Vermögenszahl + Trend anzeigen
- Fortschrittsbalken weglassen mit Hinweis: "Richte deinen Renten-Check ein, um dein Ziel zu sehen" (Link zu /plan)

### 2. Household-Switcher beibehalten, aber "Zusammen"-Ansicht aufwerten

Wenn "Alle" ausgewählt ist:
- Hero zeigt Summe beider Partner
- Darunter kleine Karten pro Partner mit deren Anteil

Wenn ein Member ausgewählt ist:
- Hero zeigt nur dessen Werte

### 3. Bestehende Sections neu ordnen

Aktuelle Reihenfolge:
1. HouseholdSwitcher
2. RetirementStatusBanner
3. Portfolio Overview Cards
4. HistoricalPerformanceChart
5. ScenarioProjectionChart
6. RetirementGapChartCard
7. FixedIncomeCard

**Neue Reihenfolge:**
1. HouseholdSwitcher
2. **NEU: Hero-Section** (Vermögen + Fortschritt + Trend)
3. Portfolio Overview Cards (kompakter, als Sub-Section der Hero)
4. HistoricalPerformanceChart
5. ScenarioProjectionChart
6. FixedIncomeCard
7. RetirementStatusBanner → **entfernen oder in Hero integrieren** (die Info steckt dann im Fortschrittsbalken)
8. RetirementGapChartCard → **auf die Plan-Seite verschieben** (gehört dort hin, nicht aufs Dashboard)

---

## Implementierung

### Neue Komponente: `DashboardHero.svelte`

**Props:**
```typescript
{
  totalValue: number              // Gesamtvermögen aktuell
  monthlyChange: number           // Veränderung in % zum Vormonat
  monthlyChangeAbsolute: number   // Veränderung absolut
  yearlyChange: number            // Veränderung in % zum Vorjahr
  targetCapital: number | null    // required_capital aus Gap-Analyse (null wenn keine Config)
  projectedCapital: number | null // projected_capital aus Gap-Analyse
  scenario: 'pessimistic' | 'realistic' | 'optimistic' // welches Szenario für Fortschritt
  hasGapConfig: boolean           // ob Gap-Config existiert
}
```

**Visuell:**
- Große Zahl: `text-4xl font-bold` für Vermögen
- Trend-Badge: Grün (positiv) / Rot (negativ) mit Pfeil-Icon
- Fortschrittsbalken: CSS `<div>` mit prozentualem `width`, Farbe je nach Fortschritt:
  - < 50%: Rot-Töne
  - 50-80%: Gelb/Orange
  - > 80%: Grün
- Darunter Text: "X€ von Y€ (realistisches Szenario)"

### Daten

Die meisten Daten existieren bereits:
- `totalValue` → kommt aus `dashboardStore.householdTotal` bzw. `selectedTotal`
- `monthlyChange` / `yearlyChange` → kommt aus bestehenden `growth`-Berechnungen in `+page.svelte`
- `targetCapital` / `projectedCapital` → aus Gap-Analyse-API (`/api/v1/gap-analysis/{member_id}`)

**Neu benötigt:**
- Ein aggregierter Gap-Endpunkt oder Frontend-Aggregation über alle Members hinweg
- Die `+page.ts` muss zusätzlich Gap-Analyse-Daten laden (für den Fortschrittsbalken)
- Ggf. neuer Backend-Endpunkt: `GET /api/v1/gap-analysis/household` der alle Members aggregiert

### Backend-Erweiterung (optional, kann auch Frontend-seitig aggregiert werden)

```python
# In src/backend/app/api/v1/endpoints/compass.py
@router.get("/gap-analysis/household")
async def get_household_gap_analysis(db: Session = Depends(get_db)):
    """Aggregierte Gap-Analyse über alle Household Members mit Gap-Config."""
    # Für jeden Member mit Gap-Config die Analyse berechnen
    # Summen bilden: total projected_capital, total required_capital
    # Return: HouseholdGapSummary
```

---

## Akzeptanzkriterien

- [ ] Dashboard zeigt prominent den Gesamtwert des Vorsorgevermögens als große Zahl
- [ ] Monatliche/jährliche Veränderung wird als Badge angezeigt (grün/rot)
- [ ] Wenn Gap-Config existiert: Fortschrittsbalken mit % zum Zielkapital
- [ ] Wenn keine Gap-Config: Hinweis mit Link zum Renten-Check
- [ ] "Alle"-Ansicht zeigt Haushalt-Summe
- [ ] Einzelperson-Ansicht zeigt individuelle Werte
- [ ] RetirementGapChartCard ist vom Dashboard auf die Plan-Seite verschoben
- [ ] RetirementStatusBanner ist in die Hero-Section integriert (kein separates Element mehr)
- [ ] Alle Texte in EN und DE (i18n)
