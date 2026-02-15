# Chapter 2: Architecture & Data Flow

## Overview

The Admin UI follows a classic client-server architecture that leverages jsgui3's isomorphic rendering pipeline. The server renders the initial HTML, the client activates controls and begins fetching live data through a set of JSON API endpoints and SSE streams.

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Admin Shell  │  │ Domain Ctrls │  │  SSE Client    │  │
│  │ (sidebar,    │──│ (stat cards, │──│ (EventSource   │  │
│  │  toolbar,    │  │  tables,     │  │  for live      │  │
│  │  status bar) │  │  panels)     │  │  updates)      │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│─────────┼─────────────────┼───────────────────┼───────────│
│  fetch('/api/admin/*')    │    EventSource('/api/admin/   │
│         │                 │         events')  │           │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                 jsgui3-server (Node.js)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Admin Module (v1/server.js)          │    │
│  │                                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────┐  │    │
│  │  │ Telemetry │  │ Snapshot  │  │ SSE Broadcast│  │    │
│  │  │ Collector │  │ Endpoints │  │ Channel      │  │    │
│  │  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘  │    │
│  └────────┼───────────────┼───────────────┼──────────┘    │
│           │               │               │               │
│  ┌────────▼───────────────▼───────────────▼──────────┐    │
│  │            Server Internals                        │    │
│  │                                                    │    │
│  │  resource_pool  server_router  http_servers        │    │
│  │  function_pubs  sse_publisher  process.memoryUsage │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Component Hierarchy

The admin UI is composed of nested jsgui3 controls that follow the standard lifecycle pattern. The hierarchy is:

```
Admin_Page (extends Active_HTML_Document)
├── Admin_Toolbar
│   ├── Button (Refresh)
│   ├── Button (Stop)
│   ├── Separator
│   ├── Button (Restart)
│   ├── Separator
│   ├── Button (Logs)
│   ├── Status_Indicator (Server Online)
│   └── Version_Label
├── Admin_Sidebar
│   ├── Server_Identity_Card
│   ├── Nav_Section ("OVERVIEW")
│   │   ├── Nav_Item (Dashboard) [active]
│   │   ├── Nav_Item (Processes)
│   │   └── Nav_Item (Resources)
│   ├── Nav_Section ("SERVER")
│   │   ├── Nav_Item (Routes)
│   │   ├── Nav_Item (Bundles)
│   │   └── Nav_Item (API)
│   ├── Nav_Section ("DIAGNOSTICS")
│   │   ├── Nav_Item (Metrics)
│   │   ├── Nav_Item (Logs)
│   │   └── Nav_Item (Inspector)
│   ├── Health_Summary
│   └── Boot_Status
├── Admin_Content_Area
│   ├── [Dashboard View]
│   │   ├── Stat_Card (Main Process)
│   │   ├── Stat_Card (Child Processes)
│   │   ├── Stat_Card (Resource Pool)
│   │   ├── Stat_Card (Routes)
│   │   ├── Stat_Card (Requests/Min)
│   │   ├── Process_Panel (group box)
│   │   ├── Resource_Table (group box)
│   │   ├── Tabbed_Panel (Routes & API | Build | Config | Logs)
│   │   ├── Server_Lifecycle_Diagram
│   │   ├── Config_Panel (group box)
│   │   └── Activity_Log (group box)
│   ├── [Processes View]
│   ├── [Resources View]
│   ├── [Routes View]
│   ├── [Logs View]
│   └── ...
└── Admin_Status_Bar
    ├── Status_Segment (Ready status)
    ├── Status_Segment (Memory)
    ├── Status_Segment (Uptime)
    └── Status_Segment (Requests/min)
```

## Data Flow Patterns

### Pattern 1: Snapshot Polling

For data that changes infrequently (configuration, route table, resource list), the client fetches a JSON snapshot on demand:

```
Client                          Server
  │                               │
  │── GET /api/admin/snapshot ───▶│
  │                               │── Collects data from:
  │                               │   resource_pool.summary
  │                               │   server_router routes
  │                               │   process.memoryUsage()
  │                               │   os.cpus(), os.networkInterfaces()
  │◀── 200 { snapshot } ─────────│
  │                               │
  │── Renders controls ──────────│
```

### Pattern 2: SSE Real-Time Stream

For data that changes frequently (request counts, log entries, process health), the client opens an SSE connection:

```
Client                          Server
  │                               │
  │── GET /api/admin/events ────▶│
  │   Accept: text/event-stream   │
  │                               │── Opens SSE channel
  │◀── event: connected ─────────│
  │                               │
  │◀── event: request_log ───────│  (on each HTTP request)
  │◀── event: resource_change ───│  (on pool state change)
  │◀── event: build_complete ────│  (on bundle rebuild)
  │◀── event: heartbeat ─────────│  (every 15s keep-alive)
  │                               │
```

### Pattern 3: Command Dispatch

For admin actions (restart server, rebuild bundle), the client sends POST requests:

```
Client                          Server
  │                               │
  │── POST /api/admin/action ───▶│
  │   { "action": "restart" }     │
  │                               │── Validates action
  │                               │── Executes action
  │◀── 200 { result } ───────────│
  │                               │
  │◀── event: server_restarting ──│  (via SSE)
  │◀── event: server_ready ──────│  (via SSE)
```

## Isomorphic Rendering Pipeline

The admin UI follows the standard jsgui3 isomorphic pattern:

### Server-Side (Initial Load)

1. User navigates to `/admin`
2. `HTTP_Webpage_Publisher` creates a `Server_Static_Page_Context`
3. `Admin_Page` constructor runs → `compose()` builds the DOM tree server-side
4. `ctrl.active()` is called to finalize the tree
5. HTML is rendered to string and sent to the browser
6. JS bundle (`/admin/js/js.js`) and CSS bundle (`/admin/css/css.css`) are included via `<script>` and `<link>` tags

### Client-Side (Activation)

1. Browser parses HTML — the admin UI is immediately visible (server-rendered)
2. JS bundle loads and executes
3. `Admin_Page.activate()` fires:
   - Binds event listeners to sidebar navigation
   - Opens SSE connection to `/api/admin/events`
   - Fetches initial snapshot from `/api/admin/snapshot`
   - Populates controls with live data

This means the admin UI has **zero time-to-first-paint** for the structural layout, with data populating as the JS bundle activates.

## Module Boundary

The admin UI maintains a clean module boundary with the host server:

```
Host Server (server.js)                Admin Module (admin-ui/v1/server.js)
┌────────────────────────┐             ┌────────────────────────────┐
│                        │             │                            │
│  resource_pool ───────▶│─────────────│▶ get_resources_tree()     │
│  server_router ───────▶│─────────────│▶ get_routes_list()        │
│  http_servers  ───────▶│─────────────│▶ get_server_status()      │
│  function_pubs ───────▶│─────────────│▶ get_publishers_list()    │
│  process       ───────▶│─────────────│▶ get_process_info()       │
│                        │             │                            │
│  NO modifications to   │             │  Read-only access to       │
│  core server behavior  │             │  server properties         │
│                        │             │                            │
└────────────────────────┘             └────────────────────────────┘
```

The Admin Module:
- **Reads** from `server.resource_pool`, `server.server_router`, `server.http_servers`
- **Subscribes** to events on `resource_pool` for state changes
- **Collects** Node.js `process.memoryUsage()`, `os.cpus()`, `os.uptime()`
- **Does NOT** modify how the server handles user routes or processes requests

The only write operations the admin module provides are:
- Restarting child processes (via `Process_Resource.restart()`)
- Stopping/starting resources (via `Resource_Pool.start/stop`)

These use the existing resource API surface — no new capabilities are added to the server itself.

## File Organization

```
admin-ui/
└── v1/
    ├── client.js              # Client entry — exports Admin_Page control
    ├── server.js              # Admin_Module class — telemetry adapter
    ├── controls/
    │   ├── admin_shell.js     # Root shell: toolbar + sidebar + content + status bar
    │   ├── stat_card.js       # Reusable stat card control
    │   ├── process_panel.js   # Process tree with fork visualization
    │   ├── resource_table.js  # Resource pool table
    │   ├── route_table.js     # Route listing with method badges
    │   ├── log_viewer.js      # Scrolling log output
    │   ├── build_status.js    # Bundle size and build info
    │   ├── config_panel.js    # Configuration display/editor
    │   ├── sidebar.js         # Sidebar with navigation sections
    │   ├── toolbar.js         # Top toolbar with action buttons
    │   ├── status_bar.js      # Bottom status bar
    │   ├── nav_item.js        # Individual navigation item
    │   ├── group_box.js       # Classic group box with inset label
    │   ├── tab_panel.js       # Tabbed content switcher
    │   ├── health_badge.js    # Colored health indicator
    │   ├── method_badge.js    # HTTP method badge (GET, POST, etc.)
    │   └── data_table.js      # Generic sortable data table
    └── css/
        └── admin-tokens.css   # Design tokens for the Aero theme
```

## Dependency Graph

```
client.js
    └── Admin_Page (extends Active_HTML_Document)
        ├── Admin_Toolbar
        │   └── jsgui3 controls: div, span, Button
        ├── Admin_Sidebar
        │   ├── Nav_Item
        │   └── Health_Badge
        ├── Admin_Content_Area
        │   ├── Stat_Card
        │   ├── Process_Panel
        │   │   └── Health_Badge
        │   ├── Resource_Table
        │   │   ├── Data_Table
        │   │   └── Health_Badge
        │   ├── Route_Table
        │   │   ├── Data_Table
        │   │   └── Method_Badge
        │   ├── Tab_Panel
        │   ├── Group_Box
        │   ├── Log_Viewer
        │   ├── Build_Status
        │   └── Config_Panel
        └── Admin_Status_Bar

server.js
    └── Admin_Module
        ├── Reads: server.resource_pool
        ├── Reads: server.server_router
        ├── Reads: server.http_servers
        ├── Reads: server.function_publishers
        ├── Uses:  HTTP_SSE_Publisher (for /api/admin/events)
        └── Uses:  process, os modules
```

## Request Routing

All admin routes live under the `/admin` and `/api/admin/` prefixes:

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin` | GET | Serve the admin UI HTML page |
| `/admin/js/js.js` | GET | Client JavaScript bundle |
| `/admin/css/css.css` | GET | Extracted CSS bundle |
| `/api/admin/snapshot` | GET | Full server state snapshot |
| `/api/admin/resources` | GET | Resource pool listing |
| `/api/admin/routes` | GET | Route table |
| `/api/admin/processes` | GET | Process information |
| `/api/admin/config` | GET | Server configuration |
| `/api/admin/build` | GET | Build/bundle status |
| `/api/admin/events` | GET | SSE stream for real-time updates |
| `/api/admin/action` | POST | Execute admin action (restart, etc.) |

All endpoints are registered by the `Admin_Module.attach_to_router()` method, which receives the `server_router` from the host server.
