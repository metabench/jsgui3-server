# Chapter 3: Server Introspection — What Data Is Available

## Purpose

Before designing any UI control, we must know precisely what data the server can provide. This chapter is an exhaustive audit of every data source within a running jsgui3-server instance, organized by category. For each data source, we document:

- **Where it lives** (which object/property)
- **What it contains** (shape and types)
- **How to access it** (read pattern)
- **Update frequency** (static vs. dynamic)
- **Admin UI control** that will display it

---

## 1. Main Process Information

### Source: `process` (Node.js global)

| Data Point | Access | Shape | Frequency |
|-----------|--------|-------|-----------|
| Process ID | `process.pid` | `number` | Static |
| Memory usage | `process.memoryUsage()` | `{ rss, heapTotal, heapUsed, external, arrayBuffers }` (bytes) | Dynamic — sample on demand |
| Uptime | `process.uptime()` | `number` (seconds) | Dynamic — always changing |
| Node.js version | `process.version` | `string` (e.g., `'v20.11.0'`) | Static |
| Platform | `process.platform` | `string` (e.g., `'win32'`, `'linux'`) | Static |
| Architecture | `process.arch` | `string` (e.g., `'x64'`) | Static |
| Command-line args | `process.argv` | `string[]` | Static |
| Working directory | `process.cwd()` | `string` | Static |
| Environment (selected) | `process.env.PORT`, `process.env.JSGUI_DEBUG`, etc. | `string \| undefined` | Static |
| CPU usage | `process.cpuUsage()` | `{ user, system }` (microseconds) | Dynamic — sample on demand |

**Admin UI controls**: Stat_Card (PID, memory), Status_Bar (uptime), Version_Label

### Source: `os` module

| Data Point | Access | Shape | Frequency |
|-----------|--------|-------|-----------|
| CPU info | `os.cpus()` | `Array<{ model, speed, times }>` | Semi-static |
| Total memory | `os.totalmem()` | `number` (bytes) | Static |
| Free memory | `os.freemem()` | `number` (bytes) | Dynamic |
| Hostname | `os.hostname()` | `string` | Static |
| Network interfaces | `os.networkInterfaces()` | `{ [name]: Array<{ address, family, ... }> }` | Semi-static |
| OS type | `os.type()` | `string` | Static |
| Uptime (OS) | `os.uptime()` | `number` (seconds) | Dynamic |

**Admin UI controls**: Config_Panel, Status_Bar

---

## 2. Server Instance Properties

### Source: `server` (JSGUI_Single_Process_Server instance)

| Property | Type | Description | Available |
|----------|------|-------------|-----------|
| `server.name` | `string` | Server name (from spec) | Always |
| `server.debug` | `boolean` | Debug mode flag | Always |
| `server.Ctrl` | `function \| undefined` | Main control constructor | If single-ctrl mode |
| `server.disk_path_client_js` | `string \| undefined` | Path to client.js entry | If JS bundling active |
| `server.http_servers` | `Array<http.Server>` | Bound HTTP/HTTPS server instances | After start() |
| `server.resource_pool` | `Server_Resource_Pool` | The resource pool | Always |
| `server.server_router` | `Router` | The HTTP router | Always |
| `server.admin` | `Admin_Module` | Admin module instance | Always |
| `server.function_publishers` | `Array<HTTP_Function_Publisher>` | Published API functions | After publish() calls |
| `server.sse_publisher` | `HTTP_SSE_Publisher \| undefined` | SSE event publisher | If events configured |
| `server._ws_publisher` | `HTTP_Website_Publisher \| undefined` | Website publisher | If website mode |
| `server._started` | `boolean` | Whether start() has been called | After start() |
| `server.port` | `number` | Bound port number | After start() |
| `server.allowed_addresses` | `string[] \| undefined` | IP address filter | If host specified |
| `server.https_options` | `object \| undefined` | TLS configuration | If HTTPS enabled |

**Admin UI controls**: Stat_Card, Config_Panel, Status_Bar, Toolbar

### Derived Data from `server.http_servers`

Each `http.Server` instance provides:

| Data Point | Access | Shape |
|-----------|--------|-------|
| Listening address | `server.address()` | `{ address, family, port }` |
| Connection count | `server.getConnections(cb)` | `number` (async) |
| Timeout setting | `server.timeout` | `number` (ms) |
| Keep-alive timeout | `server.keepAliveTimeout` | `number` (ms) |

**Admin UI controls**: Stat_Card (connections), Config_Panel (timeouts)

---

## 3. Resource Pool

### Source: `server.resource_pool` (Server_Resource_Pool)

#### Pool-Level Data

| Property/Method | Return Type | Description |
|----------------|-------------|-------------|
| `pool.summary` | `{ total, running, stopped, crashed, unreachable, byType }` | Aggregate statistics |
| `pool.resource_names` | `string[]` (inherited) | List of registered resource names |
| `pool.get_resource(name)` | `Resource \| undefined` | Get specific resource |
| `pool.get_resources_by_type(type)` | `Resource[]` | Filter by constructor/type |

#### Per-Resource Data

Every resource in the pool provides:

| Property | Type | Description |
|----------|------|-------------|
| `resource.name` | `string` | Resource name |
| `resource.constructor.name` | `string` | Class name (e.g., `'Router'`, `'Website_Resource'`) |
| `resource.__type_name` | `string \| undefined` | Type name override |
| `resource.state` | `string` | Current state |
| `resource.status` | `object` | Status object (varies by type) |

**Typical resources in a running server:**

| Name | Constructor | Notes |
|------|-------------|-------|
| `'Local Server Info'` | `Local_Server_Info` | OS info provider |
| `'Server Router'` | `Router` | HTTP routing |
| `'Admin_Publisher'` | `HTTP_Webpage_Publisher` | Admin UI publisher |
| `'Website_Resource - Single Webpage'` | `Website_Resource` | User's page |
| Any published function | `HTTP_Function_Publisher` | API endpoint |
| Custom resources | Varies | User-configured resources |

#### Pool Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `'resource_state_change'` | `{ resourceName, from, to, timestamp }` | Resource state transition |
| `'crashed'` | `{ resourceName, code?, signal?, ... }` | Resource crash |
| `'unhealthy'` | `{ resourceName, consecutiveFailures, ... }` | Health check failures |
| `'unreachable'` | `{ resourceName, consecutiveFailures, error }` | Remote resource unreachable |
| `'recovered'` | `{ resourceName, status }` | Resource recovery |
| `'removed'` | `{ resourceName, timestamp }` | Resource removed from pool |

**Admin UI controls**: Resource_Table, Health_Badge, Activity_Log

---

## 4. Router & Routes

### Source: `server.server_router` (Router)

The Router stores routes internally. To enumerate them for the admin UI, we need an adapter method since the Router doesn't natively expose a `list_routes()` API.

#### What we know from `set_route` calls:

Each route registration contains:
- **Path** — e.g., `/`, `/admin`, `/api/admin/resources`, `/js/js.js`
- **Responder object** — The publisher or handler instance
- **Handler function** — The `handle_http` method reference

#### Route categories (by responder type):

| Category | Responder Type | Examples |
|----------|---------------|----------|
| Auto (webpage) | `Static_Route_HTTP_Responder` | `/`, `/js/js.js`, `/css/css.css` |
| API | `HTTP_Function_Publisher` | `/api/validateUser`, `/api/register` |
| Observable | `HTTP_Observable_Publisher` | `/api/metrics` |
| SSE | `HTTP_SSE_Publisher` | `/events`, `/api/admin/events` |
| Admin | Various | `/admin`, `/api/admin/*` |
| Static | `Static_Route_HTTP_Responder` | `/static/*` |
| Website | `HTTP_Website_Publisher` | `/*` (catch-all for multi-page) |

**Adapter needed**: The `Admin_Module` will need to track routes as they are registered (by instrumenting `set_route`) or by reading the router's internal data structure.

**Admin UI controls**: Route_Table, Method_Badge, Stat_Card (route count)

---

## 5. Publishers

### Function Publishers

Source: `server.function_publishers` (Array)

Each `HTTP_Function_Publisher` provides:
| Property | Type | Description |
|----------|------|-------------|
| `publisher.name` | `string` | Function name |
| `publisher.fn` | `function` | The actual function |

**Admin UI controls**: Route_Table (API rows), API Explorer

### Observable Publishers

Each `HTTP_Observable_Publisher` provides:
| Property/Method | Type | Description |
|----------------|------|-------------|
| `publisher.obs` | `object` | Source observable |
| `publisher.schema` | `object \| undefined` | Observable schema |
| `publisher.is_paused` | `boolean` | Pause state |
| `publisher.active_sse_connections` | `Set` | Connected clients |
| `publisher.pause()` | method | Pause streaming |
| `publisher.resume()` | method | Resume streaming |
| `publisher.stop()` | method | Disconnect all clients |

**Admin UI controls**: Observable inspector, connection count badges

### SSE Publishers

Each `HTTP_SSE_Publisher` provides:
| Property/Method | Type | Description |
|----------------|------|-------------|
| `publisher.clients` | `Map` | Connected clients with metadata |
| `publisher.event_history` | `Array` | Recent event log |
| `publisher.next_event_id` | `number` | Event ID counter |
| `publisher.broadcast(event, data)` | method | Send to all clients |
| `publisher.send(clientId, event, data)` | method | Send to one client |

**Admin UI controls**: SSE inspector, event history viewer

---

## 6. Build & Bundle Information

### Source: `HTTP_Webpage_Publisher` (ready event)

When the publisher emits `'ready'`, it provides a bundle array:

```javascript
bundle._arr = [
    {
        type: 'js',
        extension: '.js',
        route: '/js/js.js',
        text: '...bundled JavaScript...',
        response_buffers: { identity: Buffer, gzip?: Buffer, br?: Buffer },
        response_headers: { identity: {}, gzip?: {}, br?: {} }
    },
    {
        type: 'css',
        extension: '.css',
        route: '/css/css.css',
        text: '...extracted CSS...',
        response_buffers: { identity: Buffer, gzip?: Buffer, br?: Buffer },
        response_headers: { identity: {}, gzip?: {}, br?: {} }
    },
    {
        type: 'html',
        extension: '.html',
        route: '/',
        text: '<!DOCTYPE html>...',
        response_buffers: { identity: Buffer },
        response_headers: { identity: {} }
    }
]
```

From each bundle item, we can derive:

| Data Point | Derivation | Description |
|-----------|------------|-------------|
| Bundle size (identity) | `response_buffers.identity.length` | Uncompressed size |
| Bundle size (gzip) | `response_buffers.gzip?.length` | Gzip-compressed size |
| Bundle size (brotli) | `response_buffers.br?.length` | Brotli-compressed size |
| Route path | `item.route` | Where the bundle is served |
| Source text length | `item.text.length` | Raw text size |

**Current limitation**: Build timing is not tracked. The `Admin_Module` adapter will need to record the timestamp when the `'ready'` event fires to calculate build duration.

**Admin UI controls**: Build_Status, Stat_Card (bundle sizes)

---

## 7. Request Telemetry

### Current State: Not Available

The server currently does **not** track request counts, response times, or status code distributions. The `process_request` function in `server.start()` handles requests synchronously and does not emit events.

### Adapter Needed

To provide request telemetry to the admin UI, the `Admin_Module` will need to:

1. **Instrument the request handler** — Wrap `process_request` to record:
   - Request timestamp
   - Method and URL
   - Response status code
   - Response time (ms)

2. **Maintain a rolling window** — Keep the last N requests (e.g., 1000) in a circular buffer

3. **Calculate aggregates** — Requests/minute, average response time, error rate

This is a lightweight adapter — **not** a new platform feature. It wraps existing functionality without modifying the core request flow.

**Admin UI controls**: Stat_Card (requests/min), Activity_Log, Metrics view

---

## 8. Process Resources (Child Processes)

### Source: Resources of type `Process_Resource` in the pool

Each `Process_Resource` provides rich telemetry:

| Property | Type | Update Frequency |
|----------|------|-----------------|
| `state` | `'stopped' \| 'starting' \| 'running' \| 'stopping' \| 'restarting' \| 'crashed'` | On state change |
| `pid` | `number \| null` | On start/stop |
| `memory_usage` | `{ rssBytes, cpuPercent?, source, timestamp }` | On demand |
| `restart_count` | `number` | On restart |
| `last_health_check` | `object` | Periodic |
| `status` | Full status object | On demand |
| `child_process` | Node `ChildProcess` | While running |

Events from `Process_Resource`:
- `'state_change'` — `{ from, to, timestamp }`
- `'stdout'` — `{ line, pid, timestamp }`
- `'stderr'` — `{ line, pid, timestamp }`
- `'exit'` — `{ code, signal, timestamp }`
- `'health_check'` — `{ healthy, latencyMs, timestamp }`
- `'unhealthy'` — `{ consecutiveFailures, timestamp }`
- `'crashed'` — `{ code, signal, restartCount, timestamp }`

**Admin UI controls**: Process_Panel, Health_Badge, Activity_Log

---

## 9. Remote Process Resources

### Source: Resources of type `Remote_Process_Resource` in the pool

| Property | Type | Update Frequency |
|----------|------|-----------------|
| `state` | `'stopped' \| 'running' \| 'unreachable'` | On poll |
| `host`, `port`, `protocol` | `string`, `number`, `string` | Static |
| `last_polled_status` | `object` | On poll |
| `last_polled_at` | `number` (timestamp) | On poll |
| `consecutive_failures` | `number` | On poll |
| `history` | `Array<{ timestamp, status, state, reachable, error? }>` | On poll |

**Admin UI controls**: Resource_Table, Health_Badge

---

## 10. Configuration Data

### Directly Available

| Config Key | Source | Editable? |
|-----------|--------|-----------|
| Port | `server.port` | No (requires restart) |
| Debug mode | `server.debug` | Potentially (togglable at runtime) |
| Server name | `server.name` | No |
| Client JS path | `server.disk_path_client_js` | No |
| HTTPS enabled | `!!server.https_options` | No |
| Allowed addresses | `server.allowed_addresses` | No |

### From `Server.serve()` Options (if used)

| Config Key | Source | Notes |
|-----------|--------|-------|
| Style config | `spec.style` | Passed to publisher |
| Bundler config | `spec.bundler` | Compression, minification settings |
| Auto-port | Derived | Whether port was auto-selected |

**Admin UI controls**: Config_Panel

---

## 11. Data Availability Summary

| Category | Available Now | Adapter Needed | Notes |
|----------|:------------:|:--------------:|-------|
| Main process info | ✅ | — | Node.js `process` + `os` |
| Server properties | ✅ | — | Direct property access |
| Resource pool listing | ✅ | Minor | Pool `summary` + per-resource iteration |
| Resource health events | ✅ | — | Pool events already fire |
| Route listing | ⚠️ | Yes | Router doesn't expose route list natively |
| Function publishers | ✅ | Minor | `server.function_publishers` array |
| Observable publishers | ⚠️ | Yes | Not tracked in a central registry |
| SSE publisher state | ✅ | Minor | Direct property access |
| Build/bundle info | ⚠️ | Yes | Need to capture `ready` event data |
| Request telemetry | ❌ | Yes | Request handler instrumentation needed |
| Process resources | ✅ | — | Full status API on Process_Resource |
| Remote process resources | ✅ | — | Full status API on Remote_Process_Resource |
| Configuration | ✅ | Minor | Direct property access |

The next chapter details exactly what adapter code the `Admin_Module` needs to bridge these gaps.
