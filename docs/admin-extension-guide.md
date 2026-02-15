# Admin UI Extension Guide

## Overview

The jsgui3-server admin dashboard (`/admin/v1`) is fully extensible. You can:

1. **Disable** the admin UI entirely
2. **Add custom sidebar sections** with automatic data rendering
3. **Add custom protected API endpoints** with role-based auth
4. **Use plugins** to bundle related admin extensions
5. **Access admin internals** (auth service, user store, SSE channel) for advanced use

All extension APIs follow snake_case naming and return `this` for chaining.

---

## Quick Start

```javascript
const Server = require('jsgui3-server');

const server = await Server.serve(MyControl, { port: 8080 });

// Add a custom section — shows up in the sidebar
server.admin_v1.add_section({
    id: 'my_data',
    label: 'My Data',
    api_path: '/api/admin/v1/my-data',
    handler: (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            { name: 'Item A', value: 42 },
            { name: 'Item B', value: 99 }
        ]));
    }
});
```

That's it. The sidebar section appears automatically, and clicking it shows a table.

---

## API Reference

### `admin_v1.add_section(options)`

Register a custom sidebar section.

| Parameter       | Type       | Required | Default        | Description |
|----------------|-----------|----------|----------------|-------------|
| `id`           | `string`  | Yes      | —              | Unique section identifier (snake_case) |
| `label`        | `string`  | Yes      | —              | Human-readable sidebar label |
| `icon`         | `string`  | No       | `null`         | Emoji or text icon prefix |
| `api_path`     | `string`  | Yes      | —              | Data endpoint path |
| `role`         | `string`  | No       | `'admin_read'` | Required role to view |
| `handler`      | `Function`| No       | —              | `(req, res)` handler for the endpoint |

**Returns:** `Admin_Module_V1` (chainable)

If `handler` is provided, it is automatically registered as a protected endpoint at `api_path`. If omitted, you must register the endpoint separately with `add_endpoint()` or via `server.publish()`.

#### Auto-Rendering Behaviour

The admin shell fetches `api_path` and renders the response based on its shape:

| Response Shape          | Rendered As           |
|------------------------|-----------------------|
| Array of objects       | Table (columns = keys)|
| Object                 | Key-value panel       |
| Scalar (string/number) | Plain text block      |
| Empty array            | "No data" message     |

The v1 shell builds these panels with jsgui controls (table rows, key-value rows, buttons) rather than string-based `innerHTML` rendering.

#### Example: Array → Table

```javascript
// Handler returns:
[
    { name: 'Worker 1', status: 'running', cpu: '12%' },
    { name: 'Worker 2', status: 'idle',    cpu: '0%' }
]
// Renders as a 3-column table: Name | Status | CPU
```

#### Example: Object → Key-Value

```javascript
// Handler returns:
{ version: '2.1.0', uptime: '4h 12m', mode: 'production' }
// Renders as Key-Value pairs
```

---

### `admin_v1.add_endpoint(options)`

Register a custom protected API endpoint.

| Parameter  | Type       | Required | Default        | Description |
|-----------|-----------|----------|----------------|-------------|
| `path`    | `string`  | Yes      | —              | Route path |
| `role`    | `string`  | No       | `'admin_read'` | Required role |
| `handler` | `Function`| Yes      | —              | `(req, res)` handler |

**Returns:** `Admin_Module_V1` (chainable)

The endpoint is automatically wrapped with role-based authentication. Unauthenticated requests get 401, insufficient-role requests get 403.

```javascript
server.admin_v1.add_endpoint({
    path: '/api/admin/v1/workers/restart',
    role: 'admin_write',
    handler: (req, res) => {
        // restart logic ...
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    }
});
```

---

### `admin_v1.use(plugin_fn)`

Plugin-style extension point. The function receives the admin module instance.

**Returns:** `Admin_Module_V1` (chainable)

```javascript
// my_admin_plugin.js
function my_admin_plugin(admin) {
    admin.add_section({
        id: 'metrics',
        label: 'Metrics',
        icon: '📊',
        api_path: '/api/admin/v1/metrics',
        handler: (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ requests: 12345, errors: 2 }));
        }
    });

    admin.add_endpoint({
        path: '/api/admin/v1/metrics/reset',
        role: 'admin_write',
        handler: (req, res) => {
            // reset metrics...
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        }
    });
}

module.exports = my_admin_plugin;

// In your server.js:
server.admin_v1.use(require('./my_admin_plugin'));
```

---

### `admin_v1.get_custom_sections()`

Returns the current list of registered custom section metadata.

```javascript
const sections = server.admin_v1.get_custom_sections();
// [{ id: 'metrics', label: 'Metrics', icon: '📊', api_path: '/api/admin/v1/metrics' }]
```

---

## Declarative Configuration

Custom sections and endpoints can be declared in the `Server.serve()` options:

```javascript
Server.serve({
    Ctrl: MyControl,
    port: 8080,
    admin: {
        sections: [
            {
                id: 'jobs',
                label: 'Background Jobs',
                icon: '⚙️',
                api_path: '/api/admin/v1/jobs',
                handler: (req, res) => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(get_job_status()));
                }
            }
        ],
        endpoints: [
            {
                path: '/api/admin/v1/jobs/trigger',
                role: 'admin_write',
                handler: (req, res) => {
                    trigger_job();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                }
            }
        ]
    }
});
```

---

## Disabling the Admin UI

```javascript
// Boolean shorthand
Server.serve({ Ctrl: MyControl, admin: false });

// Object form
Server.serve({ Ctrl: MyControl, admin: { enabled: false } });

// Constructor form
const server = new Server({ Ctrl: MyControl, admin: false });
```

When disabled, no admin routes, SSE channel, or request instrumentation are set up. `server.admin_v1` is `null`.

---

## Exported Classes

For advanced use cases (custom auth, subclassing, testing), the admin classes are exported:

```javascript
const Server = require('jsgui3-server');

// On the Server constructor:
const { Admin_Module_V1, Admin_Auth_Service, Admin_User_Store } = Server;

// From the npm module entry:
const jsgui = require('jsgui3-server');
const { Admin_Module_V1, Admin_Auth_Service, Admin_User_Store } = jsgui;
```

### Admin_Module_V1

The core admin adapter. Instruments the server, manages telemetry, provides APIs and SSE.

**Key properties:**
- `auth` — `Admin_Auth_Service` instance
- `user_store` — `Admin_User_Store` instance

**Key methods:**
- `init(server)` — Attach to a server instance
- `add_section(opts)` — Register custom sidebar section
- `add_endpoint(opts)` — Register custom API endpoint
- `use(plugin_fn)` — Apply a plugin function
- `get_custom_sections()` — Get section metadata array
- `get_status()` — Get server status snapshot
- `get_resources_tree()` — Get resource pool tree
- `get_routes_list()` — Get route registrations
- `destroy()` — Cleanup heartbeat and SSE

### Admin_Auth_Service

Session-based authentication service.

**Key methods:**
- `is_authenticated(req)` — Check if request has a valid session
- `has_role(req, role)` — Check if session has a specific role
- `has_any_role(req, roles)` — Check if session has any of the given roles
- `create_session(username, roles)` — Create a new session
- `destroy_session(session_id)` — Remove a session
- `handle_login(req, res)` — HTTP login handler
- `handle_logout(req, res)` — HTTP logout handler
- `handle_session(req, res)` — HTTP session check handler

### Admin_User_Store

In-memory user credential store using scrypt hashing.

**Key methods:**
- `add_user({ username, password, roles })` — Add a user (password is hashed)
- `verify_credentials(username, password)` — Verify credentials (returns `{ valid, user }`)
- `has_user(username)` — Check if user exists
- `get_user(username)` — Get user record (without password hash)

---

## Architecture Notes

### How Custom Sections Work

1. **Server-side:** `add_section()` stores metadata and optionally registers an API endpoint
2. **Client-side:** On activation, the admin shell fetches `GET /api/admin/v1/custom-sections`
3. **Dynamic nav:** Custom sections are added to the sidebar below a separator line
4. **Data fetch:** When clicked, the shell fetches the section's `api_path`
5. **Auto-render:** The response is rendered as a table, key-value panel, or text

On repeated metadata fetches, previously mounted custom section nav controls are removed before new ones are added. This keeps the sidebar free of duplicate custom entries.

### Security Model

- All custom endpoints are wrapped with role-based guards automatically
- Unauthenticated → 401 JSON response
- Authenticated but missing role → 403 JSON response
- Session cookies are `httpOnly` with `SameSite=Lax`

### Roles

| Role           | Purpose                        |
|---------------|-------------------------------|
| `admin_read`  | View dashboard data and sections |
| `admin_write` | Mutating operations (start/stop/restart) |

Default users get both roles. Custom user creation:

```javascript
server.admin_v1.user_store.add_user({
    username: 'viewer',
    password: 'readonly123',
    roles: ['admin_read']
});
```

---

## Chaining Example

```javascript
server.admin_v1
    .add_section({ id: 'workers',  label: 'Workers',  api_path: '/api/admin/v1/workers', handler: workers_handler })
    .add_section({ id: 'queues',   label: 'Queues',    api_path: '/api/admin/v1/queues',  handler: queues_handler })
    .add_endpoint({ path: '/api/admin/v1/workers/scale', role: 'admin_write', handler: scale_handler })
    .use(require('./my-monitoring-plugin'));
```

---

## Verification

Use the Admin UI interaction regression suite after extension changes that affect shell behavior:

```bash
node tests/test-runner.js --test=admin-ui-jsgui-controls.test.js
```
