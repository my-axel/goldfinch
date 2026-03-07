---
name: pr-check
description: Goldfinch PR-Checkliste vor dem Merge
---
Prüfe folgende Punkte und erstelle einen PR-Bericht:
1. Backend-Tests: `cd src/backend && python -m pytest`
2. Frontend type-check: `cd src/frontend && npm run check`
3. i18n vollständig: Alle neuen Keys in en.json + de.json vorhanden?
4. API-Schema konsistent: Pydantic-Schemas zu TS-Types passend?
5. Alembic: Ausstehende Migrations?