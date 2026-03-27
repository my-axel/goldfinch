# 13 — Notifications & Reminders

**Priorität:** P3
**Bereich:** Global
**Betroffene Dateien:**
- `src/backend/app/models/` (neues Notification-Modell)
- `src/backend/app/api/v1/endpoints/` (neuer Endpunkt)
- `src/backend/app/tasks/` (Celery-Tasks für Checks)
- `src/frontend/src/lib/components/layout/Sidebar.svelte` (Badge)
- `src/frontend/src/routes/+layout.svelte` (Notification-Loading)
- `messages/en.json`, `messages/de.json`

---

## Problem

Die App ist komplett passiv. Es gibt keine Hinweise:
- "Du hast seit 8 Monaten kein Statement für deine Versicherung aktualisiert"
- "Dein ETF-Kurs ist seit 5 Tagen nicht aktualisiert"
- "Deine Renteninformation ist über 1 Jahr alt"
- "Du hast noch keinen Renten-Check eingerichtet"

User vergessen, ihre Daten aktuell zu halten — und die Projektionen werden ungenauer.

## Lösung

### Leichtgewichtige In-App-Hinweise

Keine echten Push-Notifications, sondern **In-App-Hinweise** die beim Öffnen der App angezeigt werden.

### Typen von Hinweisen

| Typ | Bedingung | Text |
|-----|-----------|------|
| Veraltetes Statement | Pension mit Statement älter als X Monate | "Deine [Name]-Bescheinigung ist {months} Monate alt. Hast du eine neue?" |
| ETF-Preis veraltet | ETF letzte Preis-Aktualisierung > 7 Tage | "ETF-Kurse sind seit {days} Tagen nicht aktualisiert." |
| Fehlende Gap-Config | Member ohne Gap-Config | "{Name} hat noch keinen Renten-Check." |
| Jahresupdate | Januar: Erinnerung an neues Statement | "Neues Jahr! Hast du eine neue Renteninformation oder Standmitteilung erhalten?" |

### Anzeige

**Option A: Badge in der Sidebar**
- Kleine Zahl am Dashboard-Icon: "3"
- Im Dashboard: Liste der Hinweise oben

**Option B: Dedizierter Notification-Bereich**
- Glocken-Icon in der Sidebar
- Dropdown oder eigene Seite

**Empfehlung:** Option A — einfacher, weniger aufwändig.

### Backend

Kein eigenes Notification-Modell nötig. Stattdessen: **Berechnung bei jedem Dashboard-Load.**

```python
@router.get("/notifications")
async def get_notifications(db: Session = Depends(get_db)):
    notifications = []

    # Check: Veraltete Statements
    for pension in all_pensions:
        if pension.latest_statement_date < now - timedelta(days=365):
            notifications.append({
                "type": "stale_statement",
                "pension_id": pension.id,
                "pension_name": pension.name,
                "months_old": months_since(pension.latest_statement_date)
            })

    # Check: ETF-Preise veraltet
    for etf_pension in etf_pensions:
        if etf_pension.etf.last_update < now - timedelta(days=7):
            notifications.append(...)

    # Check: Fehlende Gap-Configs
    for member in members:
        if not has_gap_config(member.id):
            notifications.append(...)

    return notifications
```

---

## Akzeptanzkriterien

- [ ] Dashboard zeigt Hinweise bei veralteten Daten
- [ ] Hinweis bei Statements älter als 12 Monate
- [ ] Hinweis bei ETF-Preisen älter als 7 Tage
- [ ] Hinweis bei fehlender Gap-Config
- [ ] Hinweise sind dismissable (einmal weggeklickt = weg bis Bedingung erneut erfüllt)
- [ ] Alle Texte in EN und DE
