# Chapter 14: Real-Time Updates — SSE & Observable Integration

## Overview

The Admin UI uses **Server-Sent Events (SSE)** as its primary real-time channel. jsgui3-server provides two publisher types that support SSE:

1. **`HTTP_SSE_Publisher`** — Multi-client broadcast channel with event history
2. **`HTTP_Observable_Publisher`** — Streams an observable's emissions to SSE clients

The Admin UI uses `HTTP_SSE_Publisher` for the admin event channel (`/api/admin/v1/events`), with the adapter broadcasting events from various server subsystems into this single channel.

---

## SSE Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Server                                    │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Request Handler  │  │ Resource Pool    │  │ Build System   │  │
│  │ (instrumented)   │  │ (events)         │  │ (ready event)  │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
│           │                    │                     │           │
│           ▼                    ▼                     ▼           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Admin_Module_V1._broadcast()                  │  │
│  │                                                            │  │
│  │  Normalizes event data → JSON → SSE_Publisher.broadcast()  │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                              │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │           HTTP_SSE_Publisher                                │  │
│  │           /api/admin/v1/events                              │  │
│  │                                                            │  │
│  │  clients: Map<id, {res, connected_at}>                     │  │
│  │  event_history: Array (last 100)                           │  │
│  └──────┬────────────┬────────────┬───────────────────────────┘  │
│         │            │            │                              │
└─────────┼────────────┼────────────┼──────────────────────────────┘
          │            │            │
          ▼            ▼            ▼
     Browser 1    Browser 2    Browser 3
     EventSource  EventSource  EventSource
```

---

## Event Types

The SSE channel emits the following event types:

| Event Name | Source | Frequency | Data Shape |
|------------|--------|-----------|------------|
| `heartbeat` | Timer (5s) | Periodic | `{ uptime, pid, memory, request_count, requests_per_minute, pool_summary }` |
| `request` | Request handler | Per-request | `{ method, url, status, duration_ms, timestamp }` |
| `resource_state_change` | Resource pool | On change | `{ resourceName, from, to, timestamp }` |
| `crashed` | Resource pool | On crash | `{ resourceName, code, signal, timestamp }` |
| `unhealthy` | Resource pool | On unhealthy | `{ resourceName, timestamp, details }` |
| `recovered` | Resource pool | On recovery | `{ resourceName, timestamp }` |
| `process_state_change` | Process resources | On change | `{ name, pid, from, to, timestamp }` |
| `process_health` | Process resources | On check | `{ name, pid, healthy, memory_usage, timestamp }` |
| `build_complete` | Publisher | On build | `{ items: [{type, size_identity, size_gzip}], built_at }` |

---

## Client-Side SSE Connection

### EventSource Setup

```javascript
// In admin-ui/v1/utils/sse_client.js

class SSE_Client {
    constructor(url, options = {}) {
        this._url = url;
        this._handlers = {};
        this._reconnect_delay = options.reconnect_delay || 3000;
        this._max_reconnect_delay = options.max_reconnect_delay || 30000;
        this._current_delay = this._reconnect_delay;
        this._connected = false;
        this._event_source = null;
    }

    connect() {
        if (this._event_source) {
            this._event_source.close();
        }

        this._event_source = new EventSource(this._url);

        this._event_source.addEventListener('open', () => {
            this._connected = true;
            this._current_delay = this._reconnect_delay;  // Reset backoff
            this._emit_internal('connected');
        });

        this._event_source.addEventListener('error', () => {
            this._connected = false;
            this._emit_internal('disconnected');
            // EventSource handles reconnection automatically,
            // but we track state for the UI
        });

        // Register all event handlers
        for (const event_name of Object.keys(this._handlers)) {
            if (event_name.startsWith('_')) continue;  // Skip internal events
            this._event_source.addEventListener(event_name, (e) => {
                try {
                    const data = JSON.parse(e.data);
                    this._handlers[event_name].forEach(fn => fn(data));
                } catch (err) {
                    console.warn(`SSE parse error for ${event_name}:`, err);
                }
            });
        }
    }

    on(event_name, handler) {
        if (!this._handlers[event_name]) {
            this._handlers[event_name] = [];

            // If already connected, register the listener dynamically
            if (this._event_source) {
                this._event_source.addEventListener(event_name, (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        this._handlers[event_name].forEach(fn => fn(data));
                    } catch (err) {
                        console.warn(`SSE parse error for ${event_name}:`, err);
                    }
                });
            }
        }
        this._handlers[event_name].push(handler);
    }

    off(event_name, handler) {
        if (this._handlers[event_name]) {
            this._handlers[event_name] = this._handlers[event_name].filter(fn => fn !== handler);
        }
    }

    _emit_internal(event_name) {
        const key = `_${event_name}`;
        if (this._handlers[key]) {
            this._handlers[key].forEach(fn => fn());
        }
    }

    on_connected(handler) {
        this.on('_connected', handler);
    }

    on_disconnected(handler) {
        this.on('_disconnected', handler);
    }

    get connected() {
        return this._connected;
    }

    close() {
        if (this._event_source) {
            this._event_source.close();
            this._event_source = null;
        }
        this._connected = false;
    }
}

module.exports = SSE_Client;
```

### Integration with Admin_Shell

```javascript
// In Admin_Shell.activate()
_connect_sse() {
    const sse = new SSE_Client('/api/admin/v1/events');

    // Connection state
    sse.on_connected(() => this._set_connection_status('connected'));
    sse.on_disconnected(() => this._set_connection_status('disconnected'));

    // Event routing
    sse.on('heartbeat', (data) => this._on_heartbeat(data));
    sse.on('request', (data) => this._on_request_event(data));
    sse.on('resource_state_change', (data) => this._on_resource_event(data));
    sse.on('crashed', (data) => this._on_resource_event(data));
    sse.on('unhealthy', (data) => this._on_resource_event(data));
    sse.on('recovered', (data) => this._on_resource_event(data));
    sse.on('process_state_change', (data) => this._on_process_event(data));
    sse.on('build_complete', (data) => this._on_build_event(data));

    sse.connect();
    this._sse = sse;
}
```

---

## Event Routing to Views

The Admin_Shell routes SSE events to whichever view is currently active:

```javascript
_on_heartbeat(data) {
    // Status bar — always updated
    this._update_status_bar(data);

    // Dashboard stat cards — updated if dashboard is visible
    if (this._current_view === 'dashboard' && this._dashboard_controls) {
        const dc = this._dashboard_controls;

        dc.uptime_card.update({
            value: format_uptime(data.uptime),
            detail: format_bytes(data.memory?.rss || 0)
        });

        dc.rps_card.update({
            value: data.requests_per_minute || 0,
            detail: `${data.request_count || 0} total`
        });

        if (data.pool_summary) {
            dc.pool_card.update({
                value: `${data.pool_summary.running || 0}/${data.pool_summary.total || 0}`,
                detail: 'running'
            });
        }

        dc.routes_card.update({
            value: data.route_count || 0,
            detail: 'registered'
        });
    }
}

_on_request_event(data) {
    // Log viewer — always receives events (for any active log viewer)
    if (this._current_view === 'dashboard' && this._dashboard_controls?.activity_log) {
        this._dashboard_controls.activity_log.append_request(data);
    }

    if (this._current_view === 'logs' && this._logs_viewer) {
        this._logs_viewer.append_request(data);
    }
}

_on_resource_event(data) {
    // Resource table — update if visible
    if (this._current_view === 'dashboard' && this._dashboard_controls?.resource_table) {
        this._dashboard_controls.resource_table.refresh();
    }

    if (this._current_view === 'resources' && this._resources_table) {
        this._resources_table.refresh();
    }

    // Log viewer — resource events are also logged
    if (this._current_view === 'dashboard' && this._dashboard_controls?.activity_log) {
        this._dashboard_controls.activity_log.append_resource_event(data);
    }

    if (this._current_view === 'logs' && this._logs_viewer) {
        this._logs_viewer.append_resource_event(data);
    }

    // Status view — update health indicator
    if (this._current_view === 'status') {
        this._update_health_status(data);
    }
}

_on_process_event(data) {
    if (this._current_view === 'dashboard' && this._dashboard_controls?.process_panel) {
        this._dashboard_controls.process_panel.refresh();
    }

    if (this._current_view === 'processes' && this._process_panel) {
        this._process_panel.refresh();
    }
}

_on_build_event(data) {
    if (this._current_view === 'dashboard' && this._dashboard_controls?.build_status) {
        this._dashboard_controls.build_status.update(data);
    }

    if (this._current_view === 'build' && this._build_status) {
        this._build_status.update(data);
    }

    // Log the build event
    if (this._current_view === 'dashboard' && this._dashboard_controls?.activity_log) {
        this._dashboard_controls.activity_log.append_build_event(data);
    }
}
```

---

## Server-Side: HTTP_SSE_Publisher Usage

### Broadcast Method

The `HTTP_SSE_Publisher` from jsgui3-server provides a `broadcast(event_name, data)` method that sends to all connected clients:

```javascript
// From publishers/http-sse-publisher.js
// The publisher handles:
// - Client connection registration
// - Client disconnection cleanup
// - Event history for replay on reconnect
// - JSON serialization of data
// - SSE format: "event: name\ndata: json\n\n"
```

### Client Tracking

The publisher maintains a `clients` Map:
```javascript
{
    client_id: {
        res: http.ServerResponse,
        connected_at: timestamp
    }
}
```

The admin adapter can query this to show active SSE connections:
```javascript
get_sse_client_count() {
    if (this._sse_publisher && this._sse_publisher.clients) {
        return this._sse_publisher.clients.size;
    }
    return 0;
}
```

---

## Event History & Replay

When a client reconnects (browser refresh, network hiccup), it receives the last N events from the history buffer. This prevents the dashboard from showing empty data after a reconnect.

The `HTTP_SSE_Publisher` stores up to `history_size` events (configured as 100 in the admin channel). On reconnect, the client's `Last-Event-ID` header is used to determine which events to replay:

```javascript
// Server behavior on client connect:
// 1. Send any events after Last-Event-ID
// 2. Each broadcast includes an auto-incrementing ID
// 3. Client EventSource automatically sends Last-Event-ID on reconnect
```

This is handled by the publisher internally — the admin module doesn't need to implement replay logic.

---

## Observable Publisher Integration

For existing `HTTP_Observable_Publisher` instances registered with the server, the admin UI can display their status:

```javascript
// Adapter: enumerate observable publishers
get_observables_status(server) {
    const result = [];
    const publishers = server._publishers || [];

    publishers.forEach(pub => {
        if (pub.constructor.name === 'HTTP_Observable_Publisher' ||
            pub.active_sse_connections !== undefined) {
            result.push({
                name: pub.name || pub.path || 'unnamed',
                path: pub.path || null,
                active_connections: pub.active_sse_connections || 0,
                paused: pub._paused || false,
                total_emitted: pub._emission_count || 0
            });
        }
    });

    return result;
}
```

This information is displayed in the Resources view under a separate "Observable Streams" section.

---

## Throttling & Backpressure

### Server-Side Throttling

High-frequency events (requests under load) could overwhelm SSE clients. The adapter applies event-level throttling:

```javascript
// In Admin_Module_V1
_broadcast_request(data) {
    // Throttle request events to max 10 per second
    const now = Date.now();
    if (!this._last_request_broadcast) {
        this._last_request_broadcast = now;
        this._request_broadcast_count = 0;
    }

    if (now - this._last_request_broadcast > 1000) {
        // Reset window
        this._last_request_broadcast = now;
        this._request_broadcast_count = 0;
    }

    this._request_broadcast_count++;
    if (this._request_broadcast_count <= 10) {
        this._broadcast('request', data);
    }
    // Requests beyond the limit are still counted in telemetry
    // but not broadcast individually
}
```

### Client-Side Batching

As described in Chapter 9, the Log_Viewer uses `requestAnimationFrame` to batch DOM updates when events arrive rapidly:

```javascript
// In Log_Viewer — batched rendering
_throttled_append(entry) {
    this._pending_entries.push(entry);
    if (!this._flush_scheduled) {
        this._flush_scheduled = true;
        requestAnimationFrame(() => {
            this._pending_entries.forEach(e => this._render_entry(e));
            this._pending_entries = [];
            this._flush_scheduled = false;
        });
    }
}
```

---

## Connection Resilience

### Automatic Reconnection

The browser's `EventSource` API automatically reconnects on connection loss. The SSE_Client wrapper tracks state and updates the UI accordingly:

```
Connected ──── Connection lost ──── Reconnecting ──── Connected
   ●                  ○                  ◐                ●
  green              red               amber            green
```

### Stale Data Handling

After reconnection, the dashboard fetches a fresh snapshot via `GET /api/admin/v1/status` to ensure stat cards show current values, not stale data from before the disconnection:

```javascript
// In SSE_Client
sse.on_connected(() => {
    this._set_connection_status('connected');
    // Refresh all snapshot data
    this._fetch_initial_data();
});
```

---

## SSE vs WebSocket — Why SSE

jsgui3-server already has SSE infrastructure (`HTTP_SSE_Publisher`, `HTTP_Observable_Publisher`). WebSocket support would require:
- New dependency or custom implementation
- Different publisher type
- Client-side WebSocket handling

SSE is the right choice because:
1. **Already built** — No new infrastructure needed
2. **Unidirectional** — Admin telemetry flows server → client only
3. **Auto-reconnect** — Browser EventSource handles reconnection
4. **HTTP compatible** — Works through proxies and load balancers
5. **Event history** — The publisher already supports replay

The only case where WebSocket would be preferred is bidirectional communication (e.g., interactive terminal). For the Admin UI's Phase 1 read-only dashboard, SSE is sufficient and optimal.
