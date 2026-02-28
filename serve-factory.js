const {
    truthy,
    guess_caller_file,
    find_default_client_path,
    load_default_control_from_client,
    ensure_route_leading_slash
} = require('./serve-helpers');
const lib_path = require('path');
const Website = require('./website/website');
const Webpage = require('./website/webpage');
const HTTP_Webpage_Publisher = require('./publishers/http-webpage-publisher');
const HTTP_SSE_Publisher = require('./publishers/http-sse-publisher');
const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');
const Process_Resource = require('./resources/process-resource');
const Remote_Process_Resource = require('./resources/remote-process-resource');
const { get_port_or_free } = require('./port-utils');

const website_marker = Symbol.for('jsgui3.website');
const webpage_marker = Symbol.for('jsgui3.webpage');

const strip_trailing_slash = (route_value) => {
    if (!route_value) {
        return '/';
    }

    let normalized_route = ensure_route_leading_slash(String(route_value));
    while (normalized_route.length > 1 && normalized_route.endsWith('/')) {
        normalized_route = normalized_route.slice(0, -1);
    }
    return normalized_route;
};

const normalize_route_path = (route_value, fallback_route = '/') => {
    const route_candidate = route_value || fallback_route || '/';
    return strip_trailing_slash(route_candidate);
};

const normalize_base_path = (base_path) => {
    if (!base_path) {
        return '';
    }

    const normalized_base_path = normalize_route_path(base_path, '/');
    return normalized_base_path === '/' ? '' : normalized_base_path;
};

const prepare_webpage_route = (server, route, page_options = {}, defaults = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const {
                title,
                name
            } = page_options;
            const content_ctrl = page_options.content || page_options.ctrl || page_options.Ctrl;
            if (typeof content_ctrl !== 'function') {
                return reject(new Error(`Page at route "${route}" requires a control constructor as content.`));
            }

            const caller_dir = defaults.caller_dir || process.cwd();
            const explicit_client_path = page_options.clientPath || page_options.src_path_client_js || page_options.disk_path_client_js;
            const guessed_client_path = find_default_client_path(explicit_client_path, caller_dir);

            const webpage = new Webpage({
                name: name || title || `Page ${route}`,
                title,
                content: content_ctrl,
                path: route
            });

            const publisher_options = {
                webpage
            };
            if (guessed_client_path) publisher_options.src_path_client_js = guessed_client_path;
            if (truthy(defaults.debug)) publisher_options.debug = true;
            if (defaults.style !== undefined) publisher_options.style = defaults.style;
            if (defaults.bundler !== undefined) publisher_options.bundler = defaults.bundler;

            const webpage_publisher = new HTTP_Webpage_Publisher(publisher_options);
            webpage_publisher.on('ready', (bundle) => {
                try {
                    if (bundle && bundle._arr) {
                        const target_router = server.router || server.server_router;
                        if (!target_router || typeof target_router.set_route !== 'function') {
                            reject(new Error(`Server router is unavailable while preparing route ${route}`));
                            return;
                        }
                        for (const item of bundle._arr) {
                            const static_responder = new Static_Route_HTTP_Responder(item);
                            target_router.set_route(item.route, static_responder, static_responder.handle_http);
                        }
                        resolve();
                        return;
                    }
                    reject(new Error(`Unexpected bundle format when preparing route ${route}`));
                } catch (error) {
                    reject(error);
                }
            });
            webpage_publisher.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const invoke_resource_method = (resource, method_name) => {
    if (!resource || typeof resource[method_name] !== 'function') {
        return Promise.resolve(true);
    }

    if (resource[method_name].length >= 1) {
        return new Promise((resolve, reject) => {
            resource[method_name]((error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    }

    const method_result = resource[method_name]();
    if (method_result && typeof method_result.then === 'function') {
        return method_result;
    }

    return Promise.resolve(method_result);
};

const is_resource_like = (resource_value) => {
    return !!resource_value
        && typeof resource_value === 'object'
        && (typeof resource_value.start === 'function'
            || typeof resource_value.meets_requirements === 'function'
            || typeof resource_value.get_abstract === 'function');
};

const instantiate_custom_resource = (resource_name, resource_spec, resource_constructor) => {
    const constructor_spec = resource_spec && typeof resource_spec.spec === 'object'
        ? {
            ...resource_spec.spec
        }
        : {
            ...resource_spec
        };

    if (!constructor_spec.name) {
        constructor_spec.name = resource_name;
    }

    delete constructor_spec.type;
    delete constructor_spec.class;
    delete constructor_spec.Ctor;
    delete constructor_spec.constructor_fn;
    delete constructor_spec.instance;
    delete constructor_spec.resource;
    delete constructor_spec.spec;

    return new resource_constructor(constructor_spec);
};

const create_configured_resource = (resource_name, resource_spec = {}) => {
    if (is_resource_like(resource_spec)) {
        if (!resource_spec.name) {
            resource_spec.name = resource_name;
        }
        return resource_spec;
    }

    if (typeof resource_spec === 'function') {
        return instantiate_custom_resource(resource_name, {}, resource_spec);
    }

    const normalized_spec = {
        ...resource_spec,
        name: resource_spec.name || resource_name
    };

    const explicit_instance = normalized_spec.instance || normalized_spec.resource;
    if (is_resource_like(explicit_instance)) {
        if (!explicit_instance.name) {
            explicit_instance.name = normalized_spec.name;
        }
        return explicit_instance;
    }

    const resource_constructor = normalized_spec.class || normalized_spec.Ctor || normalized_spec.constructor_fn;
    if (typeof resource_constructor === 'function') {
        return instantiate_custom_resource(resource_name, normalized_spec, resource_constructor);
    }

    const resource_type = String(normalized_spec.type || 'process').toLowerCase();
    if (resource_type === 'process' || resource_type === 'local') {
        return new Process_Resource(normalized_spec);
    }
    if (resource_type === 'remote' || resource_type === 'http') {
        return new Remote_Process_Resource(normalized_spec);
    }
    if (resource_type === 'resource' || resource_type === 'in_process' || resource_type === 'in-process') {
        throw new Error(
            `resources.${resource_name} requires one of: { instance }, { resource }, { class }, { constructor_fn }, or a resource object directly.`
        );
    }

    if (normalized_spec.command || normalized_spec.processManager) {
        return new Process_Resource(normalized_spec);
    }
    if (normalized_spec.host || normalized_spec.endpoints) {
        return new Remote_Process_Resource(normalized_spec);
    }

    throw new Error(`Unsupported resources.${resource_name}.type: ${normalized_spec.type}`);
};

const normalize_resource_entries = (resources_option) => {
    if (!resources_option) {
        return [];
    }

    if (Array.isArray(resources_option)) {
        return resources_option.map((resource_spec, index) => {
            const inferred_name = (resource_spec && resource_spec.name) || `resource_${index + 1}`;
            return [inferred_name, resource_spec || {}];
        });
    }

    if (typeof resources_option === 'object') {
        return Object.entries(resources_option);
    }

    throw new Error('`resources` must be an object map or an array.');
};

const is_plain_object = (value) => {
    return !!value && typeof value === 'object' && !Array.isArray(value);
};

const is_website_like = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    if (value[website_marker] === true) {
        return true;
    }

    if (value instanceof Website) {
        return true;
    }

    const has_pages_collection = value.pages !== undefined || value._pages !== undefined;
    if (has_pages_collection) {
        return true;
    }

    return typeof value.add_page === 'function'
        && typeof value.get_page === 'function';
};

const is_webpage_like = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    if (value[webpage_marker] === true) {
        return true;
    }

    if (value instanceof Webpage) {
        return true;
    }

    return typeof value.path === 'string'
        && (
            typeof value.ctrl === 'function'
            || typeof value.Ctrl === 'function'
            || typeof value.content === 'function'
        );
};

const extract_page_ctrl = (page_spec = {}) => {
    const candidate_ctrl = page_spec.ctrl || page_spec.Ctrl;
    if (candidate_ctrl !== undefined) {
        return candidate_ctrl;
    }

    if (typeof page_spec.content === 'function') {
        return page_spec.content;
    }

    return undefined;
};

const normalize_page_entry = (page_spec = {}, fallback_route = '/') => {
    const source_spec = typeof page_spec === 'function'
        ? { ctrl: page_spec }
        : (is_plain_object(page_spec) ? { ...page_spec } : {});

    const route_value = source_spec.path || source_spec.route || fallback_route || '/';
    const route = normalize_route_path(route_value, '/');

    const content_ctrl = extract_page_ctrl(source_spec);
    const normalized_page = {
        ...source_spec,
        path: route,
        route,
        ctrl: content_ctrl,
        Ctrl: content_ctrl,
        content: content_ctrl
    };

    if (source_spec.content !== undefined && typeof source_spec.content !== 'function') {
        normalized_page.content_data = source_spec.content;
    }

    return [route, normalized_page];
};

const normalize_website_pages = (website_value) => {
    const normalized_pages = [];
    const push_page_entry = (page_entry, fallback_route) => {
        normalized_pages.push(normalize_page_entry(page_entry, fallback_route));
    };

    if (Array.isArray(website_value.pages)) {
        for (const page_entry of website_value.pages) {
            push_page_entry(page_entry, page_entry && page_entry.path ? page_entry.path : '/');
        }
        return normalized_pages;
    }

    if (website_value.pages instanceof Map) {
        for (const [route_key, page_entry] of website_value.pages.entries()) {
            push_page_entry(page_entry, route_key);
        }
        return normalized_pages;
    }

    if (website_value.pages && Array.isArray(website_value.pages._arr)) {
        for (const page_entry of website_value.pages._arr) {
            push_page_entry(page_entry, page_entry && page_entry.path ? page_entry.path : '/');
        }
        return normalized_pages;
    }

    if (website_value._pages instanceof Map) {
        for (const [route_key, page_entry] of website_value._pages.entries()) {
            push_page_entry(page_entry, route_key);
        }
        return normalized_pages;
    }

    if (is_plain_object(website_value.pages)) {
        for (const [route_key, page_entry] of Object.entries(website_value.pages)) {
            push_page_entry(page_entry, route_key);
        }
    }

    return normalized_pages;
};

const normalize_endpoint_entry = (endpoint_name, endpoint_value = {}, default_base_path = '') => {
    const normalized_base_path = normalize_base_path(default_base_path);
    const resolve_default_endpoint_path = (route_name) => {
        if (typeof route_name === 'string' && route_name.startsWith('/')) {
            return join_base_path(normalized_base_path, route_name);
        }
        if (typeof route_name === 'string' && route_name.length > 0) {
            return join_base_path(normalized_base_path, `/api/${route_name}`);
        }
        return join_base_path(normalized_base_path, '/api');
    };

    if (typeof endpoint_value === 'function') {
        if (typeof endpoint_name !== 'string' || endpoint_name.length === 0) {
            return null;
        }
        return {
            name: endpoint_name,
            handler: endpoint_value,
            method: 'GET',
            path: resolve_default_endpoint_path(endpoint_name)
        };
    }

    if (!is_plain_object(endpoint_value) || typeof endpoint_value.handler !== 'function') {
        return null;
    }

    const endpoint_label = endpoint_value.name || endpoint_name;
    if (!endpoint_value.path && (typeof endpoint_label !== 'string' || endpoint_label.length === 0)) {
        return null;
    }

    const endpoint_method = endpoint_value.method || 'GET';
    const endpoint_path = endpoint_value.path
        ? normalize_route_path(endpoint_value.path, '/')
        : resolve_default_endpoint_path(endpoint_label);

    return {
        name: endpoint_label,
        handler: endpoint_value.handler,
        method: endpoint_method,
        path: endpoint_path,
        description: endpoint_value.description,
        // Extended API metadata for OpenAPI / Swagger generation.
        summary: endpoint_value.summary,
        tags: endpoint_value.tags,
        params: endpoint_value.params,
        returns: endpoint_value.returns,
        schema: endpoint_value.schema,
        // Enhancement support: raw handler, deprecated, operationId.
        raw: endpoint_value.raw,
        deprecated: endpoint_value.deprecated,
        operationId: endpoint_value.operationId
    };
};

const normalize_website_endpoints = (website_value, normalized_base_path = '') => {
    const normalized_endpoints = [];
    const push_endpoint = (endpoint_entry, endpoint_name) => {
        if (!endpoint_entry) {
            return;
        }

        if (typeof endpoint_entry === 'function') {
            if (typeof endpoint_name !== 'string' || endpoint_name.length === 0) {
                return;
            }
            const normalized_endpoint = normalize_endpoint_entry(endpoint_name, endpoint_entry, normalized_base_path);
            if (normalized_endpoint) {
                normalized_endpoints.push(normalized_endpoint);
            }
            return;
        }

        if (is_plain_object(endpoint_entry) && typeof endpoint_entry.handler === 'function') {
            const normalized_endpoint = normalize_endpoint_entry(
                endpoint_name || endpoint_entry.name,
                endpoint_entry,
                normalized_base_path
            );
            if (normalized_endpoint) {
                normalized_endpoints.push(normalized_endpoint);
            }
            return;
        }

        if (is_plain_object(endpoint_entry) && typeof endpoint_entry.publish === 'function') {
            const normalized_endpoint = normalize_endpoint_entry(endpoint_name, endpoint_entry.publish, normalized_base_path);
            if (!normalized_endpoint) {
                return;
            }
            normalized_endpoints.push(normalized_endpoint);
        }
    };

    if (Array.isArray(website_value.api_endpoints)) {
        for (const endpoint_entry of website_value.api_endpoints) {
            push_endpoint(endpoint_entry, endpoint_entry && endpoint_entry.name);
        }
        return normalized_endpoints;
    }

    if (website_value._api instanceof Map) {
        for (const [endpoint_name, endpoint_entry] of website_value._api.entries()) {
            push_endpoint(
                is_plain_object(endpoint_entry)
                    ? { name: endpoint_name, ...endpoint_entry }
                    : endpoint_entry,
                endpoint_name
            );
        }
        return normalized_endpoints;
    }

    if (website_value.api && typeof website_value.api[Symbol.iterator] === 'function' && !is_plain_object(website_value.api)) {
        for (const endpoint_entry of website_value.api) {
            if (Array.isArray(endpoint_entry)) {
                const [endpoint_name, endpoint_value] = endpoint_entry;
                const normalized_endpoint = normalize_endpoint_entry(endpoint_name, endpoint_value, normalized_base_path);
                if (normalized_endpoint) {
                    normalized_endpoints.push(normalized_endpoint);
                }
            } else {
                push_endpoint(endpoint_entry, endpoint_entry && endpoint_entry.name);
            }
        }
        return normalized_endpoints;
    }

    if (is_plain_object(website_value.api)) {
        for (const [endpoint_name, endpoint_value] of Object.entries(website_value.api)) {
            const normalized_endpoint = normalize_endpoint_entry(endpoint_name, endpoint_value, normalized_base_path);
            if (normalized_endpoint) {
                normalized_endpoints.push(normalized_endpoint);
            }
        }
    }

    return normalized_endpoints;
};

const join_base_path = (base_path, route_path) => {
    const normalized_route = normalize_route_path(route_path || '/', '/');
    const normalized_base = normalize_base_path(base_path);

    if (!normalized_base) {
        return normalized_route;
    }

    if (normalized_route === '/') {
        return normalized_base;
    }

    return `${normalized_base}${normalized_route}`;
};

const dedupe_normalized_endpoints = (normalized_endpoints = []) => {
    const deduped_endpoints = [];
    const seen_endpoint_keys = new Set();

    for (const endpoint of normalized_endpoints) {
        if (!endpoint || typeof endpoint.handler !== 'function') {
            continue;
        }

        const endpoint_method = String(endpoint.method || 'GET').toUpperCase();
        const endpoint_path = endpoint.path
            ? normalize_route_path(endpoint.path, '/')
            : (
                typeof endpoint.name === 'string' && endpoint.name.length > 0
                    ? endpoint.name
                    : ''
            );
        const endpoint_key = `${endpoint_method} ${endpoint_path}`;
        if (seen_endpoint_keys.has(endpoint_key)) {
            continue;
        }

        seen_endpoint_keys.add(endpoint_key);
        deduped_endpoints.push({
            ...endpoint,
            method: endpoint_method,
            path: endpoint.path ? normalize_route_path(endpoint.path, '/') : endpoint.path
        });
    }

    return deduped_endpoints;
};

const normalize_api_endpoints_from_options = (serve_options = {}, base_path = '') => {
    const collected_endpoints = [];

    if (Array.isArray(serve_options.api_endpoints)) {
        collected_endpoints.push(...normalize_website_endpoints({
            api_endpoints: serve_options.api_endpoints
        }, base_path));
    } else if (is_plain_object(serve_options.api_endpoints)) {
        collected_endpoints.push(...normalize_website_endpoints({
            api: serve_options.api_endpoints
        }, base_path));
    }

    if (serve_options.api && typeof serve_options.api === 'object') {
        collected_endpoints.push(...normalize_website_endpoints({
            api: serve_options.api
        }, base_path));
    }

    return dedupe_normalized_endpoints(collected_endpoints);
};

const get_manifest_candidate = (input_value, serve_options = {}) => {
    const input_manifest = normalize_serve_input(input_value);
    if (input_manifest) {
        return input_manifest;
    }

    if (serve_options && typeof serve_options === 'object') {
        const explicit_webpage = normalize_serve_input(serve_options.webpage);
        if (explicit_webpage) {
            return explicit_webpage;
        }

        const explicit_website = normalize_serve_input(serve_options.website);
        if (explicit_website) {
            return explicit_website;
        }
    }

    return null;
};

const normalize_serve_input = (input_value) => {
    if (is_webpage_like(input_value)) {
        const [route, page_config] = normalize_page_entry(input_value, input_value.path || '/');
        return {
            source: 'webpage',
            name: input_value.name,
            meta: input_value.meta || {},
            assets: input_value.assets || {},
            pages: [[route, page_config]],
            api_endpoints: []
        };
    }

    if (is_website_like(input_value)) {
        const base_path = normalize_base_path(input_value.base_path);
        const normalized_pages = normalize_website_pages(input_value).map(([route, page_config]) => {
            const route_with_base = join_base_path(base_path, route);
            return [route_with_base, { ...page_config, path: route_with_base, route: route_with_base }];
        });

        const normalized_endpoints = normalize_website_endpoints(input_value, base_path);
        return {
            source: 'website',
            name: input_value.name,
            meta: input_value.meta || {},
            assets: input_value.assets || {},
            base_path: base_path || undefined,
            pages: normalized_pages,
            api_endpoints: normalized_endpoints
        };
    }

    return null;
};

module.exports = (Server) => {
    const serve = function (input, maybe_options, maybe_callback) {
        let callback = null;
        if (typeof maybe_options === 'function') {
            callback = maybe_options;
            maybe_options = undefined;
        } else if (typeof maybe_callback === 'function') {
            callback = maybe_callback;
        }

        let serve_options = {};
        if (typeof input === 'function') {
            serve_options.ctrl = input;
        } else if (input && typeof input === 'object') {
            serve_options = {
                ...input
            };
        } else if (input !== undefined) {
            throw new Error('First argument to Server.serve must be a control constructor or options object.');
        }

        if (maybe_options && typeof maybe_options === 'object') {
            serve_options = {
                ...serve_options,
                ...maybe_options
            };
        }

        const has_explicit_page_overrides = !!(
            maybe_options
            && typeof maybe_options === 'object'
            && (
                maybe_options.page !== undefined
                || maybe_options.pages !== undefined
                || maybe_options.ctrl !== undefined
                || maybe_options.Ctrl !== undefined
            )
        );

        const normalized_input_manifest = get_manifest_candidate(input, serve_options);
        if (normalized_input_manifest) {
            if (!serve_options.name && normalized_input_manifest.name) {
                serve_options.name = normalized_input_manifest.name;
            }

            if (
                !has_explicit_page_overrides
                && !serve_options.page
                && Array.isArray(normalized_input_manifest.pages)
                && normalized_input_manifest.pages.length
            ) {
                const normalized_pages_map = {};
                const seen_routes = new Set();
                for (const [route, page_config] of normalized_input_manifest.pages) {
                    const normalized_route = normalize_route_path(route, '/');
                    if (seen_routes.has(normalized_route)) {
                        throw new Error(`duplicate_route: ${normalized_route}`);
                    }
                    seen_routes.add(normalized_route);
                    normalized_pages_map[normalized_route] = page_config || {};
                }
                serve_options.pages = normalized_pages_map;

                if (
                    normalized_input_manifest.source === 'webpage'
                    || normalized_input_manifest.source === 'website'
                ) {
                    delete serve_options.ctrl;
                    delete serve_options.Ctrl;
                }
            }

            if (
                !serve_options.api
                && !serve_options.api_endpoints
                && Array.isArray(normalized_input_manifest.api_endpoints)
                && normalized_input_manifest.api_endpoints.length
            ) {
                serve_options.api_endpoints = normalized_input_manifest.api_endpoints;
            }
        }

        const manifest_base_path = normalize_base_path(
            (normalized_input_manifest && normalized_input_manifest.base_path)
            || serve_options.base_path
        );

        const caller_file = serve_options.caller_file || serve_options.callerFile || guess_caller_file();
        const caller_dir = serve_options.root
            ? lib_path.resolve(process.cwd(), serve_options.root)
            : (caller_file ? lib_path.dirname(caller_file) : process.cwd());

        if (!serve_options.ctrl && serve_options.Ctrl) serve_options.ctrl = serve_options.Ctrl;
        if (!serve_options.ctrl && serve_options.page) {
            const page_config = serve_options.page;
            serve_options.ctrl = page_config.content || page_config.ctrl || page_config.Ctrl;
            serve_options.page_route = normalize_route_path(page_config.route || page_config.path || '/', '/');
            serve_options.page_config = page_config;
        }

        let additional_pages = [];
        let use_manual_page_publication = false;
        if (!serve_options.ctrl && Array.isArray(serve_options.pages)) {
            throw new Error('`pages` option must be an object map of route -> page config.');
        }

        if (!serve_options.ctrl && serve_options.pages && typeof serve_options.pages === 'object') {
            const page_entries = Object.entries(serve_options.pages);
            if (!page_entries.length) {
                throw new Error('`pages` option requires at least one entry.');
            }

            const normalized_pages = page_entries.map(([route, cfg]) => [normalize_route_path(route, '/'), cfg || {}]);
            const seen_page_routes = new Set();
            for (const [route] of normalized_pages) {
                if (seen_page_routes.has(route)) {
                    throw new Error(`duplicate_route: ${route}`);
                }
                seen_page_routes.add(route);
            }

            const root_entry = normalized_pages.find(([route]) => route === '/');
            if (root_entry) {
                serve_options.ctrl = (root_entry[1].content || root_entry[1].ctrl || root_entry[1].Ctrl);
                serve_options.page_route = root_entry[0];
                serve_options.page_config = root_entry[1];
                additional_pages = normalized_pages.filter(([route]) => route !== serve_options.page_route);
            } else {
                use_manual_page_publication = true;
                additional_pages = normalized_pages;
            }
        }

        const explicit_client_path = serve_options.clientPath || serve_options.client_path || serve_options.src_path_client_js || serve_options.disk_path_client_js;
        const root_client_path = find_default_client_path(explicit_client_path, caller_dir);

        if (typeof serve_options.ctrl !== 'function' && root_client_path && !use_manual_page_publication) {
            const auto_ctrl = load_default_control_from_client(root_client_path);
            if (typeof auto_ctrl === 'function') {
                serve_options.ctrl = auto_ctrl;
            }
        }

        if (serve_options.page_config && typeof serve_options.ctrl !== 'function') {
            throw new Error('`page` option requires a control constructor.');
        }
        if (additional_pages.length && !use_manual_page_publication && typeof serve_options.ctrl !== 'function') {
            throw new Error('`pages` option requires at least one control constructor.');
        }

        if (use_manual_page_publication) {
            const invalid_page_entry = additional_pages.find(([, cfg]) => {
                const page_ctrl = cfg && (cfg.content || cfg.ctrl || cfg.Ctrl);
                return typeof page_ctrl !== 'function';
            });
            if (invalid_page_entry) {
                throw new Error(`Page at route "${invalid_page_entry[0]}" requires a control constructor as content.`);
            }
        }

        const normalized_api_endpoints = normalize_api_endpoints_from_options(serve_options, manifest_base_path);

        const port = Number.isFinite(serve_options.port)
            ? Number(serve_options.port)
            : (serve_options.port === 'auto' ? 0 : (process.env.PORT ? Number(process.env.PORT) : 8080));
        const auto_port = serve_options.autoPort !== false && (port === 0 || serve_options.port === 'auto' || serve_options.autoPort === true);
        if (!Number.isFinite(port) && serve_options.port !== 'auto') {
            throw new Error('Invalid port specified for Server.serve');
        }

        const host = serve_options.host || process.env.HOST || null;
        const debug_enabled = serve_options.debug !== undefined ? truthy(serve_options.debug) : truthy(process.env.JSGUI_DEBUG);
        const style_config = serve_options.style;
        const bundler_config = serve_options.bundler;

        const server_spec = {
            name: serve_options.name || 'jsgui3 server',
            debug: debug_enabled
        };
        if (style_config !== undefined) server_spec.style = style_config;
        if (bundler_config !== undefined) server_spec.bundler = bundler_config;
        if (serve_options.admin !== undefined) server_spec.admin = serve_options.admin;

        if (typeof serve_options.ctrl === 'function') {
            server_spec.Ctrl = serve_options.ctrl;
        } else if (
            (serve_options.api && typeof serve_options.api === 'object')
            || normalized_api_endpoints.length
            || use_manual_page_publication
        ) {
            server_spec.website = false;
        }

        if (root_client_path) {
            server_spec.src_path_client_js = root_client_path;
        }

        const server_instance = new Server(server_spec);
        if (host) {
            server_instance.allowed_addresses = Array.isArray(host) ? host : [host];
        }

        // ── Middleware registration ───────────────────────────────
        // `middleware` accepts a single function or an array.  Each
        // function must have the signature (req, res, next).  They
        // execute in array order before the router handles the request.
        if (serve_options.middleware) {
            const mw_list = Array.isArray(serve_options.middleware)
                ? serve_options.middleware
                : [serve_options.middleware];
            for (const mw of mw_list) {
                if (typeof mw === 'function') {
                    server_instance.use(mw);
                }
            }
        }

        // ── Built-in compression shorthand ────────────────────────
        // `compression: true` enables gzip/deflate/brotli response
        // compression with default options (1024-byte threshold).
        // `compression: { threshold: 512 }` overrides defaults.
        // Appended *after* any user-supplied middleware.
        if (serve_options.compression) {
            const compression = require('./middleware/compression');
            const compression_options = typeof serve_options.compression === 'object'
                ? serve_options.compression
                : {};
            server_instance.use(compression(compression_options));
        }

        const configured_resources = [];
        const resource_entries = normalize_resource_entries(serve_options.resources);
        if (resource_entries.length) {
            for (const [resource_name, resource_spec] of resource_entries) {
                configured_resources.push(create_configured_resource(resource_name, resource_spec || {}));
            }
            server_instance.configured_resources = configured_resources;
        }

        if (serve_options.events) {
            const event_options = typeof serve_options.events === 'object' ? serve_options.events : {};
            const events_route = ensure_route_leading_slash(event_options.route || '/events');
            const sse_publisher = new HTTP_SSE_Publisher({
                name: event_options.name || 'events',
                ...event_options
            });

            server_instance.sse_publisher = sse_publisher;
            server_instance.server_router.set_route(events_route, sse_publisher, sse_publisher.handle_http);

            const pool_event_names = ['resource_state_change', 'crashed', 'unhealthy', 'unreachable', 'recovered'];
            pool_event_names.forEach((event_name) => {
                server_instance.resource_pool.on(event_name, (event_data) => {
                    sse_publisher.broadcast(event_name, event_data);
                });
            });
        }

        const attach_configured_resources = () => {
            for (const resource of configured_resources) {
                if (!server_instance.resource_pool.has_resource(resource.name)) {
                    server_instance.resource_pool.add(resource);
                }
            }
        };

        const start_configured_resources = async () => {
            if (!configured_resources.length) {
                return;
            }

            attach_configured_resources();
            await Promise.all(configured_resources.map((resource) => invoke_resource_method(resource, 'start')));
        };

        const startup_ready_timeout_ms = Number.isFinite(serve_options.readyTimeoutMs) && Number(serve_options.readyTimeoutMs) > 0
            ? Number(serve_options.readyTimeoutMs)
            : 120000;

        const manifest_page_entries = [];
        const seen_manifest_routes = new Set();
        const push_manifest_page = (route, page_config = {}) => {
            const normalized_route = normalize_route_path(route, '/');
            if (seen_manifest_routes.has(normalized_route)) {
                return;
            }
            seen_manifest_routes.add(normalized_route);
            manifest_page_entries.push([normalized_route, page_config || {}]);
        };

        if (normalized_input_manifest && Array.isArray(normalized_input_manifest.pages) && normalized_input_manifest.pages.length) {
            for (const [route, page_config] of normalized_input_manifest.pages) {
                push_manifest_page(route, page_config);
            }
        } else {
            if (serve_options.page_config && serve_options.page_route) {
                push_manifest_page(serve_options.page_route, serve_options.page_config);
            }
            for (const [route, page_config] of additional_pages) {
                push_manifest_page(route, page_config);
            }
            if (!manifest_page_entries.length && typeof serve_options.ctrl === 'function' && !use_manual_page_publication) {
                push_manifest_page('/', {
                    ctrl: serve_options.ctrl,
                    content: serve_options.ctrl,
                    name: serve_options.name
                });
            }
        }

        const manifest_warning_messages = [];
        const non_get_endpoints = normalized_api_endpoints.filter((endpoint) => endpoint.method !== 'GET');
        if (non_get_endpoints.length) {
            manifest_warning_messages.push(
                'API endpoint metadata includes non-GET methods, but server.publish currently treats handlers as method-agnostic.'
            );
        }

        const effective_website_manifest = {
            source: (normalized_input_manifest && normalized_input_manifest.source)
                || (use_manual_page_publication ? 'pages' : (typeof serve_options.ctrl === 'function' ? 'ctrl' : 'legacy')),
            name: serve_options.name || server_spec.name || 'jsgui3 server',
            base_path: manifest_base_path || undefined,
            meta: (normalized_input_manifest && normalized_input_manifest.meta) || serve_options.meta || {},
            assets: (normalized_input_manifest && normalized_input_manifest.assets) || serve_options.assets || {},
            pages: manifest_page_entries.map(([route, page_config]) => {
                const page_ctrl = extract_page_ctrl(page_config || {});
                return {
                    route,
                    path: route,
                    name: page_config ? page_config.name : undefined,
                    title: page_config ? page_config.title : undefined,
                    render_mode: (page_config && page_config.render_mode)
                        || (typeof page_ctrl === 'function' ? 'dynamic' : 'static'),
                    has_ctrl: typeof page_ctrl === 'function'
                };
            }),
            api_endpoints: normalized_api_endpoints.map((endpoint) => ({
                name: endpoint.name,
                method: endpoint.method || 'GET',
                path: endpoint.path,
                description: endpoint.description,
                summary: endpoint.summary,
                tags: endpoint.tags,
                params: endpoint.params,
                returns: endpoint.returns,
                schema: endpoint.schema
            }))
        };

        server_instance.website_manifest = effective_website_manifest;
        server_instance.publication_summary = {
            source: effective_website_manifest.source,
            page_routes: effective_website_manifest.pages.map((page) => page.path),
            api_routes: effective_website_manifest.api_endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
            warnings: manifest_warning_messages
        };

        const extra_page_promises = additional_pages.map(([route, cfg]) => prepare_webpage_route(server_instance, route, cfg, {
            caller_dir,
            debug: debug_enabled,
            style: style_config,
            bundler: bundler_config
        }));

        if (serve_options.page_config && serve_options.page_route && serve_options.page_route !== '/') {
            extra_page_promises.unshift(prepare_webpage_route(server_instance, serve_options.page_route, serve_options.page_config, {
                caller_dir,
                debug: debug_enabled,
                style: style_config,
                bundler: bundler_config
            }));
        }

        // ── Register middleware ──────────────────────────────
        // `middleware` accepts an array of (req, res, next) functions.
        if (Array.isArray(serve_options.middleware)) {
            for (const mw of serve_options.middleware) {
                if (typeof mw === 'function') {
                    server_instance.use(mw);
                }
            }
        }

        for (const endpoint of normalized_api_endpoints) {
            if (!endpoint || typeof endpoint.handler !== 'function') {
                continue;
            }

            const endpoint_route = endpoint.path || endpoint.name;
            if (typeof endpoint_route !== 'string' || endpoint_route.length === 0) {
                continue;
            }

            const publish_meta = { method: endpoint.method };
            if (endpoint.summary) publish_meta.summary = endpoint.summary;
            if (endpoint.description) publish_meta.description = endpoint.description;
            if (endpoint.tags) publish_meta.tags = endpoint.tags;
            if (endpoint.params) publish_meta.params = endpoint.params;
            if (endpoint.returns) publish_meta.returns = endpoint.returns;
            if (endpoint.deprecated) publish_meta.deprecated = endpoint.deprecated;
            if (endpoint.operationId) publish_meta.operationId = endpoint.operationId;
            if (endpoint.raw) publish_meta.raw = endpoint.raw;
            server_instance.publish(endpoint.path || endpoint.name, endpoint.handler, publish_meta);
        }
        // ── Data query endpoints ──────────────────────────────
        // `data` accepts an object map of name → {query_fn, adapter, schema}.
        // Each entry creates a Query_Resource + Query_Publisher at /api/data/<name>.
        let data_endpoint_count = 0;
        if (serve_options.data && typeof serve_options.data === 'object') {
            const Query_Publisher = require('./publishers/query-publisher');
            const Query_Resource = require('./resources/query-resource');
            const Array_Adapter = require('./resources/adapters/array-adapter');

            for (const [data_name, data_spec] of Object.entries(serve_options.data)) {
                if (!data_spec) continue;

                let query_fn;
                let resource = null;

                if (typeof data_spec.query_fn === 'function') {
                    query_fn = data_spec.query_fn;
                } else if (data_spec.adapter && typeof data_spec.adapter.query === 'function') {
                    resource = new Query_Resource({
                        name: data_name,
                        adapter: data_spec.adapter,
                        schema: data_spec.schema
                    });
                    query_fn = (params) => resource.query(params);
                } else if (Array.isArray(data_spec.data)) {
                    const adapter = new Array_Adapter({ data: data_spec.data });
                    resource = new Query_Resource({
                        name: data_name,
                        adapter,
                        schema: data_spec.schema
                    });
                    query_fn = (params) => resource.query(params);
                } else {
                    continue;
                }

                if (resource) {
                    configured_resources.push(resource);
                    if (!server_instance.configured_resources) {
                        server_instance.configured_resources = configured_resources;
                    }
                }

                const data_route = ensure_route_leading_slash(`/api/data/${data_name}`);
                const publisher = new Query_Publisher({
                    name: data_name,
                    query_fn,
                    schema: data_spec.schema
                });
                server_instance.server_router.set_route(data_route, publisher, publisher.handle_http);
                data_endpoint_count++;
            }
        }

        // ── Swagger / OpenAPI auto-registration ──────────────
        // swagger: true   → always enable
        // swagger: false  → always disable
        // swagger: omitted → enable in non-production
        const swagger_option = serve_options.swagger;
        const swagger_enabled = swagger_option === true
            || (swagger_option !== false && process.env.NODE_ENV !== 'production');

        if (swagger_enabled) {
            const swagger_options = typeof swagger_option === 'object' ? swagger_option : {};
            server_instance._register_swagger_routes({
                title: swagger_options.title || serve_options.name,
                version: swagger_options.version,
                description: swagger_options.description
            });
        }

        const should_force_ready = !serve_options.ctrl && (
            normalized_api_endpoints.length > 0
            || data_endpoint_count > 0
            || use_manual_page_publication
        );

        return new Promise((resolve, reject) => {
            let has_started = false;
            let has_settled = false;
            let ready_timeout_handle = null;

            const settle = (resolver, value) => {
                if (has_settled) {
                    return;
                }
                has_settled = true;
                if (ready_timeout_handle) {
                    clearTimeout(ready_timeout_handle);
                    ready_timeout_handle = null;
                }

                if (callback) {
                    try {
                        callback(resolver === reject ? value : null, resolver === resolve ? value : undefined);
                    } catch {
                        // Ignore callback errors after settlement.
                    }
                }
                resolver(value);
            };

            const start_server = async () => {
                if (has_started || has_settled) return;
                has_started = true;

                let actual_port = port;
                if (auto_port) {
                    try {
                        const check_host = host || '127.0.0.1';
                        actual_port = await get_port_or_free(port, Array.isArray(check_host) ? check_host[0] : check_host);
                    } catch (error) {
                        return settle(reject, error);
                    }
                }

                server_instance.port = actual_port;

                const start_options = {
                    ...(serve_options.start && typeof serve_options.start === 'object' ? serve_options.start : {})
                };
                if (typeof serve_options.on_port_conflict === 'string' && !start_options.on_port_conflict) {
                    start_options.on_port_conflict = serve_options.on_port_conflict;
                }

                server_instance.start(actual_port, (error) => {
                    if (error) {
                        return settle(reject, error);
                    }

                    start_configured_resources().then(() => {
                        settle(resolve, server_instance);
                    }).catch((resource_error) => {
                        settle(reject, resource_error);
                    });
                }, start_options);
            };

            server_instance.on('ready', () => {
                if (has_settled) {
                    return;
                }
                Promise.allSettled(extra_page_promises).then((results) => {
                    const rejected_entry = results.find((result) => result.status === 'rejected');
                    if (rejected_entry) {
                        return settle(reject, rejected_entry.reason);
                    }
                    start_server();
                }).catch((error) => {
                    settle(reject, error);
                });
            });

            if (should_force_ready) {
                server_instance.raise('ready');
            }

            ready_timeout_handle = setTimeout(() => {
                if (!has_settled && !has_started) {
                    settle(reject, new Error(
                        `Server.serve timed out waiting for "ready" before start (${startup_ready_timeout_ms}ms).`
                    ));
                }
            }, startup_ready_timeout_ms);
            ready_timeout_handle.unref?.();
        });
    };

    return serve;
};
