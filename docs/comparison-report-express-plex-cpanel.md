# jsgui3-server Comparison Report: Express, Plex, and cPanel

**Date:** February 14, 2026  
**Scope:** Feature comparison, architectural differences, and roadmap recommendations for jsgui3-server admin UI

---

## 1. Executive Summary

jsgui3-server, Express, Plex Media Server, and cPanel are fundamentally different categories of software, but each offers lessons relevant to building a server admin UI:

| Software | Category | Core Purpose |
|----------|----------|-------------|
| **jsgui3-server** | Isomorphic JS app server | Serve component-based UIs with resource management, SSE streaming, and API publishing |
| **Express** | HTTP framework | Minimal routing/middleware pipeline for building web applications and APIs |
| **Plex** | Media server + platform | Client-server media management with transcoding, library organization, and remote streaming |
| **cPanel/WHM** | Web hosting control panel | Full server administration GUI for web hosting (DNS, email, databases, files, security) |

jsgui3-server occupies a unique position: it's an **opinionated application server** that marries isomorphic rendering, resource lifecycle management, and real-time streaming. No single comparison target does the same thing, but each excels in areas jsgui3-server should learn from.

---

## 2. Detailed Feature Comparison

### 2.1 HTTP & Routing

| Capability | jsgui3-server | Express | Plex | cPanel |
|-----------|--------------|---------|------|--------|
| **HTTP methods** | Implicit (routes handle all) | Full (GET/POST/PUT/DELETE/PATCH/ALL) | Internal API | Apache/Nginx managed |
| **Route parameters** | Basic path matching via Router | `:param`, regex, string patterns | N/A | N/A (URL rewriting via Apache) |
| **Middleware pipeline** | None | Core architecture — chainable `app.use()` | N/A | N/A |
| **Router modularity** | Single router | `express.Router()` mini-apps, mountable | N/A | N/A |
| **Static file serving** | Via publishers (CSS, JS, images) | `express.static()` built-in | Built-in media serving | File Manager GUI |
| **HTTPS** | Native with `https_options` | Via `https.createServer()` or proxy | AutoSSL via plex.tv | Let's Encrypt AutoSSL |
| **Request body parsing** | JSON in function publishers | `express.json()`, `express.urlencoded()` | Internal | N/A |
| **Error handling** | 404/500 defaults | Dedicated error middleware `(err, req, res, next)` | Graceful fallbacks | Error page customization |
| **CORS** | Not built-in | Via `cors` middleware | Built-in for apps | Apache config |

**Key gap in jsgui3-server:** No middleware system. Express's middleware pipeline (`app.use()`) is its defining feature — composable request processing where authentication, logging, compression, CORS, rate limiting, etc., are layered in a predictable order. jsgui3-server handles requests directly via route handlers and publishers without a composable processing pipeline.

### 2.2 Application Architecture

| Capability | jsgui3-server | Express | Plex | cPanel |
|-----------|--------------|---------|------|--------|
| **Rendering model** | Isomorphic (server-render + client-activate) | Template engines (Pug, EJS, Handlebars) or SPA | React-based web app | Perl-generated HTML panels |
| **Component system** | Full control lifecycle with CSS extraction | None (bring your own) | Proprietary component model | Table-based panel layout |
| **Auto-bundling** | ESBuild JS + CSS extraction built-in | None (use webpack/vite separately) | Webpack-based build chain | None |
| **Data binding** | obext Data_Object with reactive fields | None | Flux/Redux-style state | None |
| **Multi-page** | `pages` config in `Server.serve()` | `app.get()` per route | Tab-based navigation | Section-based panels |
| **Real-time** | SSE + Observable publishers | Via Socket.io/ws (third-party) | WebSocket for live updates | None |
| **CLI** | `cli.js serve --port --host` | Via `express-generator` scaffold | N/A | CLI via `whmapi1`, `cpapi2` |

**jsgui3-server strengths:** The isomorphic rendering model, automatic CSS extraction from control static properties, and integrated ESBuild bundling are unique. No other system here bundles the UI framework, rendering engine, and build tooling into one server.

### 2.3 Resource & Process Management

This is the most architecturally significant comparison area for your admin UI goals.

| Capability | jsgui3-server | Express | Plex | cPanel/WHM |
|-----------|--------------|---------|------|-----------|
| **Process management** | `Process_Resource` with health checks, auto-restart, exponential backoff | None | Internal service manager | `systemctl` integration, service monitoring |
| **Remote process monitoring** | `Remote_Process_Resource` with HTTP polling | None | Remote server discovery via plex.tv | N/A (per-server) |
| **Resource pooling** | `Server_Resource_Pool` with lifecycle | None | Library/scanner pool | Service pools (Apache, MySQL, Exim, etc.) |
| **Health checking** | Configurable intervals, failure thresholds | None | Health endpoint + plex.tv heartbeat | `chkservd` service monitor daemon |
| **Auto-recovery** | Restart with exponential backoff, max retries | None | Automatic scanner restart | Automatic service restart via Tailwatch |
| **PM2 integration** | Supported in `Process_Resource` | None (external) | N/A | N/A |
| **Resource events** | `state_change`, `crashed`, `unhealthy`, `recovered` | None | Push notifications | Email alerts |
| **File system access** | `FS_Resource` + comprehensive `fs2.js` | None built-in | Media library scanner | File Manager with full GUI |
| **Data resources** | `Data_Resource` wrapping objects | None | SQLite database for metadata | MySQL, PostgreSQL management |
| **Network info** | `Local_Server_Info_Resource` | None | UPnP, DLNA discovery | Network config panels |

**jsgui3-server's resource system is already strong** compared to Express (which has nothing) and competitive with cPanel's service management. The `Process_Resource` with health checking, auto-restart, and state events is well-designed.

### 2.4 Admin UI & Monitoring

| Capability | jsgui3-server | Express | Plex | cPanel/WHM |
|-----------|--------------|---------|------|-----------|
| **Built-in admin UI** | Basic `/admin` route with sidebar layout | None | Full web dashboard at `localhost:32400/web` | Full WHM at port 2087, cPanel at port 2083 |
| **Resource tree view** | API exists (`/api/admin/resources`) | None | Library tree with sections | Service tree with status indicators |
| **Real-time metrics** | Partial (SSE infrastructure exists) | None | Bandwidth, transcoding stats, play history | CPU, memory, disk, bandwidth graphs |
| **User management** | None | Via passport.js (third-party) | Multi-user with managed users, friends invites, home users | Full account CRUD, reseller tiers |
| **Access control** | `allowed_addresses` IP filtering | Via middleware | Auth tokens, PIN codes, sharing permissions | ACLs, feature lists, package limits |
| **Log viewer** | None | Via morgan/winston (third-party) | Activity log with filters | Raw log viewer, Webalizer, AWStats |
| **Configuration editor** | None | None | Settings panels (network, transcoding, libraries, agents) | Apache/PHP/MySQL config editors |
| **Backup/Restore** | None | None | None built-in (metadata DB only) | Full backup system with scheduling, remote transfer, incremental |
| **Notifications** | None | None | Push notifications to mobile, email | Email alerts, system notifications |

### 2.5 Security

| Capability | jsgui3-server | Express | Plex | cPanel/WHM |
|-----------|--------------|---------|------|-----------|
| **Authentication** | None built-in | passport.js, session middleware | plex.tv OAuth + token auth | PAM, OAuth, two-factor (2FA) |
| **Authorization** | IP filtering only | Role-based via middleware | Server owner > managed users > friends | Root > reseller > user ACL hierarchy |
| **Rate limiting** | None | `rate-limiter-flexible`, `express-rate-limit` | Built-in API rate limiting | cPHulk brute force protection |
| **Security headers** | None | Helmet middleware | Standard headers | ModSecurity WAF, CSP headers |
| **SSL/TLS** | `https_options` passthrough | Same | plex.tv tunnel or local cert | AutoSSL with Let's Encrypt |
| **Input validation** | None | Via express-validator | Internal sanitization | Input filtering |
| **Session management** | None | express-session, cookie-session | Token-based | Session cookies with 2FA |

---

## 3. What Plex Does Well (Lessons for Admin UI)

Plex is the most relevant comparison for the *admin UI experience*, because Plex turns a complex server into something anyone can manage through a polished web interface.

### 3.1 Dashboard-First Design
Plex opens to a content-rich dashboard showing recent activity, currently playing items, server status, and recommendations. The admin never needs to look at a config file. **jsgui3-server's admin should do the same** — open to a live dashboard showing resource states, active SSE connections, request throughput, and errors.

### 3.2 Library/Resource Scanning
Plex automatically scans media libraries and gathers metadata. The equivalent for jsgui3-server is **resource discovery** — auto-detecting running processes, available ports, file system trees, and published API endpoints without manual configuration.

### 3.3 Settings Panels
Plex organizes settings into focused panels: General, Library, Network, Transcoder, Languages, Agents, etc. Each panel has clear labels and inline help. jsgui3-server should similarly break settings into:
- **Server** (port, host, debug mode, HTTPS)
- **Resources** (pool configuration, health check intervals)
- **Publishers** (bundler options, compression, minification)
- **Network** (allowed addresses, CORS)

### 3.4 Remote Access
Plex's ability to securely expose a local server to the internet via their cloud relay is a killer feature. While jsgui3-server doesn't need Plex's scale, the concept of a **tunneling/remote access toggle** in the admin UI would be valuable (perhaps integrating with tools like `localtunnel` or `ngrok`).

### 3.5 Plex Dash (Separate Admin App)
Plex ships a dedicated admin app (`Plex Dash`) focused purely on monitoring — active streams, bandwidth, transcoding queue, user activity. The separation between "consumer UI" and "admin UI" is clean. jsgui3-server already has this separation (`/admin` route vs. main app).

---

## 4. What cPanel Does Well (Lessons for Admin UI)

cPanel is the gold standard for web server administration UIs. It's been refined over 29 years.

### 4.1 Categorized Tool Panels
cPanel organizes 50+ tools into logical categories:
- **Files:** File Manager, Disk Usage, FTP Accounts, Backups
- **Databases:** MySQL Databases, phpMyAdmin, Remote MySQL
- **Email:** Email Accounts, Forwarders, MX Entry, Spam Filters
- **Domains:** Subdomains, Redirects, DNS Zone Editor
- **Security:** SSL/TLS, IP Blocker, ModSecurity, Two-Factor Auth
- **Advanced:** Cron Jobs, Error Pages, Apache Handlers, MIME Types
- **Metrics:** Visitors, Errors, Bandwidth, Resource Usage

**For jsgui3-server**, the equivalent categories could be:
- **Resources:** Resource pool viewer, process manager, remote resources
- **Publishers:** Published endpoints, SSE channels, function APIs
- **Bundling:** ESBuild status, CSS extraction, source maps
- **Network:** Ports, addresses, HTTPS config
- **Monitoring:** Request logs, SSE connections, health check history
- **System:** Server info, Node.js version, memory/CPU, uptime

### 4.2 WHM's Tiered Access Model
WHM separates root admin, reseller, and end-user access. For jsgui3-server, a simpler model would suffice:
- **Admin:** Full server control
- **Viewer:** Read-only monitoring dashboard

### 4.3 Service Manager
cPanel's `chkservd` monitors services (Apache, MySQL, FTP, Mail) and auto-restarts them. The admin UI shows service status with green/yellow/red indicators and restart buttons. **jsgui3-server's `Process_Resource` already has the backend for this** — it just needs the UI layer.

### 4.4 Cron/Scheduled Tasks
cPanel's cron job editor is simple but powerful. jsgui3-server has no scheduler — adding one (as a resource type) would be valuable.

### 4.5 API Access
cPanel provides `UAPI`, `WHM API`, and legacy `cPanel API 2` — comprehensive APIs that parallel every UI action. jsgui3-server's admin API currently only has two endpoints (`/api/admin/resources` and `/api/admin/observables`). This needs expansion.

---

## 5. What Express Does Well (Lessons for Architecture)

Express is about **developer ergonomics** and **composability**.

### 5.1 Middleware Pattern
Express's middleware chain (`app.use(fn)`) is its most powerful architectural concept. Every request passes through a composable pipeline: logging → parsing → auth → CORS → routing → error handling. jsgui3-server should consider adding a **pre-route middleware hook** system, even if lightweight:

```javascript
server.use((req, res, next) => {
    // logging, auth, etc.
    next();
});
```

### 5.2 Route Parameter Extraction
Express's `:param` syntax enables clean REST APIs (`/users/:userId/books/:bookId`). jsgui3-server's router currently uses fixed-path matching. Adding parameter extraction would enable richer API endpoints.

### 5.3 Response Helpers
Express provides `res.json()`, `res.sendFile()`, `res.redirect()`, `res.render()`, `res.download()` — convenient response utilities. jsgui3-server's publishers handle content-type-specific responses, but adding convenience methods to the response object would improve the API authoring experience.

### 5.4 Modular Routing (express.Router)
Express allows creating independent router modules that can be mounted at different paths. This pattern would be valuable for jsgui3-server's admin UI: the admin routes could be a self-contained router module that gets mounted at `/admin`.

---

## 6. The Process vs. Resource Question

### 6.1 Current State

jsgui3-server already has a well-designed resource abstraction:

| Resource Type | Purpose |
|--------------|---------|
| `Process_Resource` | Manages local child processes (start/stop/restart, health checks, auto-recovery) |
| `Remote_Process_Resource` | Monitors remote HTTP processes via polling |
| `FS_Resource` | File system access |
| `Data_Resource` | Data object wrapping |
| `Website_Resource` | Website serving |
| `Local_Server_Info_Resource` | Network interface info |
| `Server_Resource_Pool` | Pool with lifecycle management and event forwarding |

### 6.2 Analysis: Does jsgui3-server Need a Separate "Process" Primitive?

**No. A process IS a specific type of resource, and the current design is correct.**

The existing `Process_Resource` already demonstrates this — it extends the base `Resource` class while adding process-specific lifecycle (spawn, kill, signals, PID tracking). This is the right pattern.

Here's why separating "Process" from "Resource" would be a mistake:

1. **Unified lifecycle:** All resources share `start()`, `stop()`, `restart()`, `status`. A process is just a resource whose start/stop involves spawning/killing a child process.
2. **Pool composability:** `Server_Resource_Pool` can manage any mix of processes, remote services, data stores, and file systems. A separate process pool would fragment management.
3. **Event consistency:** Resource events (`state_change`, `crashed`, `unhealthy`, `recovered`) apply equally to processes, remote services, and any future resource types.
4. **Admin UI simplicity:** One tree view showing all resources, regardless of type, is cleaner than separate "Processes" and "Resources" views.

### 6.3 What's Done Well Elsewhere

**Kubernetes** models everything as a Resource with a unified YAML spec:
```
apiVersion: v1
kind: Pod              // "kind" is the resource type
metadata:
  name: my-app
spec:                  // type-specific configuration
  containers: [...]
```

**systemd** similarly treats everything as a "unit" (service, timer, mount, socket) with a common lifecycle interface and type-specific properties.

**PM2** is a pure process manager — it's good at one thing but lacks the broader resource abstraction. jsgui3-server's model is actually more powerful because it can manage processes AND other resource types.

### 6.4 Recommended New Resource Types

Rather than adding a "Process" primitive, extend the resource taxonomy:

| Proposed Resource Type | Purpose | Inspiration |
|-----------------------|---------|-------------|
| **Cron_Resource** | Scheduled task execution (like cPanel's cron editor) | cPanel, systemd timers |
| **Database_Resource** | Database connection pool management | cPanel MySQL, Prisma |
| **Log_Resource** | Log file monitoring and rotation | cPanel raw access logs, PM2 logs |
| **Metric_Resource** | Time-series metrics collection (CPU, memory, requests/sec) | Plex dashboard, Prometheus |
| **Certificate_Resource** | SSL/TLS certificate management and renewal | cPanel AutoSSL, Let's Encrypt |
| **Tunnel_Resource** | Remote access tunnel management | Plex remote access, ngrok |
| **Config_Resource** | Configuration with validation, change events, and history | cPanel config editors |

Each of these fits naturally into `Server_Resource_Pool` and inherits the base resource lifecycle.

---

## 7. Admin UI Feature Priority Recommendations

### Phase 1: Foundation (Implement First)

These features build the admin UI infrastructure and deliver immediate value.

#### 7.1 Live Resource Dashboard
**Priority: HIGHEST**

Display all resources in `Server_Resource_Pool` with real-time status:
- Resource name, type, and state (running/stopped/unhealthy) with color indicators
- Uptime, PID, memory usage for process resources
- Start/Stop/Restart action buttons
- Health check status and last check time
- Use existing SSE infrastructure to push state changes to the dashboard

**Why first:** You already have `Process_Resource` with full lifecycle, events, and health checks. The backend is 90% done — you need the UI layer.

**jsgui3-html controls to use:**
- `Status_Indicator` — already exists for colored state dots
- `Data_Table` or `Data_Grid` — already exists for resource lists
- `Start_Stop_Toggle_Button` — already exists for process control
- `Stat_Card` — already exists for metric display
- `Status_Dashboard` — already exists as a dashboard container
- `Badge` — already exists for state labels

#### 7.2 Expanded Admin API
**Priority: HIGH**

The current admin API has only two endpoints. Expand to:

```
GET  /api/admin/resources              — List all resources with status
GET  /api/admin/resources/:name        — Get single resource detail
POST /api/admin/resources/:name/start  — Start a resource
POST /api/admin/resources/:name/stop   — Stop a resource
POST /api/admin/resources/:name/restart — Restart a resource
GET  /api/admin/server                 — Server info (uptime, port, addresses, Node version)
GET  /api/admin/publishers             — List all publishers with routes
GET  /api/admin/routes                 — List all registered routes
GET  /api/admin/sse                    — SSE publisher stats (connections, event counts)
GET  /api/admin/health                 — Server health summary
```

#### 7.3 Server Overview Panel
**Priority: HIGH**

A clean dashboard showing:
- Server uptime and start time
- Node.js version, jsgui3-server version
- Listening addresses and ports
- Total resource count by type and state
- Active SSE connections count
- Published API routes list

### Phase 2: Monitoring (Implement Second)

#### 7.4 SSE Connection Monitor
Display active SSE connections with:
- Client ID and connection duration
- Events sent count
- Event history buffer status
- Disconnect/broadcast controls

**Why important:** SSE is a differentiating feature of jsgui3-server. Making it visible and manageable in the admin UI highlights the platform's strengths.

#### 7.5 Request Log Viewer
Simple log viewer showing recent HTTP requests:
- Timestamp, method, path, status code, response time
- Filter by status code range (2xx, 4xx, 5xx)
- Auto-scroll with pause/resume
- Stream via SSE for real-time updates

**jsgui3-html controls to use:** `Log_Viewer` (exists), `Search_Bar` (exists), `Filter_Chips` (exists), `Toggle_Button` (exists)

#### 7.6 Resource Event Timeline
Show resource lifecycle events in a timeline:
- State changes (started, stopped, crashed, recovered)
- Health check results
- Process restarts with backoff timing

**jsgui3-html controls to use:** `Activity_Feed` (exists — timeline with entries), `Status_Indicator` (exists), `Badge` (exists)

### Phase 3: Management (Implement Third)

#### 7.7 Process Manager Panel
Full process management UI:
- Add new `Process_Resource` via form (command, args, cwd, env vars)
- Edit health check configuration
- Set auto-restart policy
- Environment variable editor
- stdout/stderr log streaming

**jsgui3-html controls to use:** `Form_Container` + `Form_Field` (exist), `Code_Editor` (exists), `Console_Panel` (exists), `Key_Value_Table` + `Property_Editor` (exist), `Log_Viewer` (exists)

#### 7.8 Publisher Manager
View and manage publishers:
- List all registered publishers with routes and content types
- Function publisher test panel (input params, execute, see response)
- Observable publisher controls (pause/resume/inspect)

#### 7.9 Settings Panel
Server configuration editor:
- Port and host settings
- Debug mode toggle
- Bundler configuration
- Style configuration
- HTTPS certificate paths
- Save and restart server

### Phase 4: Advanced (Future)

#### 7.10 Remote Resource Dashboard
Monitor `Remote_Process_Resource` instances:
- Connection status with remote servers
- Latency graphs
- Aggregate health across distributed resources

#### 7.11 File System Browser
Leverage `FS_Resource` and `fs2.js`:
- Navigate server file system (restricted to configured paths)
- View file contents, sizes, modification dates
- Upload/download for specific directories

**jsgui3-html controls to use:** `File_Tree` + `File_Tree_Node` (exist — purpose-built for this), `Breadcrumbs` (exists), `Code_Editor` or `Markdown_Viewer` (exist for file preview)

#### 7.12 Authentication Layer
Before exposing admin functionality in production:
- Token-based authentication for admin API
- Login page for admin UI
- Session management
- Role-based access (admin vs. viewer)

---

## 8. Controls: What Already Exists in jsgui3-html vs. What's Needed

jsgui3-html (v0.0.180) already provides **180+ controls** — a comprehensive platform. The admin UI should leverage these existing controls rather than duplicating them. Here's the audit:

### Already Available in jsgui3-html (USE THESE):

| Category | Controls | Notes |
|----------|----------|-------|
| **Layout** | `Grid`, `Stack`, `Cluster`, `Split_Pane`, `Drawer`, `Center`, `Single_Line`, `Multi_Layout_Mode`, `Scroll_View` | Full responsive layout system |
| **Data Display** | `Data_Table`, `Data_Grid` (connected), `Data_Row`, `Key_Value_Table`, `Virtual_List`, `Virtual_Grid`, `Tree_Table` | Including virtualized variants for large datasets |
| **Trees** | `Tree`, `Tree_View`, `Tree_Node`, `File_Tree`, `File_Tree_Node` | Hierarchical display including file-specific variant |
| **Forms** | `Form_Container`, `Form_Field`, `Form_Designer`, `Text_Input`, `Number_Input`, `Password_Input`, `Email_Input`, `Tel_Input`, `Url_Input`, `Textarea`, `Checkbox`, `Radio_Button`, `Radio_Button_Group`, `Combo_Box`, `Select_Options`, `Range_Input`, `File_Upload` | 25+ input types |
| **Date/Time** | `Date_Picker`, `Datetime_Picker`, `Time_Picker`, `Calendar`, `Month_View`, `Timespan_Selector` | Full date/time suite |
| **Colors** | `Color_Picker`, `Color_Picker_Tabbed`, `Color_Grid`, `Color_Palette` | Full color selection |
| **Navigation** | `Breadcrumbs`, `Sidebar_Nav`, `Horizontal_Menu`, `Tabbed_Panel`, `Dropdown_Menu`, `Context_Menu`, `Popup_Menu_Button`, `Menu_Node`, `Command_Palette` | Complete navigation system |
| **Status & Feedback** | `Status_Indicator`, `Status_Bar`, `Status_Dashboard`, `Stat_Card`, `Badge`, `Toast`, `Alert_Banner`, `Progress_Bar`, `Skeleton_Loader`, `Indicator`, `Validation_Status_Indicator`, `Error_Summary` | Already has Status_Indicator, Stat_Card, Toast, Badge |
| **Buttons** | `Button`, `Icon_Button`, `Link_Button`, `Arrow_Button`, `Split_Button`, `Toggle_Button`, `Toggle_Switch`, `Start_Stop_Toggle_Button`, `Plus_Minus_Toggle_Button` | Including Start_Stop_Toggle — perfect for process control |
| **Overlays** | `Modal`, `Pop_Over`, `Tooltip`, `Drawer` | Full overlay system |
| **Charts** | `Bar_Chart`, `Line_Chart`, `Pie_Chart`, `Sparkline`, `Gauge`, `Meter` | Admin dashboard charting |
| **Viewers/Editors** | `Log_Viewer`, `Code_Editor`, `Markdown_Viewer`, `Rich_Text_Editor`, `Object_Editor`, `Property_Editor`, `Property_Grid`, `Property_Viewer`, `Resource_Viewer` | Log_Viewer and Resource_Viewer already exist! |
| **Advanced** | `Window`, `Window_Manager`, `Wizard`, `Master_Detail`, `Stepper`, `Pagination`, `Reorderable_List`, `Inline_Cell_Edit`, `Separator`, `Toolbar`, `Toolbox` | Window management, multi-step wizards |
| **Misc** | `Avatar`, `Chip`, `Filter_Chips`, `Rating_Stars`, `Sparkline`, `Tag_Input`, `Group_Box`, `Titled_Panel`, `Title_Bar`, `Activity_Feed`, `Console_Panel`, `Login` | Activity_Feed is ideal for event timelines |

### Key Observations — Most Admin UI Controls Already Exist:

The previous version of this report listed controls that would need to be built. In fact, **nearly all of them already exist in jsgui3-html**:

| Previously Listed as "Needed" | Actually Available |
|------------------------------|-------------------|
| `Status_Indicator` | **YES** — `Status_Indicator` exists |
| `Stat_Card` | **YES** — `Stat_Card` exists |
| `Data_Table` | **YES** — `Data_Table` + `Data_Grid` (connected) exist |
| `Tree_View` | **YES** — `Tree_View` + `Tree` + `File_Tree` exist |
| `Form` / `Form_Field` | **YES** — `Form_Container` + `Form_Field` + `Form_Designer` exist |
| `Modal` | **YES** — `Modal` exists |
| `Toast` | **YES** — `Toast` exists |
| `Breadcrumb` | **YES** — `Breadcrumbs` exists |
| `Progress_Bar` | **YES** — `Progress_Bar` exists |
| `Tooltip` | **YES** — `Tooltip` exists |
| `Badge` | **YES** — `Badge` exists |
| `Log_Viewer` | **YES** — `Log_Viewer` exists |
| `Timeline` | **YES** — `Activity_Feed` serves this purpose |
| `Key_Value_Editor` | **YES** — `Key_Value_Table` + `Property_Editor` exist |

### Controls to Build in jsgui3-server (domain-specific composites):

Only a handful of **server-admin-specific composites** are needed in this repo, built on top of existing jsgui3-html controls:

- **`Resource_Card`** — Composes `Stat_Card` + `Status_Indicator` + `Start_Stop_Toggle_Button` for a single resource
- **`Resource_List`** — Composes `Data_Table` or `Tree_View` with `Status_Indicator` per row for the resource pool
- **`SSE_Monitor`** — Composes `Data_Table` + `Badge` for active SSE connections
- **`API_Tester`** — Composes `Form_Container` + `Code_Editor` for testing function publishers
- **`Server_Info_Panel`** — Composes `Key_Value_Table` + `Stat_Card` for server overview
- **`Process_Detail`** — Composes `Property_Grid` + `Log_Viewer` + `Console_Panel` for process inspection

### Potential Enhancements to Existing jsgui3-html Controls:

Some existing controls may benefit from extensions for admin UI use cases:

| Control | Possible Enhancement |
|---------|---------------------|
| `Data_Table` / `Data_Grid` | SSE-powered live row updates, auto-refresh binding |
| `Log_Viewer` | SSE streaming source, auto-scroll with pause/resume, log level filtering |
| `Status_Indicator` | Standard state-to-color mapping (running=green, stopped=grey, error=red, unhealthy=yellow) |
| `Activity_Feed` | SSE event source binding for resource event timeline |
| `Key_Value_Table` | Inline edit mode (may already exist via `Inline_Cell_Edit`) |
| `Stat_Card` | Sparkline integration for trend display |
| `Status_Dashboard` | Configurable widget grid for custom admin dashboards |

---

## 9. Architectural Recommendations

### 9.1 Add Lightweight Middleware Support
Not a full Express-style pipeline, but a simple pre-route hook:

```javascript
// In server.js
server.before((req, res, next) => {
    req.start_time = Date.now();
    next();
});

server.after((req, res) => {
    const duration = Date.now() - req.start_time;
    emit_request_metric({ path: req.url, duration, status: res.statusCode });
});
```

This enables logging, auth, and metrics collection without reimplementing Express's full middleware architecture.

### 9.2 Enrich the Admin API with SSE
Rather than polling for resource status, the admin UI should subscribe to a dedicated admin SSE stream:

```javascript
// Server-side
server.admin_events = new HTTP_SSE_Publisher({ name: 'admin_events' });

// Forward all resource pool events
server.resource_pool.on('resource_state_change', (data) => {
    server.admin_events.broadcast('resource_state_change', data);
});

// Client-side admin UI
const source = new EventSource('/api/admin/events');
source.addEventListener('resource_state_change', (e) => {
    update_resource_display(JSON.parse(e.data));
});
```

### 9.3 Resource Serialization Standard
Every resource should implement `get_abstract()` returning a standard shape:

```javascript
{
    name: 'my_process',
    type: 'Process_Resource',
    state: 'running',
    uptime_ms: 345000,
    health: { status: 'healthy', last_check: '2026-02-14T12:00:00Z' },
    metrics: { memory_mb: 45, cpu_percent: 2.1 },
    actions: ['stop', 'restart'],  // Available actions in current state
    meta: { /* type-specific data */ }
}
```

### 9.4 Keep the Resource Taxonomy Open
The resource system's extensibility is its greatest strength. Document the pattern clearly so users can create custom resource types:

```javascript
class My_Custom_Resource extends Resource {
    start() { /* ... */ }
    stop() { /* ... */ }
    get status() { return { state: this._state, /* ... */ }; }
    get_abstract() { return { /* ... */ }; }
}
```

---

## 10. Summary: What to Build First

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|-------------|
| 1 | **Expanded Admin API** (10+ endpoints) | Medium | High | None |
| 2 | **Live Resource Dashboard** with status indicators | Medium | High | Admin API |
| 3 | **Admin SSE stream** for real-time updates | Low | High | SSE Publisher (exists) |
| 4 | **Server Overview Panel** | Low | Medium | Admin API |
| 5 | **Process Manager** (start/stop/restart UI) | Medium | High | Resource Dashboard |
| 6 | **Request logging** with SSE streaming | Medium | Medium | Admin SSE |
| 7 | **Publisher/Route viewer** | Low | Medium | Admin API |
| 8 | **Resource Event Timeline** | Medium | Medium | Admin SSE |
| 9 | **Settings Panel** | Medium | Medium | Config_Resource |
| 10 | **Authentication layer** | High | Critical (for production) | Session management |

### Bottom Line

jsgui3-server's resource abstraction is architecturally sound — **don't add a separate "Process" primitive**. Instead, extend the resource taxonomy with new types (Cron, Log, Metric, Config) and invest heavily in the admin UI that makes the existing resource system visible and manageable.

The immediate priority should be: **expand the admin API, add SSE-powered real-time status updates, and build the resource dashboard UI**. This is the highest-impact work because the backend capabilities already exist — they just need to be surfaced.

For controls, lean on jsgui3-html for general-purpose primitives (Data_Table, Tree_View, Form, Modal) and build domain-specific composites (Status_Indicator, Resource_Card, Log_Viewer, SSE_Monitor) within jsgui3-server.
