const assert = require('assert');
const http = require('http');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Website = require('jsgui3-website');
const Webpage = require('jsgui3-webpage');
const Server = require('../server');
const serve_site = require('../serve-site');
const jsgui_server = require('../module');

const serve_site_client_entry_path = path.join(__dirname, 'fixtures', 'serve-site-client-entry.js');

const jsgui = require('jsgui3-html');
const { Control } = jsgui;

class Hero_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'hero_ctrl';
        super(spec);
        if (!spec.el) {
            this.add('Welcome Home');
        }
    }
}

Hero_Ctrl.css = `.hero-ctrl { color: rebeccapurple; }`;

class About_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'about_ctrl';
        super(spec);
        if (!spec.el) {
            this.add('About Us Page');
        }
    }
}

class Docs_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'docs_ctrl';
        super(spec);
        if (!spec.el) {
            this.add('Docs Index');
        }
    }
}

class Bound_Nav_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'bound_nav_ctrl';
        super(spec);
        if (!spec.el) {
            const items = Array.isArray(spec.items) ? spec.items : [];
            this.add(`Nav Items: ${items.map(item => item.label).join(', ')}`);
        }
    }
}

class Bound_Data_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'bound_data_ctrl';
        super(spec);
        if (!spec.el) {
            this.add(`Brand: ${spec.brand && spec.brand.name}`);
        }
    }
}

class Hidden_Ctrl extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'hidden_ctrl';
        super(spec);
        if (!spec.el) {
            this.add('Should Not Render');
        }
    }
}

const build_site = () => {
    const site = new Website({ name: 'Test Site' });
    site.api.get('status', () => ({ ok: true, source: 'website-api' }), {
        summary: 'Site status',
        tags: ['System'],
        returns: { ok: { type: 'boolean' } },
        operationId: 'getSiteStatus'
    });
    site.add_page(new Webpage({
        id: 'home',
        path: '/',
        title: 'Home',
        ctrl: Hero_Ctrl
    }));
    site.add_page(new Webpage({
        id: 'about',
        path: '/about',
        title: 'About',
        ctrl: About_Ctrl,
        aliases: ['/about-us'],
        redirect_from: ['/old-about']
    }));
    site.add_page(new Webpage({
        id: 'docs',
        path: '/docs',
        title: 'Docs',
        ctrl: Docs_Ctrl
    }));
    return site;
};

const build_base_path_site = () => {
    const site = new Website({ name: 'Mounted Test Site', base_path: '/app/' });
    site.api.get('status', () => ({ ok: true, mounted: true }));
    site.add_page(new Webpage({
        id: 'home',
        path: '/',
        title: 'Mounted Home',
        ctrl: Hero_Ctrl
    }));
    site.add_page(new Webpage({
        id: 'about',
        path: '/about',
        title: 'Mounted About',
        ctrl: About_Ctrl,
        aliases: ['/about-us'],
        redirect_from: ['/old-about']
    }));
    return site;
};

describe('Server.serve_site', function () {
    this.timeout(15000);

    describe('prepare_only mode', () => {
        it('exports serve_site on Server', () => {
            assert.strictEqual(typeof Server.serve_site, 'function');
        });

        it('exposes canonical Website/Webpage classes through server modules', () => {
            assert.strictEqual(Server.Website, Website);
            assert.strictEqual(Server.Webpage, Webpage);
            assert.strictEqual(jsgui_server.Website, Website);
            assert.strictEqual(jsgui_server.Webpage, Webpage);
            assert.strictEqual(require('../website/website'), Website);
            assert.strictEqual(require('../website/webpage'), Webpage);
        });

        it('finalizes the site and registers a route per resolved page', async () => {
            const site = build_site();
            const server = await serve_site(site, { prepare_only: true });
            const routes = server.site_routes;
            const page_routes = routes.filter(r => r.kind === 'page').map(r => r.path).sort();
            assert.deepStrictEqual(page_routes, ['/', '/about', '/docs']);
        });

        it('registers alias routes pointing at the canonical path', async () => {
            const site = build_site();
            const server = await serve_site(site, { prepare_only: true });
            const routes = server.site_routes;
            const aliases = routes.filter(r => r.kind === 'alias');
            assert.strictEqual(aliases.length, 1);
            assert.strictEqual(aliases[0].path, '/about-us');
            assert.strictEqual(aliases[0].canonical, '/about');
        });

        it('registers redirect routes for redirect_from entries', async () => {
            const site = build_site();
            const server = await serve_site(site, { prepare_only: true });
            const routes = server.site_routes;
            const redirects = routes.filter(r => r.kind === 'redirect');
            assert.strictEqual(redirects.length, 1);
            assert.strictEqual(redirects[0].path, '/old-about');
            assert.strictEqual(redirects[0].target, '/about');
        });

        it('exposes the resolved model and site on the server', async () => {
            const site = build_site();
            const server = await serve_site(site, { prepare_only: true });
            const model = server.site_model;
            assert.strictEqual(server.site, site);
            assert.strictEqual(server.site_model, model);
            assert.ok(model.pages.has('/'));
        });

        it('preserves Website API metadata when publishing endpoints', async () => {
            const site = build_site();
            const server = await serve_site(site, { prepare_only: true });
            const status_endpoint = server._api_registry.find(entry => entry.path === '/api/status');

            assert(status_endpoint);
            assert.strictEqual(status_endpoint.method, 'GET');
            assert.strictEqual(status_endpoint.meta.summary, 'Site status');
            assert.deepStrictEqual(status_endpoint.meta.tags, ['System']);
            assert.deepStrictEqual(status_endpoint.meta.returns, { ok: { type: 'boolean' } });
            assert.strictEqual(status_endpoint.meta.operationId, 'getSiteStatus');
        });

        it('renders resolved page meta and head entries', async () => {
            const site = new Website({
                name: 'Head Test Site',
                defaults: {
                    meta: {
                        description: 'Head description'
                    }
                },
                head: {
                    links: [{ rel: 'preload', href: '/head.js', as: 'script' }],
                    styles: ['body { color: #123456; }'],
                    scripts: [{ src: '/head.js', defer: true }]
                },
                pages: {
                    '/': {
                        id: 'head_home',
                        title: 'Head Home',
                        ctrl: Hero_Ctrl,
                        head: {
                            meta: [{ property: 'og:title', content: 'Head Home' }],
                            links: [{ rel: 'canonical', href: '/' }]
                        }
                    }
                }
            });
            const server = await serve_site(site, { prepare_only: true });
            const page = server.site_model.get_page('/');
            const html = serve_site.render_page_html(page, server.site_model);

            assert(html.includes('name="description"'));
            assert(html.includes('content="Head description"'));
            assert(html.includes('property="og:title"'));
            assert(html.includes('rel="canonical"'));
            assert(html.includes('href="/"'));
            assert(html.includes('body { color: #123456; }'));
            assert(html.includes('src="/head.js"'));
            assert(html.includes('defer="defer"'));
        });

        it('automatically includes site assets, page assets, and control CSS', async () => {
            const site = new Website({
                name: 'Asset Test Site',
                assets: {
                    css: [
                        '/site.css',
                        { content: '.site-inline { color: #456789; }' }
                    ],
                    js: [
                        '/site.js',
                        { src: '/site-module.js', type: 'module' }
                    ]
                },
                pages: {
                    '/': {
                        id: 'asset_home',
                        title: 'Asset Home',
                        ctrl: Hero_Ctrl,
                        stylesheets: ['/page.css'],
                        scripts: ['/page.js']
                    }
                }
            });
            const server = await serve_site(site, { prepare_only: true });
            const page = server.site_model.get_page('/');
            const html = serve_site.render_page_html(page, server.site_model);

            assert(html.includes('href="/site.css"'));
            assert(html.includes('.site-inline { color: #456789; }'));
            assert(html.includes('href="/page.css"'));
            assert(html.includes('src="/page.js"'));
            assert(html.includes('src="/site.js"'));
            assert(html.includes('src="/site-module.js"'));
            assert(html.includes('type="module"'));
            assert(html.includes('data-jsgui-auto-css="controls"'));
            assert(html.includes('.hero-ctrl { color: rebeccapurple; }'));
        });

        it('passes request render context to function slots', async () => {
            const site = new Website({
                layouts: {
                    default: { slots: ['main'] }
                },
                pages: {
                    '/request': {
                        id: 'request_page',
                        title: 'Request Page',
                        ctrl: Hero_Ctrl,
                        slots: {
                            main: ({ request, site_ctx }) => `request:${request.url}:${site_ctx.page.id}`
                        }
                    }
                }
            });
            const server = await serve_site(site, { prepare_only: true });
            const page = server.site_model.get_page('/request');
            const html = serve_site.render_page_html(page, server.site_model, {
                req: { url: '/request?debug=1' }
            });

            assert(html.includes('request:'));
            assert(html.includes('debug=1:request_page'));
        });

        it('resolves region and inline slot bindings from the site context', async () => {
            const site = new Website({
                data: {
                    brand: { name: 'Acme' }
                },
                navigation: {
                    primary: [
                        { label: 'Home', path: '/' },
                        { label: 'About', path: '/about' }
                    ]
                },
                regions: {
                    primary_nav: {
                        ctrl: Bound_Nav_Ctrl,
                        bind: { items: 'navigation.primary' }
                    },
                    hidden: {
                        ctrl: Hidden_Ctrl,
                        render_when: false
                    }
                },
                layouts: {
                    default: {
                        slots: ['nav', 'brand', 'hidden', 'main'],
                        defaults: {
                            nav: 'primary_nav',
                            hidden: 'hidden',
                            brand: {
                                ctrl: Bound_Data_Ctrl,
                                bind: { brand: 'data.brand' }
                            }
                        }
                    }
                },
                pages: {
                    '/': { id: 'home', title: 'Home', ctrl: Hero_Ctrl },
                    '/about': { id: 'about', title: 'About', ctrl: About_Ctrl }
                }
            });

            const server = await serve_site(site, { prepare_only: true });
            const page = server.site_model.get_page('/');
            const html = serve_site.render_page_html(page, server.site_model);

            assert(html.includes('Nav Items: Home, About'));
            assert(html.includes('Brand: Acme'));
            assert(!html.includes('Should Not Render'));
        });

        it('rejects non-Website inputs', async () => {
            await assert.rejects(
                () => serve_site({ not: 'a website' }, { prepare_only: true }),
                /Website instance/
            );
        });
    });

    describe('full HTTP serving', () => {
        let server;

        before(async () => {
            const site = build_site();
            server = await serve_site(site, { port: 'auto' });
        });

        after(async () => {
            if (server && typeof server.stop === 'function') {
                await new Promise((resolve) => {
                    try { server.stop(() => resolve()); } catch (_) { resolve(); }
                });
            }
        });

        const fetch_path = (path) => new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: server.port,
                path,
                method: 'GET'
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
            });
            req.on('error', reject);
            req.end();
        });

        it('serves the home page with rendered HTML body', async () => {
            const { status, body } = await fetch_path('/');
            assert.strictEqual(status, 200);
            assert.ok(body.includes('Welcome Home'), `body should include hero text, got: ${body.slice(0, 200)}`);
            assert.ok(body.includes('<title>Home</title>') || body.includes('Home'), 'title should appear');
            assert.strictEqual((body.match(/<title\b/g) || []).length, 1);
        });

        it('serves the about page', async () => {
            const { status, body } = await fetch_path('/about');
            assert.strictEqual(status, 200);
            assert.ok(body.includes('About Us Page'));
        });

        it('serves alias path with same canonical content', async () => {
            const { status, body } = await fetch_path('/about-us');
            assert.strictEqual(status, 200);
            assert.ok(body.includes('About Us Page'));
        });

        it('returns 301 with Location header for redirect_from path', async () => {
            const { status, headers } = await fetch_path('/old-about');
            assert.strictEqual(status, 301);
            assert.strictEqual(headers.location, '/about');
        });

        it('serves Website API endpoints through server.publish', async () => {
            const { status, body } = await fetch_path('/api/status');
            assert.strictEqual(status, 200);
            assert.deepStrictEqual(JSON.parse(body), { ok: true, source: 'website-api' });
        });
    });

    describe('base_path HTTP serving', () => {
        let server;

        before(async () => {
            server = await serve_site(build_base_path_site(), { port: 'auto' });
        });

        after(async () => {
            if (server && typeof server.stop === 'function') {
                await new Promise((resolve) => {
                    try { server.stop(() => resolve()); } catch (_) { resolve(); }
                });
            }
        });

        const fetch_path = (path) => new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: server.port,
                path,
                method: 'GET'
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
            });
            req.on('error', reject);
            req.end();
        });

        it('serves mounted page, alias, redirect, and API routes', async () => {
            const home = await fetch_path('/app');
            assert.strictEqual(home.status, 200);
            assert.ok(home.body.includes('Welcome Home'));

            const alias = await fetch_path('/app/about-us');
            assert.strictEqual(alias.status, 200);
            assert.ok(alias.body.includes('About Us Page'));

            const redirect = await fetch_path('/app/old-about');
            assert.strictEqual(redirect.status, 301);
            assert.strictEqual(redirect.headers.location, '/app/about');

            const api = await fetch_path('/app/api/status');
            assert.strictEqual(api.status, 200);
            assert.deepStrictEqual(JSON.parse(api.body), { ok: true, mounted: true });
        });

        it('serves generated page client_js assets under the mounted base path', async () => {
            const client_site = new Website({ name: 'Mounted Client Site', base_path: '/app/' });
            client_site.add_page(new Webpage({
                id: 'home',
                path: '/',
                title: 'Mounted Client Home',
                ctrl: Hero_Ctrl,
                client_js: serve_site_client_entry_path
            }));

            const client_server = await serve_site(client_site, { port: 'auto' });
            const fetch_client_path = (request_path) => new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: '127.0.0.1',
                    port: client_server.port,
                    path: request_path,
                    method: 'GET'
                }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => { body += chunk; });
                    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
                });
                req.on('error', reject);
                req.end();
            });

            try {
                const home = await fetch_client_path('/app');
                assert.strictEqual(home.status, 200);
                assert.ok(home.body.includes('/app/js/home.js'), `Expected mounted JS route in HTML: ${home.body}`);

                const js = await fetch_client_path('/app/js/home.js');
                assert.strictEqual(js.status, 200);
                assert.ok(js.body.includes('__serve_site_client_entry_loaded'));
                assert.ok((js.headers['content-type'] || '').includes('application/javascript'));
            } finally {
                if (client_server && typeof client_server.stop === 'function') {
                    await new Promise((resolve) => {
                        try { client_server.stop(() => resolve()); } catch (_) { resolve(); }
                    });
                }
            }
        });
    });

    describe('Server.serve integration', () => {
        it('dispatches Website instances to serve_site', async () => {
            const server = await Server.serve(build_site(), { port: 'auto' });
            try {
                const response = await new Promise((resolve, reject) => {
                    const req = http.request({
                        hostname: '127.0.0.1',
                        port: server.port,
                        path: '/docs',
                        method: 'GET'
                    }, (res) => {
                        let body = '';
                        res.on('data', (chunk) => { body += chunk; });
                        res.on('end', () => resolve({ status: res.statusCode, body }));
                    });
                    req.on('error', reject);
                    req.end();
                });

                assert.strictEqual(response.status, 200);
                assert.ok(response.body.includes('Docs Index'));
                assert.strictEqual(server.site_model.pages.size, 3);
            } finally {
                if (server && typeof server.stop === 'function') {
                    await new Promise((resolve) => {
                        try { server.stop(() => resolve()); } catch (_) { resolve(); }
                    });
                }
            }
        });
    });
});
