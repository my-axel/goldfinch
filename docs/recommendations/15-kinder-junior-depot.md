# 15 — Kinder / Junior-Depot Support

**Priorität:** P3
**Bereich:** Household, Pension
**Betroffene Dateien:**
- `src/backend/app/models/household.py` (neues Feld)
- `src/backend/app/schemas/household.py` (neues Feld)
- `src/frontend/src/lib/types/household.ts` (neues Feld)
- `src/frontend/src/lib/components/household/MemberForm.svelte`
- `src/frontend/src/routes/plan/` (Ausblendung für Kinder)
- `messages/en.json`, `messages/de.json`

---

## Problem

Kinder können als Household-Member angelegt werden, aber:
- Rentenalter (67) macht für ein 3-jähriges Kind wenig Sinn als primäre Metrik
- Gap-Analyse ist irrelevant für Kinder
- Der eigentliche Use Case: "Ich spare 18 Jahre lang in ein Junior-Depot, wie viel wird daraus?"

## Lösung

### 1. Member-Typ-Flag

```python
# In HouseholdMember Model
member_type: str = "adult"  # "adult" | "child"
```

### 2. Kinderspezifisches Verhalten

| Bereich | Erwachsener | Kind |
|---------|-------------|------|
| Rentenalter | 63-70 (Standard: 67) | Nicht angezeigt |
| Pensionen | Alle 5 Typen | Nur ETF + Savings |
| Gap-Analyse | Verfügbar | Ausgeblendet |
| Dashboard | Portfolio + Projektion | Portfolio + "Wert mit 18/25/67" |
| Formular | Standard | Geburtstag + Name (kein Rentenalter) |

### 3. Projektions-Meilensteine für Kinder

Statt "Bei Renteneintritt" → Zeige Meilensteine:
- "Mit 18 Jahren: 48.500€"
- "Mit 25 Jahren: 72.000€"
- "Mit 67 Jahren: 890.000€"

### 4. MemberForm-Anpassung

```svelte
{#if memberType === 'child'}
  <!-- Kein Rentenalter-Feld -->
  <!-- Stattdessen: "Auszahlungsalter" mit Default 18 -->
  <StepperInput label={m.payout_age()} bind:value={payoutAge} min={16} max={30} />
{:else}
  <!-- Bestehendes Formular -->
{/if}
```

---

## Akzeptanzkriterien

- [ ] Household-Member hat ein `member_type`-Feld ("adult" / "child")
- [ ] Kind-spezifisches Formular (kein Rentenalter, stattdessen Auszahlungsalter)
- [ ] Gap-Analyse für Kinder ausgeblendet
- [ ] Projektionen zeigen Meilensteine (18, 25, 67 Jahre)
- [ ] Pension-Typ-Auswahl für Kinder eingeschränkt (nur ETF + Savings)
- [ ] Alle Texte in EN und DE
- [ ] Backend-Migration für neues Feld
