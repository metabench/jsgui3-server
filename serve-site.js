// serve-site.js
//
// Server.serve_site(site, options) - single-call serving of a jsgui3-website
// `Website` instance. Finalizes the site, builds composed page controls for
// each Resolved_Page, renders them server-side at startup, and registers
// route responders. Aliases share the canonical HTML; redirect_from entries
// register 301 responders. API endpoints are wired via server.publish.
//
// Rendering remains synchronous for page HTML, with an additive client bundle
// pass for pages that declare `Webpage.client_js` or for sites served with a
// site-level client entry option.

const fs = require('fs');
const os = require('os');
const path = require('path');
const Server_Static_Page_Context = require('./static-page-context');
const compose_page_ctrl = require('./controls/site-page-composer');
const { truthy } = require('./serve-helpers');
const { get_port_or_free } = require('./port-utils');
const JS_Bundler = require('./resources/processors/bundlers/js/JS_Bundler');
const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');

const ensure_leading_slash = (path) => {
    if (typeof path !== 'string' || path.length === 0) return '/';
    return path.startsWith('/') ? path : `/${path}`;
};

const strip_trailing_slash = (path) => {
    let normalized = ensure_leading_slash(path);
    while (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
};

const normalize_route_path = (path) => ensure_leading_slash(path);

const normalize_base_path = (base_path) => {
    if (!base_path || base_path === '/') return '';
    return strip_trailing_slash(base_path);
};

const join_base_path = (base_path, path) => {
    const normalized_base_path = normalize_base_path(base_path);
    const normalized_path = normalize_route_path(path || '/');
    if (!normalized_base_path) return normalized_path;
    if (normalized_path === normalized_base_path || normalized_path.startsWith(`${normalized_base_path}/`)) {
        return normalized_path;
    }
    return normalized_path === '/'
        ? normalized_base_path
        : `${normalized_base_path}${normalized_path}`;
};

const endpoint_route = (endpoint, base_path) => {
    const endpoint_path = endpoint.path || (
        endpoint.name && endpoint.name.startsWith('/')
            ? endpoint.name
            : `/api/${endpoint.name || ''}`
    );
    return join_base_path(base_path, endpoint_path);
};

const is_website_instance = (value) => {
    if (!value || typeof value !== 'object') return false;
    if (value[Symbol.for('jsgui3.website')] === true && typeof value.finalize === 'function') return true;
    return typeof value.finalize === 'function'
        && typeof value.add_page === 'function'
        && typeof value.get_page === 'function';
};

const get_request_path = (req, fallback_path = '/') => {
    const raw_url = req && (req.url || req.path) ? (req.url || req.path) : fallback_path;
    return String(raw_url || fallback_path).split('?')[0] || '/';
};

const make_site_ctx = (resolved_page, model, options = {}) => {
    if (options.site_ctx) return options.site_ctx;
    const req = options.req || options.request;
    const path = get_request_path(req, resolved_page.path);
    return model.render_context({
        path,
        locale: options.locale || (req && req.locale),
        data: options.data || (req && req.data)
    });
};

const render_page_html = (resolved_page, model, options = {}) => {
    const client_assets_by_page = options.client_assets_by_page;
    const client_assets = client_assets_by_page && typeof client_assets_by_page.get === 'function'
        ? client_assets_by_page.get(resolved_page.id)
        : undefined;
    const Composed_Ctrl = compose_page_ctrl(resolved_page, model, { client_assets });
    const req = options.req || options.request;
    const res = options.res || options.response;
    const context = new Server_Static_Page_Context({ req, res, server: options.server });
    const site_ctx = make_site_ctx(resolved_page, model, options);
    context.site_model = model;
    context.site_page = resolved_page;
    context.site_ctx = site_ctx;
    const ctrl = new Composed_Ctrl({ context, site_ctx });
    const html_body = typeof ctrl.html === 'string'
        ? ctrl.html
        : ((ctrl.html && ctrl.html.toString) ? ctrl.html.toString() : '');
    return `<!DOCTYPE html>${html_body}`;
};

const make_html_responder = (resolved_page, model, server, render_options = {}) => (req, res) => {
    const html_string = render_page_html(resolved_page, model, { ...render_options, req, res, server });
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html_string)
    });
    res.end(html_string);
};

const make_redirect_responder = (target, status = 301) => (req, res) => {
    res.writeHead(status, { Location: target });
    res.end();
};

const normalize_client_js_path = (client_js_path) => {
    if (typeof client_js_path !== 'string' || client_js_path.length === 0) return undefined;
    return path.isAbsolute(client_js_path)
        ? client_js_path
        : path.resolve(process.cwd(), client_js_path);
};

const safe_asset_name = (value, fallback = 'site') => {
    const normalized = String(value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || fallback;
};

const get_site_client_js_path = (site, options = {}) => normalize_client_js_path(
    options.src_path_client_js
    || options.source_path_client_js
    || options.client_js
    || site.src_path_client_js
    || site.source_path_client_js
    || site.client_js
    || site._spec_client_js
);

const get_page_client_js_path = (resolved_page) => normalize_client_js_path(
    resolved_page.client_js
    || (resolved_page.webpage && resolved_page.webpage.client_js)
);

const is_object = (value) => value !== null && typeof value === 'object';

const get_data_property = (object, key) => {
    if (!is_object(object) && typeof object !== 'function') return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return undefined;
    return descriptor.value;
};

const inspect_control_export_path = (module_exports, Ctrl) => {
    if (module_exports === Ctrl) return [];

    if (!is_object(module_exports) && typeof module_exports !== 'function') return null;

    for (const key of Object.keys(module_exports)) {
        if (get_data_property(module_exports, key) === Ctrl) return [key];
    }

    const controls_export = get_data_property(module_exports, 'controls');
    if (is_object(controls_export)) {
        for (const key of Object.keys(controls_export)) {
            if (get_data_property(controls_export, key) === Ctrl) return ['controls', key];
        }
    }

    return null;
};

const normalize_control_export_path = (value) => {
    if (Array.isArray(value)) return value.map((part) => String(part)).filter(Boolean);
    if (typeof value === 'string' && value.length > 0) return value.split('.').filter(Boolean);
    return [];
};

const resolve_control_export_from_metadata = (Ctrl) => {
    const module_path_value = get_data_property(Ctrl, 'client_module_path')
        || get_data_property(Ctrl, 'module_path')
        || get_data_property(Ctrl, 'source_path');
    if (typeof module_path_value !== 'string' || module_path_value.length === 0) return null;

    const module_path = path.isAbsolute(module_path_value)
        ? module_path_value
        : path.resolve(process.cwd(), module_path_value);
    const export_path = normalize_control_export_path(
        get_data_property(Ctrl, 'client_export_path')
        || get_data_property(Ctrl, 'export_path')
        || get_data_property(Ctrl, 'client_export_name')
        || get_data_property(Ctrl, 'export_name')
    );
    const registration_name = get_data_property(Ctrl, 'client_registration_name')
        || get_data_property(Ctrl, 'registration_name')
        || export_path[export_path.length - 1]
        || Ctrl.name;

    return { module_path, export_path, registration_name };
};

const score_module_path_for_control_export = (module_path) => {
    const normalized = module_path.replace(/\\/g, '/');
    if (normalized.includes('/node_modules/jsgui3-html/') || normalized.includes('/node_modules/jsgui3-client/')) return 20;
    if (normalized.includes('/node_modules/')) return 10;
    return 0;
};

const resolve_control_export = (Ctrl) => {
    if (typeof Ctrl !== 'function') return null;

    const metadata_export = resolve_control_export_from_metadata(Ctrl);
    if (metadata_export) return metadata_export;

    const module_paths = Object.keys(require.cache).sort((a, b) => {
        const score_delta = score_module_path_for_control_export(a) - score_module_path_for_control_export(b);
        return score_delta || a.localeCompare(b);
    });

    for (const module_path of module_paths) {
        const cache_entry = require.cache[module_path];
        if (!cache_entry) continue;
        const export_path = inspect_control_export_path(cache_entry.exports, Ctrl);
        if (!export_path) continue;

        const export_name = export_path.length > 0 ? export_path[export_path.length - 1] : Ctrl.name;
        return {
            module_path,
            export_path,
            registration_name: export_name || Ctrl.name
        };
    }

    return null;
};

const add_control_constructor = (constructors, Ctrl) => {
    if (typeof Ctrl === 'function' && !constructors.includes(Ctrl)) constructors.push(Ctrl);
};

const collect_slot_control_constructors = (slot_value, model, constructors) => {
    if (!slot_value || slot_value.kind === 'omit') return;

    if (slot_value.kind === 'region') {
        const region = model.regions && model.regions.get(slot_value.region);
        if (region) add_control_constructor(constructors, region.ctrl);
        return;
    }

    if (slot_value.kind === 'ctrl' || slot_value.kind === 'inline') {
        add_control_constructor(constructors, slot_value.ctrl);
        return;
    }

    if (slot_value.kind === 'list') {
        for (const child_slot of slot_value.children || []) {
            collect_slot_control_constructors(child_slot, model, constructors);
        }
        return;
    }

    if (slot_value.kind === 'append') {
        collect_slot_control_constructors(slot_value.append, model, constructors);
    }
};

const collect_page_control_constructors = (resolved_page, model) => {
    const constructors = [];
    add_control_constructor(constructors, resolved_page.ctrl);
    for (const Ctrl of resolved_page.client_controls || []) {
        add_control_constructor(constructors, Ctrl);
    }
    for (const slot_value of Object.values(resolved_page.slots || {})) {
        collect_slot_control_constructors(slot_value, model, constructors);
    }
    return constructors;
};

const make_generated_client_entry_source = (control_exports) => {
    const jsgui_client_module_path = require.resolve('jsgui3-client').replace(/\\/g, '/');
    const lines = [
        `const jsgui = require(${JSON.stringify(jsgui_client_module_path)});`,
        '',
        'const resolve_export_path = (module_exports, export_path) => {',
        '    let value = module_exports;',
        '    for (const key of export_path) {',
        '        value = value && value[key];',
        '    }',
        '    return value;',
        '};',
        '',
        'const register_control = (name, Constructor) => {',
        '    if (typeof Constructor !== \'function\') {',
        '        throw new Error(`Generated serve_site client entry could not resolve control ${name}`);',
        '    }',
        '    jsgui.controls[name] = Constructor;',
        '};',
        ''
    ];

    control_exports.forEach((control_export, index) => {
        const require_path = control_export.module_path.replace(/\\/g, '/');
        lines.push(`const module_${index} = require(${JSON.stringify(require_path)});`);
        lines.push(`register_control(${JSON.stringify(control_export.registration_name)}, resolve_export_path(module_${index}, ${JSON.stringify(control_export.export_path)}));`);
    });

    lines.push('', 'module.exports = jsgui;', '');
    return lines.join('\n');
};

const make_generated_client_entry = async (resolved_page, model, options = {}) => {
    if (options.auto_client_js === false || options.generate_client_js === false) return null;

    const constructors = collect_page_control_constructors(resolved_page, model);
    if (constructors.length === 0) return null;

    const control_exports = [];
    for (const Ctrl of constructors) {
        const control_export = resolve_control_export(Ctrl);
        if (!control_export) return null;
        control_exports.push(control_export);
    }

    const unique_exports = [];
    const seen = new Set();
    for (const control_export of control_exports) {
        const key = `${control_export.module_path}:${control_export.export_path.join('.')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique_exports.push(control_export);
    }

    const temp_dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jsgui3-serve-site-client-'));
    const client_js_path = path.join(temp_dir, 'client.js');
    await fs.promises.writeFile(client_js_path, make_generated_client_entry_source(unique_exports), 'utf8');

    return {
        client_js_path,
        generated: true,
        key: `generated:${[...seen].sort().join('|')}`,
        cleanup: async () => {
            await fs.promises.rm(temp_dir, { recursive: true, force: true });
        }
    };
};

const make_asset_route = (model, directory, asset_name, extension) => {
    return join_base_path(model.base_path, `/${directory}/${asset_name}.${extension}`);
};

const make_text_bundle_route_item = (source_item, route, fallback_type, extension) => ({
    ...source_item,
    type: source_item.type || fallback_type,
    extension,
    route,
    text: source_item.text || ''
});

const bundle_client_entry = async (client_js_path, model, asset_name) => {
    const js_bundler = new JS_Bundler({});
    const js_bundler_res = await js_bundler.bundle(client_js_path);
    const bundle = Array.isArray(js_bundler_res) ? js_bundler_res[0] : js_bundler_res;
    const bundle_items = bundle && Array.isArray(bundle._arr) ? bundle._arr : [];
    const js_item = bundle_items.find((item) => item && item.type === 'JavaScript');
    const css_item = bundle_items.find((item) => item && item.type === 'CSS');

    const assets = { js: [], css: [] };
    const routes = [];

    if (css_item && css_item.text) {
        const css_route = make_asset_route(model, 'css', asset_name, 'css');
        routes.push(make_text_bundle_route_item(css_item, css_route, 'CSS', 'css'));
        assets.css.push({ href: css_route });
    }

    if (js_item && js_item.text) {
        const js_route = make_asset_route(model, 'js', asset_name, 'js');
        routes.push(make_text_bundle_route_item(js_item, js_route, 'JavaScript', 'js'));
        assets.js.push({ src: js_route });
    }

    return { assets, routes, client_js_path };
};

const prepare_site_client_assets = async (site, model, options = {}) => {
    const site_client_js_path = get_site_client_js_path(site, options);
    const bundle_by_client_path = new Map();
    const client_assets_by_page = new Map();
    const route_items = [];

    for (const resolved_page of model.pages.values()) {
        const page_client_js_path = get_page_client_js_path(resolved_page);
        const generated_entry = page_client_js_path || site_client_js_path
            ? null
            : await make_generated_client_entry(resolved_page, model, options);
        const client_js_path = page_client_js_path || site_client_js_path || (generated_entry && generated_entry.client_js_path);
        if (!client_js_path) continue;

        const bundle_key = generated_entry ? generated_entry.key : client_js_path;

        if (!bundle_by_client_path.has(bundle_key)) {
            const asset_name = page_client_js_path || generated_entry
                ? safe_asset_name(resolved_page.id || resolved_page.path, 'page')
                : 'site';
            try {
                const bundle_info = await bundle_client_entry(client_js_path, model, asset_name);
                bundle_by_client_path.set(bundle_key, bundle_info);
                route_items.push(...bundle_info.routes);
            } finally {
                if (generated_entry && typeof generated_entry.cleanup === 'function') {
                    await generated_entry.cleanup();
                }
            }
        } else if (generated_entry && typeof generated_entry.cleanup === 'function') {
            await generated_entry.cleanup();
        }

        const bundle_info = bundle_by_client_path.get(bundle_key);
        client_assets_by_page.set(resolved_page.id, bundle_info.assets);
    }

    return { client_assets_by_page, route_items };
};

const register_client_asset_routes = (server, route_items = []) => {
    if (!route_items.length) return [];
    const target_router = server.router || server.server_router;
    if (!target_router || typeof target_router.set_route !== 'function') {
        throw new Error('Server router unavailable for serve_site client assets');
    }

    const route_summary = [];
    for (const route_item of route_items) {
        const responder = new Static_Route_HTTP_Responder(route_item);
        target_router.set_route(route_item.route, responder, responder.handle_http);
        route_summary.push({
            path: route_item.route,
            kind: 'client_asset',
            extension: route_item.extension
        });
    }
    return route_summary;
};

const register_site_routes = (server, model, render_options = {}) => {
    const target_router = server.router || server.server_router;
    if (!target_router || typeof target_router.set_route !== 'function') {
        throw new Error('Server router unavailable for serve_site');
    }

    const route_summary = [];

    for (const resolved_page of model.pages.values()) {
        const responder = make_html_responder(resolved_page, model, server, render_options);

        target_router.set_route(resolved_page.path, null, responder);
        route_summary.push({ path: resolved_page.path, kind: 'page', id: resolved_page.id });

        for (const alias_path of resolved_page.aliases || []) {
            target_router.set_route(alias_path, null, responder);
            route_summary.push({ path: alias_path, kind: 'alias', canonical: resolved_page.path });
        }

        for (const source_path of resolved_page.redirect_from || []) {
            target_router.set_route(source_path, null, make_redirect_responder(resolved_page.path, 301));
            route_summary.push({ path: source_path, kind: 'redirect', target: resolved_page.path });
        }
    }

    return route_summary;
};

const serve_site = async (site, options = {}) => {
    if (!is_website_instance(site)) {
        throw new TypeError('serve_site requires a Website instance');
    }

    const Server = require('./server');

    if (!site.finalized) site.finalize();
    const model = site.resolved_model;

    if (typeof options.on_diagnostics === 'function') {
        options.on_diagnostics(model.diagnostics());
    }

    const debug_enabled = options.debug !== undefined ? truthy(options.debug) : truthy(process.env.JSGUI_DEBUG);

    const server = new Server({
        name: options.name || site.name || 'jsgui3 site',
        debug: debug_enabled,
        ...(options.style !== undefined ? { style: options.style } : {}),
        ...(options.bundler !== undefined ? { bundler: options.bundler } : {}),
        admin: options.admin !== undefined ? options.admin : false,
        website: false
    });

    if (options.middleware) {
        const mw_list = Array.isArray(options.middleware) ? options.middleware : [options.middleware];
        for (const mw of mw_list) if (typeof mw === 'function') server.use(mw);
    }

    server.use((req, res, next) => {
        try {
            const url_path = (req.url || '/').split('?')[0];
            req.site_ctx = model.render_context({ path: url_path });
        } catch (_) { /* non-fatal */ }
        next();
    });

    const client_asset_info = await prepare_site_client_assets(site, model, options);
    const client_asset_routes = register_client_asset_routes(server, client_asset_info.route_items);
    const route_summary = [
        ...client_asset_routes,
        ...register_site_routes(server, model, {
            client_assets_by_page: client_asset_info.client_assets_by_page
        })
    ];
    server.site = site;
    server.site_model = model;
    server.site_routes = route_summary;
    server.site_client_assets = client_asset_info.client_assets_by_page;

    for (const endpoint of site.api_endpoints || []) {
        if (endpoint && typeof endpoint.handler === 'function') {
            const { handler, name, path, ...endpoint_meta } = endpoint;
            server.publish(endpoint_route({ name, path }, model.base_path), handler, {
                ...endpoint_meta,
                method: endpoint.method
            });
        }
    }

    if (options.prepare_only === true) {
        return server;
    }

    return new Promise((resolve, reject) => {
        const startup = async () => {
            try {
                let actual_port;
                if (options.port === 'auto' || options.port === 0 || options.port === undefined) {
                    actual_port = await get_port_or_free(0, options.host || '127.0.0.1');
                } else {
                    actual_port = Number(options.port);
                }
                if (!Number.isFinite(actual_port)) {
                    throw new Error('Invalid port specified for serve_site');
                }
                server.port = actual_port;
                server.start(actual_port, (error) => {
                    if (error) return reject(error);
                    resolve(server);
                });
            } catch (error) {
                reject(error);
            }
        };
        startup();
    });
};

module.exports = serve_site;
module.exports.is_website_instance = is_website_instance;
module.exports.render_page_html = render_page_html;
module.exports.make_site_ctx = make_site_ctx;
module.exports.join_base_path = join_base_path;
