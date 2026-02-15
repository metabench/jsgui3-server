# Chapter 1: Introduction & Vision

## Why an Admin UI?

Every non-trivial server benefits from introspection. When a developer starts a jsgui3-server — whether it's a single-control demo, a multi-page application, or an API-only service — there is a wealth of internal state that is invisible from the outside:

- How many resources are loaded, and are they healthy?
- What routes have been registered, and by which publishers?
- How large is the bundled JavaScript? The extracted CSS?
- Is the build system working? Are there warnings?
- Which processes are running? What is their memory consumption?
- What observables are being published? How many clients are connected?

Today, to answer any of these questions, a developer must either read console output, attach a debugger, or write custom telemetry code. The Admin UI changes this entirely.

## Vision Statement

**Navigate to `/admin` on any running jsgui3-server instance and immediately see everything the server knows about itself — in real time, with no configuration required.**

The Admin UI is:

1. **Built-in** — Ships with jsgui3-server. No extra `npm install`, no separate process, no configuration file.
2. **Real-time** — Uses the server's own SSE and Observable infrastructure to push live updates to the browser.
3. **Honest** — Shows only data that actually exists within the running system. No mocked values, no placeholder counts.
4. **Dogfooded** — Constructed entirely from jsgui3 controls (div, span, h2, Panel, Button, etc.). The admin UI itself is validation that the control system works.
5. **Safe** — Defaults to read-only. Destructive actions (restart, stop) require deliberate interaction and are guarded behind confirmation.

## Audience

The primary users of the Admin UI are:

- **Developers** building applications with jsgui3-server during local development
- **DevOps engineers** monitoring deployed instances
- **Framework contributors** debugging jsgui3-server internals
- **Curious users** who want to understand what's happening inside their server

## Design Inspiration

The visual design draws from Windows Aero-era interfaces — a distinctive aesthetic that communicates professionalism and polish:

- **Glass-effect title bars** with gradient fills and subtle transparency
- **Warm parchment content areas** (`#F0EDE6` → `#E8E4DC`) rather than pure white
- **Group boxes** with inset labels — a classic UI pattern for organizing related controls
- **Tabbed panels** for switching between related views without navigation
- **Status bar** at the bottom with segmented information panels
- **Subtle drop shadows** and rounded corners that add depth without distraction

This aesthetic was chosen deliberately — it is visually distinct from the "flat design" dashboards common today, giving jsgui3-server its own identity while still being functional and readable.

## Scope — What the Admin UI Is and Is Not

### What it IS:

- A dashboard showing server state, routes, processes, resources, and build output
- A log viewer with real-time streaming
- A route and API explorer
- A configuration viewer (and, where safe, editor)
- A process manager with start/stop/restart controls

### What it is NOT:

- A replacement for a full monitoring stack (Prometheus, Grafana, etc.)
- A code editor or IDE
- A database administration tool
- A user authentication/authorization management system

The Admin UI occupies the space between "console.log" and "full observability platform." It gives developers immediate insight into their server without leaving the browser.

## The `/admin` Route

When jsgui3-server starts, it automatically:

1. Loads the `Admin_Module` from `admin-ui/v1/server.js`
2. Attaches telemetry API endpoints under `/api/admin/*`
3. Renders the admin UI control and serves it at `/admin`
4. Sets up SSE endpoints for real-time data push

No code change is needed in the user's application. The admin UI is always available.

```
http://localhost:8080/admin    ← Full admin dashboard
http://localhost:8080/         ← User's application (unchanged)
```

## Versioning Strategy

The admin UI lives in `admin-ui/v1/`. This explicit versioning allows:

- **Parallel iteration** — A `v2/` can be developed while `v1/` remains stable
- **A/B comparison** — Both versions can be served simultaneously for comparison
- **Safe rollback** — If `v2/` has issues, `v1/` is always available
- **Independent release** — The admin UI can evolve at its own pace

## What Success Looks Like

A developer creates a simple jsgui3-server application:

```javascript
const Server = require('jsgui3-server');
Server.serve({
    Ctrl: My_App,
    port: 8080
});
```

They navigate to `http://localhost:8080/admin` and see:

- **3 stat cards** showing PID, resource count, and route count
- **A process panel** with the main server process and any child processes
- **A resource table** listing every resource in the pool with health status
- **A route table** showing all registered HTTP routes with their handler types
- **A build section** with JS bundle size, CSS size, and build timing
- **A live activity log** streaming recent requests and events

All of this appears automatically, populated with real data from the running server, updating in real time as the server handles requests.

## Relationship to Existing Admin UI

The existing `admin-ui/` directory contains a preliminary implementation with:
- A sidebar/content shell in `admin-ui/client.js`
- Basic API endpoints in `admin-ui/server.js` for resources and observables

The `v1/` implementation builds on the lessons learned from this prototype while introducing:
- Domain-specific controls (not just generic divs)
- A comprehensive telemetry adapter layer
- Real-time SSE-driven updates
- The Aero-inspired visual design
- A structured navigation system with multiple views

The existing code in `admin-ui/client.js` and `admin-ui/server.js` remains as the current implementation. The `v1/` directory is a fresh start that will eventually replace it.
