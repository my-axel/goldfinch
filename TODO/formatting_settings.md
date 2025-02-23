# Number, Currency and Date Formatting Implementation Plan

## Backend Tasks

### Database and Models
- [x] Create new settings model in `app/models/settings.py`
  * Add `ui_locale` field (string, default "en-US")
  * Add `number_locale` field (string, default "en-US")
  * Add `currency` field (string, default "USD")
  * Add timestamps (created_at, updated_at)
  * Add appropriate SQLAlchemy relationships

- [x] Create Alembic migration for settings table
  * Generate migration file
  * Add upgrade and downgrade functions
  * Test migration in both directions
  * Add default settings row for existing users

### API and Schemas
- [x] Create settings Pydantic schemas in `app/schemas/settings.py`
  * Base schema with all fields
  * Create schema for new settings
  * Response schema including timestamps
  * Add validation for supported locales and currencies

- [x] Create settings CRUD operations in `app/crud/settings.py`
  * Add get_settings function
  * Add update_settings function
  * Add create_default_settings function
  * Add proper error handling

- [x] Create settings API endpoints in `app/api/settings.py`
  * GET endpoint to retrieve current settings
  * PUT endpoint to update settings
  * Add proper error responses
  * Add API documentation

## Frontend Tasks

### Core Formatting Module
- [x] Create `lib/transforms.ts` utility file
  * Implement SafeNumber interface
  * Implement SafeDate interface
  * Add number formatting functions
  * Add date formatting functions
  * Add parsing functions for user input
  * Add locale-specific separator helpers
  * Add comprehensive error handling
  * Add TypeScript type definitions

### API Integration
- [x] Create enhanced API client in `lib/api-client.ts`
  * Implement request interceptor for data transformation
  * Add number field detection
  * Add date field detection
  * Add proper error handling
  * Add TypeScript types for all API responses

### Settings Context
- [x] Update `context/SettingsContext.tsx`
  * Add new settings fields
  * Add loading state
  * Add error state
  * Add settings sync with backend
  * Add proper TypeScript types
  * Add persistence to localStorage as fallback

### Settings Page
- [x] Update `app/settings/page.tsx`
  * Add language selection
  * Add number format selection
  * Add currency selection
  * Create preview component
  * Add loading states
  * Add error states
  * Add proper form validation
  * Ensure responsive design

### Component Updates
- [x] Update `PensionList.tsx`
  * Replace hardcoded number formatting
  * Replace hardcoded date formatting
  * Add proper error handling
  * Update TypeScript types

- [x] Update `OneTimeInvestmentModal.tsx`
  * Update number input handling
  * Update date input handling
  * Add input validation
  * Add error messages
  * Update TypeScript types

- [x] Update all other components using numbers or dates
  * [x] Update `EditInsurancePensionForm.tsx`
  * [x] Update `AddETFPensionForm.tsx`
  * [x] Update `EditETFPensionForm.tsx`
  * [x] Update `EditCompanyPensionForm.tsx`

## Documentation

### Backend Documentation
- [x] Update API documentation
  * Document new endpoints
  * Add request/response examples
  * Document error cases
  * Update OpenAPI schema

### Frontend Documentation
- [x] Create formatting utility documentation
  * Document all available functions
  * Add usage examples
  * Document error handling
  * Add TypeScript type documentation

## Deployment

### Migration Plan
- [x] Create deployment checklist
  * Database migration steps
  * Default settings creation
  * Rollback procedure
  * Monitoring points

## Notes
- All locale implementations should use the browser's Intl API
- Numbers should always use thousand separators
- Dates in the backend should always be in YYYY-MM-DD format
- Currency symbols should follow locale conventions (€ after in DE, $ before in US)
- All user inputs must be validated before sending to backend
- All components must handle loading and error states gracefully 