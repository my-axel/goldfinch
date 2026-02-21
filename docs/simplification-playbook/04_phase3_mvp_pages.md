# Phase 3: MVP-Schnitt fuer Dashboard, Compass und Payout Strategy

## 1. Ziel und Abgrenzung
Diese Phase reduziert statische Wunschlisten auf umsetzbare, nutzbare MVP-Kerne.

Ziele:
1. Dashboard liefert echte Kernwerte.
2. Compass liefert einen simplen Gap-Rechner.
3. Payout Strategy liefert einen einfachen Entnahmerahmen.
4. Nicht-MVP-Ideen werden explizit in M2/M3 ausgelagert.

Abgrenzung:
1. Kein Full-Feature-Rollout.
2. Keine Experten-Simulationen fuer alle Randfaelle.
3. Keine KI-Empfehlungsengine.

## 2. Betroffene Dateien (absolute Pfade)
Svelte-Routen:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/+page.svelte`
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/compass/+page.svelte`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/routes/payout-strategy/+page.svelte`

Optional neue APIs/Helper:
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/api/*` (falls kleine Summary-Endpunkte genutzt werden)
2. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/utils/*`
3. `/Users/axel/Coding/goldfinch-dev/src/backend/app/api/v1/endpoints/pension_summaries.py` (nur falls additive Summary-Felder noetig)

Doku:
1. `/Users/axel/Coding/goldfinch-dev/PROGRESS.md`
2. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/99_ABSCHLUSS.md`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
Dashboard MVP:
1. vier Kernkarten mit echten Daten:
   - Gesamtwert,
   - aktive Plaene,
   - letzter Datenstand,
   - naechste Aktion.
2. eine einfache Verlaufssicht.
3. keine langen Platzhalterlisten mehr.

Compass MVP:
1. Eingabe fuer Ziel-/Sollwert.
2. Gegenueberstellung aktueller erwarteter Werte.
3. einfache Lueckenanzeige.

Payout MVP:
1. Basis-Entnahmerate.
2. Laufzeitindikator in drei Szenarien (pessimistisch/realistisch/optimistisch).
3. klare Annahmen-Hinweise.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`:
   - bestehende Pension-Summary-Endpunkte.
2. `harmonisiert`:
   - additive Summary-Felder, falls fuer MVP-Berechnungen erforderlich.
3. `deprecated-intern`:
   - rein statische "coming soon"-Listen fuer Kernseiten.

### Datenmodell
1. Keine zwingende DB-Aenderung.
2. Additive API-Response-Erweiterungen ohne Breaking Contract sind erlaubt.

### Doku
1. M2/M3-Backlog fuer nicht-MVP-Ideen explizit ausweisen.
2. In `PROGRESS.md` den Status von "UI-Only" auf "MVP aktiv" aktualisieren.

## 4. Was bewusst nicht geaendert wird
1. Keine komplexen Risikomodelle.
2. Keine Steueroptimierungslogik.
3. Keine Marktkontext-Automatisierung.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Bestehende Seitenpfade bleiben gleich.
2. Additive Datenfelder statt ersetzender Payload-Aenderungen.
3. Alte Platzhaltertexte koennen schrittweise entfernt werden.

## 6. Testplan mit konkreten Befehlen
Svelte:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Backend:
```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

MVP-Szenarien:
1. Dashboard zeigt reale Minimaldaten statt Feature-Wunschliste.
2. Compass berechnet Gap mit konsistenten Eingangswerten.
3. Payout zeigt nachvollziehbare Basisprojektion fuer drei Szenarien.

## 7. Akzeptanzkriterien
1. Alle drei Seiten sind funktional nutzbar im MVP-Sinn.
2. Kein Kernbereich ist nur noch Platzhaltertext.
3. Nicht-MVP-Ideen sind sauber ausgelagert und priorisiert.

## 8. Rollback-Plan
1. Falls MVP-Datenfluss instabil ist, temporaer auf read-only Kernmetriken reduzieren.
2. Additive API-Felder koennen ignoriert werden, ohne Altverhalten zu brechen.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 4 bis 5 Arbeitstage.

Reihenfolge:
1. Dashboard MVP.
2. Compass MVP.
3. Payout MVP.
4. Backlog- und Doku-Bereinigung.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Dashboard/Compass/Payout als MVP live und testbar sind,
2. M2/M3-Ideen sauber ausgelagert sind,
3. Phase-3-Abschluss in `99_ABSCHLUSS.md` inkl. Commit-Referenz dokumentiert ist.
