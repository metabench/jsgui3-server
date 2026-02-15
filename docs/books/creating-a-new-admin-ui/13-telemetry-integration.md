# Chapter 13: Telemetry Integration — Instrumenting the Server

## Overview

This chapter covers the code changes needed to make the server emit the telemetry data that the Admin UI consumes. Unlike the domain controls (Chapters 5–11), which specify client-side controls, this chapter specifies **server-side modifications** — the adapter functions that intercept, measure, and broadcast server activity.

The guiding principle: **instrument, don't restructure**. We wrap existing methods and listen to existing events rather than rewriting core systems.

---

## What Needs Instrumentation

From the data availability audit in Chapter 3, the following data sources require adapter-level instrumentation:

| Data | Current State | Instrumentation Needed |
|------|---------------|----------------------|
| Request count & timing | Not tracked | Wrap `router.process` |
| Request rate (req/min) | Not tracked | Rolling window counter |
| Response status codes | Not tracked | Wrap `res.end` |
| Route list | No listing API | Wrap `set_route` |
| Build timestamps | Not persisted | Listen to publisher `ready` |
| Bundle sizes (gzip) | Not computed | Compute on `ready` |
| SSE connection count | Available per-publisher | Aggregate across publishers |
| Process resource events | Events exist | Forward to SSE channel |
| Config snapshot | Scattered properties | Aggregate adapter function |

---

## Request Telemetry

### Interception Point

The server's request handling flows through `router.process(req, res)`. We wrap this method to capture timing and status:

```javascript
// In Admin_Module_V1.init(server)
instrument_request_handler(server) {
    const router = server.router;
    if (!router || !router.process) return;

    // Preserve original
    const original_process = router.process.bind(router);

    // Counters
    this._request_count = 0;
    this._request_window = [];      // timestamps for rate calculation
    this._status_counts = {};       // { 200: 142, 404: 3, ... }

    router.process = (req, res) => {
        const start = Date.now();
        this._request_count++;

        // Track in rolling window (last 60 seconds)
        const now = Date.now();
        this._request_window.push(now);
        this._trim_request_window(now);

        // Wrap res.end to capture status and timing
        const original_end = res.end.bind(res);
        res.end = (...args) => {
            const duration_ms = Date.now() - start;
            const status = res.statusCode || 200;

            // Update status counts
            this._status_counts[status] = (this._status_counts[status] || 0) + 1;

            // Broadcast to SSE
            this._broadcast_request({
                method: req.method,
                url: req.url,
                status: status,
                duration_ms: duration_ms,
                timestamp: start,
                content_length: res.getHeader('content-length') || null
            });

            return original_end(...args);
        };

        return original_process(req, res);
    };
}

_trim_request_window(now) {
    const cutoff = now - 60000;  // 60 second window
    while (this._request_window.length > 0 && this._request_window[0] < cutoff) {
        this._request_window.shift();
    }
}

get_requests_per_minute() {
    this._trim_request_window(Date.now());
    return this._request_window.length;
}
```

### Filter: Admin Routes

Admin API requests (`/api/admin/*`) should **not** be counted in the request telemetry to avoid feedback loops. The SSE connection itself also generates requests that shouldn't inflate the counter:

```javascript
// In the wrapped router.process
router.process = (req, res) => {
    // Skip admin routes from telemetry
    if (req.url && req.url.startsWith('/api/admin/')) {
        return original_process(req, res);
    }
    if (req.url && req.url.startsWith('/admin')) {
        return original_process(req, res);
    }

    // ... instrumentation continues
};
```

---

## Route Registration Tracking

### Interception Point

The router's `set_route` method is wrapped to maintain a list of all registered routes:

```javascript
track_route_registration(server) {
    const router = server.router;
    if (!router || !router.set_route) return;

    this._routes = [];
    const original_set_route = router.set_route.bind(router);

    router.set_route = (path, responder_or_handler, handler) => {
        // Determine the handler type
        const route_info = {
            path: path,
            type: this._categorize_route(path, responder_or_handler),
            handler_name: this._get_handler_name(responder_or_handler, handler),
            registered_at: Date.now()
        };

        this._routes.push(route_info);

        return original_set_route(path, responder_or_handler, handler);
    };
}

_categorize_route(path, handler) {
    if (path.startsWith('/api/admin'))  return 'admin';
    if (path.startsWith('/api/'))       return 'api';
    if (path === '/admin')              return 'admin';

    // Check handler type
    const handler_name = handler?.constructor?.name || '';
    if (handler_name.includes('Webpage'))    return 'webpage';
    if (handler_name.includes('Function'))   return 'api';
    if (handler_name.includes('Observable')) return 'observable';
    if (handler_name.includes('SSE'))        return 'sse';
    if (handler_name.includes('CSS'))        return 'static';
    if (handler_name.includes('JS'))         return 'static';

    return 'route';
}

_get_handler_name(responder, handler) {
    if (handler && typeof handler === 'function') {
        return handler.name || 'anonymous';
    }
    if (responder && responder.constructor) {
        return responder.constructor.name;
    }
    return 'unknown';
}

get_routes_list() {
    return this._routes.map(r => ({
        path: r.path,
        type: r.type,
        handler: r.handler_name,
        method: this._infer_method(r.type)
    }));
}

_infer_method(type) {
    switch (type) {
        case 'api':        return 'POST';
        case 'observable': return 'GET';
        case 'sse':        return 'GET';
        case 'static':     return 'GET';
        case 'webpage':    return 'GET';
        default:           return 'ANY';
    }
}
```

---

## Build & Bundle Telemetry

### Interception Point

Build data is captured when `HTTP_Webpage_Publisher` instances emit their `ready` event:

```javascript
capture_bundle_info(server) {
    this._build_info = null;
    const publishers = server._publishers || [];

    publishers.forEach(pub => {
        // Check if it's a webpage publisher with bundling
        if (pub.js_output_path !== undefined || pub.css_output_path !== undefined) {
            const capture = () => {
                const info = {
                    publisher_name: pub.name || pub.constructor.name || 'default',
                    items: [],
                    built_at: Date.now(),
                    entry_point: pub.src_path_client_js || null,
                    build_path: pub.build_path || null,
                    source_maps: !!pub.source_maps
                };

                // JS bundle
                if (pub.js_output_path && fs.existsSync(pub.js_output_path)) {
                    const stat = fs.statSync(pub.js_output_path);
                    let gzip_size = 0;
                    try {
                        const buf = fs.readFileSync(pub.js_output_path);
                        gzip_size = zlib.gzipSync(buf).length;
                    } catch (e) { /* non-critical */ }

                    info.items.push({
                        type: 'js',
                        path: pub.js_output_path,
                        filename: path.basename(pub.js_output_path),
                        size_identity: stat.size,
                        size_gzip: gzip_size,
                        compression_ratio: gzip_size > 0
                            ? (gzip_size / stat.size * 100).toFixed(1) : '0'
                    });
                }

                // CSS bundle
                if (pub.css_output_path && fs.existsSync(pub.css_output_path)) {
                    const stat = fs.statSync(pub.css_output_path);
                    let gzip_size = 0;
                    try {
                        const buf = fs.readFileSync(pub.css_output_path);
                        gzip_size = zlib.gzipSync(buf).length;
                    } catch (e) { /* non-critical */ }

                    info.items.push({
                        type: 'css',
                        path: pub.css_output_path,
                        filename: path.basename(pub.css_output_path),
                        size_identity: stat.size,
                        size_gzip: gzip_size,
                        compression_ratio: gzip_size > 0
                            ? (gzip_size / stat.size * 100).toFixed(1) : '0'
                    });
                }

                this._build_info = info;

                // Broadcast build event
                this._broadcast('build_complete', info);
            };

            // Listen for ready
            if (typeof pub.on === 'function') {
                pub.on('ready', capture);
            }

            // If already ready, capture now
            if (pub._ready) {
                capture();
            }
        }
    });
}
```

---

## Resource Pool Event Forwarding

The `Server_Resource_Pool` already emits events (`resource_state_change`, `crashed`, `unhealthy`, `unreachable`, `recovered`). The adapter subscribes and forwards to the SSE channel:

```javascript
subscribe_resource_events(server) {
    const pool = server.resource_pool;
    if (!pool) return;

    const events_to_forward = [
        'resource_state_change',
        'crashed',
        'unhealthy',
        'unreachable',
        'recovered',
        'removed'
    ];

    events_to_forward.forEach(event_name => {
        pool.on(event_name, (data) => {
            this._broadcast(event_name, {
                event: event_name,
                resourceName: data.name || data.resourceName || 'unknown',
                from: data.from || null,
                to: data.to || data.state || null,
                timestamp: Date.now(),
                details: data
            });
        });
    });
}
```

---

## Process Resource Event Forwarding

Individual `Process_Resource` instances emit stdout, stderr, and lifecycle events. These are forwarded for the Process Panel and Log Viewer:

```javascript
subscribe_process_events(server) {
    const pool = server.resource_pool;
    if (!pool || !pool.resources) return;

    pool.resources.forEach((resource, name) => {
        if (resource.type === 'process' || resource.constructor.name === 'Process_Resource') {
            // State changes
            resource.on('state_change', (data) => {
                this._broadcast('process_state_change', {
                    name: name,
                    pid: resource.pid,
                    from: data.from,
                    to: data.to,
                    timestamp: Date.now()
                });
            });

            // Health checks
            resource.on('health_check', (data) => {
                this._broadcast('process_health', {
                    name: name,
                    pid: resource.pid,
                    healthy: data.healthy,
                    memory_usage: data.memory_usage || null,
                    timestamp: Date.now()
                });
            });
        }
    });

    // Also watch for newly added resources
    pool.on('resource_added', (data) => {
        // Re-subscribe to new process resources
        const resource = pool.resources.get(data.name);
        if (resource && (resource.type === 'process' || resource.constructor.name === 'Process_Resource')) {
            resource.on('state_change', (state_data) => {
                this._broadcast('process_state_change', {
                    name: data.name,
                    pid: resource.pid,
                    from: state_data.from,
                    to: state_data.to,
                    timestamp: Date.now()
                });
            });
        }
    });
}
```

---

## Heartbeat Emission

A periodic heartbeat event provides status bar data without requiring the client to poll:

```javascript
start_heartbeat(server) {
    this._heartbeat_interval = setInterval(() => {
        const pool = server.resource_pool;
        const pool_summary = pool ? pool.summary : { total: 0, running: 0 };

        this._broadcast('heartbeat', {
            uptime: Math.floor(process.uptime()),
            pid: process.pid,
            memory: process.memoryUsage(),
            request_count: this._request_count || 0,
            requests_per_minute: this.get_requests_per_minute(),
            pool_summary: pool_summary,
            route_count: this._routes ? this._routes.length : 0,
            timestamp: Date.now()
        });
    }, 5000);  // Every 5 seconds
}
```

---

## Aggregate Status Endpoint

`GET /api/admin/v1/status` returns a comprehensive snapshot that the dashboard uses for initial population:

```javascript
get_status(server) {
    const mem = process.memoryUsage();
    const pool = server.resource_pool;

    return {
        process: {
            pid: process.pid,
            title: process.title,
            uptime: Math.floor(process.uptime()),
            memory: {
                rss: mem.rss,
                heap_used: mem.heapUsed,
                heap_total: mem.heapTotal,
                external: mem.external
            },
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd()
        },
        server: {
            port: server.port || null,
            host: server.host || '0.0.0.0'
        },
        telemetry: {
            request_count: this._request_count || 0,
            requests_per_minute: this.get_requests_per_minute(),
            status_counts: this._status_counts || {}
        },
        pool: pool ? pool.summary : { total: 0, running: 0, stopped: 0 },
        routes: {
            total: this._routes ? this._routes.length : 0
        },
        build: this._build_info || null
    };
}
```

---

## Initialization Sequence

The instrumentation must be applied in the correct order, after the server's core systems are initialized but before it starts accepting requests:

```javascript
class Admin_Module_V1 {
    init(server) {
        // 1. Track route registration FIRST (before other modules register routes)
        this.track_route_registration(server);

        // 2. Register admin API endpoints (these are tracked by step 1)
        this._register_endpoints(server);

        // 3. Instrument request handler (after routes exist)
        this.instrument_request_handler(server);

        // 4. Subscribe to resource pool events
        this.subscribe_resource_events(server);

        // 5. Subscribe to process resource events
        this.subscribe_process_events(server);

        // 6. Capture build info (listens for publisher ready)
        this.capture_bundle_info(server);

        // 7. Start SSE channel
        this._init_sse_channel(server);

        // 8. Start heartbeat
        this.start_heartbeat(server);
    }

    _register_endpoints(server) {
        const fn_publisher = server.fn_publisher || new HTTP_Function_Publisher({ context: server.context });

        // GET endpoints
        fn_publisher.publish('/api/admin/v1/status',    () => this.get_status(server));
        fn_publisher.publish('/api/admin/v1/resources',  () => this.get_resources_tree(server));
        fn_publisher.publish('/api/admin/v1/routes',     () => this.get_routes_list());
        fn_publisher.publish('/api/admin/v1/build',      () => this._build_info || {});
        fn_publisher.publish('/api/admin/v1/config',     () => this.get_config(server));

        // POST endpoint for config changes
        fn_publisher.publish('/api/admin/v1/config/set', (body) => this.set_config(body));
    }

    _init_sse_channel(server) {
        this._sse_publisher = new HTTP_SSE_Publisher({
            context: server.context,
            history_size: 100
        });

        server.router.set_route('/api/admin/v1/events', this._sse_publisher);
    }

    _broadcast(event_name, data) {
        if (this._sse_publisher) {
            this._sse_publisher.broadcast(event_name, data);
        }
    }

    _broadcast_request(data) {
        this._broadcast('request', data);
    }

    destroy() {
        if (this._heartbeat_interval) {
            clearInterval(this._heartbeat_interval);
        }
        if (this._sse_publisher) {
            // Close all SSE connections
            this._sse_publisher.close_all && this._sse_publisher.close_all();
        }
    }
}
```

---

## Impact Assessment

### Performance Impact

| Instrumentation | Overhead per Request | Notes |
|-----------------|---------------------|-------|
| Request wrapping | ~0.1ms | One Date.now() call + array push |
| Route tracking | None at runtime | Only runs during registration |
| Build capture | None at runtime | Only runs on publisher ready |
| Resource events | None per request | Event-driven, no polling |
| Heartbeat | ~1ms every 5s | process.memoryUsage() is the main cost |
| SSE broadcast | ~0.5ms per event | JSON serialization + write to clients |

Total overhead: **< 1ms per request** for the common case.

### Memory Impact

| Data Structure | Max Size | Notes |
|---------------|----------|-------|
| Request window | ~60K entries max | 1-minute window, trimmed continuously |
| Route list | ~100 entries | Static after initialization |
| Build info | 1 object | Overwritten on each build |
| SSE history | 100 events | Configured via `history_size` |
| Status counts | ~10 entries | One per status code |

Total: **< 1 MB** additional memory for typical workloads.

### Safety

- **No core modifications**: All instrumentation wraps existing methods; originals are preserved
- **Admin routes excluded**: The admin panel's own requests don't inflate telemetry
- **Graceful degradation**: If any instrumentation fails to attach (missing router, no pool), the admin panel shows "–" instead of crashing
- **Cleanup**: `destroy()` clears intervals and closes SSE connections
