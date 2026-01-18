# Chapter 2: Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     jsgui3-server                            │
│                                                              │
│  ┌──────────────────┐   ┌────────────────┐                  │
│  │ Admin UI Module  │◄──│ Server Router  │                  │
│  │ (admin-ui/)      │   └───────┬────────┘                  │
│  └────────┬─────────┘           │                           │
│           │             ┌───────┴────────┐                  │
│           ▼             │ Resource Pool  │                  │
│  ┌─────────────────┐    │ (resources/)   │                  │
│  │ Admin_Page      │    └───────┬────────┘                  │
│  │ (client.js)     │            │                           │
│  └────────┬────────┘    ┌───────┴────────┐                  │
│           │             │ Publishers     │                  │
│           ▼             │ (observables)  │                  │
│  ┌─────────────────┐    └────────────────┘                  │
│  │ Controls:       │                                        │
│  │ - Resource_List │                                        │
│  │ - Observable_   │                                        │
│  │   Monitor       │                                        │
│  │ - Config_Panel  │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

```
admin-ui/
├── client.js         # Main client control (Admin_Page)
├── server.js         # API routes for admin data
├── controls/         # UI components
│   ├── Resource_List.js
│   ├── Observable_Monitor.js
│   ├── Config_Panel.js
│   └── Metrics_Dashboard.js
└── styles/           # CSS modules
    └── admin.css
```

## Key Patterns (from Window examples)

1. **`client.js`** exports a jsgui module with controls registered on `jsgui.controls`
2. **`server.js`** creates a `Server` instance, passes `Ctrl` and `src_path_client_js`
3. Controls extend `Active_HTML_Document` for full-page apps
4. CSS is defined as a static `.css` property on the control class
5. `activate()` sets up client-side interactivity

## Data Flow

1. **Server Start** → Admin module registers `/admin` route
2. **Client Request** → SSR renders Admin_Page with initial state
3. **Activation** → Client connects to `/api/admin/resources` (SSE)
4. **Updates** → Resource changes stream to client in real-time

## Integration with `publish_observable`

The Admin UI leverages the schema-aware observable system:
- Server exposes `/api/admin/observables` listing all published observables
- Each observable has a schema describing its data type
- `Auto_Observable_UI` renders appropriate controls automatically

## Server Lifecycle Events

The server emits two distinct lifecycle events:

| Event | Fired When | Use Case |
|-------|------------|----------|
| `ready` | Publishers/bundlers complete | Safe to call `server.start()`, publish routes |
| `listening` | HTTP server bound to ports | Server accepting connections |

**Example usage:**
```javascript
server.on('ready', () => {
    // Publish observables and set up routes
    server.publish_observable('/api/data', myObservable);
    
    // Now start accepting connections
    server.start(port, (err) => {
        console.log('Server running');
    });
});

server.on('listening', () => {
    console.log('Server accepting connections');
});
```
