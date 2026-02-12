# 6. E2E Testing Methodology

## Principle

A browser E2E test is valid only if it asserts both:

- user-visible state (DOM/control behavior)
- server truth (resource/process state, event emission)

UI-only assertions are necessary but insufficient for fullstack correctness.

## Harness

`tests/helpers/puppeteer-e2e-harness.js` provides:

- deterministic step runner (`run_interaction_story`)
- browser probe capture (`console`, `pageerror`, request failures)
- shared page/server boot helpers
- stable interaction primitives (input event dispatch, drag)

This converts long imperative test scripts into explicit state-transition stories.

## Story Pattern

Each step has:

- `name`
- `run(page)`
- optional `assert(page)`

Failure is annotated with `[story :: step]` to localize defects quickly.

## Current High-Value Scenarios

1. control interaction precision (`Date_Picker` + `Datetime_Picker`)
2. client-driven resource lifecycle control (`start/stop/restart`)
3. SSE propagation to browser and UI projection
4. parity check between browser-observed state and server-side resource state

Implemented in:

- `tests/window-resource-integration.puppeteer.test.js`

## Stability Guards

- route readiness gate before browser navigation in resource integration tests
- allowlist-based probe assertions for expected disconnect noise (`/events` abort on close)
- strict no-unexpected-console-error policy
