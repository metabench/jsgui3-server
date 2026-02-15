# Chapter 17 — Next Steps Roadmap (Process/Resource-Centric Admin)

## Purpose of This Chapter

This chapter is a **handoff-grade implementation roadmap** for the next phase of the Admin UI. It captures the current baseline, architectural direction, concrete work packages, and acceptance criteria so another agent (or engineer) can continue confidently.

This roadmap is intentionally **domain-agnostic**: it does not assume crawler-specific behavior or any workload-specific semantics.

---

## Current Baseline (Already Implemented)

### Admin UI v1 shell and read-only sections

- Admin shell with sidebar, toolbar, content, and status bar.
- Dashboard stat cards.
- Read-only sections for Resources, Routes, Settings with loading/error/retry states.
- Control-first rendering for section content (tables, key-value rows, actions) using jsgui controls, not direct DOM string patching.
- Interactive shell wiring implemented for:
  - sidebar item activation
  - phone tab synchronization
  - hamburger/overlay sidebar toggling
  - custom section insertion and refresh replacement
  - logout/retry actions in dynamic panels

### Telemetry adapter and APIs

- `/api/admin/v1/status`
- `/api/admin/v1/resources`
- `/api/admin/v1/routes`
- `/api/admin/v1/events` (SSE)

### Authentication and authorization groundwork

- Login/logout/session endpoints:
  - `POST /api/admin/v1/auth/login`
  - `POST /api/admin/v1/auth/logout`
  - `GET /api/admin/v1/auth/session`
- Protected UI + API surface (`/admin/v1` and `/api/admin/v1/*`).
- In-memory sessions and role groundwork:
  - `admin_read`
  - `admin_write` (reserved for future mutation endpoints)

### Documentation baseline

- Auth book started:
  - Threat model
  - Session/token model
  - middleware/authorization patterns
- Troubleshooting updated with generated shim cache guidance.
- Admin shell and testing chapters updated to match current implementation (`Chapter 12`, `Chapter 16`).

### Test baseline (currently implemented)

- `tests/admin-ui-render.test.js` (rendering baseline)
- `tests/admin-ui-jsgui-controls.test.js` (interactive behavior + SSE lifecycle + DOM-pattern guard)
- Included in `tests/test-runner.js` as `admin-ui-jsgui-controls.test.js`.

---

## Architectural Direction: Process as Resource

## Decision

Adopt **Process as a Resource type** and keep a **ProcessManager as a Resource** for orchestration.

### Why this is the right direction

1. Uniform control plane: everything is a resource with lifecycle and telemetry.
2. Better admin UX: one table model for states/health/actions.
3. Extensible orchestration: manager policies can evolve independently.
4. Natural language remains intact: teams still talk about “processes,” while implementation is resource-based.

### Conceptual model

- `Process_Resource` extends `Resource`.
- `Process_Manager_Resource` extends `Resource` and manages a set of `Process_Resource` instances.
- Resource pool remains the system registry and event bus anchor.

---

## Target Capabilities (Next Phase)

The next phase should improve the admin interface as a **task/process coordinator** while keeping risk low.

### Read-side capabilities (implement first)

1. Process inventory and state overview.
2. Process detail panel (identity, runtime, state timeline).
3. Process manager summary (counts, policy settings, queue pressure if available).
4. Event stream correlation for process state transitions.

### Write-side capabilities (planned later)

1. Start/stop/restart process operations.
2. Desired-state reconciliation through manager policy.
3. Controlled write actions guarded by `admin_write` + CSRF + audit logs.

---

## Data Contract Proposal (Generic)

These contracts should be introduced incrementally and versioned under `/api/admin/v1/...`.

### `GET /api/admin/v1/processes`

Returns process-like resources in normalized shape. V1 returns all items (no pagination). If pagination is needed later, add `?limit=N&offset=M` query parameters — but defer until there's evidence of large inventories.

**Process state enum** (strict at adapter level):
`starting` | `running` | `degraded` | `crashed` | `stopped` | `unknown`

Resources whose state doesn't map cleanly to one of these values should be normalized to `unknown`.

```json
{
  "ok": true,
  "items": [
    {
      "name": "worker-a",
      "type": "Process_Resource",
      "manager": "default_process_manager",
      "desired_state": "running",
      "observed_state": "running",
      "health": "healthy",
      "pid": 12345,
      "uptime_seconds": 842,
      "restart_count": 0,
      "last_error": null,
      "updated_at": 1739590000000
    }
  ]
}
```

### `GET /api/admin/v1/processes/:name`

Returns detailed process metadata and recent events.

### `GET /api/admin/v1/process-managers`

Returns manager-level summaries:

- total managed processes
- running/degraded/crashed counts
- policy configuration snapshot

### SSE event names (existing + proposed)

- existing: `resource_state_change`, `crashed`, `recovered`, `heartbeat`
- proposed normalized process events:
  - `process_state_changed`
  - `process_unhealthy`
  - `process_exited`
  - `process_restarted`

---

## UI Roadmap (Admin v1.x)

### UI-1: Processes section (read-only)

Add a dedicated sidebar item and panel:

- columns: Name, Manager, Desired, Observed, Health, Uptime, Restarts
- sorting by state and uptime
- status color badges
- empty/error/loading states

**Adaptive composition** (ref: Device-Adaptive Composition book, Chapter 2 — four-layer model)

- **Desktop**: dense table layout with all columns visible.
- **Tablet**: table with horizontal scroll or column prioritization (hide Restarts, Manager).
- **Phone**: card list — one card per process showing Name, Observed State badge, and Health. Tap to navigate to detail.
- Use `[data-layout-mode]` attribute selectors, not raw `@media` queries (Chapter 4).
- Touch targets for state badges and row actions must meet 44×44 px minimum.

**Acceptance criteria**

- panel loads with auth-protected API
- handles empty inventories gracefully
- updates key state badges from SSE without full reload
- SSE auto-reconnects on stream drop with exponential backoff (1s → 2s → 4s → max 30s)
- renders correctly across the viewport test matrix: phone portrait (390×844), tablet landscape (1024×768), desktop wide (1920×1080)

### UI-2: Process detail drawer/panel (read-only)

Selecting a process shows:

- identity + manager
- desired vs observed state
- runtime metadata
- recent event timeline

**Adaptive composition** (ref: Device-Adaptive Composition book, Chapter 2)

- **Desktop**: side drawer (right panel, ~400px) overlays or splits alongside the process list.
- **Tablet**: drawer pushes list content or opens as a slide-over.
- **Phone**: full-screen panel with back-navigation to the process list.
- Use JS composition (`compose_adaptive()`) for the discrete phone → drawer switch (Chapter 6).

**Acceptance criteria**

- all values match API payload
- timeline updates while panel is open via SSE (auto-reconnect on drop)
- no write actions exposed yet
- drawer/panel transition works across all three layout modes

### UI-3: Process manager summary panel (read-only)

Displays manager-level health and policy snapshot.

**Adaptive composition** (ref: Device-Adaptive Composition book, Chapter 2)

- **Desktop/Tablet**: stat cards in a responsive grid (like Dashboard).
- **Phone**: single-column stacked cards.
- Use CSS-only continuous adaptation (flexbox wrap) — no JS composition switch needed.

**Acceptance criteria**

- supports multiple managers
- summarizes counts correctly
- includes "last updated" timestamp and stale-data indicator
- cards reflow correctly at phone viewport width

---

## Backend Roadmap (Process/Resource layer)

### BE-1: Normalize process resource shape

Add utility mapping in admin adapter to produce a stable process DTO from heterogeneous resources.

**Acceptance criteria**

- missing fields fall back to explicit defaults:
  - `health` → `'unknown'`
  - `desired_state` → `null`
  - `observed_state` → `'unknown'`
  - `restart_count` → `0`
  - `uptime_seconds` → `null`
  - `last_error` → `null`
  - `pid` → `null`
  - `manager` → `null`
  - `updated_at` → `Date.now()` (timestamp of normalization)
- no access to hazardous getters that can throw side effects

### BE-2: Add process inventory endpoints

Implement read-only endpoints listed above under `admin_read` guard.

**Acceptance criteria**

- unauthenticated => 401
- authenticated without role => 403
- authenticated with `admin_read` => 200

### BE-3: Event normalization bridge

Map generic pool events to process-centric event names when resource type indicates process semantics.

**Event mapping table**

| Pool event | Condition | Normalized event |
|---|---|---|
| `resource_state_change` | `resource.type === 'Process_Resource'` | `process_state_changed` |
| `crashed` | resource is process type | `process_exited` (with `exit_reason: 'crash'`) |
| `recovered` | resource is process type | `process_restarted` |
| `resource_state_change` where `new_state` is degraded | resource is process type | `process_unhealthy` |

Normalized event payloads should include: `{ name, manager, previous_state, current_state, timestamp }`.

**Acceptance criteria**

- existing events remain available (normalized events are additive, not replacements)
- normalized events are documented in this chapter's data contract section
- unmapped resource types pass through without transformation

---

## Security and Authorization Next Steps

### S-1: Role policy enforcement consistency

Ensure every new process endpoint is explicitly guarded (`admin_read` for read endpoints now).

### S-2: Write action gate (future)

Before adding any mutation endpoint:

1. require `admin_write`
2. require CSRF protection for browser-initiated writes
3. emit audit events (actor, action, target, result)

---

## Testing Roadmap

### T-1: API auth contract tests

- unauthorized requests return 401
- role violations return 403
- valid read role returns 200

### T-2: UI smoke tests for process panels

- login flow
- process panel renders
- SSE updates state badge in place

### T-3: Regression checks

- existing status/resources/routes views still pass
- no route collisions with static assets
- startup still succeeds without process resources present

---

## Implementation Order (Recommended)

1. **BE-1** process DTO normalization helper
2. **BE-2** `/processes` and `/process-managers` read endpoints
3. **UI-1** process list panel
4. **UI-2** process detail panel
5. **BE-3 + UI-3** normalized events + manager summary
6. tests for auth and rendering regression

This order keeps risk low by landing read-side observability first.

---

## Open Questions for Reviewer Agent

1. ~~Should process endpoints be nested under `/api/admin/v1/resources/processes` or top-level `/api/admin/v1/processes`?~~ **Resolved: top-level.** The process endpoint is a first-class concept, not a filtered view of a generic resource browser that doesn't exist yet.
2. Should timeline events be pulled (`GET`) only, or include in-band SSE replay snapshots?
3. What minimum manager policy fields should be exposed in v1 read-only summary?
4. ~~Should process state enums be strict at adapter level now?~~ **Resolved: yes.** Strict enum (`starting | running | degraded | crashed | stopped | unknown`) at the adapter layer. Costs nothing, prevents downstream string-comparison drift. `unknown` covers unmapped resources.

---

## Definition of Done for Next Milestone

The next milestone is complete when:

1. Admin UI has a working **Processes** read-only section.
2. Process inventory and manager summary endpoints exist and are documented.
3. Role-guarded access is verified (`401/403/200` behavior).
4. SSE-driven process state updates appear in UI.
5. No workload-specific logic is introduced into this repo.

---

## Notes for Contributors

- Keep naming conventions aligned with project rules (`snake_case` for functions/variables, PascalCase classes).
- Keep process/resource abstractions generic.
- Avoid introducing write actions until CSRF + audit plan is implemented.
