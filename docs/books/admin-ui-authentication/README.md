# Admin UI Authentication for jsgui3-server

This book introduces a practical, phased approach to securing the Admin UI.

## Status

This book is intentionally started early (before a final auth architecture decision) so implementation can proceed safely in phases.

## Chapters

1. [Threat model and goals](01-threat-model-and-goals.md)
2. [Session model and token model](02-session-model-and-token-model.md)
3. [Auth middleware patterns in jsgui3-server](03-auth-middleware-patterns.md)
4. Login flow and logout flow (planned)
5. Authorization and role checks (planned)
6. CSRF, cookies, and browser hardening (planned)
7. SSE authentication and revocation handling (planned)
8. Operational rollout and migration plan (planned)

## Scope for v1 Admin

Until authentication is fully implemented:
- Keep the admin UI read-only where possible.
- Avoid privileged write-actions from browser controls.
- Document all intended mutation endpoints before building them.
