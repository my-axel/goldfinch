# Goldfinch — Offene Todos

## 1. Payout Strategy Seite implementieren
**Priorität: hoch** | Status: Placeholder, noch keine echten Daten

Was umzusetzen ist:
- Gesamtvermögen aller aktiven Pläne summieren (alle 5 Pension-Typen)
- Gewünschte Entnahmedauer als Eingabe (z. B. 20 oder 30 Jahre)
- 3 Szenarien auf Basis der `scenarioRates` aus dem `settingsStore`:
  - pessimistisch: geringere Rendite / kürzere Laufzeit
  - realistisch: mittlere Werte
  - optimistisch: höhere Rendite / längere Laufzeit
- Klare Annahmen-Hinweise (keine Steuern, keine Inflation, vereinfachte Entnahme)

Betroffene Dateien:
- `src/frontend/src/routes/payout-strategy/+page.svelte`
- `src/frontend/src/routes/payout-strategy/+page.ts`
- Ggf. neue Komponenten unter `src/frontend/src/lib/components/payout/`

---

## 2. ETF Retry-Logik vereinfachen
**Priorität: mittel** | Status: offen

Was umzusetzen ist:
- In `src/backend/app/tasks/etf_pension.py`
- Maximale Retry-Anzahl von 20 auf 3–5 reduzieren
- Nach Erschöpfung der Versuche: klarer `FAILED`-Status mit lesbarem Fehlertext
- Optional: Backoff vereinfachen (fixe 60s statt exponentiell)

---

## 3. ETF Erstellungsflow — 2-Stufen-UI
**Priorität: niedrig (Someday/Maybe)** | Status: nice-to-have

Was umzusetzen ist:
- Schritt 1: Initialisierungsmethode wählen (`new` / `existing` / `historical`)
- Schritt 2: Nur die für diese Methode relevanten Felder anzeigen
- Klarere UI-Hinweise welche Schritte synchron/asynchron ablaufen

Betroffene Dateien:
- `src/frontend/src/routes/pension/etf/new/+page.svelte`
- `src/frontend/src/lib/components/pension/etf/BasicInformationCard.svelte`
