# Phase 0: Freeze und Guardrails

## 1. Ziel und Abgrenzung
Ziel dieser Phase ist ein stabiler Startpunkt fuer die Entschlackung.

Ziele:
1. Legacy-React/Next klar einfrieren.
2. Repo-Leitplanken einfuehren, damit neue Komplexitaet nicht unkontrolliert nachwaechst.
3. Dokumentation an die reale Runtime angleichen (Redis/Celery-Realitaet).
4. Navigation in Svelte fuer nicht gestartete Bereiche sauber ueber Feature-Flags steuern.

Abgrenzung:
1. Keine funktionalen Produktfeatures.
2. Kein Umbau von Business-Logik.
3. Kein Entfernen alter Module in dieser Phase.

## 2. Betroffene Dateien (absolute Pfade)
Primar:
1. `/Users/axel/Coding/goldfinch-dev/README.md`
2. `/Users/axel/Coding/goldfinch-dev/DOCKER_SETUP.md`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/layout/Sidebar.svelte`
4. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/paraglide/messages/*` (nur falls neue Feature-Flag-Labels benoetigt)

Optional:
1. `/Users/axel/Coding/goldfinch-dev/PROGRESS.md`
2. `/Users/axel/Coding/goldfinch-dev/docs/svelte_migration_plan.md`

## 3. Exakte Aenderungen (Code, API, Datenmodell, Doku)
### Code
1. In der Svelte-Navigation Feature-Flags fuer unreife Seiten einfuehren:
   - Dashboard,
   - Compass,
   - Payout Strategy.
2. Flag-Verhalten:
   - Flag aus: Menuepunkt versteckt oder als "MVP geplant" markiert.
   - Flag an: Route normal sichtbar.
3. Legacy-Freeze sichtbar machen:
   - klarer Hinweis in Legacy-Einstiegspunkten, dass nur Bugfixing erlaubt ist.

### API/Interfaces/Typen
API-Status in dieser Phase:
1. `stabil`: alle bestehenden Endpunkte.
2. `harmonisiert`: keine.
3. `deprecated-intern`: keine.

### Datenmodell
1. Keine Migration.
2. Keine Schema-Aenderung.

### Doku
1. Root-README korrigieren: Task-Stack Redis/Celery statt RabbitMQ-Nennung.
2. `DOCKER_SETUP.md` auf Konsistenz mit aktueller `docker-compose.yml` bringen.
3. Kurze Guardrail-Sektion aufnehmen:
   - kein neues Feature in `/Users/axel/Coding/goldfinch-dev/app`.
   - kein neues Feature in `/Users/axel/Coding/goldfinch-dev/src/frontend`.

## 4. Was bewusst nicht geaendert wird
1. Keine Entfernung von Legacy-Code.
2. Keine Migration von Endpunkten.
3. Keine Refactorings innerhalb der CRUD- oder Service-Layer.

## 5. Migrations- und Kompatibilitaetsstrategie ohne Breaking Changes
1. Nur additive Markierungen, Flags und Doku-Klarstellungen.
2. Bestehende Routen und Endpunkte bleiben erreichbar.
3. Kein Verhalten wird fuer bestehende Nutzer zwangsweise geaendert.

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

Manuelle Checks:
1. Sidebar zeigt/versteckt unreife Menuepunkte gemaess Flag.
2. README und DOCKER_SETUP widersprechen sich nicht bzgl. Task-Infra.

## 7. Akzeptanzkriterien
1. Legacy-Freeze-Regeln sind dokumentiert und sichtbar.
2. Navigation kann unreife Seiten gezielt ausblenden.
3. Doku nennt die reale Infra korrekt.
4. Keine API- oder Datenmodell-Aenderung.

## 8. Rollback-Plan
1. Feature-Flags in Sidebar auf "alles sichtbar" zuruecksetzen.
2. Doku-Aenderungen per Git-Revert rueckgaengig machen.
3. Kein Datenmodell betroffen, daher kein DB-Rollback notwendig.

## 9. Zeitrahmen und Reihenfolge innerhalb der Phase
Schaetzung: 1 bis 2 Arbeitstage.

Reihenfolge:
1. Doku-Korrekturen.
2. Sidebar-Flags.
3. Kurztest.
4. Protokoll in `99_ABSCHLUSS.md` vorbereiten.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn alle Punkte erfuellt sind:
1. Akzeptanzkriterien komplett erfuellt.
2. Testergebnis dokumentiert.
3. Eintrag in `/Users/axel/Coding/goldfinch-dev/docs/simplification-playbook/99_ABSCHLUSS.md` vorhanden.
4. Loeschdatum und Commit-Referenz in `99_ABSCHLUSS.md` eingetragen.
