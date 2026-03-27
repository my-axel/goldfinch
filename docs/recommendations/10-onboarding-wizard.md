# 10 — Onboarding / Geführter Einstieg

**Priorität:** P2
**Bereich:** Global (neue Route)
**Betroffene Dateien:**
- Neue Route: `src/frontend/src/routes/onboarding/+page.svelte` (+ ggf. Steps)
- `src/frontend/src/routes/+page.svelte` (Dashboard — Redirect/Erkennung)
- `src/frontend/src/routes/+layout.svelte` (Sidebar ausblenden während Onboarding)
- `src/frontend/src/lib/stores/` (Onboarding-State)
- `src/frontend/src/lib/api/household.ts`, `pension.ts`, `settings.ts`
- `messages/en.json`, `messages/de.json`

---

## Problem

Ein neuer User sieht ein leeres Dashboard und muss sich selbst erschließen:
1. Erst Household-Member anlegen
2. Dann Pensionen pro Member erstellen
3. Dann Plan konfigurieren

Ohne Anleitung ist die Reihenfolge unklar und die Time-to-Value hoch. Besonders für das Docker-Release (andere Nutzer) ist ein Onboarding essentiell.

## Lösung

### Mehrstufiger Wizard

Ein Onboarding-Flow mit 4-5 Schritten, der beim ersten App-Besuch angezeigt wird.

```
Schritt 1: Willkommen
→ "Goldfinch hilft dir, deine Altersvorsorge zu planen.
   Lass uns in wenigen Schritten dein Profil einrichten."

Schritt 2: Wer seid ihr?
→ Formular für den ersten Household-Member (Name, Geburtstag, Rentenalter)
→ "Hast du einen Partner?" → Ja → Zweites Formular
→ Direkte Erstellung via API

Schritt 3: Welche Vorsorge habt ihr?
→ Pro Member: Typ-Auswahl (Checkboxen)
  ☑ Gesetzliche Rente
  ☑ Betriebsrente
  ☐ Versicherung
  ☑ ETF-Sparplan
  ☐ Sparkonto
→ Für jeden ausgewählten Typ: Minimale Daten (Name, ggf. aktueller Wert)
→ Direkte Erstellung via API (Minimum Viable Pension)

Schritt 4: Wie viel verdient ihr?
→ Pro Member: Netto-Einkommen (für Gap-Analyse)
→ Optionale Frage: "Bis zu welchem Alter soll euer Geld reichen?" (Default 90)
→ Gap-Config erstellen

Schritt 5: Fertig!
→ Zusammenfassung: "Ihr habt X Vorsorgeverträge angelegt."
→ Erster Renten-Check Ergebnis (sofort berechnet)
→ "Zum Dashboard →" Button
```

### Wann wird das Onboarding angezeigt?

**Erkennung:** Wenn keine Household-Members existieren → Redirect zu `/onboarding`

In `+layout.svelte` oder `+page.ts` des Dashboards:
```typescript
if (members.length === 0) {
  goto('/onboarding')
}
```

**Skip-Option:** "Ich kenne mich aus, direkt zum Dashboard →" Link auf jeder Wizard-Seite.

### Wizard-State

```typescript
// Lokaler State — kein Backend-Feld nötig
interface OnboardingState {
  step: number
  members: { first_name: string, last_name: string, birthday: string, retirement_age: number }[]
  pensions: { member_index: number, type: PensionType, name: string, value?: number }[]
  income: { member_index: number, net_monthly: number }[]
}
```

Der State wird nur lokal gehalten. Bei jedem Schritt werden die Daten direkt via API gespeichert. Der Wizard ist also "idempotent" — bei Abbruch sind die bereits erstellten Einträge gespeichert.

---

## Implementierung

### Route-Struktur

```
src/frontend/src/routes/onboarding/
  +page.svelte          # Wizard-Container mit Step-Management
  +page.ts              # Prüft ob Onboarding nötig (redirect wenn Members existieren)
```

Alternativ als Multi-Page:
```
src/frontend/src/routes/onboarding/
  +layout.svelte        # Wizard-Layout (keine Sidebar, Progress-Bar oben)
  step1/+page.svelte    # Willkommen
  step2/+page.svelte    # Household
  step3/+page.svelte    # Pensionen
  step4/+page.svelte    # Einkommen
  step5/+page.svelte    # Fertig
```

**Empfehlung:** Single-Page mit Steps (einfacher, weniger Routing-Logik).

### Wizard-Layout

Während des Onboardings: Sidebar ausblenden, eigenes Layout:
```
┌──────────────────────────────────────────────┐
│  🐦 Goldfinch                                │
│                                               │
│  ● ● ○ ○ ○   Schritt 2 von 5                │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │  Wer seid ihr?                        │    │
│  │                                       │    │
│  │  [Formular]                           │    │
│  │                                       │    │
│  │  [Zurück]           [Weiter →]       │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  Überspringen →                               │
└──────────────────────────────────────────────┘
```

### Keine Backend-Änderungen nötig

Alle APIs existieren bereits:
- `POST /household` — Member anlegen
- `POST /pension/{type}` — Pension anlegen
- `POST /gap-config/{member_id}` — Gap-Config anlegen
- `GET /gap-analysis/{member_id}` — Ergebnis berechnen

Der Wizard nutzt die bestehenden APIs sequenziell.

---

## i18n Keys (Auswahl)

```json
{
  "onboarding_welcome_title": "Welcome to Goldfinch",
  "onboarding_welcome_description": "Let's set up your retirement planning in a few steps.",
  "onboarding_step_household": "Who are you?",
  "onboarding_step_household_partner": "Do you have a partner?",
  "onboarding_step_pensions": "What retirement savings do you have?",
  "onboarding_step_pensions_hint": "Select all that apply. You can add details later.",
  "onboarding_step_income": "What's your income?",
  "onboarding_step_income_hint": "This is used to calculate how much you'll need in retirement.",
  "onboarding_step_done_title": "You're all set!",
  "onboarding_step_done_description": "You've set up {pension_count} retirement plans. Here's your first retirement check.",
  "onboarding_skip": "I know my way around, skip to dashboard",
  "onboarding_next": "Continue",
  "onboarding_back": "Back",
  "onboarding_go_to_dashboard": "Go to Dashboard"
}
```

---

## Akzeptanzkriterien

- [ ] Neuer User (keine Members) wird automatisch zum Onboarding geleitet
- [ ] Wizard hat 4-5 Schritte mit Progress-Indikator
- [ ] Schritt 2: Ein oder zwei Members anlegen (Name, Geburtstag, Rentenalter)
- [ ] Schritt 3: Pension-Typen auswählen und mit Minimum-Daten anlegen
- [ ] Schritt 4: Netto-Einkommen pro Member eingeben
- [ ] Schritt 5: Zusammenfassung mit erstem Renten-Check-Ergebnis
- [ ] Skip-Option auf jeder Seite
- [ ] Daten werden bei jedem Schritt sofort via API gespeichert
- [ ] Sidebar ist während des Onboardings ausgeblendet
- [ ] Alle Texte in EN und DE
