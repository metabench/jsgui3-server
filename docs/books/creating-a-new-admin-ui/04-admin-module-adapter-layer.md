# Chapter 4: The Admin Module Adapter Layer

## Purpose

The Admin Module (`admin-ui/v1/server.js`) is the bridge between raw server internals and the clean JSON API that the admin UI controls consume. It does **not** add new platform features — it reads existing data, formats it, and exposes it through HTTP endpoints and SSE channels.

This chapter specifies every adapter function, every API endpoint, and every SSE event the Admin Module must provide.

---

## Design Principles

1. **Read-mostly** — The adapter reads server properties; it does not modify control flow.
2. **Snapshot + Stream** — Static/slow data is served via GET endpoints. Dynamic data is pushed via SSE.
3. **Defensive** — Every property access is wrapped in try/catch. A missing property never crashes the admin module.
4. **Self-contained** — The adapter has no external dependencies beyond what jsgui3-server already imports.

---

## Class Structure

```javascript
class Admin_Module_V1 {
    constructor(server) {
        this.server = server;
        this._start_time = Date.now();
        this._request_log = [];          // Circular buffer, max 1000
        this._request_count = 0;
        this._bundle_info = null;         // Captured from ready event
        this._sse_publisher = null;       // For /api/admin/events
        this._route_registry = [];        // Tracked route registrations
    }

    attach_to_router(router) { ... }
    instrument_request_handler() { ... }
    capture_bundle_info() { ... }
    track_route_registration() { ... }

    // Snapshot builders
    get_snapshot() { ... }
    get_process_info() { ... }
    get_resources_tree() { ... }
    get_routes_list() { ... }
    get_publishers_list() { ... }
    get_build_info() { ... }
    get_config() { ... }
    get_request_stats() { ... }

    // SSE event broadcasters
    broadcast_request(req_data) { ... }
    broadcast_resource_change(event_data) { ... }
    broadcast_build_complete(build_data) { ... }
}
```

---

## API Endpoints

### GET `/api/admin/snapshot`

Returns the complete server state in a single response. This is what the admin UI fetches on initial load.

**Response shape:**

```javascript
{
    "server": {
        "name": "jsgui3 server",
        "pid": 7824,
        "uptime_seconds": 15780,
        "node_version": "v20.11.0",
        "platform": "win32",
        "debug": true,
        "port": 3000,
        "started": true,
        "https": false
    },
    "memory": {
        "rss": 134217728,
        "heap_total": 67108864,
        "heap_used": 45088768,
        "external": 2097152,
        "array_buffers": 1048576
    },
    "resources": {
        "total": 5,
        "running": 5,
        "stopped": 0,
        "crashed": 0,
        "items": [
            {
                "name": "Local Server Info",
                "type": "Local_Server_Info",
                "state": "on"
            },
            {
                "name": "Server Router",
                "type": "Router",
                "state": "unknown"
            }
        ]
    },
    "routes": [
        {
            "path": "/",
            "method": "GET",
            "handler_type": "Static_Route_HTTP_Responder",
            "category": "auto"
        },
        {
            "path": "/api/validateUser",
            "method": "POST",
            "handler_type": "HTTP_Function_Publisher",
            "category": "api"
        }
    ],
    "build": {
        "js": {
            "route": "/js/js.js",
            "size_bytes": 250880,
            "size_gzip": 62720,
            "size_brotli": 48128,
            "module_count": null
        },
        "css": {
            "route": "/css/css.css",
            "size_bytes": 12288,
            "size_gzip": 3072,
            "size_brotli": 2560
        },
        "built_at": 1739567000000,
        "errors": 0,
        "warnings": 0
    },
    "requests": {
        "total": 42,
        "per_minute": 12,
        "recent": [
            {
                "timestamp": 1739567000000,
                "method": "GET",
                "url": "/",
                "status": 200,
                "duration_ms": 14
            }
        ]
    },
    "processes": {
        "main": {
            "pid": 7824,
            "state": "running",
            "memory_rss": 134217728,
            "uptime_seconds": 15780
        },
        "children": []
    }
}
```

### GET `/api/admin/resources`

Returns just the resource pool data.

```javascript
{
    "total": 5,
    "running": 5,
    "stopped": 0,
    "crashed": 0,
    "unreachable": 0,
    "by_type": {
        "Local_Server_Info": [{ "name": "Local Server Info", "state": "on" }],
        "Router": [{ "name": "Server Router", "state": "unknown" }]
    },
    "items": [
        {
            "name": "Local Server Info",
            "type": "Local_Server_Info",
            "state": "on",
            "has_status": true,
            "status": { ... }
        }
    ]
}
```

### GET `/api/admin/routes`

Returns the route table.

```javascript
{
    "count": 7,
    "routes": [
        {
            "path": "/",
            "method": "GET",
            "handler_type": "Static_Route_HTTP_Responder",
            "handler_name": null,
            "category": "auto",
            "description": "HTML page"
        }
    ]
}
```

### GET `/api/admin/processes`

Returns process information.

```javascript
{
    "main": {
        "pid": 7824,
        "state": "running",
        "uptime_seconds": 15780,
        "memory": {
            "rss": 134217728,
            "heap_total": 67108864,
            "heap_used": 45088768
        },
        "cpu": {
            "user": 45000000,
            "system": 12000000
        }
    },
    "children": [
        {
            "name": "Bundle Builder",
            "pid": 7830,
            "state": "running",
            "memory": { "rss_bytes": 90177536 },
            "restart_count": 0,
            "type": "Process_Resource"
        }
    ]
}
```

### GET `/api/admin/build`

Returns build/bundle information.

```javascript
{
    "bundles": [
        {
            "type": "js",
            "route": "/js/js.js",
            "size_identity": 250880,
            "size_gzip": 62720,
            "size_brotli": 48128
        },
        {
            "type": "css",
            "route": "/css/css.css",
            "size_identity": 12288,
            "size_gzip": 3072,
            "size_brotli": 2560
        }
    ],
    "built_at": 1739567000000,
    "source_maps": true,
    "errors": 0,
    "warnings": 0
}
```

### GET `/api/admin/config`

Returns server configuration.

```javascript
{
    "server_name": "jsgui3 server",
    "port": 3000,
    "debug": true,
    "client_js_path": "./examples/client.js",
    "https_enabled": false,
    "allowed_addresses": null,
    "node_version": "v20.11.0",
    "jsgui_version": "0.0.143",
    "platform": "win32",
    "hostname": "DESKTOP-ABC123"
}
```

### GET `/api/admin/events` (SSE)

Opens an SSE stream for real-time updates.

**SSE events emitted:**

| Event Name | Trigger | Payload |
|-----------|---------|---------|
| `connected` | Client connects | `{ timestamp, client_id }` |
| `heartbeat` | Every 15s | `{ timestamp }` |
| `request` | HTTP request handled | `{ method, url, status, duration_ms, timestamp }` |
| `resource_state_change` | Pool event | `{ resource_name, from, to, timestamp }` |
| `resource_crashed` | Pool event | `{ resource_name, code, signal, timestamp }` |
| `resource_recovered` | Pool event | `{ resource_name, timestamp }` |
| `build_complete` | Bundle rebuilt | `{ bundles, built_at, errors, warnings }` |
| `server_stopping` | Server shutting down | `{ timestamp }` |

### POST `/api/admin/action`

Execute an admin action.

**Request body:**

```javascript
{
    "action": "restart_resource",
    "target": "Bundle Builder"
}
```

**Supported actions:**

| Action | Target | Description |
|--------|--------|-------------|
| `restart_resource` | Resource name | Restart a Process_Resource |
| `stop_resource` | Resource name | Stop a resource |
| `start_resource` | Resource name | Start a stopped resource |
| `toggle_debug` | — | Toggle debug mode |

**Response:**

```javascript
{
    "ok": true,
    "action": "restart_resource",
    "target": "Bundle Builder",
    "result": "restarting",
    "timestamp": 1739567000000
}
```

---

## Adapter Functions — Implementation Details

### `instrument_request_handler()`

This is the most important adapter. It wraps the request processing to capture telemetry without modifying the core request flow.

**Strategy**: The Admin Module will override or wrap the `process_request` closure inside `server.start()`. Since `process_request` is a local function, we instrument it by wrapping the router's `process` method:

```javascript
instrument_request_handler() {
    const original_process = this.server.server_router.process.bind(this.server.server_router);
    const admin = this;

    this.server.server_router.process = function(req, res) {
        const start_time = Date.now();
        const req_data = {
            method: req.method,
            url: req.url,
            timestamp: start_time
        };

        // Intercept res.end to capture status and timing
        const original_end = res.end.bind(res);
        res.end = function(...args) {
            req_data.status = res.statusCode;
            req_data.duration_ms = Date.now() - start_time;
            admin._log_request(req_data);
            return original_end(...args);
        };

        return original_process(req, res);
    };
}
```

**Circular buffer for request log:**

```javascript
_log_request(req_data) {
    this._request_log.push(req_data);
    if (this._request_log.length > 1000) {
        this._request_log.shift();
    }
    this._request_count++;

    // Broadcast via SSE if connected
    if (this._sse_publisher) {
        this._sse_publisher.broadcast('request', req_data);
    }
}
```

### `capture_bundle_info()`

Captures bundle data from the publisher's `ready` event.

```javascript
capture_bundle_info() {
    // Listen for main webpage publisher ready
    // The publisher is created in server.js constructor
    // We need access to it — either through the resource pool
    // or by having the server pass it to us

    const pool = this.server.resource_pool;
    const publishers = pool.get_resources_by_type('HTTP_Webpage_Publisher');

    publishers.forEach(pub => {
        // If already ready, capture from static responders
        // If not, listen for ready event
        pub.on('ready', (bundle) => {
            this._bundle_info = {
                built_at: Date.now(),
                items: []
            };

            if (bundle && bundle._arr) {
                for (const item of bundle._arr) {
                    this._bundle_info.items.push({
                        type: item.type || item.extension?.replace('.', ''),
                        route: item.route,
                        size_identity: item.response_buffers?.identity?.length || 0,
                        size_gzip: item.response_buffers?.gzip?.length || null,
                        size_brotli: item.response_buffers?.br?.length || null
                    });
                }
            }

            if (this._sse_publisher) {
                this._sse_publisher.broadcast('build_complete', this._bundle_info);
            }
        });
    });
}
```

### `track_route_registration()`

Instruments `server_router.set_route` to maintain a route registry.

```javascript
track_route_registration() {
    const original_set_route = this.server.server_router.set_route.bind(
        this.server.server_router
    );
    const admin = this;

    this.server.server_router.set_route = function(path, responder, handler) {
        // Record the route
        const route_entry = {
            path: path,
            handler_type: responder?.constructor?.name || 'function',
            handler_name: responder?.name || null,
            category: admin._categorize_route(path, responder),
            registered_at: Date.now()
        };

        admin._route_registry.push(route_entry);

        // Call original
        return original_set_route(path, responder, handler);
    };
}
```

### `_categorize_route(path, responder)`

Determines the category of a route for display purposes.

```javascript
_categorize_route(path, responder) {
    const type_name = responder?.constructor?.name || '';

    if (path.startsWith('/api/admin/')) return 'admin';
    if (path === '/admin') return 'admin';
    if (type_name === 'HTTP_Function_Publisher') return 'api';
    if (type_name === 'Observable_Publisher') return 'observable';
    if (type_name === 'HTTP_SSE_Publisher') return 'sse';
    if (type_name === 'Static_Route_HTTP_Responder') return 'auto';
    if (type_name === 'HTTP_Website_Publisher') return 'website';
    if (path.startsWith('/static')) return 'static';
    return 'other';
}
```

---

## SSE Channel Setup

The Admin Module creates its own `HTTP_SSE_Publisher` for streaming real-time events to the admin UI:

```javascript
_setup_sse() {
    const HTTP_SSE_Publisher = require('../../publishers/http-sse-publisher');

    this._sse_publisher = new HTTP_SSE_Publisher({
        name: 'admin_events',
        keepaliveIntervalMs: 15000,
        maxClients: 10,
        eventHistorySize: 500
    });

    // Wire up resource pool events
    const pool = this.server.resource_pool;
    const event_names = [
        'resource_state_change',
        'crashed',
        'unhealthy',
        'unreachable',
        'recovered',
        'removed'
    ];

    event_names.forEach(event_name => {
        pool.on(event_name, (event_data) => {
            this._sse_publisher.broadcast(event_name, event_data);
        });
    });
}
```

---

## Initialization Sequence

The Admin Module follows this startup order:

1. **Constructor** — Store server reference, initialize buffers
2. **`track_route_registration()`** — Instrument `set_route` before any routes are registered (must happen first!)
3. **`_setup_sse()`** — Create SSE publisher
4. **`attach_to_router(router)`** — Register all `/api/admin/*` endpoints
5. **`instrument_request_handler()`** — Wrap request processing (after routes are set up, to avoid instrumenting admin route setup itself)
6. **`capture_bundle_info()`** — Listen for bundle ready events

```javascript
// In server.js constructor:
const Admin_Module = require('./admin-ui/v1/server');
this.admin = new Admin_Module(this);
this.admin.track_route_registration();
this.admin._setup_sse();
this.admin.attach_to_router(server_router);

// After all user routes are set up:
this.admin.instrument_request_handler();
this.admin.capture_bundle_info();
```

---

## Error Handling

Every adapter function is defensive:

```javascript
get_process_info() {
    try {
        return {
            main: {
                pid: process.pid,
                state: 'running',
                uptime_seconds: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            children: this._get_child_processes()
        };
    } catch (err) {
        return {
            main: { pid: process.pid, state: 'unknown', error: err.message },
            children: []
        };
    }
}
```

If a property doesn't exist or throws, the adapter returns a safe default. The admin UI must also handle missing/null values gracefully.

---

## Data Refresh Strategy

| Data Category | Strategy | Interval |
|--------------|----------|----------|
| Process memory | Client polls `/api/admin/snapshot` | Every 5s |
| Resource states | SSE push on state change | Instant |
| Route table | Client fetches on navigation | On demand |
| Request log | SSE push per request | Instant |
| Build info | SSE push on build | On build |
| Config | Client fetches on navigation | On demand |
| Uptime | Client-side timer from initial value | Every 1s (client-calculated) |

This minimizes server load: only memory/CPU require periodic polling. Everything else is either static or event-driven.
