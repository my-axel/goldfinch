# Implementation Plan Template

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This template guides the planning and implementation of new features. It ensures consistent implementation approach and documentation across the project.
>
> ## When to Use
> - When starting implementation of a new feature
> - When making significant changes to existing features
> - When the implementation requires multiple steps or sessions
>
> ## How to Use This Template
>
> ### 1. Initial Planning
> - Fill out Overview and Description first
> - Check PROGRESS.md to align with project status
> - Review and list all relevant rules and guidelines
>
> ### 2. Requirements Gathering
> Ask the following questions to gather comprehensive requirements:
>
> #### Data Model Questions
> - What information needs to be stored?
> - What are the relationships to other models?
> - Are there specific validation rules?
> - What are the required vs optional fields?
> - Are there any unique constraints?
> - What data types are needed for each field?
>
> #### UI/UX Questions
> - What is the primary user flow?
> - Which forms are needed?
> - What validation feedback is required?
> - Are there specific loading states?
> - What error scenarios need handling?
> - Are there any complex interactions?
> - Which existing components can be reused?
>
> #### Integration Questions
> - What APIs need to be created/modified?
> - Are there external service dependencies?
> - What existing patterns can be reused?
> - Are there performance requirements?
>
> #### Best Practice Questions
> - Which formatting rules apply?
> - What accessibility requirements exist?
> - Are there specific security considerations?
> - Which testing patterns should be followed?
>
> ### 3. Implementation Planning
> - Break down into clear, achievable steps
> - Reference existing code where similar patterns exist
> - Note any technical decisions or limitations
>
> ### 4. Maintenance
> - Update status as implementation progresses
> - Document any deviations from original plan
> - Update technical notes with learnings
>
> ## Best Practices
> 1. Keep it concise - this is a working document
> 2. Link to existing documentation rather than duplicating
> 3. Update status and notes regularly
> 4. Reference existing code patterns when available
>
> </details>

## Overview
**Feature**: [Name of the Feature]
**Duration**: [Estimated time in hours/sessions]
**Status**: [📝 Not Started | 🟡 Planning | ⚠️ In Progress | ✅ Complete]
**Priority**: [High/Medium/Low]

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
### Data Model
- Required fields and types
- Validation rules
- Relationships

### UI/UX
- Page layout
- Components needed
- User interactions
- States (loading, error, success)

## Implementation Steps
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

## Testing Scope
- Critical test cases
- Edge cases to verify