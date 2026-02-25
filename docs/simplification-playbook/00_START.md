# Simplification Playbook Start

## Zielbild
Dieses Dossier steuert die Entschlackung von Goldfinch als umsetzbare, loeschbare Phasen.

Leitziele:
1. MVP zuerst statt Vollausbau.
2. Keine Breaking Changes fuer bestehende API-Contracts.
3. Background-Strategie als Minimalbetrieb (nur essentielle periodische Jobs, Rest on-demand).
4. Fokus auf Svelte-Frontend, mit gezielten Backend- und Fachlichkeitsvereinfachungen.

## Scope
In Scope:
1. `src/frontend` als Primaer-Frontend.
2. MVP-Seiten: Dashboard, Compass, Payout Strategy mit echten Daten befuellen.
3. ETF-Flow vereinfachen (Retry-Reduktion, 2-Stufen-Erstellung).
4. Legacy-Code-Inventur und kontrollierter Abbau.

Out of Scope:
1. Vollstaendige Neuentwicklung der Domainenlogik.
2. Erweiterung auf neue Asset-Klassen.
3. Produktisierung ausserhalb des Hobby-Projekt-Rahmens.

## Nicht-Ziele
1. Kein API-Neugestaltung mit bewusstem Bruch existierender Clients.
2. Kein Big-Bang-Rewrite in einem einzigen Sprint.
3. Kein Refactoring von Code, der keinen konkreten Schmerz verursacht.

## Phasenreihenfolge
1. [Phase 0] Freeze und Guardrails — Legacy einfrieren, Doku korrigieren, unreife Seiten ausblenden.
2. [Phase 1] MVP-Seiten — Dashboard/Compass/Payout mit echten Daten.
3. [Phase 2] ETF-Flow vereinfachen — Retry reduzieren, 2-Stufen-Erstellungsflow.
4. [Phase 3] Legacy-Inventur und Cleanup — was ist noch aktiv, was kann weg.

Nicht mehr enthalten (nach Review gestrichen):
- ~~Svelte Tech Slim~~ — Code ist bereits gut strukturiert, kein konkreter Schmerz.
- ~~Backend Tasks Konsistenz~~ — Endpoints sind bereits hochkonsistent ueber alle 5 Typen.

## Globale Regeln
1. Keine Breaking Changes an bestehenden API-Contracts.
2. Jede Phase enthaelt einen `Delete When Done`-Abschnitt.
3. Nach Abschluss einer Phase wird ihr Ergebnis in `99_ABSCHLUSS.md` protokolliert.
4. Nur Phasen-Dateien `01` bis `04` sind temporaer und loeschbar.
5. Phasengates sind eine Empfehlung, kein hartes Lock — wenn eine Phase offensichtlich abgeschlossen ist, kann die naechste beginnen.

## Globale Test- und Qualitaetsvorgaben
Svelte-Check (pro Phase):
```bash
cd /Users/axel/Coding/goldfinch-dev/src/frontend
npm run check
```

Backend-Regression (pro Phase):
```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

## Globale Abnahmekriterien
1. Jede Phase hat vollstaendig ausgefuellte Pflichtkapitel.
2. Jede Phase hat mindestens einen verifizierbaren Testlauf oder einen klar dokumentierten Blocker.
3. `99_ABSCHLUSS.md` enthaelt nach jeder implementierten Phase einen Eintrag.
4. Loeschung von Phasen-Dateien erfolgt erst nach dokumentierter Erfuellung aller Akzeptanzkriterien.

## Linkliste aller Phasen
1. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/01_phase0_freeze_guardrails.md`
2. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/02_phase1_mvp_pages.md`
3. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/03_phase2_etf_simplification.md`
4. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/04_phase3_legacy_cleanup.md`
5. Abschluss: `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/99_ABSCHLUSS.md`

## Arbeitsregel fuer Loeschungen
1. `00_START.md` bleibt bestehen.
2. `99_ABSCHLUSS.md` bleibt bestehen.
3. `01` bis `04` werden einzeln geloescht, sobald sie implementiert, getestet, protokolliert und abgenommen sind.
