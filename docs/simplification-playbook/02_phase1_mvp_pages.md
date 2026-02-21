# Phase 1: MVP-Seiten — Dashboard, Compass, Payout Strategy

## 1. Ziel und Abgrenzung
Die drei Coming-Soon-Platzhalter werden mit echten Daten und nutzbarem MVP-Kern befuellt.

Ziele:
1. Dashboard: zeigt echte Kernwerte statt Platzhalterliste.
2. Compass: einfacher Gap-Rechner mit echten Pensionsdaten.
3. Payout Strategy: einfacher Entnahmerahmen mit drei Szenarien.

Abgrenzung:
1. Kein Full-Feature-Rollout.
2. Keine Experten-Simulationen.
3. Keine KI-Empfehlungsengine.
4. Nicht-MVP-Ideen kommen in den M2/M3-Backlog.

## 2. Betroffene Dateien
Svelte-Routen:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/+page.svelte` (Dashboard)
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/compass/+page.svelte`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/payout-strategy/+page.svelte`

Optional bei Bedarf:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/api/*` (falls neue Helper noetig)
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/utils/*`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension_summaries.py` (nur additive Felder)

## 3. Exakte Aenderungen

### Dashboard MVP
1. Vier Kernkarten mit echten Daten:
   - Gesamtwert aller Pensionen,
   - Anzahl aktiver Plaene,
   - letzter Datenstand,
   - naechste empfohlene Aktion.
2. Einfache Verlaufssicht (z. B. Balken oder Liste der Pensionswerte).
3. Platzhalterlisten entfernen.

### Compass MVP
1. Eingabe fuer Ziel-Rentenbetrag (monatlich).
2. Gegenuberstellung: aktuell erwarteter Wert vs. Zielwert.
3. Einfache Lueckenanzeige (Gap in EUR/Monat).

### Payout MVP
1. Basis-Entnahmerate (Gesamtwert / gewuenschte Laufzeit).
2. Laufzeitindikator in drei Szenarien (pessimistisch/realistisch/optimistisch).
3. Klare Annahmen-Hinweise fuer den Nutzer.

### Sidebar (Phase-0-Ausblendung rueckgaengig machen)
Nach Fertigstellung aller drei Seiten: Compass, Payout Strategy und Dashboard wieder einblenden.

## 4. Was bewusst nicht geaendert wird
1. Keine komplexen Risikomodelle.
2. Keine Steueroptimierungslogik.
3. Bestehende Pension-CRUD-Flows bleiben unveraendert.

## 5. Migrations- und Kompatibilitaetsstrategie
1. Bestehende Seitenpfade bleiben gleich.
2. Nur additive API-Felder, keine Breaking Changes.
3. Platzhaltertexte koennen direkt entfernt werden.

## 6. Testplan
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Manuell:
1. Dashboard zeigt reale Werte (kein Platzhaltertext mehr).
2. Compass berechnet Gap korrekt bei verschiedenen Eingaben.
3. Payout zeigt drei Szenarien mit nachvollziehbaren Werten.

## 7. Akzeptanzkriterien
1. Alle drei Seiten sind funktional nutzbar.
2. Kein Kernbereich ist noch reiner Platzhaltertext.
3. Nicht-MVP-Ideen sind im Abschlussdokument als M2/M3 vermerkt.

## 8. Rollback-Plan
Falls MVP-Datenfluss instabil: temporaer auf einfache read-only Metriken reduzieren.
Additive API-Felder koennen ignoriert werden, ohne Altverhalten zu brechen.

## 9. Zeitrahmen
Schaetzung: 4 bis 5 Arbeitstage.

Reihenfolge:
1. Dashboard MVP.
2. Compass MVP.
3. Payout MVP.
4. Sidebar wieder einblenden.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Dashboard/Compass/Payout als MVP live und testbar sind,
2. Nicht-MVP-Ideen in `99_ABSCHLUSS.md` als M2/M3 vermerkt sind,
3. Phase-1-Abschluss inkl. Commit-Referenz in `99_ABSCHLUSS.md` dokumentiert ist.
