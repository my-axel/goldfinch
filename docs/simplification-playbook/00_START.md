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
1. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend` als Primaer-Frontend.
2. Fachliche Entschlackung im Bereich Pension-Editing, ETF-Initialisierung und MVP-Seiten.
3. Konsistenz- und Komplexitaetsreduktion im Backend (Task-Orchestrierung, Status- und Statement-Flows).
4. Dokumentationsbereinigung und klare Cutover-Vorbereitung.

Out of Scope:
1. Vollstaendige Neuentwicklung der Domainenlogik.
2. Erweiterung auf neue Asset-Klassen.
3. Aufbau einer erweiterten Task-Monitoring-Plattform.
4. Produktisierung ausserhalb des Hobby-Projekt-Rahmens.

## Nicht-Ziele
1. Keine API-Neugestaltung mit bewusstem Bruch existierender Clients.
2. Kein Big-Bang-Rewrite in einem einzigen Sprint.
3. Keine Performance-Mikrooptimierungen ohne Wartbarkeitsnutzen.
4. Kein paralleler Feature-Ausbau in Legacy-React und Svelte.

## Phasenreihenfolge
1. [Phase 0] Freeze und Guardrails.
2. [Phase 1] Svelte technisch entschlacken.
3. [Phase 2] ETF-Flow vereinfachen bei Erhalt der drei Initialisierungsmethoden.
4. [Phase 3] Dashboard/Compass/Payout als echtes MVP schneiden.
5. [Phase 4] Backend-Tasks und Endpunktkonsistenz entschlacken.
6. [Phase 5] Svelte-Standardisierung, Legacy-Abbau, Cleanup.

Reihenfolge ist verbindlich. Spaetere Phasen duerfen nur gestartet werden, wenn die Akzeptanzkriterien der vorherigen Phase erfuellt sind oder eine dokumentierte Ausnahme vorliegt.

## Globale Regeln
1. Keine Breaking Changes an bestehenden API-Contracts.
2. Additive Harmonisierung ist erlaubt und bevorzugt.
3. Jede Phase dokumentiert:
   - stabile Endpunkte,
   - harmonisierte Endpunkte,
   - deprecated-intern Endpunkte.
4. Jede Phase enthaelt einen konkreten Rollback-Plan.
5. Jede Phase muss testbar sein mit den unten definierten Kommandos.
6. Jede Phase endet mit einem `Delete When Done`-Abschnitt.
7. Nach Abschluss einer Phase wird ihr Ergebnis im Abschlussdokument protokolliert.
8. Nur Phasen-Dateien `01` bis `06` sind temporaer und loeschbar.

## API/Interface Status-Kategorien
`stabil`:
1. Verhalten und Contract unveraendert.
2. Nur interne Refactorings.

`harmonisiert`:
1. Additive Vereinheitlichung ohne Bruch.
2. Alte und neue Nutzungsweise koennen parallel funktionieren.

`deprecated-intern`:
1. Altpfad bleibt lauffaehig.
2. Interne Nutzung wird auf den harmonisierten Pfad migriert.
3. Entfernen erst nach expliziter Entscheidung ausserhalb dieses Dossiers.

## Risiko-Matrix
| Risiko | Eintritt | Auswirkung | Gegenmassnahme | Trigger |
|---|---|---|---|---|
| Scope-Creep durch "nice-to-have" | Mittel | Hoch | harte MVP-Grenzen pro Phase | neue Anforderungen ohne Dossier-Update |
| Versteckte API-Inkonsistenzen | Hoch | Mittel | expliziter Endpunkt-Check je Phase | Fehlverhalten in Edit/Delete-Flows |
| Task-Komplexitaet bleibt trotz Refactoring | Mittel | Hoch | Minimalbetrieb als Leitregel | neue periodische Jobs ohne Business-Zwang |
| Parallelpflege Legacy + Svelte | Hoch | Mittel | Legacy-Freeze + sichtbare Guardrails | neue Features in `/app` oder `/src/frontend` |
| Testluecken im Backend-Setup | Hoch | Mittel | Umgebungs-Hinweise und Gate-Check pro Phase | fehlende Python-Testumgebung |

## Globale Test- und Qualitaetsvorgaben
Svelte-Check (pro Phase):
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Backend-Regression (pro Phase):
```bash
cd /Users/axel/Coding/goldfinch-dev/src/backend
python3 -m pytest
```

Hinweis:
1. Falls `pytest` lokal nicht installiert ist, zuerst Abhaengigkeiten installieren und in der Phase dokumentieren.
2. Bei bekannten, bereits vorhandenen Test-Infrastruktur-Luecken muessen diese als Risiko im Phasenprotokoll stehen.

## Globale Abnahmekriterien
1. Jede Phase hat vollstaendig ausgefuellte Pflichtkapitel.
2. Jede Phase hat mindestens einen verifizierbaren Testlauf oder einen klar dokumentierten Blocker.
3. `99_ABSCHLUSS.md` enthaelt nach jeder implementierten Phase einen Eintrag im Umsetzungsprotokoll.
4. Loeschung von Phasen-Dateien erfolgt erst nach dokumentierter Erfuellung aller Akzeptanzkriterien.

## Linkliste aller Phasen
1. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/01_phase0_freeze_guardrails.md`
2. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/02_phase1_svelte_tech_slim.md`
3. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/03_phase2_etf_simplification.md`
4. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/04_phase3_mvp_pages.md`
5. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/05_phase4_backend_tasks_consistency.md`
6. `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/06_phase5_cutover_cleanup.md`
7. Abschluss: `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/99_ABSCHLUSS.md`

## Arbeitsregel fuer Loeschungen
1. `00_START.md` bleibt bestehen.
2. `99_ABSCHLUSS.md` bleibt bestehen.
3. `01` bis `06` werden einzeln geloescht, sobald sie implementiert, getestet, protokolliert und abgenommen sind.
