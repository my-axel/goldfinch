# Retirement Gap Analysis — MVP Requirements

> **Status:** Draft
> **Datum:** 2026-02-26
> **Scope:** MVP für die Kompass-Seite + Summary-Card im Dashboard

---

## 1. Ziel

Berechnung der individuellen Rentenlücke (Gap) je Haushaltsmitglied: Wie viel Vermögen fehlt zum Renteneintritt, um den gewünschten Lebensstandard zu halten?

Die Analyse wird auf der **Kompass-Seite** als interaktives Tool dargestellt. Eine **kompakte Summary** erscheint zusätzlich im Dashboard.

---

## 2. Datenmodell

### 2.1 Neue Tabelle: `retirement_gap_config`

Separate Tabelle (nicht am HouseholdMember), 1:1-Beziehung über `member_id`.

| Feld | Typ | Default | Beschreibung |
|---|---|---|---|
| `id` | Integer PK | auto | Primary Key |
| `member_id` | Integer FK (unique) | — | Referenz auf `household_member.id` |
| `net_monthly_income` | Decimal | — | Monatliches Nettogehalt |
| `desired_monthly_pension` | Decimal (nullable) | null | Manueller Override des Rentenbedarfs |
| `replacement_rate` | Decimal | 0.80 | Anteil des Nettos als Rentenbedarf (80%) |
| `withdrawal_rate` | Decimal | 0.04 | Safe Withdrawal Rate (4%) |
| `created_at` | DateTime | now | Erstellzeitpunkt |
| `updated_at` | DateTime | now | Letzter Update |

### 2.2 Bestehende Daten (kein Änderungsbedarf)

Die folgenden Daten werden aus bestehenden Modellen gelesen:

- **HouseholdMember**: `retirement_date_planned`, `retirement_age_planned`, Alter
- **PensionListItem**: Typ, `member_id`, aktuelle Werte, monatliche Auszahlungsprognosen
- **Settings**: `inflation_rate`, Szenario-Renditen (pessimistic/realistic/optimistic)
- **Dashboard Aggregate**: Projiziertes Gesamtvermögen je Member (3 Szenarien)

---

## 3. Berechnungslogik

### 3.1 Schritt 1 — Monatlicher Rentenbedarf

```
WENN desired_monthly_pension gesetzt:
    needed_monthly = desired_monthly_pension
SONST:
    needed_monthly = net_monthly_income × replacement_rate
```

**MVP-Methode:** Netto × Prozentsatz (default 80%).
**Spätere Erweiterung:** Netto minus Sparrate (berechnet aus Pensionsbeiträgen).

### 3.2 Schritt 2 — Monatliche Pensionseinkünfte (aus bestehenden Plänen)

Für jedes Haushaltsmitglied werden monatliche Auszahlungen summiert aus:

| Pensionstyp | Datenquelle | Beschreibung |
|---|---|---|
| **State** | `StatePensionList.latest_projected_amount` | Prognostizierte monatliche gesetzliche Rente |
| **Company** | `CompanyPensionList.latest_projections[].monthly_payout` | Betriebsrente (zum geplanten Rentenalter) |
| **Insurance** | `InsurancePensionProjection.monthly_payout` | Private Rentenversicherung (aus letztem Statement) |

**Wichtig:** Nur Pläne mit Status `ACTIVE` werden berücksichtigt.

```
monthly_pension_income = Σ(state_monthly + company_monthly + insurance_monthly)
```

### 3.3 Schritt 3 — Verbleibender monatlicher Gap

```
remaining_monthly_gap = needed_monthly - monthly_pension_income
```

Wenn negativ → Member ist allein durch monatliche Pensionen abgedeckt.

### 3.4 Schritt 4 — Benötigtes Kapital (Safe Withdrawal Rate)

```
required_annual = remaining_monthly_gap × 12
required_capital = required_annual / withdrawal_rate
```

**Inflationsanpassung** auf den Renteneintritt:

```
years_to_retirement = retirement_date_planned - heute (in Jahren)
required_capital_adjusted = required_capital × (1 + inflation_rate) ^ years_to_retirement
```

Die `inflation_rate` kommt aus den globalen Settings (default 2%).

### 3.5 Schritt 5 — Projiziertes Kapital (aus bestehenden Plänen)

Kapitalbasierte Pensionen (aus Dashboard-Aggregation, `by_type` Breakdown):

| Pensionstyp | Datenquelle |
|---|---|
| **ETF** | `AggregateSeriesResponse.by_type.ETF_PLAN.projection` — Endwert |
| **Savings** | `AggregateSeriesResponse.by_type.SAVINGS.projection` — Endwert |

Jeweils der letzte Wert in `pessimistic`, `realistic`, `optimistic`.

```
projected_capital = Σ(etf_projection_end + savings_projection_end)   // je Szenario
```

### 3.6 Schritt 6 — Finaler Gap

```
gap = required_capital_adjusted - projected_capital
```

- **Positiv** → Lücke (Vermögen fehlt)
- **Negativ** → Überschuss
- Berechnet für alle **3 Szenarien** (pessimistisch / realistisch / optimistisch)

### 3.7 Berechnungsbeispiel

```
Annahmen:
  Netto: 4.000 €/Monat
  Replacement Rate: 80%
  Withdrawal Rate: 4%
  Inflation: 2%
  Jahre bis Rente: 25
  Gesetzliche Rente: 1.200 €/Monat
  Betriebsrente: 300 €/Monat
  Versicherung: 200 €/Monat

Schritt 1: needed_monthly = 4.000 × 0.80 = 3.200 €
Schritt 2: monthly_pension_income = 1.200 + 300 + 200 = 1.700 €
Schritt 3: remaining_monthly_gap = 3.200 - 1.700 = 1.500 €
Schritt 4: required_capital = (1.500 × 12) / 0.04 = 450.000 €
           mit Inflation: 450.000 × (1.02)^25 = 738.611 €
Schritt 5: projected_capital (realistisch) = 520.000 € (ETF + Savings)
Schritt 6: gap = 738.611 - 520.000 = 218.611 € Lücke
```

---

## 4. UI-Spezifikation

### 4.1 Dashboard — Summary Card

Ersetzt die bestehende Placeholder-Card **"Retirement Goal Progress"** in der rechten Spalte (Future Projections).

**Zustand A — Keine Gap-Konfiguration vorhanden:**
- Titel: "Retirement Goal"
- CTA-Button: "Set up your retirement goal →" (Link zum Kompass)
- Kurze Beschreibung: "Calculate your retirement gap"

**Zustand B — Konfiguration vorhanden:**
- Titel: "Retirement Gap"
- Realistische Gap-Zahl als Hauptwert (große Schrift, farbcodiert)
  - Grün: Überschuss oder auf Kurs
  - Gelb/Orange: Moderate Lücke
  - Rot: Große Lücke
- Darunter: Pessimistisch / Optimistisch als Bandbreite (klein)
- Link: "View details →" (zum Kompass)
- Wenn Member-Selektor aktiv: zeigt Gap des ausgewählten Members

### 4.2 Kompass-Seite — Vollständige Analyse

Layout (von oben nach unten):

#### 4.2.1 Haushalt-Gesamtübersicht

- Summierter Gap aller Members (realistisches Szenario prominent)
- Status-Indikator: "On Track" / "Needs Attention" / "Critical"
- Szenario-Bandbreite (pessimistisch – optimistisch)

#### 4.2.2 Pro-Member-Sektionen (expandierbar)

Für jedes Haushaltsmitglied eine Sektion:

**Eingabefelder:**
| Feld | Typ | Beschreibung |
|---|---|---|
| Monatliches Nettogehalt | CurrencyInput | Pflichtfeld |
| Replacement Rate | Slider/NumberInput | Default 80%, Range 50–100% |
| Gewünschte monatliche Rente | CurrencyInput (optional) | Manueller Override, überschreibt die Berechnung |
| Withdrawal Rate | Slider/NumberInput | Default 4%, Range 2–6% |

**Ergebnisanzeige:**
| Kennzahl | Beschreibung |
|---|---|
| Benötigte monatliche Rente | Aus Netto × Rate oder Override |
| Monatliche Pensionseinkünfte | Summe State + Company + Insurance |
| Monatliche Lücke | Differenz |
| Benötigtes Kapital (heute) | Über SWR berechnet |
| Benötigtes Kapital (inflationsbereinigt) | Hochgerechnet auf Renteneintritt |
| Projiziertes Kapital | Aus Dashboard-Aggregation (3 Szenarien) |
| **Gap** | Differenz (3 Szenarien, farbcodiert) |

**Aufschlüsselung (optional aufklappbar):**
- Welche Pensionspläne liefern welchen Beitrag
- State: X €/Monat, Company: Y €/Monat, Insurance: Z €/Monat
- ETF: X € projiziert, Savings: Y € projiziert

#### 4.2.3 Roadmap-Cards (bestehend, unverändert)

Die drei bestehenden statischen Cards bleiben unterhalb der Analyse erhalten:
- Gap Analysis (mit Häkchen als "implementiert" markieren)
- Smart Recommendations
- Interactive Planning

---

## 5. Backend-Spezifikation

### 5.1 Neues Model

```python
class RetirementGapConfig(Base):
    __tablename__ = "retirement_gap_config"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("household_member.id"), unique=True, nullable=False)
    net_monthly_income = Column(Numeric(12, 2), nullable=False)
    desired_monthly_pension = Column(Numeric(12, 2), nullable=True)
    replacement_rate = Column(Numeric(5, 4), nullable=False, default=0.80)
    withdrawal_rate = Column(Numeric(5, 4), nullable=False, default=0.04)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    member = relationship("HouseholdMember", back_populates="gap_config")
```

### 5.2 Neue Schemas

```python
class RetirementGapConfigCreate(BaseModel):
    net_monthly_income: Decimal
    desired_monthly_pension: Optional[Decimal] = None
    replacement_rate: Decimal = Decimal("0.80")
    withdrawal_rate: Decimal = Decimal("0.04")

class RetirementGapConfigUpdate(BaseModel):
    net_monthly_income: Optional[Decimal] = None
    desired_monthly_pension: Optional[Decimal] = None
    replacement_rate: Optional[Decimal] = None
    withdrawal_rate: Optional[Decimal] = None

class RetirementGapConfigResponse(BaseModel):
    id: int
    member_id: int
    net_monthly_income: Decimal
    desired_monthly_pension: Optional[Decimal]
    replacement_rate: Decimal
    withdrawal_rate: Decimal
    created_at: datetime
    updated_at: datetime
```

### 5.3 Neue Endpoints

```
GET    /api/v1/compass/gap-config                    → Liste aller Configs
GET    /api/v1/compass/gap-config/{member_id}        → Config für ein Member
POST   /api/v1/compass/gap-config/{member_id}        → Config erstellen
PUT    /api/v1/compass/gap-config/{member_id}        → Config aktualisieren
DELETE /api/v1/compass/gap-config/{member_id}        → Config löschen
```

### 5.4 Alembic-Migration

Autogeneriert via `alembic revision --autogenerate -m "add retirement_gap_config table"`.

---

## 6. Frontend-Spezifikation

### 6.1 Neue Types

```typescript
// src/lib/types/compass.ts
interface RetirementGapConfig {
    id: number;
    member_id: number;
    net_monthly_income: number;
    desired_monthly_pension: number | null;
    replacement_rate: number;  // 0.80 = 80%
    withdrawal_rate: number;   // 0.04 = 4%
    created_at: string;
    updated_at: string;
}
```

### 6.2 Neuer API-Service

```typescript
// src/lib/api/compass.ts
- getAll(): RetirementGapConfig[]
- get(memberId): RetirementGapConfig
- create(memberId, data): RetirementGapConfig
- update(memberId, data): RetirementGapConfig
- delete(memberId): void
```

### 6.3 Berechnung (Frontend)

Die Gap-Berechnung erfolgt im **Frontend**, da alle Daten bereits verfügbar sind:
- Gap-Config: aus dem neuen Compass-API
- Pensionsliste: aus dem `pensionStore`
- Projektionen: aus der bestehenden Dashboard-Aggregate-API
- Settings (Inflation): aus dem `settingsStore`

Utility-Funktion in `src/lib/utils/gap-analysis.ts`.

### 6.4 Neue Komponenten

```
src/lib/components/compass/
├── GapHouseholdSummary.svelte     — Haushalt-Gesamtübersicht
├── GapMemberSection.svelte        — Pro-Member Sektion (Input + Ergebnis)
├── GapConfigForm.svelte           — Eingabeformular für Gap-Config
├── GapResultDisplay.svelte        — Ergebnisanzeige mit Szenarien
└── GapBreakdown.svelte            — Detailaufschlüsselung (optional)

src/lib/components/dashboard/
└── RetirementGapCard.svelte       — Summary-Card für Dashboard
```

---

## 7. i18n-Keys (Auswahl)

Neue Keys in `messages/en.json` und `messages/de.json`:

- `compass_gap_title`, `compass_gap_description`
- `compass_gap_net_income_label`, `compass_gap_replacement_rate_label`
- `compass_gap_desired_pension_label`, `compass_gap_withdrawal_rate_label`
- `compass_gap_needed_monthly`, `compass_gap_pension_income`
- `compass_gap_monthly_gap`, `compass_gap_required_capital`
- `compass_gap_projected_capital`, `compass_gap_final_gap`
- `compass_gap_surplus`, `compass_gap_shortfall`
- `compass_gap_on_track`, `compass_gap_needs_attention`, `compass_gap_critical`
- `dashboard_retirement_gap_title`, `dashboard_retirement_gap_setup_cta`

---

## 8. Edge Cases

| Case | Verhalten |
|---|---|
| Kein Member hat Gap-Config | Kompass zeigt CTA zum Einrichten |
| Member hat keine Pensionspläne | Gap = gesamter Rentenbedarf als Kapital |
| State Pension ohne Statements | monthly_pension_income = 0 für State |
| Company/Insurance ohne Auszahlungsprognose | Beitrag = 0 (nur Kapitalwert aus Projektion) |
| remaining_monthly_gap ≤ 0 | Required Capital = 0, Gap = -projected_capital (Überschuss) |
| Years to retirement = 0 oder negativ | Keine Inflation anwenden, Warnung anzeigen |
| desired_monthly_pension gesetzt | Überschreibt die Netto × Rate Berechnung, visuell kennzeichnen |

---

## 9. Nicht im MVP (spätere Iterationen)

- **Netto-minus-Sparrate Methode**: Automatische Berechnung der Sparrate aus Pensionsbeiträgen
- **Interaktive Szenario-Planung**: Was-wäre-wenn Slider für Rentenalter, zusätzliche Beiträge
- **Smart Recommendations**: Handlungsempfehlungen basierend auf der Lücke
- **Visualisierung**: Zeitleisten-Chart, Balkendiagramm der Lücke über Zeit
- **Payout Strategy Integration**: Verknüpfung mit der Auszahlungsstrategie-Seite
- **Steuern und Sozialabgaben**: Berücksichtigung von Abzügen in der Rentenphase

---

## 10. Implementierungsreihenfolge

1. Backend: Model + Migration + Schema + CRUD + Endpoints
2. Frontend: Types + API-Service
3. Frontend: Gap-Berechnungs-Utility
4. Frontend: Kompass-Seite UI (Config-Formular + Ergebnisanzeige)
5. Frontend: Dashboard Summary-Card
6. i18n: Alle neuen Keys (EN + DE)
7. Integration-Test: Vollständiger Flow durchspielen
