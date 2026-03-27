# 08 — Dashboard → Plan Verknüpfung verbessern

**Priorität:** P2
**Bereich:** Dashboard, Plan
**Betroffene Dateien:**
- `src/frontend/src/routes/+page.svelte` (Dashboard)
- `src/frontend/src/lib/components/dashboard/RetirementStatusBanner.svelte`
- `src/frontend/src/lib/components/dashboard/DashboardHero.svelte` (neu, aus Rec. 01)
- `messages/en.json`, `messages/de.json`

---

## Problem

Das Dashboard zeigt einen `RetirementStatusBanner` mit Gap-Informationen ("Needs Attention", Monats-Gap), aber:

1. Der Weg von "Ich sehe ein Problem" zu "Was kann ich tun?" ist nicht direkt
2. User muss selbst zur Plan-Seite navigieren
3. Wenn keine Gap-Config existiert, fehlt der Hinweis komplett
4. Es gibt keinen "Call to Action" der den User zur richtigen Stelle führt

## Lösung

### 1. CTA im Dashboard-Hero (wenn keine Gap-Config)

Wenn die Hero-Section (Recommendation 01) keinen Fortschrittsbalken anzeigen kann, weil keine Gap-Config existiert:

```
┌──────────────────────────────────────────────────────┐
│  Euer Vorsorgevermögen: 142.350 €                    │
│                                                       │
│  ℹ Reicht euer Vermögen für die Rente?               │
│    Richte euren Renten-Check ein, um es              │
│    herauszufinden.                                    │
│                                                       │
│    [Renten-Check starten →]                           │
└──────────────────────────────────────────────────────┘
```

Der Button navigiert zu `/plan` — bzw. direkt zu `/plan/[member_id]` für den ersten Member ohne Config.

### 2. CTA im Dashboard-Hero (wenn Gap-Config existiert und Lücke)

Wenn der Fortschrittsbalken zeigt, dass eine Lücke besteht:

```
│  ████████████████████░░░░░░░░  73% vom Zielkapital   │
│                                                       │
│  Es fehlen noch ca. 520€/Monat.                      │
│  [Details im Renten-Check →]                          │
```

Der Link führt zur Plan-Detail-Seite des Members (oder Übersicht wenn "Alle" ausgewählt).

### 3. Kontext-sensitive Links

| Zustand | CTA |
|---------|-----|
| Keine Gap-Config für keinen Member | "Richten euren Renten-Check ein →" → `/plan` |
| Gap-Config existiert, auf Kurs | "Ihr seid auf Kurs! [Details →]" → `/plan` |
| Gap-Config existiert, Lücke | "Es fehlen noch X€/Monat. [Was tun? →]" → `/plan` |
| Gap-Config nur für einen Partner | "Maria hat noch keinen Renten-Check. [Jetzt einrichten →]" → `/plan/[maria_id]` |

---

## Implementierung

### Im Dashboard-Hero oder als separate Komponente

```svelte
{#if !hasAnyGapConfig}
  <div class="mt-4 p-3 rounded-lg bg-muted/50 border">
    <p class="text-sm">{m.dashboard_no_gap_config()}</p>
    <a href="/plan" class="text-sm font-medium text-primary hover:underline">
      {m.dashboard_start_check()} →
    </a>
  </div>
{:else if householdGap && householdGap.realistic < 0}
  <div class="mt-2">
    <p class="text-sm text-muted-foreground">
      {m.dashboard_gap_hint({ amount: formatCurrency(Math.abs(householdGap.realistic)) })}
    </p>
    <a href="/plan" class="text-sm font-medium text-primary hover:underline">
      {m.dashboard_gap_details()} →
    </a>
  </div>
{:else if !allMembersConfigured}
  <div class="mt-2">
    <p class="text-sm text-muted-foreground">
      {m.dashboard_partial_config({ name: unconfiguredMember.first_name })}
    </p>
    <a href="/plan/{unconfiguredMember.id}" class="text-sm font-medium text-primary hover:underline">
      {m.dashboard_configure_member()} →
    </a>
  </div>
{/if}
```

### Daten-Anforderung

Die `+page.ts` des Dashboards muss zusätzlich laden:
- Ob Gap-Configs existieren (leichtgewichtiger Check, z.B. `GET /gap-config` → Länge prüfen)
- Ggf. die aggregierte Household-Gap-Summary (aus Rec. 05)

Falls der Household-Endpunkt noch nicht existiert, reicht ein einfacher Check: "Existiert mindestens eine Gap-Config?"

---

## i18n Keys

```json
{
  "dashboard_no_gap_config": "Is your savings enough for retirement? Set up your retirement check to find out.",
  "dashboard_start_check": "Start Retirement Check",
  "dashboard_gap_hint": "There's a gap of approx. {amount}/month.",
  "dashboard_gap_details": "Details in Retirement Check",
  "dashboard_on_track": "You're on track! See details.",
  "dashboard_partial_config": "{name} doesn't have a retirement check yet.",
  "dashboard_configure_member": "Set up now"
}
```

---

## Akzeptanzkriterien

- [ ] Dashboard zeigt CTA wenn keine Gap-Config existiert
- [ ] Dashboard zeigt Gap-Hinweis + Link wenn Lücke besteht
- [ ] Dashboard zeigt Hinweis wenn nur ein Partner konfiguriert ist
- [ ] Links führen zur richtigen Plan-(Detail-)Seite
- [ ] Alle Texte in EN und DE
- [ ] Setzt Recommendation 01 (Dashboard Hero) voraus oder funktioniert als Standalone-Banner
