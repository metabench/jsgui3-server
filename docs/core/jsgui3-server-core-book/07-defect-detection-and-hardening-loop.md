# 7. Defect Detection and Hardening Loop

## Goal

Maximize bug discovery rate while minimizing false confidence.

## Loop

1. define invariant
2. encode invariant as automated test
3. reproduce failure deterministically
4. implement smallest correctness-preserving fix
5. re-run focused suite
6. run regression suites touching adjacent surfaces
7. document invariant and fix rationale

## Practical Invariants for Current Surface

### Startup / Routing

- `serve()` must not resolve before root route availability
- startup timeout must fail explicitly, not partially start

### Resource Management

- `stop()` semantics are idempotent for already-stopped resources
- crash vs unreachable classification must remain distinct
- process manager backend must not leak into consumer API shape

### Eventing

- every forwarded resource event must include `resourceName`
- SSE replay must preserve event ordering by event ID

### Browser Integration

- client action routes must be observable in captured API call log
- SSE state transitions must drive UI state within bounded time

## Recommended Additional Test Work

1. Add a chaos-style resource test with rapid start/stop/restart bursts and assert no deadlock.
2. Add remote resource failure flapping test (unreachable/recovered oscillation) with threshold validation.
3. Add SSE reconnection E2E test in browser with explicit `Last-Event-ID` continuity assertion.
4. Add matrix tests across process manager modes (`direct`, `pm2` if available) under the same API contract assertions.

These increase confidence in concurrency and degraded-network behavior, where latent bugs usually appear.
