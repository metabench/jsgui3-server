# Chapter 3 — Auth Middleware Patterns for jsgui3-server

## Goal

Establish stable authorization guard patterns now, so future write endpoints can be added safely without redesign.

## Current guard model (implemented)

Admin v1 now uses explicit guard helpers in the server adapter:

- authentication guard
- role guard
- read-role guard (`admin_read`)
- write-role guard (`admin_write`)

This keeps route registration simple and prevents ad-hoc per-endpoint checks.

## Route policy baseline

### Public routes

- `/admin/v1/login`
- `POST /api/admin/v1/auth/login`
- `POST /api/admin/v1/auth/logout`
- `GET /api/admin/v1/auth/session`

### Protected read routes (`admin_read`)

- `/admin/v1`
- `GET /api/admin/v1/status`
- `GET /api/admin/v1/resources`
- `GET /api/admin/v1/routes`
- `GET /api/admin/v1/events`

### Reserved write route class (`admin_write`)

No mutation endpoints are enabled yet, but all future write endpoints should require `admin_write` at minimum.

## Guard usage pattern

Use the guard wrapper at route-registration time:

- read routes use read guard
- write routes use write guard

This keeps endpoint code focused on business behavior and leaves authz behavior centralized.

## Response semantics

- `401 Unauthorized`: no valid session.
- `403 Forbidden`: valid session, insufficient role.

These semantics are stable and should remain consistent for all future admin endpoints.

## SSE policy

SSE endpoint is protected by the same read-role guard.

Rationale:
- event streams can reveal sensitive internal state,
- role checks must be equivalent to read API checks.

## Next step for write endpoints

When adding first mutation routes:

1. register route under `/api/admin/v1/...`
2. wrap with write-role guard
3. add CSRF requirement before enabling browser write actions
4. add audit logging for successful and failed mutation attempts

## Minimal acceptance checklist for new admin endpoints

- Has explicit required role (`admin_read` or `admin_write`)
- Returns 401/403 correctly
- No accidental fallback to auth-only checks
- Included in endpoint inventory docs
