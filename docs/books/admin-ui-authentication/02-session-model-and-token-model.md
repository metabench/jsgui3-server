# Chapter 2 — Session Model and Token Model (v1 Decision)

## Chosen model for v1

This project uses **stateful in-memory sessions** for admin authentication in v1.

### Why this model now

- Fastest path to safe protection of `/admin/v1` and `/api/admin/v1/*`.
- Works with existing single-process server setup.
- Easy to reason about and debug while auth surface stabilizes.

### Trade-offs

- Sessions are lost on server restart.
- Not suitable for multi-instance horizontal scaling without shared storage.
- Requires follow-up for production HA (Phase D).

## Session shape

A session record contains:

- `session_id`
- `user` (`username`, `roles`)
- `created_at`
- `expires_at`

Cookie name: `jsgui_admin_v1_sid`

Cookie policy (v1):

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Secure` enabled in production mode

## User credential source (v1)

Credentials are validated against an **in-process user store resource-like service**.

- Primary bootstrap path: `ADMIN_V1_USER` + `ADMIN_V1_PASSWORD`.
- Development fallback (non-production only): `admin/admin`.
- Production without explicit password keeps login disabled until configured.

## Endpoint policy

Public endpoints:

- `POST /api/admin/v1/auth/login`
- `POST /api/admin/v1/auth/logout`
- `GET /api/admin/v1/auth/session`
- `GET /admin/v1/login`

Protected endpoints:

- `GET /admin/v1`
- `GET /api/admin/v1/status`
- `GET /api/admin/v1/resources`
- `GET /api/admin/v1/routes`
- `GET /api/admin/v1/events`

## Request flow

1. Browser requests `/admin/v1`.
2. If unauthenticated, server redirects to `/admin/v1/login`.
3. Login form posts credentials to `/api/admin/v1/auth/login`.
4. Server validates credentials and issues session cookie.
5. Browser returns to `/admin/v1` and can access protected APIs.

## Planned evolution (post-v1)

- Move session store to Redis or equivalent shared backing store.
- Add idle timeout refresh strategy.
- Add session revocation events and forced SSE disconnect.
- Add CSRF protections for write endpoints before mutation APIs launch.
