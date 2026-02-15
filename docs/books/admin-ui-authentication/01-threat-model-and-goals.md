# Chapter 1 — Threat Model and Goals

## Why this chapter first

Authentication design becomes expensive when started too late. The Admin UI already has telemetry endpoints and an SSE channel, so this chapter defines what we are protecting and what can wait.

## Assets to protect

For jsgui3-server admin surfaces, primary assets are:

1. **Control-plane actions**
   - starting/stopping resources
   - changing runtime config
   - registering/removing routes
2. **Sensitive observability data**
   - host/process metadata
   - route inventories
   - internal resource names and states
3. **Availability**
   - preventing abuse of SSE streams and expensive endpoints

## Threat model (practical)

### External attacker
- Can probe `/admin` and `/api/admin/*` endpoints.
- Tries default credentials, weak tokens, replay, or unauthenticated access.

### Internal but unauthorized user
- Has network access but should not have admin privileges.
- Attempts to read diagnostic state or execute write actions.

### Session theft and browser attacks
- Cookie theft, CSRF, XSS-assisted token misuse.
- Stale sessions after role changes.

### Operational mistakes
- Admin endpoint exposed publicly by accident.
- Weak defaults in non-production become production behavior.

## Security goals

### G1: Default deny for admin APIs
- Any `/api/admin/*` endpoint should require auth by default.
- Explicit allow-list only for bootstrapping/health if needed.

### G2: Separate read and write permissions
- Read-only operators should access telemetry.
- Mutating operations require stronger roles.

### G3: Short-lived, revocable sessions
- Session invalidation should take effect quickly.
- SSE clients must be disconnected when auth is revoked.

### G4: Browser-safe auth transport
- Prefer secure, httpOnly cookies for web-admin sessions.
- Apply CSRF protection for state-changing endpoints.

### G5: Deployment-safe defaults
- Clear behavior in dev vs production.
- Explicit configuration for trusted origins and cookie policy.

## Non-goals for first implementation phase

To keep delivery realistic, v1 auth does **not** need:

- Multi-tenant federation (SAML/OIDC enterprise SSO) on day one.
- Fine-grained per-resource ACL matrices.
- Full audit analytics UI before basic enforcement exists.

## Phased implementation plan

### Phase A — Guard rails (immediate)
- Keep admin UI read-only while auth is incomplete.
- Avoid adding new mutation endpoints.
- Document intended privileged operations.

### Phase B — Baseline authentication
- Add login/logout endpoint pair.
- Add session issuance + validation middleware.
- Require auth for all `/api/admin/v1/*` and `/admin/v1`.

### Phase C — Authorization and hardening
- Introduce roles: `admin_read`, `admin_write`.
- Add CSRF for write paths.
- Add rate limiting and SSE connection caps.

### Phase D — Operational maturity
- Session revocation, inactivity expiry, and rotation.
- Structured security/audit logs.
- Runbook for emergency lockout and credential reset.

## Design constraints from current codebase

Given existing server patterns:

- Admin routes are registered through router adapters.
- SSE is already used for live events.
- The current v1 UI is telemetry-first and can remain read-only safely.

This means we can adopt auth incrementally without blocking current UI progress.

## Decision points (to finalize in next chapter)

1. Session storage model: in-memory vs Redis-backed.
2. Credential source: static bootstrap admin vs user store resource.
3. Cookie strategy: strict same-site policy for local-only admin vs configurable for reverse proxies.
4. Role model shape: two-role minimal model vs extensible claims model.

## Selected v1 decisions (current)

The following decisions are now selected for v1 implementation:

1. **Session storage model:** in-memory sessions.
2. **Credential source:** user resource/store (not env-bootstrap only).
3. **Protection scope:** protect both `/admin/v1` and `/api/admin/v1/*` immediately.

These choices keep the first auth rollout simple while still enforcing an end-to-end protected admin surface.

## Exit criteria for this chapter

Before coding auth middleware, agree on:
- which endpoints require `admin_read` vs `admin_write`,
- session lifecycle requirements,
- dev/prod default policy matrix.
