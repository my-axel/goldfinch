# Settings Deployment Guide (Current)

## Scope

Deployment and verification notes for settings-related backend/frontend changes.

## Backend steps

```bash
cd src/backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Verify endpoints:

```bash
curl -s http://localhost:8000/api/v1/settings
curl -s -X PUT http://localhost:8000/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{"currency":"EUR","number_locale":"de-DE"}'
```

## Frontend steps

From repository root:

```bash
npm run build
npm run start
```

Verify settings page behavior in UI:
- locale switching
- currency switching
- projection/state-pension rate updates

## Rollback

1. Revert code to previous release commit.
2. Roll back DB migration only if schema changed and downgrade exists.
3. Restart API and frontend.
4. Re-run `/api/v1/settings` checks.

## Notes

- This repository does not use a static `build/` artifact folder for Next.js deployment.
- Keep API contract docs and settings schema updates in the same PR.
