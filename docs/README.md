# Goldfinch Documentation

This directory contains project documentation for the Goldfinch retirement planning platform.

## Directory Structure

### Frontend (`/frontend`)
- Component and UX documentation
- Form and interaction patterns
- Frontend-specific implementation notes

### Backend (`/backend`)
- Service-level API documentation
- Operational and deployment notes
- Backend-specific security and internal docs

### Plans (`/plans`)
- Active implementation plans (`/active`)
- Completed work logs (`/done`)
- Draft ideas and templates

### Tech (`/tech`)
- Architecture and design notes
- Best-practice guidance
- Refactoring and technical debt tracking
- Testing and monitoring notes

## Documentation Status Model

Use this model consistently in docs:
- `Current`: normative documentation that should match implementation
- `Plan`: proposed or in-progress design
- `Archive`: historical reference, not normative

If a document is `Current`, it must be updated with code changes in the same PR.

## Maintenance Rules

1. Keep endpoint paths, schemas, and examples aligned with the backend source.
2. Mark historical content explicitly (`Archive`) to avoid confusion.
3. Keep links valid (no dangling references).
4. Prefer concise, verifiable statements over aspirational claims.
5. Include migration notes when behavior changes but legacy endpoints still exist.
