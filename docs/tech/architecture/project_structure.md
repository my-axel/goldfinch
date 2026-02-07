# Project Structure (Current)

This structure reflects the current repository layout and key application areas.

```text
.
├── app/                              # Next.js App Router pages
│   ├── compass/
│   ├── household/
│   ├── payout-strategy/
│   ├── pension/
│   │   ├── company/
│   │   ├── etf/
│   │   ├── insurance/
│   │   ├── savings/
│   │   └── state/
│   └── settings/
├── docs/
│   ├── backend/
│   ├── frontend/
│   ├── plans/
│   └── tech/
├── src/
│   ├── backend/
│   │   ├── alembic/
│   │   └── app/
│   │       ├── api/
│   │       ├── core/
│   │       ├── crud/
│   │       ├── db/
│   │       ├── models/
│   │       ├── schemas/
│   │       ├── services/
│   │       └── tasks/
│   └── frontend/
│       ├── components/
│       ├── context/                  # UI contexts only
│       ├── hooks/                    # React Query hooks
│       ├── lib/
│       ├── providers/
│       ├── services/
│       └── types/
├── public/
└── package.json
```

## Notes

- Pension API routing is singular: `/api/v1/pension/...`.
- Frontend data loading is hook/service based (React Query), not a central `PensionContext`.
- `docs/plans/done` and `docs/tech/archive` may reference legacy layouts and should be treated as historical.
