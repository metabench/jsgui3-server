/**
 * Swagger_Publisher — publishes interactive API documentation as HTTP endpoints.
 *
 * This publisher extends {@link HTTP_Publisher} and provides two routes:
 *
 * | Route                | Method | Content-Type       | Purpose                          |
 * |----------------------|--------|--------------------|----------------------------------|
 * | `/api/openapi.json`  | GET    | `application/json` | OpenAPI 3.0.3 specification      |
 * | `/api/docs`          | GET    | `text/html`        | Interactive Swagger UI page      |
 *
 * ## How It Works
 *
 * - The HTML page is generated once at construction time and cached
 *   (it's static — the CDN-loaded Swagger UI fetches the spec at runtime).
 * - The OpenAPI spec is regenerated on every request so it always reflects
 *   the current set of registered endpoints.
 * - Both the HTML generator ({@link module:publishers/swagger-ui}) and the
 *   spec generator ({@link module:openapi}) are zero-dependency utility
 *   modules used internally by this publisher.
 *
 * ## Usage
 *
 * ### Automatic (via Server.serve)
 *
 * When `swagger` is enabled (default in development), `Server.serve()` creates
 * a `Swagger_Publisher` automatically and registers it on the router:
 *
 * ```js
 * Server.serve({
 *     port: 8080,
 *     swagger: true,
 *     api: { 'ping': { handler: () => ({ pong: true }), method: 'GET' } }
 * });
 * // → /api/docs and /api/openapi.json are automatically available
 * ```
 *
 * ### Manual (standalone)
 *
 * You can also create and register a `Swagger_Publisher` directly:
 *
 * ```js
 * const Swagger_Publisher = require('jsgui3-server/publishers/swagger-publisher');
 *
 * const pub = new Swagger_Publisher({
 *     server: my_server,
 *     title: 'My API',
 *     version: '2.0.0'
 * });
 *
 * // Register on the server's router:
 * my_server.server_router.set_route('/api/openapi.json', pub, pub.handle_http);
 * my_server.server_router.set_route('/api/docs', pub, pub.handle_http);
 * ```
 *
 * ## Publisher Lifecycle
 *
 * - **Construction** — generates and caches the HTML page, stores spec options.
 * - **ready event** — emitted immediately (no async setup required).
 * - **handle_http** — routes incoming requests to the appropriate handler
 *   based on `req.url`.
 *
 * @extends HTTP_Publisher
 * @see {@link module:openapi} — spec generation utility.
 * @see {@link module:publishers/swagger-ui} — HTML page generation utility.
 * @module publishers/swagger-publisher
 */

'use strict';

const HTTP_Publisher = require('./http-publisher');
const { generate_openapi_spec } = require('../openapi');
const { generate_swagger_html } = require('./swagger-ui');

class Swagger_Publisher extends HTTP_Publisher {

    /**
     * Create a new Swagger_Publisher.
     *
     * @param {Object}  spec - Configuration options.
     * @param {Object}  spec.server      - The JSGUI_Single_Process_Server instance
     *   whose API registry will be used to generate the OpenAPI spec.
     * @param {string}  [spec.title]     - API title for the spec `info.title` field.
     * @param {string}  [spec.version]   - API version for the spec `info.version` field.
     * @param {string}  [spec.description] - API description for the spec `info.description` field.
     * @param {string}  [spec.spec_url='/api/openapi.json'] - URL the Swagger UI
     *   page uses to fetch the OpenAPI spec. Override if serving from a
     *   non-standard path.
     * @param {string}  [spec.docs_route='/api/docs'] - Route path for the
     *   Swagger UI HTML page. Used to match incoming requests in `handle_http`.
     * @param {string}  [spec.spec_route='/api/openapi.json'] - Route path for
     *   the OpenAPI JSON endpoint. Used to match incoming requests.
     */
    constructor(spec = {}) {
        super(spec);

        /**
         * Reference to the server instance whose APIs are documented.
         * @type {Object}
         */
        this.server = spec.server;

        /**
         * Route path that serves the OpenAPI JSON spec.
         * @type {string}
         */
        this.spec_route = spec.spec_route || '/api/openapi.json';

        /**
         * Route path that serves the Swagger UI HTML page.
         * @type {string}
         */
        this.docs_route = spec.docs_route || '/api/docs';

        /**
         * Options passed through to the OpenAPI spec generator.
         * @type {{ title?: string, version?: string, description?: string }}
         */
        this.spec_options = {
            title: spec.title,
            version: spec.version,
            description: spec.description
        };

        /**
         * Publisher type identifier (used by the Publishers registry).
         * @type {string}
         */
        this.type = 'swagger';

        /**
         * Cached HTML buffer for the Swagger UI page.
         * Generated once at construction time since the page is static
         * (the dynamic spec is fetched by Swagger UI at runtime via XHR).
         * @type {Buffer}
         * @private
         */
        this._html_buffer = Buffer.from(
            generate_swagger_html({
                spec_url: spec.spec_url || this.spec_route,
                title: spec.title || 'API Documentation'
            }),
            'utf8'
        );

        // Emit ready — this publisher has no async setup.
        const self = this;
        setImmediate(() => self.raise('ready', { _arr: [] }));
    }

    /**
     * Handle an incoming HTTP request.
     *
     * Routes the request based on `req.url`:
     *
     * - **spec_route** (`/api/openapi.json`) — generates the OpenAPI spec
     *   from `this.server` and responds with JSON.
     * - **docs_route** (`/api/docs`) — responds with the cached Swagger UI
     *   HTML page.
     * - **Other URLs** — responds with 404.
     *
     * Only GET and HEAD methods are allowed; other methods receive 405.
     *
     * @param {http.IncomingMessage} req - Node.js HTTP request.
     * @param {http.ServerResponse}  res - Node.js HTTP response.
     */
    handle_http(req, res) {
        // Only allow GET / HEAD.
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { 'Allow': 'GET' });
            res.end('Method Not Allowed');
            return;
        }

        // Strip query string for route matching.
        const url_path = req.url.split('?')[0];

        if (url_path === this.spec_route) {
            // ── Serve OpenAPI JSON spec ──
            const spec = generate_openapi_spec(this.server, this.spec_options);
            const json = JSON.stringify(spec, null, 2);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(json);

        } else if (url_path === this.docs_route) {
            // ── Serve Swagger UI HTML ──
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': this._html_buffer.length,
                'Cache-Control': 'no-cache'
            });
            res.end(this._html_buffer);

        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
}

module.exports = Swagger_Publisher;
