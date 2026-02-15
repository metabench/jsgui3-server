'use strict';

const HTTP_SSE_Publisher = require('../../publishers/http-sse-publisher');
const Admin_User_Store = require('./admin_user_store');
const Admin_Auth_Service = require('./admin_auth_service');

/**
 * Admin Module V1 — adapter layer that instruments the server
 * and exposes telemetry data via JSON endpoints and SSE.
 */
class Admin_Module_V1 {
    /**
     * @param {object} [config] - Optional configuration
     * @param {boolean} [config.enabled] - Whether admin UI is active (default: true)
     * @param {Array}   [config.sections] - Custom sidebar sections to register
     * @param {Array}   [config.endpoints] - Custom protected API endpoints
     */
    constructor(config = {}) {
        this._config = config;
        this._request_count = 0;
        this._request_window = [];
        this._status_counts = {};
        this._routes = [];
        this._build_info = null;
        this._sse_publisher = null;
        this._heartbeat_interval = null;
        this._routes_instrumented = false;
        this._process_instrumented = false;

        // Extensibility registries
        this._custom_sections = [];
        this._custom_endpoints = [];

        this.user_store = this._create_user_store();
        this.auth = new Admin_Auth_Service({
            user_store: this.user_store,
            cookie_name: 'jsgui_admin_v1_sid'
        });
    }

    _create_user_store() {
        const store = new Admin_User_Store();
        const env_user = process.env.ADMIN_V1_USER || 'admin';
        const env_password = process.env.ADMIN_V1_PASSWORD || null;

        if (env_password) {
            store.add_user({
                username: env_user,
                password: env_password,
                roles: ['admin_read', 'admin_write']
            });
            return store;
        }

        if (process.env.NODE_ENV === 'production') {
            console.warn('[Admin_Module_V1] No ADMIN_V1_PASSWORD set; login is disabled in production.');
            return store;
        }

        store.add_user({
            username: 'admin',
            password: 'admin',
            roles: ['admin_read', 'admin_write']
        });
        console.warn('[Admin_Module_V1] Development default credentials active: admin/admin');
        return store;
    }

    /**
     * Initialise the adapter and attach to the server.
     * Must be called after the server's core systems are up
     * but before it starts accepting requests.
     * @param {object} server - JSGUI_Single_Process_Server instance
     */
    init(server) {
        this._server = server;
        const router = server.server_router || server.router;
        if (!router) {
            console.warn('[Admin_Module_V1] No router found; skipping.');
            return;
        }
        this._router = router;

        // 1. Track route registrations (must be first)
        this._track_route_registration(router);

        // 2. Set up SSE channel
        this._init_sse_channel(router);

        // 3. Register API endpoints
        this._register_endpoints(router);

        // 4. Instrument request handler
        this._instrument_request_handler(router);

        // 5. Subscribe to resource pool events
        this._subscribe_resource_events(server);

        // 6. Start heartbeat
        this._start_heartbeat(server);

        // 7. Apply config-driven sections and endpoints
        if (this._config.sections && Array.isArray(this._config.sections)) {
            this._config.sections.forEach(s => this.add_section(s));
        }
        if (this._config.endpoints && Array.isArray(this._config.endpoints)) {
            this._config.endpoints.forEach(e => this.add_endpoint(e));
        }
    }

    // ─── API Endpoints ───────────────────────────────────────

    _write_unauthorized_json(res) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
    }

    _write_forbidden_json(res) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Forbidden' }));
    }

    _require_auth(req, res, handler) {
        if (!this.auth.is_authenticated(req)) {
            this._write_unauthorized_json(res);
            return;
        }
        handler();
    }

    _require_role(req, res, role_name, handler) {
        if (!this.auth.is_authenticated(req)) {
            this._write_unauthorized_json(res);
            return;
        }
        if (!this.auth.has_role(req, role_name)) {
            this._write_forbidden_json(res);
            return;
        }
        handler();
    }

    _require_admin_read(req, res, handler) {
        this._require_role(req, res, 'admin_read', handler);
    }

    _require_admin_write(req, res, handler) {
        this._require_role(req, res, 'admin_write', handler);
    }

    _register_endpoints(router) {
        // Auth endpoints (public)
        router.set_route('/api/admin/v1/auth/login', (req, res) => {
            this.auth.handle_login(req, res);
        });

        router.set_route('/api/admin/v1/auth/logout', (req, res) => {
            this.auth.handle_logout(req, res);
        });

        router.set_route('/api/admin/v1/auth/session', (req, res) => {
            this.auth.handle_session(req, res);
        });

        // GET /api/admin/v1/status
        router.set_route('/api/admin/v1/status', (req, res) => {
            this._require_admin_read(req, res, () => {
                const data = this.get_status();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            });
        });

        // GET /api/admin/v1/resources
        router.set_route('/api/admin/v1/resources', (req, res) => {
            this._require_admin_read(req, res, () => {
                const data = this.get_resources_tree();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            });
        });

        // GET /api/admin/v1/routes
        router.set_route('/api/admin/v1/routes', (req, res) => {
            this._require_admin_read(req, res, () => {
                const data = this.get_routes_list();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            });
        });

        // GET /api/admin/v1/custom-sections — returns metadata for client discovery
        router.set_route('/api/admin/v1/custom-sections', (req, res) => {
            this._require_admin_read(req, res, () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.get_custom_sections()));
            });
        });
    }

    // ─── Status Snapshot ─────────────────────────────────────

    get_status() {
        const server = this._server;
        const mem = process.memoryUsage();
        const pool_summary = this._safe_pool_summary(server);

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
                arch: process.arch
            },
            server: {
                port: (server && server.port) || null,
                name: (server && server.name) || 'jsgui3-server'
            },
            telemetry: {
                request_count: this._request_count,
                requests_per_minute: this._get_requests_per_minute(),
                status_counts: this._status_counts
            },
            pool: pool_summary,
            routes: {
                total: this._routes.length
            },
            build: this._build_info
        };
    }

    // ─── Resources ───────────────────────────────────────────

    get_resources_tree() {
        const tree = { name: 'Root', type: 'pool', children: [] };
        try {
            const pool = this._server ? this._server.resource_pool : null;
            if (!pool || !pool.resources) return tree;

            const resources = pool.resources._arr || pool.resources || [];
            resources.forEach(res => {
                if (!res) return;
                tree.children.push({
                    name: res.name || 'Unnamed',
                    type: (res.constructor && res.constructor.name) || 'Resource',
                    state: res.state || 'unknown'
                });
            });
        } catch (e) {
            // Defensive — pool access may fail
        }
        return tree;
    }

    // ─── Routes ──────────────────────────────────────────────

    get_routes_list() {
        return this._routes.map(r => ({
            path: r.path,
            type: r.type,
            handler: r.handler_name,
            method: this._infer_method(r.type)
        }));
    }

    _track_route_registration(router) {
        if (!router || !router.set_route) return;
        if (this._routes_instrumented || router.__admin_v1_wrapped_set_route) return;

        const original_set_route = router.set_route.bind(router);
        const self = this;

        router.set_route = function(path, responder_or_handler, handler) {
            const route_info = {
                path: path,
                type: self._categorize_route(path, responder_or_handler),
                handler_name: self._get_handler_name(responder_or_handler, handler),
                registered_at: Date.now()
            };
            self._routes.push(route_info);
            return original_set_route(path, responder_or_handler, handler);
        };

        router.__admin_v1_wrapped_set_route = true;
        this._routes_instrumented = true;
    }

    _categorize_route(path, handler) {
        if (typeof path !== 'string') return 'route';
        if (path.startsWith('/api/admin')) return 'admin';
        if (path.startsWith('/api/'))     return 'api';
        if (path === '/admin')            return 'admin';

        const name = handler && handler.constructor ? handler.constructor.name : '';
        if (name.includes('Webpage'))    return 'webpage';
        if (name.includes('Function'))   return 'api';
        if (name.includes('Observable')) return 'observable';
        if (name.includes('SSE'))        return 'sse';
        if (name.includes('CSS') || name.includes('JS') || name.includes('Static')) return 'static';

        return 'route';
    }

    _get_handler_name(responder, handler) {
        if (handler && typeof handler === 'function' && handler.name) return handler.name;
        if (responder && responder.constructor) return responder.constructor.name;
        if (typeof responder === 'function' && responder.name) return responder.name;
        return 'anonymous';
    }

    _infer_method(type) {
        switch (type) {
            case 'api':        return 'GET';
            case 'observable': return 'GET';
            case 'sse':        return 'GET';
            case 'static':     return 'GET';
            case 'webpage':    return 'GET';
            case 'admin':      return 'GET';
            default:           return 'ANY';
        }
    }

    // ─── Request Telemetry ───────────────────────────────────

    _instrument_request_handler(router) {
        if (!router || !router.process) return;
        if (this._process_instrumented || router.__admin_v1_wrapped_process) return;

        const original_process = router.process.bind(router);
        const self = this;

        router.process = function(req, res) {
            // Skip admin routes from telemetry
            if (req.url && (req.url.startsWith('/api/admin/') || req.url === '/admin' || req.url.startsWith('/admin/v1'))) {
                return original_process(req, res);
            }

            const start = Date.now();
            self._request_count++;

            // Track in rolling window (last 60 seconds)
            self._request_window.push(start);
            self._trim_request_window(start);

            // Wrap res.end to capture timing
            const original_end = res.end.bind(res);
            let end_called = false;
            res.end = function(...args) {
                if (end_called) return original_end(...args);
                end_called = true;

                const duration_ms = Date.now() - start;
                const status = res.statusCode || 200;
                self._status_counts[status] = (self._status_counts[status] || 0) + 1;

                // Broadcast to SSE (throttled)
                self._broadcast_request({
                    method: req.method,
                    url: req.url,
                    status: status,
                    duration_ms: duration_ms,
                    timestamp: start
                });

                return original_end(...args);
            };

            return original_process(req, res);
        };

        router.__admin_v1_wrapped_process = true;
        this._process_instrumented = true;
    }

    _trim_request_window(now) {
        const cutoff = now - 60000;
        while (this._request_window.length > 0 && this._request_window[0] < cutoff) {
            this._request_window.shift();
        }
    }

    _get_requests_per_minute() {
        this._trim_request_window(Date.now());
        return this._request_window.length;
    }

    // ─── Request Broadcast Throttle ──────────────────────────

    _broadcast_request(data) {
        const now = Date.now();
        if (!this._last_request_broadcast || now - this._last_request_broadcast > 1000) {
            this._last_request_broadcast = now;
            this._request_broadcast_count = 0;
        }
        this._request_broadcast_count = (this._request_broadcast_count || 0) + 1;
        if (this._request_broadcast_count <= 10) {
            this._broadcast('request', data);
        }
    }

    // ─── Resource Pool Events ────────────────────────────────

    _subscribe_resource_events(server) {
        const pool = server.resource_pool;
        if (!pool || typeof pool.on !== 'function') return;

        const events = ['resource_state_change', 'crashed', 'unhealthy', 'unreachable', 'recovered', 'removed'];
        events.forEach(event_name => {
            pool.on(event_name, (data) => {
                this._broadcast(event_name, {
                    event: event_name,
                    resourceName: (data && data.resourceName) || 'unknown',
                    timestamp: Date.now(),
                    details: data
                });
            });
        });
    }

    // ─── SSE Channel ─────────────────────────────────────────

    _init_sse_channel(router) {
        this._sse_publisher = new HTTP_SSE_Publisher({
            name: 'admin_v1_events',
            eventHistorySize: 100
        });

        router.set_route('/api/admin/v1/events', (req, res) => {
            this._require_admin_read(req, res, () => {
                this._sse_publisher.handle_http(req, res);
            });
        });
    }

    is_authenticated_request(req) {
        return this.auth.is_authenticated(req);
    }

    is_admin_read_request(req) {
        return this.auth.has_role(req, 'admin_read');
    }

    is_admin_write_request(req) {
        return this.auth.has_role(req, 'admin_write');
    }

    _broadcast(event_name, data) {
        if (this._sse_publisher) {
            this._sse_publisher.broadcast(event_name, data);
        }
    }

    // ─── Heartbeat ───────────────────────────────────────────

    /**
     * Build a pool summary without touching resource.status (which
     * calls jsgui.http on the client and crashes on the server).
     */
    _safe_pool_summary(server) {
        const summary = { total: 0, running: 0, stopped: 0, byType: {} };
        try {
            const pool = server ? server.resource_pool : null;
            if (!pool || !pool.resources) return summary;
            const arr = pool.resources._arr || [];
            arr.forEach(res => {
                if (!res) return;
                summary.total++;
                const type_name = (res.constructor && res.constructor.name) || 'Unknown';
                summary.byType[type_name] = (summary.byType[type_name] || 0) + 1;
            });
        } catch (e) { /* defensive */ }
        return summary;
    }

    _start_heartbeat(server) {
        this._heartbeat_interval = setInterval(() => {
            const pool_summary = this._safe_pool_summary(server);
            const mem = process.memoryUsage();

            this._broadcast('heartbeat', {
                uptime: Math.floor(process.uptime()),
                pid: process.pid,
                memory: {
                    rss: mem.rss,
                    heap_used: mem.heapUsed,
                    heap_total: mem.heapTotal
                },
                request_count: this._request_count,
                requests_per_minute: this._get_requests_per_minute(),
                pool_summary: pool_summary,
                route_count: this._routes.length,
                timestamp: Date.now()
            });
        }, 5000);

        // Don't prevent process exit
        if (this._heartbeat_interval.unref) {
            this._heartbeat_interval.unref();
        }
    }
    // ─── Extensibility API ────────────────────────────────

    /**
     * Register a custom sidebar section.
     *
     * The section appears in the admin sidebar. When the user clicks it,
     * the admin shell fetches `api_path` and auto-renders the result as
     * a table (arrays) or key-value panel (objects).
     *
     * @param {object}  opts
     * @param {string}  opts.id       - Unique section identifier (snake_case)
     * @param {string}  opts.label    - Human-readable label for the sidebar
     * @param {string}  [opts.icon]   - Optional emoji or text icon
     * @param {string}  opts.api_path - API endpoint path (e.g. '/api/admin/v1/crawlers')
     * @param {string}  [opts.role]   - Required role (default: 'admin_read')
     * @param {Function} [opts.handler] - Request handler for the api_path endpoint
     * @returns {Admin_Module_V1} this (for chaining)
     *
     * @example
     *   server.admin_v1.add_section({
     *       id: 'crawlers',
     *       label: 'Crawlers',
     *       icon: '\uD83D\uDD77\uFE0F',
     *       api_path: '/api/admin/v1/crawlers',
     *       handler: (req, res) => {
     *           res.writeHead(200, { 'Content-Type': 'application/json' });
     *           res.end(JSON.stringify([
     *               { name: 'Crawler A', status: 'running', pages: 1234 }
     *           ]));
     *       }
     *   });
     */
    add_section(opts) {
        if (!opts || !opts.id || !opts.label || !opts.api_path) {
            throw new Error('add_section requires { id, label, api_path }');
        }
        const section = {
            id: opts.id,
            label: opts.label,
            icon: opts.icon || null,
            api_path: opts.api_path,
            role: opts.role || 'admin_read'
        };
        this._custom_sections.push(section);

        // If a handler was supplied and the router is already available, register it
        if (typeof opts.handler === 'function') {
            this.add_endpoint({
                path: opts.api_path,
                role: section.role,
                handler: opts.handler
            });
        }
        return this;
    }

    /**
     * Register a custom protected admin API endpoint.
     *
     * The endpoint is automatically protected by the specified role.
     *
     * @param {object}   opts
     * @param {string}   opts.path    - Route path (e.g. '/api/admin/v1/my-data')
     * @param {string}   [opts.role]  - Required role (default: 'admin_read')
     * @param {Function} opts.handler - (req, res) handler
     * @returns {Admin_Module_V1} this (for chaining)
     *
     * @example
     *   server.admin_v1.add_endpoint({
     *       path: '/api/admin/v1/crawlers/start',
     *       role: 'admin_write',
     *       handler: (req, res) => {
     *           // start a crawler …
     *           res.writeHead(200, { 'Content-Type': 'application/json' });
     *           res.end(JSON.stringify({ ok: true }));
     *       }
     *   });
     */
    add_endpoint(opts) {
        if (!opts || !opts.path || typeof opts.handler !== 'function') {
            throw new Error('add_endpoint requires { path, handler }');
        }
        const role = opts.role || 'admin_read';
        this._custom_endpoints.push({ path: opts.path, role });

        const router = this._router;
        if (router) {
            router.set_route(opts.path, (req, res) => {
                this._require_role(req, res, role, () => {
                    opts.handler(req, res);
                });
            });
        } else {
            // Router not yet available — queue for deferred registration.
            // This can happen if add_endpoint is called before init().
            this._deferred_endpoints = this._deferred_endpoints || [];
            this._deferred_endpoints.push(opts);
        }
        return this;
    }

    /**
     * Plugin-style extension point.
     *
     * The provided function receives the admin module instance so it can
     * call `add_section`, `add_endpoint`, access `auth`, etc.
     *
     * @param {Function} plugin_fn - (admin_v1) => void
     * @returns {Admin_Module_V1} this (for chaining)
     *
     * @example
     *   server.admin_v1.use((admin) => {
     *       admin.add_section({ id: 'logs', label: 'Logs', api_path: '/api/admin/v1/logs' });
     *   });
     */
    use(plugin_fn) {
        if (typeof plugin_fn !== 'function') {
            throw new Error('use() requires a function');
        }
        plugin_fn(this);
        return this;
    }

    /**
     * Returns metadata for all registered custom sections.
     * Used by the admin shell client to discover and render them.
     * @returns {Array<{id, label, icon, api_path}>}
     */
    get_custom_sections() {
        return this._custom_sections.map(s => ({
            id: s.id,
            label: s.label,
            icon: s.icon,
            api_path: s.api_path
        }));
    }
    // ─── Cleanup ─────────────────────────────────────────────

    destroy() {
        if (this._heartbeat_interval) {
            clearInterval(this._heartbeat_interval);
            this._heartbeat_interval = null;
        }
        if (this._sse_publisher && typeof this._sse_publisher.stop === 'function') {
            this._sse_publisher.stop();
        }
    }
}

module.exports = Admin_Module_V1;
