# Chapter 16: Testing & Quality Assurance

## Overview

This chapter documents the current Admin UI v1 testing strategy as implemented in this repository.

Testing is split into:

1. Rendering baseline checks.
2. Control-level interactive behavior checks.
3. Adapter/server behavior checks in existing server test suites.

The Admin UI interaction suite is intentionally browserless and uses jsgui control events (`raise('click')`) plus lightweight stubs for external APIs (`fetch`, `EventSource`, `setTimeout`).

## Current Admin UI Test Files

- `tests/admin-ui-render.test.js`
- `tests/admin-ui-jsgui-controls.test.js`

These tests are included in the project test runner (`tests/test-runner.js`).

## What the Interaction Suite Covers

`tests/admin-ui-jsgui-controls.test.js` validates:

- No direct DOM patching patterns in admin shell and admin page source.
- Menu click activation and title sync in `Admin_Page`.
- Sidebar/tab click routing and active-state synchronization in `Admin_Shell`.
- Sidebar overlay and hamburger interactions.
- Resources/routes/settings dynamic rendering through jsgui controls.
- Loading/error/empty UI states including retry-button behavior.
- Settings logout-button behavior (`POST /api/admin/v1/auth/logout` + redirect hook).
- Custom section loading, click routing, and refresh replacement behavior.
- Layout-mode updates (`desktop/tablet/phone`) via `data-layout-mode`.
- Idempotent activation bootstrap (`_client_bootstrapped`).
- SSE open/error/heartbeat lifecycle, including reconnect backoff scheduling.
- Unauthorized API response redirect behavior.

## Running the Tests

### Focused Mocha run

```bash
node node_modules/mocha/bin/mocha.js tests/admin-ui-render.test.js tests/admin-ui-jsgui-controls.test.js --timeout 60000
```

### Through project test runner

```bash
node tests/test-runner.js --test=admin-ui-jsgui-controls.test.js
```

### Full runner (all suites)

```bash
node tests/test-runner.js
```

## Test Design Notes

### Control-first event simulation

Interactive behavior is tested by emitting jsgui events on controls:

```javascript
const routes_tab = admin_shell._tab_items.find((item) => item.id === 'routes');
routes_tab.control.raise('click');
```

This keeps tests aligned with how controls are wired in implementation (`control.on('click', ...)`).

### SSE simulation without browser

SSE behavior is validated by replacing `global.EventSource` with a small fake class that stores listeners and allows test-triggered events.

```javascript
class Fake_Event_Source {
    constructor(url) {
        this.url = url;
        this.listeners = Object.create(null);
    }

    addEventListener(event_name, handler) {
        this.listeners[event_name] = handler;
    }

    emit(event_name, payload) {
        if (this.listeners[event_name]) this.listeners[event_name](payload);
    }
}
```

This enables deterministic testing of:

- online/offline indicator transitions
- heartbeat payload dispatch
- reconnect backoff (`setTimeout`) scheduling

### Source guard for DOM drift

A static assertion prevents regressions toward direct DOM patching in key admin UI files.

Patterns rejected by test:

- `document.`
- `querySelector`
- `innerHTML`
- `createElement`
- `appendChild`
- `.classList`

## Quality Gates

### P0 (required)

- Admin interaction suite passes.
- Rendering baseline suite passes.
- No direct DOM patching patterns reintroduced in admin UI controls.
- SSE reconnect/error handling remains covered by tests.

### P1 (recommended)

- Add endpoint-level integration tests for custom sections and auth transitions where behavior changes.
- Add end-to-end browser coverage when introducing richer mobile/tablet visual behavior.

## Failure Scenarios Covered

- Custom section refresh duplicates nav items.
- Section click does not sync nav/tab active classes.
- Retry/logout controls render but are not interactive.
- Activation runs startup side effects multiple times.
- SSE disconnection does not transition to offline state.
- Unauthorized fetch does not trigger login redirect.

## CI Guidance

Use the focused suite as a merge gate for admin UI control changes:

```bash
node tests/test-runner.js --test=admin-ui-jsgui-controls.test.js
```

Use the combined admin run before release branches:

```bash
node node_modules/mocha/bin/mocha.js tests/admin-ui-render.test.js tests/admin-ui-jsgui-controls.test.js --timeout 60000
```
