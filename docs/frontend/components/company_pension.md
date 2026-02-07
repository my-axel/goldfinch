# Company Pension Frontend Documentation (Current)

## Overview

Company pension UI is implemented with React Hook Form + React Query hooks + service layer.

## Current routes

- `/pension/company/new`
- `/pension/company/[id]/edit`

## Core types

Type source: `src/frontend/types/pension.ts`

Key points:
- `CompanyPension.id` is `number`
- `member_id` is `number`
- status values are `ACTIVE | PAUSED`
- statements and projections use numeric IDs

## Data layer

Main hooks are in:
- `src/frontend/hooks/pension/useCompanyPensions.ts`

Typical hooks used by pages:
- `useCompanyPension(id)`
- `useUpdateCompanyPension()`
- `useUpdateCompanyPensionWithStatement()`
- `useCreateCompanyPensionStatement()`
- `useUpdateCompanyPensionStatus()`

Service functions live in:
- `src/frontend/services/companyPensionService.ts`

## Form architecture

Edit page uses:
- `useCompanyPension` for loading
- `useFormReset` for API-to-form initialization
- transformer `companyPensionToForm`

Reference page:
- `app/pension/company/[id]/edit/page.tsx`

## Component map

- `BasicInformationCard`
- `ContributionPlanCard`
- `PensionStatementsCard`
- `ContributionHistoryCard`
- explanation components under `components/pension/company/explanations/*`

## Notes

- Legacy `PensionContext` references are historical and no longer the current data architecture.
- `usePensionData` is no longer the primary company pension data-loading pattern.
