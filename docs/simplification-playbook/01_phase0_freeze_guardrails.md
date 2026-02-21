# Phase 0: Freeze und Guardrails

## 1. Ziel und Abgrenzung
Stabiler Startpunkt fuer die Entschlackung: Legacy einfrieren, Doku korrigieren, unreife Seiten ausblenden.

Ziele:
1. Legacy-React/Next klar einfrieren — kein neues Feature mehr dort.
2. Doku auf reale Runtime angleichen (Redis/Celery, nicht RabbitMQ).
3. Compass, Payout Strategy und Dashboard in der Sidebar ausblenden, bis die MVP-Seiten (Phase 1) fertig sind.

Abgrenzung:
1. Keine funktionalen Produktfeatures.
2. Kein Umbau von Business-Logik.
3. Kein Entfernen von Code in dieser Phase.

## 2. Betroffene Dateien
1. `/Users/axel/Coding/goldfinch-dev/README.md`
2. `/Users/axel/Coding/goldfinch-dev/DOCKER_SETUP.md`
3. `/Users/axel/Coding/goldfinch-dev/src/svelte-frontend/src/lib/components/layout/Sidebar.svelte`

## 3. Exakte Aenderungen

### Sidebar
Compass, Payout Strategy und Dashboard aus der Navigation ausblenden (einfaches `{#if false}` oder Kommentar reicht).
Kein Flag-System notwendig — die Seiten werden in Phase 1 befuellt und dann wieder eingeblendet.

### Doku
1. Root-README: Task-Stack Redis/Celery statt RabbitMQ.
2. `DOCKER_SETUP.md`: Konsistenz mit aktueller `docker-compose.yml` pruefen und korrigieren.
3. Kurzer Guardrail-Hinweis: kein neues Feature in `/app` oder `/src/frontend`.

## 4. Was bewusst nicht geaendert wird
1. Kein Entfernen von Legacy-Code.
2. Keine Migration von Endpunkten.

## 5. Testplan
```bash
cd /Users/axel/Coding/goldfinch-dev/src/svelte-frontend
npm run check
```

Manuell:
1. Sidebar zeigt Compass/Payout/Dashboard nicht mehr.
2. README und DOCKER_SETUP nennen Redis/Celery konsistent.

## 6. Akzeptanzkriterien
1. Legacy-Freeze-Regel ist in README dokumentiert.
2. Drei Sidebar-Punkte sind ausgeblendet.
3. Doku nennt die reale Infra korrekt.

## 7. Rollback-Plan
1. Sidebar-Ausblendung rueckgaengig machen.
2. Doku-Aenderungen per Git-Revert zurueckholen.

## 8. Zeitrahmen
Schaetzung: halber bis 1 Arbeitstag.

## 9. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Akzeptanzkriterien komplett erfuellt.
2. Eintrag in `99_ABSCHLUSS.md` vorhanden.
