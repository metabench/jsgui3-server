# Creating a New Admin UI

**A comprehensive guide to building the jsgui3-server Administration Interface**

---

## About This Book

This book documents the design, architecture, and implementation of a rich administration interface for jsgui3-server. The admin UI is built entirely with jsgui3 controls — dogfooding the framework to create a production-quality dashboard that provides real-time visibility into server internals, process health, resource pools, routing tables, build outputs, and configuration.

The admin UI lives at `admin-ui/v1/` and is served automatically at the `/admin/v1` route of any running jsgui3-server instance.

## Design Reference

The visual design is inspired by a Windows Aero-era aesthetic — glass-effect title bars, warm parchment content areas, subtle gradients, and grouped panels with classic separators. The SVG design reference (`server-admin-interface-aero.svg`) provides the canonical visual target.

## Chapters

| # | Chapter | Description |
|---|---------|-------------|
| 01 | [Introduction & Vision](01-introduction-and-vision.md) | Goals, audience, design philosophy, and what the admin UI aims to achieve |
| 02 | [Architecture & Data Flow](02-architecture-and-data-flow.md) | Client-server architecture, data paths, isomorphic rendering, and component hierarchy |
| 03 | [Server Introspection — What Data Is Available](03-server-introspection.md) | Audit of every data source in jsgui3-server that the admin UI can surface |
| 04 | [The Admin Module Adapter Layer](04-admin-module-adapter-layer.md) | API endpoints, telemetry collection, and the bridge between server internals and the UI |
| 05 | [Domain Controls — Stat Cards & Gauges](05-domain-controls-stat-cards-and-gauges.md) | Status indicator cards, numeric displays, progress gauges, and sparkline charts |
| 06 | [Domain Controls — Process Manager Panel](06-domain-controls-process-manager.md) | Process tree, fork visualization, PID/memory display, start/stop/restart actions |
| 07 | [Domain Controls — Resource Pool Inspector](07-domain-controls-resource-pool-inspector.md) | Resource table, type badges, health indicators, memory breakdown |
| 08 | [Domain Controls — Route Table & API Explorer](08-domain-controls-route-table-and-api-explorer.md) | HTTP method badges, route listing, handler types, interactive API testing |
| 09 | [Domain Controls — Log Viewer & Activity Feed](09-domain-controls-log-viewer-and-activity-feed.md) | Timestamped log stream, severity filtering, auto-scroll, search |
| 10 | [Domain Controls — Build Status & Bundle Inspector](10-domain-controls-build-status-and-bundle-inspector.md) | Bundle size cards, module count, build timing, source map status |
| 11 | [Domain Controls — Configuration Panel](11-domain-controls-configuration-panel.md) | Read-only and editable config fields, port/debug/entry-point display |
| 12 | [The Admin Shell — Layout, Sidebar, & Navigation](12-admin-shell-layout-sidebar-navigation.md) | Window chrome, sidebar navigation, toolbar, status bar, content area routing |
| 13 | [Integrating with the Server — Telemetry Endpoints](13-telemetry-integration.md) | Modifying `server.js` and `Admin_Module` to expose new telemetry APIs |
| 14 | [Real-Time Updates — SSE & Observable Integration](14-realtime-sse-observable-integration.md) | Connecting the UI to `HTTP_SSE_Publisher` and `HTTP_Observable_Publisher` for live data |
| 15 | [Styling & Theming — The Aero-Inspired Design System](15-styling-theming-aero-design-system.md) | Token definitions, gradient recipes, glass effects, typography, and density |
| 16 | [Testing & Quality Assurance](16-testing-and-quality-assurance.md) | Unit tests, integration tests, viewport matrix testing, and acceptance criteria |
| 17 | [Next Steps — Process/Resource Roadmap](17-next-steps-process-resource-roadmap.md) | Handoff-grade implementation plan for process-centric admin capabilities, auth boundaries, and test gates |

## Key Principles

1. **Dogfooding** — The admin UI is built entirely with jsgui3 controls. Every pattern used here validates the framework.
2. **Zero Configuration** — The admin UI is available at `/admin/v1` on every jsgui3-server instance with no extra setup.
3. **Read Before Write** — The admin UI primarily reads and displays server state. Write operations (restart, config change) are guarded and opt-in.
4. **Incremental Delivery** — Each domain control is independently functional. The shell composes them, but each can be developed and tested in isolation.
5. **Real Data Only** — No mock data in production. Every number shown comes from actual server telemetry.

## Prerequisites

- Familiarity with jsgui3-html control lifecycle (`compose` → `activate`)
- Understanding of jsgui3-server's publisher and resource systems
- Node.js and basic HTTP/SSE concepts

## Directory Structure

```
admin-ui/
├── v1/
│   ├── client.js              # Client-side entry point (registers Admin_Shell)
│   ├── server.js              # Admin module (adapter layer + auth + telemetry)
│   ├── admin_auth_service.js  # Session auth service
│   ├── admin_user_store.js    # In-memory user store
│   ├── controls/
│   │   ├── admin_shell.js     # Main shell with sidebar + content
│   │   ├── stat_card.js       # Stat card control
│   │   └── group_box.js       # Reusable grouped panel container
│   └── utils/
│       └── formatters.js      # Shared formatting helpers
```
