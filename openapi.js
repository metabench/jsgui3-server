/**
 * OpenAPI 3.0.3 Specification Generator for jsgui3-server.
 *
 * This module produces a valid OpenAPI 3.0.3 specification from the
 * server's registered API endpoints.  It is the heart of jsgui3-server's
 * built-in Swagger support — no external dependencies are needed.
 *
 * ## How It Works
 *
 * 1. **Data collection** — {@link collect_api_entries} walks three sources
 *    on the server instance, in priority order:
 *      - `server._api_registry` — entries added by {@link JSGUI_Single_Process_Server#publish}
 *      - `server.function_publishers` — raw Function_Publisher instances
 *      - `server.website_manifest.api_endpoints` — endpoints declared in `Server.serve()`
 *    Duplicates (same `METHOD + path`) are resolved by source priority.
 *
 * 2. **Schema conversion** — {@link simple_schema_to_openapi} converts the
 *    lightweight `{key: {type, description, default}}` format that jsgui3
 *    uses for `params` / `returns` into proper OpenAPI Schema Objects.
 *
 * 3. **Spec assembly** — {@link generate_openapi_spec} combines everything
 *    into a complete OpenAPI 3.0.3 document with `info`, `servers`,
 *    `paths`, and `tags`.
 *
 * ## Metadata Format
 *
 * Endpoints can provide metadata via the `meta` argument to `server.publish()`:
 *
 * ```js
 * server.publish('users/list', handler, {
 *     method: 'POST',                    // HTTP method (default: 'POST')
 *     summary: 'List all users',         // One-line summary
 *     description: 'Long description',   // Multi-line Markdown description
 *     tags: ['Users'],                   // Grouping tags
 *     deprecated: false,                 // Mark as deprecated
 *     operationId: 'listUsers',          // Custom operation ID
 *     params: {                          // Request body schema
 *         page: { type: 'integer', description: 'Page number', default: 1 },
 *         name: { type: 'string', description: 'Filter by name' }
 *     },
 *     returns: {                         // Response body schema
 *         rows: { type: 'array', items: { type: 'object' } },
 *         total_count: { type: 'integer' }
 *     },
 *     response_description: 'List of users with pagination'
 * });
 * ```
 *
 * All metadata fields are **optional**.  Endpoints without metadata still
 * produce a valid (minimal) OpenAPI entry.
 *
 * @module openapi
 * @see {@link module:publishers/swagger-ui} for the UI that renders this spec.
 */

'use strict';

// ── Schema Helpers ───────────────────────────────────────────

/**
 * Set of valid OpenAPI primitive type names.
 *
 * Any type string not in this set is normalised to `"string"`.
 *
 * @const {Set<string>}
 * @private
 */
const OPENAPI_TYPES = new Set(['string', 'integer', 'number', 'boolean', 'array', 'object']);

/**
 * Normalise a single type definition into an OpenAPI-compatible form.
 *
 * - Maps unrecognised `type` values to `"string"`.
 * - Recursively normalises `items` (for arrays) and `properties` (for objects).
 *
 * @param {Object|null|undefined} def - A definition like `{type: 'integer'}`.
 * @returns {{ type: string, items?: Object, properties?: Object }} OpenAPI type object.
 * @private
 */
const normalise_type = (def) => {
    if (!def || typeof def !== 'object') return { type: 'string' };
    const t = typeof def.type === 'string' ? def.type.toLowerCase() : 'string';
    const out = { type: OPENAPI_TYPES.has(t) ? t : 'string' };
    if (t === 'array' && def.items) {
        out.items = normalise_type(def.items);
    }
    if (def.properties && t === 'object') {
        // Process nested properties directly to avoid infinite recursion.
        // Cannot call simple_schema_to_openapi here because it would detect
        // the top-level 'type' field and call normalise_type again.
        const nested_props = {};
        const nested_required = [];
        for (const [key, prop_def] of Object.entries(def.properties)) {
            if (!prop_def || typeof prop_def !== 'object') {
                nested_props[key] = { type: 'string' };
                continue;
            }
            const prop = normalise_type(prop_def);
            if (prop_def.description) prop.description = String(prop_def.description);
            if (prop_def.default !== undefined) prop.default = prop_def.default;
            if (prop_def.enum) prop.enum = prop_def.enum;
            if (prop_def.required === true) nested_required.push(key);
            nested_props[key] = prop;
        }
        out.properties = nested_props;
        if (nested_required.length) out.required = nested_required;
    }
    return out;
};

/**
 * Convert a simple `{key: {type, description, default}}` params/returns map
 * into a valid OpenAPI 3.0 Schema Object (`type: "object"` with `properties`).
 *
 * This is the bridge between the lightweight metadata format used in
 * `server.publish()` and the verbose OpenAPI schema format.
 *
 * ### Supported field attributes
 *
 * | Attribute      | Type     | Description                              |
 * |----------------|----------|------------------------------------------|
 * | `type`         | string   | `'string'`, `'integer'`, `'number'`, `'boolean'`, `'array'`, `'object'` |
 * | `description`  | string   | Human-readable description               |
 * | `default`      | any      | Default value                            |
 * | `enum`         | Array    | List of allowed values                   |
 * | `required`     | boolean  | Whether this field is required           |
 * | `items`        | Object   | For `type: 'array'`, describes each item |
 * | `properties`   | Object   | For `type: 'object'`, nested properties  |
 *
 * ### Pass-through behaviour
 *
 * If the input already looks like a raw OpenAPI schema (has a `type` string
 * at the top level), it is normalised in-place rather than wrapped.
 *
 * @param {Object|null|undefined} schema_map - Simple schema map, or `null`.
 * @returns {Object|null} An OpenAPI Schema Object, or `null` if input is falsy.
 *
 * @example
 * // Simple params map:
 * simple_schema_to_openapi({
 *     page: { type: 'integer', description: 'Page number', default: 1 },
 *     name: { type: 'string', required: true }
 * });
 * // → { type: 'object', properties: { page: {...}, name: {...} }, required: ['name'] }
 *
 * @example
 * // Pass-through for pre-formed schemas:
 * simple_schema_to_openapi({ type: 'array', items: { type: 'string' } });
 * // → { type: 'array', items: { type: 'string' } }
 */
const simple_schema_to_openapi = (schema_map) => {
    if (!schema_map || typeof schema_map !== 'object') return null;

    // Already looks like a raw OpenAPI schema — pass through.
    if (schema_map.type && typeof schema_map.type === 'string') {
        return normalise_type(schema_map);
    }

    const properties = {};
    const required = [];
    for (const [key, def] of Object.entries(schema_map)) {
        if (!def || typeof def !== 'object') {
            properties[key] = { type: 'string' };
            continue;
        }
        const prop = normalise_type(def);
        if (def.description) prop.description = String(def.description);
        if (def.default !== undefined) prop.default = def.default;
        if (def.enum) prop.enum = def.enum;
        if (def.required === true) required.push(key);
        properties[key] = prop;
    }

    const schema = { type: 'object', properties };
    if (required.length) schema.required = required;
    return schema;
};

// ── API Entry Collection ─────────────────────────────────────

/**
 * Collect all published API entries from the server instance.
 *
 * Merges entries from three sources on the server, in priority order:
 *
 * 1. **`server._api_registry`** — richest metadata; entries added by
 *    `server.publish()`. These take priority if there is a key collision.
 *
 * 2. **`server.function_publishers`** — raw `Function_Publisher` instances.
 *    Each carries `name`, `api_meta`, and `schema`.  Used as fallback if
 *    the same route is not already in `_api_registry`.
 *
 * 3. **`server.website_manifest.api_endpoints`** — endpoints normalised
 *    by `serve-factory.js` from the declarative `api:` option.  Lowest
 *    priority since these are typically also registered via `publish()`.
 *
 * Deduplication key: `"METHOD /path"` (e.g. `"POST /api/users"`).
 *
 * @param {Object} server - JSGUI_Single_Process_Server instance.
 * @returns {Array<{path: string, method: string, meta: Object, schema: Object}>}
 *   Array of collected API entries.
 */
const collect_api_entries = (server) => {
    const entries_by_key = new Map();

    // Source 1: explicit registry (richest metadata).
    if (Array.isArray(server._api_registry)) {
        for (const entry of server._api_registry) {
            const key = `${(entry.method || 'POST').toUpperCase()} ${entry.path}`;
            entries_by_key.set(key, entry);
        }
    }

    // Source 2: Function publishers (fallback if _api_registry doesn't cover them).
    if (Array.isArray(server.function_publishers)) {
        for (const pub of server.function_publishers) {
            const name = pub.name || '';
            const path = name.startsWith('/') ? name : '/api/' + name;
            const method = (pub.api_meta && pub.api_meta.method) || 'POST';
            const key = `${method.toUpperCase()} ${path}`;
            if (!entries_by_key.has(key)) {
                entries_by_key.set(key, {
                    path,
                    method: method.toUpperCase(),
                    meta: pub.api_meta || {},
                    schema: pub.schema
                });
            }
        }
    }

    // Source 3: website manifest endpoints (declarative serve-factory endpoints).
    if (server.website_manifest && Array.isArray(server.website_manifest.api_endpoints)) {
        for (const ep of server.website_manifest.api_endpoints) {
            const method = (ep.method || 'GET').toUpperCase();
            const key = `${method} ${ep.path}`;
            if (!entries_by_key.has(key)) {
                entries_by_key.set(key, {
                    path: ep.path,
                    method,
                    meta: {
                        summary: ep.summary || ep.description || ep.name,
                        description: ep.description,
                        tags: ep.tags,
                        params: ep.params,
                        returns: ep.returns
                    },
                    schema: ep.schema
                });
            }
        }
    }

    return Array.from(entries_by_key.values());
};

// ── Main Generator ───────────────────────────────────────────

/**
 * Generate a complete OpenAPI 3.0.3 specification object from a jsgui3
 * server instance.
 *
 * The returned object is a plain JSON-serialisable JavaScript object that
 * conforms to the [OpenAPI 3.0.3 Specification](https://spec.openapis.org/oas/v3.0.3).
 *
 * ### What Gets Included
 *
 * - **info** — title, version, description (from `options` or server name).
 * - **servers** — derived from `server.get_listening_endpoints()`.
 * - **paths** — one entry per registered API endpoint (excluding the
 *   Swagger routes themselves: `/api/openapi.json` and `/api/docs`).
 * - **tags** — auto-collected from endpoint metadata, sorted alphabetically.
 * - **requestBody** — generated for POST/PUT/PATCH methods or when `params`
 *   metadata is present.
 * - **responses** — `200` (with schema from `returns` metadata) and `500`.
 *
 * ### Tag Auto-Detection
 *
 * When an endpoint has no explicit `tags`, a tag is guessed from the route
 * path.  For example, `/api/users/list` produces tag `"users"`.
 *
 * @param {Object} server - JSGUI_Single_Process_Server instance.
 * @param {Object} [options] - Override options.
 * @param {string} [options.title]       - Override API title (default: server.name).
 * @param {string} [options.version]     - Override API version (default: '1.0.0').
 * @param {string} [options.description] - Override API description.
 * @returns {Object} A valid OpenAPI 3.0.3 specification object.
 *
 * @example
 * const { generate_openapi_spec } = require('./openapi');
 * const spec = generate_openapi_spec(server, { title: 'My API', version: '2.0.0' });
 * console.log(JSON.stringify(spec, null, 2));
 */
const generate_openapi_spec = (server, options = {}) => {
    const title = options.title || server.name || 'jsgui3 API';
    const version = options.version || '1.0.0';
    const description = options.description || `Auto-generated API documentation for ${title}`;

    // Server URLs — derived from the actual listening endpoints.
    const server_urls = [];
    if (typeof server.get_listening_endpoints === 'function') {
        const endpoints = server.get_listening_endpoints();
        for (const ep of endpoints) {
            server_urls.push({ url: ep.url, description: `${ep.protocol}://${ep.host}:${ep.port}` });
        }
    }
    if (!server_urls.length) {
        server_urls.push({ url: '/', description: 'Current server' });
    }

    // Build OpenAPI paths from collected API entries.
    const paths = {};
    const all_tags = new Set();
    const api_entries = collect_api_entries(server);

    for (const entry of api_entries) {
        const { path, method } = entry;
        const meta = entry.meta || {};
        const method_lower = method.toLowerCase();

        // Skip swagger's own routes to avoid self-referential documentation.
        if (path === '/api/openapi.json' || path === '/api/docs') continue;

        // ── Path parameter support ──
        // Convert Express-style :param to OpenAPI {param} format.
        const openapi_path = path.replace(/:([a-zA-Z_]\w*)/g, '{$1}');

        // Extract path parameters from :param patterns.
        const path_params = [];
        const param_re = /:([a-zA-Z_]\w*)/g;
        let param_match;
        while ((param_match = param_re.exec(path)) !== null) {
            const param_def = (meta.params && meta.params[param_match[1]]) || {};
            path_params.push({
                name: param_match[1],
                in: 'path',
                required: true,
                description: param_def.description || '',
                schema: { type: normalise_type(param_def).type || 'string' }
            });
        }

        if (!paths[openapi_path]) paths[openapi_path] = {};

        // --- Build the Operation Object ---
        const operation = {};

        // operationId: defaults to a sanitised version of the path.
        operation.operationId = meta.operationId || path.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');

        if (meta.summary) operation.summary = meta.summary;
        if (meta.description) operation.description = meta.description;
        if (meta.deprecated) operation.deprecated = true;

        // Tags — use explicit tags or auto-detect from route path.
        const tags = meta.tags || [guess_tag(path)];
        operation.tags = tags;
        tags.forEach(t => all_tags.add(t));

        // ── Parameters vs requestBody ──
        const is_body_method = ['post', 'put', 'patch'].includes(method_lower);

        if (meta.params && !is_body_method) {
            // GET/HEAD/DELETE: emit params as query parameters (not requestBody).
            const query_params = Object.entries(meta.params)
                .filter(([name]) => !path_params.some(pp => pp.name === name))
                .map(([name, def]) => {
                    if (!def || typeof def !== 'object') def = {};
                    const norm = normalise_type(def);
                    const param = {
                        name,
                        in: 'query',
                        required: !!def.required,
                        schema: { type: norm.type || 'string' }
                    };
                    if (def.description) param.description = def.description;
                    if (def.default !== undefined) param.schema.default = def.default;
                    if (def.enum) param.schema.enum = def.enum;
                    return param;
                });
            operation.parameters = [...path_params, ...query_params];
        } else if (is_body_method || entry.schema || meta.params) {
            // POST/PUT/PATCH: emit as requestBody (original behaviour).
            const param_schema = meta.params
                ? simple_schema_to_openapi(meta.params)
                : (entry.schema && Object.keys(entry.schema).length
                    ? simple_schema_to_openapi(entry.schema)
                    : { type: 'object' });

            operation.requestBody = {
                required: false,
                content: {
                    'application/json': {
                        schema: param_schema || { type: 'object' }
                    }
                }
            };
            // Still include path parameters if present.
            if (path_params.length) {
                operation.parameters = path_params;
            }
        } else if (path_params.length) {
            // No meta.params but has path parameters.
            operation.parameters = path_params;
        }

        // Responses — 200 success and 500 error.
        const response_schema = meta.returns
            ? simple_schema_to_openapi(meta.returns)
            : null;

        operation.responses = {
            '200': {
                description: meta.response_description || 'Successful response',
                content: {
                    'application/json': {
                        schema: response_schema || { type: 'object' }
                    }
                }
            },
            '500': {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: { type: 'string' }
                            }
                        }
                    }
                }
            }
        };

        paths[openapi_path][method_lower] = operation;
    }

    // --- Assemble the full spec ---
    const spec = {
        openapi: '3.0.3',
        info: {
            title,
            version,
            description
        },
        servers: server_urls,
        paths,
        tags: Array.from(all_tags).sort().map(name => ({ name }))
    };

    return spec;
};

/**
 * Derive a tag name from a route path for auto-grouping in Swagger UI.
 *
 * Strips the `/api/` prefix and uses the first path segment.
 *
 * @param {string} path - Route path (e.g. `/api/users/list`).
 * @returns {string} Tag name (e.g. `"users"`).
 * @private
 *
 * @example
 * guess_tag('/api/users/list');   // → "users"
 * guess_tag('/api/data/products'); // → "data"
 * guess_tag('/health');           // → "health"
 */
const guess_tag = (path) => {
    const parts = path.replace(/^\/api\//, '').split('/').filter(Boolean);
    return parts[0] || 'default';
};

module.exports = { generate_openapi_spec, collect_api_entries, simple_schema_to_openapi };
