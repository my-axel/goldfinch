.
├── app
│   ├── household
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── pension
│   │   ├── company
│   │   │   ├── [id]
│   │   │   │   └── edit
│   │   │   └── new
│   │   │       └── page.tsx
│   │   ├── etf
│   │   │   ├── [id]
│   │   │   │   ├── edit
│   │   │   │   └── page.tsx
│   │   │   └── new
│   │   │       └── page.tsx
│   │   ├── insurance
│   │   │   ├── [id]
│   │   │   │   └── edit
│   │   │   └── new
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── settings
│   │   └── page.tsx
│   └── styles
│       └── globals.css
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── public
│   └── goldfinch_logo.jpg
├── README.md
├── src
│   ├── backend
│   │   ├── alembic
│   │   │   ├── env.py
│   │   │   ├── README
│   │   │   └── script.py.mako
│   │   ├── alembic.ini
│   │   ├── app
│   │   │   ├── api
│   │   │   │   └── v1
│   │   │   ├── core
│   │   │   │   ├── celery_app.py
│   │   │   │   ├── config.py
│   │   │   │   ├── currency.py
│   │   │   │   ├── logging.py
│   │   │   │   └── startup.py
│   │   │   ├── crud
│   │   │   │   ├── base.py
│   │   │   │   ├── etf.py
│   │   │   │   ├── etf_update.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── settings.py
│   │   │   │   └── update_tracking.py
│   │   │   ├── db
│   │   │   │   ├── base_class.py
│   │   │   │   ├── base.py
│   │   │   │   └── session.py
│   │   │   ├── main.py
│   │   │   ├── models
│   │   │   │   ├── enums.py
│   │   │   │   ├── etf.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── settings.py
│   │   │   │   ├── task.py
│   │   │   │   └── update_tracking.py
│   │   │   ├── schemas
│   │   │   │   ├── etf.py
│   │   │   │   ├── etf_update.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   ├── household.py
│   │   │   │   ├── pension_company.py
│   │   │   │   ├── pension_etf.py
│   │   │   │   ├── pension_insurance.py
│   │   │   │   ├── pension.py
│   │   │   │   ├── settings.py
│   │   │   │   └── task.py
│   │   │   ├── services
│   │   │   │   ├── etf_service.py
│   │   │   │   ├── exchange_rate.py
│   │   │   │   └── yfinance.py
│   │   │   └── tasks
│   │   │       ├── etf_pension.py
│   │   │       ├── etf.py
│   │   │       └── exchange_rates.py
│   │   ├── docs
│   │   │   ├── etf_service
│   │   │   │   ├── etf_service_deployment.md
│   │   │   │   ├── etf_service_internal.md
│   │   │   │   ├── etf_service.md
│   │   │   │   └── etf_service_security.md
│   │   │   ├── exchange_rates
│   │   │   │   ├── exchange_rates_internal.md
│   │   │   │   ├── exchange_rates.md
│   │   │   │   ├── exchange_rates_migration.md
│   │   │   │   └── exchange_rates_security.md
│   │   │   └── settings
│   │   │       ├── settings_deployment.md
│   │   │       └── settings.md
│   │   ├── logs
│   │   │   ├── api.log
│   │   │   ├── goldfinch.log
│   │   │   ├── models.log
│   │   │   ├── services.log
│   │   │   └── tasks.log
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   └── setup.py
│   └── frontend
│       ├── app
│       │   └── pension
│       │       └── etf
│       ├── components
│       │   ├── charts
│       │   │   ├── ChartErrorBoundary.tsx
│       │   │   ├── ChartLegend.tsx
│       │   │   ├── chart-theme.ts
│       │   │   ├── ChartTooltip.tsx
│       │   │   ├── ChartWrapper.tsx
│       │   │   ├── ContributionHistoryChart.tsx
│       │   │   ├── index.ts
│       │   │   ├── PerformanceMetricsChart.tsx
│       │   │   └── ValueDevelopmentChart.tsx
│       │   ├── common
│       │   ├── etf
│       │   │   └── ETFSearchCombobox.tsx
│       │   ├── household
│       │   │   ├── AddMemberDialog.tsx
│       │   │   ├── EditMemberDialog.tsx
│       │   │   ├── MemberForm.tsx
│       │   │   └── MemberList.tsx
│       │   ├── layout
│       │   │   ├── AppSidebar.tsx
│       │   │   ├── mode-toggle.tsx
│       │   │   └── theme-provider.tsx
│       │   ├── pension
│       │   │   ├── ETFPensionStats.tsx
│       │   │   ├── form
│       │   │   ├── OneTimeInvestmentModal.tsx
│       │   │   ├── PauseConfirmationDialog.tsx
│       │   │   ├── PensionList.tsx
│       │   │   ├── PensionTypeSelectionModal.tsx
│       │   │   └── ResumeDateDialog.tsx
│       │   └── ui
│       │       ├── alert-dialog.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── checkbox.tsx
│       │       ├── command.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── form.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── popover.tsx
│       │       ├── radio-group.tsx
│       │       ├── select.tsx
│       │       ├── separator.tsx
│       │       ├── sheet.tsx
│       │       ├── sidebar.tsx
│       │       ├── skeleton.tsx
│       │       ├── sonner.tsx
│       │       ├── switch.tsx
│       │       ├── textarea.tsx
│       │       └── tooltip.tsx
│       ├── context
│       │   ├── ETFContext.tsx
│       │   ├── HouseholdContext.tsx
│       │   ├── PensionContext.tsx
│       │   └── SettingsContext.tsx
│       ├── docs
│       │   ├── charts.md
│       │   └── formatting.md
│       ├── hooks
│       │   ├── useApi.ts
│       │   ├── useDebounce.ts
│       │   └── use-mobile.ts
│       ├── lib
│       │   ├── api-client.ts
│       │   ├── contribution-plan.ts
│       │   ├── routes
│       │   │   ├── api
│       │   │   ├── constants.ts
│       │   │   ├── index.ts
│       │   │   ├── pages
│       │   │   └── types.ts
│       │   ├── routes.ts
│       │   ├── transforms.ts
│       │   ├── utils.ts
│       │   └── validations
│       │       └── pension.ts
│       ├── providers
│       │   └── AppProviders.tsx
│       └── types
│           ├── etf.ts
│           ├── household-helpers.ts
│           ├── household.ts
│           ├── pension-form.ts
│           ├── pension-helpers.ts
│           ├── pension-statistics.ts
│           └── pension.ts
├── tailwind.config.ts
└── tsconfig.json

60 directories, 158 files
