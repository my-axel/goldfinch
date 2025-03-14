# Implementation Plan Template

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This template guides the planning and implementation of new features with a clear separation of backend and frontend concerns.
>
> ## When to Use
> - When implementing a new feature
> - When making significant changes to existing features
> - When implementation requires multiple steps or sessions
>
> ## Implementation Process
>
> ### 1. Planning Phase
> - Fill out Overview and Description sections
> - Check PROGRESS.md to align with project status
> - Create separate plans for backend and frontend when needed
> - Reference companion plans (link backend plan in frontend plan)
> - List all relevant rules and guidelines that must be followed
> - For backend plans, draft curl commands for testing each endpoint in the Testing section
>
> ### 2. Requirements Analysis
> - **Data Model**: Fields, types, relationships, validation rules, constraints
> - **API Endpoints**: Paths, methods, request/response schemas, authentication
> - **UI/UX**: Layout, components, interactions, states (loading, error, success)
> - **Integration**: External dependencies, performance requirements
>
> ### 3. Implementation Execution
> - Break down into clear, achievable steps with checkboxes (`- [ ] Step X`)
> - Complete backend implementation before starting frontend when possible
> - Check off steps (`- [x] Step X`) as they are completed
> - Update the Status field in Overview section as implementation progresses (from 📝 to 🟡 to ⚠️ to ✅)
> - Test backend endpoints using the curl commands after implementation
>
> ## Critical Guidelines
> 1. **Strict Plan Adherence**: Modify ONLY components explicitly mentioned in the plan. Get user approval for anything else.
>
> 2. **Code Examples Are References**: All code snippets in the plan are starting points only. Thoroughly examine the existing codebase before implementing.
>
> 3. **Incremental Implementation**: Implement in small, testable units. Complete and verify one step before moving to the next.
>
> 4. **Progress Tracking**: Check off completed steps and regularly update the user on progress, challenges, and blockers.
>
> 5. **Dependency Management**: Discuss with user before adding new dependencies. Document them in Technical Notes.
>
> 6. **Error Handling**: Implement proper error handling following existing patterns. Don't assume happy paths.
>
> 7. **Seek Clarification**: When requirements are ambiguous or multiple approaches exist, ask the user rather than making assumptions.
>
> 8. **Documentation**: Keep the plan updated with status changes, deviations, and technical learnings.
>
> 9. **Separation of Concerns**: Keep backend and frontend implementations separate and focused.
>
> 10. **Scope Changes**: Document changes, assess impact, get user approval before implementing, and update the plan accordingly.
>
> 11. **Communication**: Provide status updates at session start/end and after completing significant steps. Clearly describe blockers with possible solutions.
>
> </details>

## Overview
**Feature**: [Name of the Feature]
**Type**: [Backend | Frontend | Full-Stack]
**Duration**: [Estimated time in hours/sessions]
**Status**: [📝 Not Started | 🟡 Planning | ⚠️ In Progress | ✅ Complete]
**Priority**: [High/Medium/Low]
**Related Plan**: [Link to companion backend/frontend plan if applicable]

## Description
[2-3 sentences describing what this feature is and why it's needed]

## Important Rules & Guidelines
> List relevant best practices, rules, or patterns that MUST be followed
- Rule 1: [e.g., "Use EnumSelect for all enum fields in forms"]
- Rule 2: [e.g., "Follow date formatting best practices from formatting-best-practice.md"]
- Pattern 1: [e.g., "Use form-reset-hook for all forms"]

Reference docs:
- [Link to relevant best practice docs]
- [Link to pattern documentation]

## Requirements
<!-- For Backend Plans -->
### Data Model (Backend)
- Required fields and types
- Validation rules
- Relationships

### API Endpoints (Backend)
- Endpoint paths and methods
- Request/response schemas
- Authentication requirements

<!-- For Frontend Plans -->
### UI/UX (Frontend)
- Page layout
- Components needed
- User interactions
- States (loading, error, success)

## Implementation Steps
<!-- Each step should have a checkbox that will be checked when completed -->
- [ ] Step 1
  - Details
  - Reference existing code (if applicable)
- [ ] Step 2
  - Details
  - Reference existing code (if applicable)

## Dependencies
- Required modules/features
- External services/APIs
- Reference implementations

## Technical Notes
- Important architectural decisions
- Reusable components/patterns
- Known limitations

## Testing
<!-- For Backend Plans -->
### API Testing (Backend)
```bash
# Example curl commands to test endpoints
curl -X GET http://localhost:8000/api/resource
curl -X POST http://localhost:8000/api/resource -H "Content-Type: application/json" -d '{"key": "value"}'
```

<!-- For All Plans -->
### Test Cases
- Critical test cases
- Edge cases to verify