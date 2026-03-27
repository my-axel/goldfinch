# 12 — Steuer-Berücksichtigung

**Priorität:** P3
**Bereich:** Gap-Analyse, Pension-Typen
**Betroffene Dateien:**
- `src/backend/app/schemas/retirement_gap.py` (neue Felder)
- `src/backend/app/models/retirement_gap.py` (neue Spalten)
- `src/backend/app/services/gap_analysis.py` (Steuer-Logik)
- `src/frontend/src/lib/components/compass/GapConfigForm.svelte`
- `src/frontend/src/lib/components/compass/GapResultDisplay.svelte`
- `messages/en.json`, `messages/de.json`

---

## Problem

Die Gap-Analyse rechnet komplett brutto. In der Realität sind Renteneinnahmen unterschiedlich besteuert:

- **Gesetzliche Rente:** Nachgelagerte Besteuerung (abhängig vom Renteneintritts-Kohorte, aktuell ~80-100% steuerpflichtig)
- **Betriebsrente:** Voll steuerpflichtig (Einkommensteuer + Sozialabgaben)
- **Private Versicherung:** Ertragsanteilbesteuerung (nur ein Teil wird besteuert, abhängig vom Alter)
- **ETF:** 26,375% Abgeltungssteuer auf Gewinne (+ Teilfreistellung 30% für Aktien-ETF)
- **Sparkonto:** 26,375% Abgeltungssteuer auf Zinsen (über Freibetrag)

Das kann die realen Renteneinnahmen um 15-30% reduzieren.

## Lösung

### Ansatz: Pauschaler Steuersatz pro Pensionstyp

Kein vollständiges Steuer-Modell (zu komplex, hängt von persönlicher Situation ab), sondern **pauschale Steuersätze** als Annäherung:

| Pensionstyp | Default-Steuersatz | Begründung |
|-------------|-------------------|------------|
| State | 25% | Durchschnitt nachgelagerter Besteuerung |
| Company | 30% | Einkommensteuer + Sozialabgaben |
| Insurance | 15% | Ertragsanteil bei Rentenalter ~67 |
| ETF | 18.5% | 26.375% × 70% (nach Teilfreistellung) |
| Savings | 26.375% | Abgeltungssteuer voll |

### Implementierung

#### 1. Neue Felder in Gap-Config

```python
# Neues Feld (optional)
consider_taxes: bool = False  # Default: Brutto wie bisher
```

#### 2. Default-Steuersätze in Settings oder als Konstanten

```python
DEFAULT_TAX_RATES = {
    "state": Decimal("0.25"),
    "company": Decimal("0.30"),
    "insurance": Decimal("0.15"),
    "etf": Decimal("0.185"),
    "savings": Decimal("0.26375"),
}
```

#### 3. Gap-Analyse-Anpassung

Wenn `consider_taxes = True`:
```python
# In gap_analysis.py
net_state_monthly = gross_state_monthly * (1 - tax_rate_state)
net_company_monthly = gross_company_monthly * (1 - tax_rate_company)
# etc.
```

#### 4. Frontend: Toggle + Ergebnis-Anzeige

In der GapConfigForm ein einfacher Toggle:
```
☐ Steuern berücksichtigen (Annäherung)
  ℹ Verwendet pauschale Steuersätze pro Vorsorgetyp.
    Für eine exakte Berechnung konsultiere einen Steuerberater.
```

In der Ergebnis-Anzeige: Brutto vs. Netto nebeneinander.

### Warum P3?

- Hohe Komplexität für korrekte Umsetzung
- Pauschale Sätze können irreführend sein (individuelle Situation variiert stark)
- Freibeträge, Progressionsvorbehalt, Günstigerprüfung — alles nicht abbildbar
- Besser: Klar kommunizieren "Brutto-Betrachtung" und auf Steuerberater verweisen

---

## i18n Keys

```json
{
  "gap_consider_taxes": "Consider taxes (approximation)",
  "gap_taxes_hint": "Uses flat tax rates per pension type. For exact calculations, consult a tax advisor.",
  "gap_result_gross": "Gross (before tax)",
  "gap_result_net": "Net (after approx. tax)"
}
```

---

## Akzeptanzkriterien

- [ ] Optional: Toggle "Steuern berücksichtigen" in Gap-Config
- [ ] Pauschale Steuersätze pro Pensionstyp
- [ ] Ergebnis zeigt Brutto vs. Netto wenn aktiviert
- [ ] Klarer Hinweis: "Annäherung, kein Ersatz für Steuerberater"
- [ ] Default: Aus (bestehendes Verhalten)
- [ ] Alle Texte in EN und DE
