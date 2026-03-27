# 16 — Immobilien als Asset-Typ

**Priorität:** P3
**Bereich:** Neuer Bereich (eigenes Datenmodell)
**Betroffene Dateien:**
- `src/backend/app/models/` (neues Modell)
- `src/backend/app/schemas/` (neue Schemas)
- `src/backend/app/crud/` (neue CRUD-Operationen)
- `src/backend/app/api/v1/endpoints/` (neuer Endpunkt)
- `src/frontend/src/routes/` (neue Route oder Integration in Pension)
- `src/frontend/src/lib/types/` (neue Typen)
- `src/frontend/src/lib/components/` (neue Komponenten)
- `messages/en.json`, `messages/de.json`

---

## Problem

Für viele deutsche Paare ist die eigene Immobilie ein zentraler Teil der Altersvorsorge:
- **Selbstgenutzt:** Mietfreiheit im Alter (= "implizites Einkommen")
- **Vermietet:** Mieteinnahmen im Alter
- **Verkauf geplant:** Erlös als Kapital

Aktuell kann keiner dieser Fälle in Goldfinch abgebildet werden.

## Lösung

### Datenmodell

```python
class RealEstate(Base):
    id: int
    name: str                        # "Wohnung Berlin", "Haus München"
    member_id: int                   # Zuordnung (oder beide Partner)
    shared_with_member_id: int?      # Zweiter Eigentümer (Partner)
    ownership_share: Decimal         # 0.5 = 50% (bei geteiltem Eigentum)

    # Wert
    purchase_price: Decimal
    purchase_date: date
    current_estimated_value: Decimal
    value_last_updated: date

    # Typ & Nutzung
    usage_type: str                  # "self_occupied" | "rented" | "mixed"

    # Kredit
    remaining_mortgage: Decimal?
    mortgage_monthly_payment: Decimal?
    mortgage_end_date: date?
    mortgage_interest_rate: Decimal?

    # Mieteinnahmen (wenn vermietet)
    monthly_rent_income: Decimal?
    monthly_rent_expenses: Decimal?  # Hausgeld, Instandhaltung

    # Altersvorsorge-Relevanz
    retirement_plan: str             # "keep" | "sell" | "rent_out"
    # keep = Mietfreiheit
    # sell = Verkaufserlös als Kapital
    # rent_out = Mieteinnahmen als Einkommen

    # Bei Verkauf
    expected_sale_value: Decimal?    # Geschätzter Verkaufswert im Alter
    planned_sale_year: int?          # Wann verkaufen?

    notes: str?
```

### Integration in Gap-Analyse

Je nach `retirement_plan`:

**"keep" (Selbstgenutzt, behalten):**
- Mietfreiheit = implizites Einkommen
- In der Gap-Analyse: "Benötigtes Einkommen" reduziert um geschätzte Miete
- Neues Feld in Gap-Config: `estimated_rent_savings: Decimal` (was man an Miete sparen würde)

**"sell" (Verkauf geplant):**
- `expected_sale_value - remaining_mortgage` wird zum projected_capital addiert
- In der Gap-Analyse: Erhöht das verfügbare Kapital

**"rent_out" (Vermieten im Alter):**
- `monthly_rent_income - monthly_rent_expenses` wird zur fixed_income addiert
- In der Gap-Analyse: Zusätzliche monatliche Einnahme (ähnlich wie Betriebsrente)

### Frontend-Integration

**Option A: Eigene Seite** (empfohlen)
- Neue Route `/assets` oder `/real-estate`
- Eigene Karten, Formulare
- Im Sidebar: Neuer Eintrag "Immobilien" / "Real Estate"

**Option B: Als Pension-Typ**
- 6. Typ neben ETF, Insurance etc.
- Vorteil: Weniger neue Infrastruktur
- Nachteil: Immobilie ist keine "Pension" — konzeptionell falsch

### Warum P3?

- Großer Aufwand (neues Modell, CRUD, API, Frontend)
- Immobilienbewertung ist subjektiv (kein automatischer Kursabruf)
- Kredit-Modellierung ist komplex (Tilgung, Sondertilgung, Zinsbindung)
- Aber: Hoher strategischer Wert für deutsche Zielgruppe

---

## Akzeptanzkriterien

- [ ] Neues Datenmodell für Immobilien
- [ ] CRUD-Endpoints
- [ ] Formular: Basisinfos, Kreditinfos, Nutzungstyp, Altersvorsorgerelevanz
- [ ] Integration in Gap-Analyse (je nach retirement_plan)
- [ ] Darstellung auf Dashboard (als eigener Asset-Typ)
- [ ] Gemeinsames Eigentum (ownership_share)
- [ ] Alle Texte in EN und DE
