Read `.ai/AI_RULES.md` and all other relevant `.ai/` documentation before starting.

Also inspect the actual source code. The source code is the final authority if documentation and implementation differ.

# Task

Type: [NEW FEATURE / BUG FIX / REFACTOR / PERFORMANCE / SECURITY / TEST / CODE CLEANUP]

Requirement:

[DESCRIBE THE TASK HERE]

# Phase 1 — Understand

Before modifying code:

1. Understand the requirement.
2. Inspect the relevant existing implementation.
3. Identify all affected files.
4. Search for existing utilities, components, services, APIs, models, and patterns that can be reused.
5. Identify dependencies and side effects.
6. Check whether similar functionality already exists.
7. Identify potential breaking changes.

Do not modify code during this phase.

# Phase 2 — Plan

Provide:

1. Problem/requirement understanding
2. Root cause, if this is a bug
3. Current implementation
4. Proposed solution
5. Files to create
6. Files to modify
7. Database/API impact
8. Security impact
9. Testing strategy
10. Potential risks

Keep the solution consistent with the existing architecture.

Wait for approval before making significant changes.

# Phase 3 — Implementation

After approval:

1. Implement the requested change.
2. Follow `.ai/AI_RULES.md`.
3. Follow existing project conventions.
4. Reuse existing code wherever appropriate.
5. Keep the change focused.
6. Do not modify unrelated functionality.
7. Do not perform unnecessary rewrites.
8. Do not introduce a new dependency if the existing project already provides equivalent functionality.
9. Preserve backward compatibility unless the task explicitly requires breaking changes.
10. Do not remove working functionality without explaining why.

# Bug Fix Rules

If this is a bug:

1. Reproduce or understand the failure.
2. Identify the root cause.
3. Do not blindly patch the symptom.
4. Fix the underlying issue.
5. Check for similar bugs elsewhere.
6. Add a regression test when practical.
7. Verify that the fix does not break existing behavior.

# Refactoring Rules

If this is a refactoring task:

1. Preserve existing behavior.
2. Do not change business logic unless explicitly requested.
3. Establish the current behavior before modifying it.
4. Make the smallest reasonable change.
5. Avoid large unrelated rewrites.
6. Compare behavior before and after the refactor.
7. Run existing tests/build/lint checks.

# New Feature Rules

If this is a new feature:

1. Integrate with the existing architecture.
2. Reuse existing components and services.
3. Follow existing API and database patterns.
4. Consider authentication and authorization.
5. Consider validation and error handling.
6. Add appropriate tests.
7. Update relevant documentation.

# Verification

After implementation:

1. Run relevant tests.
2. Run linting.
3. Run type checking if applicable.
4. Run the build.
5. Check for runtime errors.
6. Review the Git diff.
7. Check for accidental changes.
8. Verify that the requested behavior works.

Fix issues caused by your implementation.

# Documentation

If the implementation changes any of the following:

- Architecture
- API
- Database
- Authentication
- Important business logic
- Dependencies
- Development workflow

Update the relevant `.ai/*.md` file.

Do not update documentation unnecessarily.

# Final Report

After completing the task, report:

## Summary

What changed and why.

## Files Created

List files.

## Files Modified

List files.

## Root Cause

Only for bug fixes.

## Architecture Impact

Explain any architectural changes.

## Database Changes

Mention migrations/schema changes, or `None`.

## API Changes

Mention new/modified APIs, or `None`.

## Tests

List tests executed and results.

## Commands

List important commands executed.

## Risks / Limitations

Mention anything that still needs attention.

## Documentation

Mention which `.ai/` files were updated.
