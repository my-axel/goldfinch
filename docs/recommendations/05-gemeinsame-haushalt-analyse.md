# 05 — Gemeinsame Haushalt-Analyse (Paar-Ebene)

**Priorität:** P1
**Bereich:** Plan-Seite, Dashboard
**Betroffene Dateien:**
- `src/frontend/src/routes/plan/+page.svelte` (Übersicht)
- `src/frontend/src/routes/plan/+page.ts` (Daten laden)
- `src/frontend/src/lib/components/compass/` (neue/erweiterte Komponenten)
- `src/frontend/src/lib/utils/retirement-gap.ts` (Aggregations-Logik)
- `src/backend/app/api/v1/endpoints/compass.py` (neuer Endpunkt)
- `src/backend/app/services/gap_analysis.py` (Aggregations-Service)
- `src/backend/app/schemas/retirement_gap.py` (neue Response-Schemas)
- `messages/en.json`, `messages/de.json`

---

## Problem

Die meisten Altersvorsorge-Tools zeigen die Situation nur pro Person — isoliert. Goldfinch hat zwar das Household-Konzept, aber die Gap-Analyse ist ebenfalls rein individuell. Für Paare/Verheiratete fehlt:

1. **Gemeinsame Bedarfs-Rechnung**: "Zusammen braucht ihr X€/Monat"
2. **Gemeinsame Lücken-Analyse**: "Eure gemeinsame Vorsorge deckt Y€, es fehlen Z€"
3. **Cross-Subsidierung**: Partner A hat ein Surplus, Partner B eine Lücke → zusammen sieht es anders aus
4. **Geteilte Assets**: Immobilien, gemeinsame Konten (→ Zukunft, siehe Recommendation 16)

Das ist ein echtes Differenzierungsmerkmal und der USP der App gegenüber individuellen Tools.

## Lösung

### 1. Neue Household-Zusammenfassung auf der Plan-Übersicht

Oben auf der `/plan`-Seite, VOR den individuellen Member-Karten:

```
┌─────────────────────────────────────────────────────────┐
│  Euer gemeinsamer Renten-Check                          │
│                                                          │
│  Zusammen braucht ihr:          4.200 €/Monat           │
│  Eure Vorsorge deckt:          3.450 €/Monat            │
│  ████████████████████░░░░░░  82%                        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐                       │
│  │ Axel    92%  │  │ Maria  71%  │                       │
│  │ ✓ Auf Kurs  │  │ ⚠ Lücke     │                       │
│  └─────────────┘  └─────────────┘                       │
│                                                          │
│  Hinweis: Axels Überschuss von 180€ kann Marias         │
│  Lücke teilweise ausgleichen.                            │
└─────────────────────────────────────────────────────────┘
```

### 2. Aggregations-Logik

Die Household-Aggregation ist im Frontend bereits teilweise vorhanden (`aggregateGapAnalyses` in `retirement-gap.ts`). Sie muss erweitert werden:

```typescript
interface HouseholdGapSummary {
  // Summen über alle Members
  total_needed_monthly: GapScenarios          // Summe aller needed_monthly_at_retirement
  total_pension_income: GapScenarios          // Summe aller monthly_pension_income
  total_remaining_gap: GapScenarios           // Summe aller remaining_monthly_gap
  total_required_capital: GapScenarios        // Summe aller required_capital
  total_projected_capital: GapScenarios       // Summe aller projected_capital
  total_gap: GapScenarios                     // Summe aller gaps

  // Abdeckungsrate
  coverage_rate: GapScenarios                 // total_pension_income / total_needed_monthly

  // Cross-Subsidierung
  members_with_surplus: MemberGapSummary[]    // Members mit positivem Gap
  members_with_gap: MemberGapSummary[]        // Members mit negativem Gap
  cross_subsidy_possible: boolean             // Gibt es Surplus + Gap gleichzeitig?

  // Status
  household_status: 'on_track' | 'needs_attention' | 'critical'

  // Pro Member
  per_member: MemberGapSummary[]
}

interface MemberGapSummary {
  member_id: number
  member_name: string
  needed_monthly: number
  pension_income: GapScenarios
  gap: GapScenarios
  coverage_rate: GapScenarios
  status: 'on_track' | 'needs_attention' | 'critical'
}
```

### 3. Backend: Neuer Aggregations-Endpunkt

```python
# In src/backend/app/api/v1/endpoints/compass.py

@router.get("/gap-analysis/household", response_model=HouseholdGapAnalysisResponse)
async def get_household_gap_analysis(db: Session = Depends(get_db)):
    """
    Aggregierte Gap-Analyse über alle Household-Members mit Gap-Config.
    Berechnet individuelle Analysen und summiert die Ergebnisse.
    """
    members = crud_household.get_multi(db)
    configs = crud_gap_config.get_all(db)

    results = []
    for config in configs:
        member = next(m for m in members if m.id == config.member_id)
        analysis = gap_analysis_service.calculate(db, member, config)
        results.append((member, analysis))

    return aggregate_household(results)
```

### 4. Cross-Subsidierung erklären

Wenn Partner A einen Überschuss und Partner B eine Lücke hat:

```
"Hinweis: Wenn ihr eure Finanzen gemeinsam betrachtet,
gleicht Axels Überschuss von 180€/Monat Marias Lücke von 580€/Monat
teilweise aus. Die verbleibende gemeinsame Lücke beträgt 400€/Monat."
```

Diese Information ist motivierend und realistisch — Paare teilen in der Regel ihre Finanzen.

---

## Implementierung

### Neue Komponente: `HouseholdGapSummary.svelte`

```typescript
// Props
{
  summary: HouseholdGapSummary
  members: HouseholdMember[]
}
```

**Rendering:**
- Card mit "Euer gemeinsamer Renten-Check" als Titel
- Große Zahl: Gesamtbedarf + Gesamtdeckung
- Fortschrittsbalken (coverage_rate)
- Mini-Karten pro Partner (wie im Wireframe oben)
- Optional: Cross-Subsidierungs-Hinweis

### Plan-Übersichtsseite: Neue Struktur

**Aktuell:**
```
PageHeader
GapTimelineChart (aggregiert)
GapMemberCard (pro Member)
```

**Neu:**
```
PageHeader ("Renten-Check")
HouseholdGapSummary (NEU — aggregierte Karte)
GapTimelineChart (aggregiert, mit Household-Linie)
GapMemberCard (pro Member) → Link zur Detail-Seite
```

### Frontend-Aggregation (als Fallback)

Falls der Backend-Endpunkt noch nicht existiert, kann die Aggregation auch im Frontend passieren — die Daten werden bereits in `+page.ts` geladen:

```typescript
// In src/frontend/src/routes/plan/+page.ts
// Bestehend: gapResults Map<member_id, GapAnalysisResult>
// Neu: Aggregation im Frontend
import { aggregateGapAnalyses } from '$lib/utils/retirement-gap'

const householdSummary = aggregateGapAnalyses(
  Array.from(gapResults.values())
)
```

Die bestehende `aggregateGapAnalyses`-Funktion in `retirement-gap.ts` muss um Coverage-Rate und Cross-Subsidierung erweitert werden.

### Schema-Erweiterung Backend

```python
# In src/backend/app/schemas/retirement_gap.py

class MemberGapSummary(BaseModel):
    member_id: int
    member_name: str
    needed_monthly_at_retirement: Decimal
    monthly_pension_income: GapScenarios
    remaining_monthly_gap: GapScenarios
    coverage_rate: GapScenarios  # pension_income / needed_monthly
    status: str  # "on_track" | "needs_attention" | "critical"

class HouseholdGapAnalysisResponse(BaseModel):
    total_needed_monthly: Decimal
    total_pension_income: GapScenarios
    total_gap: GapScenarios
    total_projected_capital: GapScenarios
    total_required_capital: GapScenarios
    household_coverage_rate: GapScenarios
    household_status: str
    cross_subsidy_possible: bool
    cross_subsidy_amount: Optional[GapScenarios]  # Surplus-Betrag der zum Ausgleich dient
    per_member: List[MemberGapSummary]
    members_configured: int
    members_total: int
```

---

## i18n Keys

```json
{
  "household_gap_title": "Your joint retirement check",
  "household_gap_together_need": "Together you need",
  "household_gap_together_covered": "Your combined savings cover",
  "household_gap_per_month": "/month",
  "household_gap_cross_subsidy": "{name_surplus}'s surplus of {amount} partially offsets {name_gap}'s gap. The remaining joint gap is {remaining}/month.",
  "household_gap_all_on_track": "As a household, you're on track for retirement.",
  "household_gap_partially": "As a household, you're partially covered.",
  "household_gap_critical": "As a household, there's a significant retirement gap.",
  "household_gap_not_all_configured": "{configured} of {total} members have a retirement check configured.",
  "household_gap_configure_all": "Configure all members for a complete household picture."
}
```

---

## Akzeptanzkriterien

- [ ] Plan-Übersichtsseite zeigt Household-Zusammenfassung oben
- [ ] Zusammenfassung zeigt: Gesamtbedarf, Gesamtdeckung, Abdeckungsrate als %
- [ ] Mini-Karten pro Partner mit individuellem Status
- [ ] Cross-Subsidierungs-Hinweis wenn ein Partner Surplus hat und der andere eine Lücke
- [ ] Backend: Neuer Endpunkt `/gap-analysis/household` (oder Frontend-Aggregation)
- [ ] Household-Status: Grün/Gelb/Rot basierend auf aggregierter Lücke
- [ ] Hinweis wenn nicht alle Members konfiguriert sind
- [ ] Alle Texte in EN und DE
- [ ] Fortschrittsbalken für gemeinsame Abdeckungsrate
