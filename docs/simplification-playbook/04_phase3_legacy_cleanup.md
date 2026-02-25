# Phase 3: Legacy-Inventur und Cleanup

## 1. Ziel und Abgrenzung
Legacy-Code (React/Next.js in `/app` und `/src/frontend`) wird inventarisiert und kontrolliert abgebaut.

Ziele:
1. Klar dokumentieren, welche Teile des Legacy-Codes noch aktiv genutzt werden.
2. Inaktive Teile entfernen.
3. Noch aktiv genutzte Teile gezielt migrieren oder bewusst behalten.
4. Svelte ist danach der einzige aktive Frontend-Pfad.

Abgrenzung:
1. Kein Big-Bang-Loeschen ohne Inventur.
2. Kein Entfernen von Teilen, die noch gebraucht werden, ohne Ersatz.

## 2. Schritt 1: Inventur (zuerst machen!)
Bevor irgendetwas geloescht wird:

**Was nutze ich in `/app` noch konkret?**
(Hier ausfuellen bevor mit Schritt 2 begonnen wird)
- [ ] ...
- [ ] ...

**Was nutze ich in `/src/frontend` noch konkret?**
- [ ] ...
- [ ] ...

**Was kann direkt weg (sicher inaktiv)?**
- [ ] ...

**Was muss erst migriert werden?**
- [ ] ...

## 3. Betroffene Verzeichnisse
1. `/Users/axel/Coding/goldfinch-dev/app/` (Legacy Next.js)
2. `/Users/axel/Coding/goldfinch-dev/src/frontend/` (Legacy React)
3. `/Users/axel/Coding/goldfinch-dev/package.json` (Root-Level-Scripts pruefen)
4. `/Users/axel/Coding/goldfinch-dev/README.md` (Verweise auf Legacy entfernen)
5. `/Users/axel/Coding/goldfinch-dev/PROGRESS.md`

## 4. Exakte Aenderungen (nach Inventur)

### Code
1. Sicher inaktive Teile loeschen.
2. Noch genutzte Teile entweder:
   - nach Svelte migrieren (falls klein),
   - oder bewusst als "behalten bis X" dokumentieren.
3. Root-Level-Scripts bereinigen (keine verwaisten npm-Skripte fuer Legacy).

### Doku
1. README auf Svelte-Standard aktualisieren.
2. Verweise auf `/app` und `/src/frontend` als primaren Pfad entfernen.
3. `PROGRESS.md` auf "Svelte ist Standard" setzen.

## 5. Migrations- und Kompatibilitaetsstrategie
1. Legacy bleibt waehrend der Inventur vollstaendig erreichbar.
2. Loeschung nur nach expliziter Pruefung je Verzeichnis/Datei.
3. Git-History sichert alles — keine Angst vor Loeschen nach Pruefung.

## 6. Testplan
```bash
cd /Users/axel/Coding/goldfinch-dev/src/frontend
npm run check
```

Manuell nach Cleanup:
1. Svelte-Frontend startet und laeuft normal.
2. Backend-API funktioniert unveraendert.
3. Keine verwaisten Imports oder Skripte im Root-package.json.

## 7. Akzeptanzkriterien
1. Inventur ist ausgefuellt und dokumentiert.
2. Sicher inaktive Teile sind entfernt.
3. Verbleibende Legacy-Nutzung ist explizit begruendet und dokumentiert.
4. Svelte ist der einzige aktive Frontend-Pfad (oder Ausnahmen sind begruendet).

## 8. Rollback-Plan
Git-History — alles ist wiederherstellbar. Vor groesseren Loeschaktionen optional einen Tag erstellen.

## 9. Zeitrahmen
Schaetzung: 2 bis 4 Arbeitstage (abhaengig von Inventur-Ergebnis).

Reihenfolge:
1. Inventur ausfuellen.
2. Sicher inaktive Teile loeschen.
3. Noch genutzte Teile migrieren oder dokumentieren.
4. Doku-Bereinigung.
5. Finaler Smoke-Test.

## 10. Delete When Done
Diese Datei kann geloescht werden, wenn:
1. Inventur vollstaendig ausgefuellt ist,
2. Legacy-Zustand eindeutig geklaert und umgesetzt ist,
3. Abschluss inkl. Commit-Referenz in `99_ABSCHLUSS.md` steht.
