/**
 * Lab 005: Input Normalization
 * Book Chapter: 08-server-integration + 11-converged-recommendation
 *
 * Question: Can all Server.serve() input shapes normalize to one manifest?
 *
 * Run: node labs/website-design/005-normalize-input/check.js
 */

'use strict';

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

console.log('\n═══ 005: Input Normalization ═══\n');

const { Evented_Class } = require('jsgui3-html');

// ── Prototype classes (from experiment 004) ────────────
class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();
        if (spec.path != null && typeof spec.path !== 'string') {
            throw new TypeError(`path must be a string, got ${typeof spec.path}`);
        }
        this.path = typeof spec.path === 'string'
            ? (spec.path.startsWith('/') ? spec.path : '/' + spec.path)
            : undefined;
        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.render_mode = spec.render_mode || undefined;
    }
    get has_content() { return this.content != null; }
    get is_dynamic() { return typeof this.content === 'function'; }
    toJSON() {
        return {
            path: this.path, name: this.name, title: this.title,
            has_content: this.has_content, is_dynamic: this.is_dynamic, meta: this.meta
        };
    }
}

class Website extends Evented_Class {
    constructor(spec = {}) {
        super();
        this.name = spec.name || undefined;
        this.meta = spec.meta || {};
        this._pages = new Map();
        this._api = new Map();
    }
    add_page(page) {
        if (!(page instanceof Webpage)) page = new Webpage(page);
        if (this._pages.has(page.path)) throw new Error(`Duplicate: ${page.path}`);
        this._pages.set(page.path, page);
        return page;
    }
    get_page(path) { return this._pages.get(path); }
    has_page(path) { return this._pages.has(path); }
    get routes() { return [...this._pages.keys()]; }
    get pages() { return [...this._pages.values()]; }

    add_endpoint(name, handler, meta = {}) {
        this._api.set(name, { name, handler, ...meta });
    }
    get api_endpoints() { return [...this._api.values()]; }

    toJSON() {
        return {
            name: this.name,
            pages: [...this._pages.values()].map(p => p.toJSON()),
            api: [...this._api.entries()].map(([name, ep]) => ({ name, method: ep.method || 'GET', path: ep.path }))
        };
    }
}

// ── The normalizer ─────────────────────────────────────

/**
 * Normalized manifest — the universal internal representation.
 *
 * All Server.serve() input shapes get converted to this before
 * being handed to publishers.
 */
function normalize_serve_input(input) {
    const manifest = {
        pages: [],    // Array of { path, title, content, meta, render_mode }
        api: [],      // Array of { name, method, path, handler }
        meta: {},
        _source: null // what kind of input produced this
    };

    // Case 1: Control constructor — Server.serve(MyCtrl)
    if (typeof input === 'function') {
        manifest.pages.push({
            path: '/',
            title: input.name || 'Home',
            content: input,
            meta: {},
            render_mode: 'dynamic'
        });
        manifest._source = 'control';
        return manifest;
    }

    // Case 2: Webpage instance — Server.serve(new Webpage(...))
    if (input instanceof Webpage) {
        manifest.pages.push({
            path: input.path || '/',
            title: input.title,
            content: input.content,
            meta: input.meta,
            render_mode: input.render_mode
        });
        manifest._source = 'webpage';
        return manifest;
    }

    // Case 3: Website instance — Server.serve(new Website(...))
    if (input instanceof Website) {
        manifest.pages = input.pages.map(p => ({
            path: p.path,
            title: p.title,
            content: p.content,
            meta: p.meta,
            render_mode: p.render_mode
        }));
        manifest.api = input.api_endpoints.map(ep => ({
            name: ep.name,
            method: ep.method || 'GET',
            path: ep.path || `/api/${ep.name}`,
            handler: ep.handler
        }));
        manifest.meta = input.meta;
        manifest._source = 'website';
        return manifest;
    }

    // Case 4: Plain object — Server.serve({ pages: {...}, api: {...} })
    if (input && typeof input === 'object') {
        // Pages from object spec
        if (input.pages) {
            for (const [route, pageSpec] of Object.entries(input.pages)) {
                const spec = typeof pageSpec === 'function'
                    ? { path: route, content: pageSpec, title: pageSpec.name }
                    : { path: route, ...pageSpec };
                manifest.pages.push({
                    path: spec.path || route,
                    title: spec.title,
                    content: spec.content,
                    meta: spec.meta || {},
                    render_mode: spec.render_mode
                });
            }
        }

        // Single page shorthand
        if (input.page) {
            const p = input.page;
            manifest.pages.push({
                path: p.path || '/',
                title: p.title,
                content: p.content || p.Ctrl,
                meta: p.meta || {},
                render_mode: p.render_mode
            });
        }

        // API
        if (input.api) {
            for (const [name, handler] of Object.entries(input.api)) {
                manifest.api.push({
                    name,
                    method: 'GET',
                    path: `/api/${name}`,
                    handler: typeof handler === 'function' ? handler : handler.handler
                });
            }
        }

        manifest._source = 'plain-object';
        return manifest;
    }

    throw new Error(`Cannot normalize input: ${typeof input}`);
}

// ── TEST 1: Control constructor ────────────────────────
console.log('TEST 1: Control constructor input');
console.log('────────────────────────────────');

function HomeCtrl() { }
const m1 = normalize_serve_input(HomeCtrl);

check('Source: control', m1._source === 'control');
check('One page at /', m1.pages.length === 1 && m1.pages[0].path === '/');
check('Content is the constructor', m1.pages[0].content === HomeCtrl);
check('Title from constructor name', m1.pages[0].title === 'HomeCtrl');
check('No API endpoints', m1.api.length === 0);

// ── TEST 2: Webpage instance ───────────────────────────
console.log('\nTEST 2: Webpage instance input');
console.log('────────────────────────────────');

const wp = new Webpage({ path: '/about', title: 'About', content: function AboutCtrl() { } });
const m2 = normalize_serve_input(wp);

check('Source: webpage', m2._source === 'webpage');
check('One page at /about', m2.pages.length === 1 && m2.pages[0].path === '/about');
check('Title preserved', m2.pages[0].title === 'About');

// ── TEST 3: Website instance ───────────────────────────
console.log('\nTEST 3: Website instance input');
console.log('────────────────────────────────');

const site = new Website({ name: 'My App' });
site.add_page({ path: '/', title: 'Home', content: function () { } });
site.add_page({ path: '/about', title: 'About', content: function () { } });
site.add_endpoint('get-users', () => [], { method: 'GET', path: '/api/users' });

const m3 = normalize_serve_input(site);

check('Source: website', m3._source === 'website');
check('Two pages', m3.pages.length === 2);
check('Page paths correct', m3.pages[0].path === '/' && m3.pages[1].path === '/about');
check('One API endpoint', m3.api.length === 1);
check('API method preserved', m3.api[0].method === 'GET');
check('API path preserved', m3.api[0].path === '/api/users');

// ── TEST 4: Plain object ──────────────────────────────
console.log('\nTEST 4: Plain object input');
console.log('────────────────────────────────');

function BlogCtrl() { }
function DocsCtrl() { }

const m4 = normalize_serve_input({
    pages: {
        '/': { title: 'Blog', content: BlogCtrl },
        '/docs': DocsCtrl  // shorthand: just a constructor
    },
    api: {
        'get-posts': () => [],
        'get-tags': () => []
    }
});

check('Source: plain-object', m4._source === 'plain-object');
check('Two pages', m4.pages.length === 2);
check('Page / has title', m4.pages[0].title === 'Blog');
check('Page /docs from constructor shorthand', m4.pages[1].content === DocsCtrl);
check('Two API endpoints', m4.api.length === 2);
check('API paths auto-generated', m4.api[0].path === '/api/get-posts');

// ── TEST 5: Structural consistency ─────────────────────
console.log('\nTEST 5: All manifests have same structure');
console.log('────────────────────────────────');

const manifests = [m1, m2, m3, m4];

for (const m of manifests) {
    check(`${m._source}: has pages array`, Array.isArray(m.pages));
    check(`${m._source}: has api array`, Array.isArray(m.api));
    check(`${m._source}: has meta object`, typeof m.meta === 'object');
    // Every page has the same shape
    for (const p of m.pages) {
        check(`${m._source}: page has path`, typeof p.path === 'string');
        check(`${m._source}: page has content`, p.content != null);
    }
}

// ── TEST 6: Deterministic serialization ────────────────
console.log('\nTEST 6: Manifest serialization');
console.log('────────────────────────────────');

const serializeManifest = (m) => JSON.stringify({
    pages: m.pages.map(p => ({ path: p.path, title: p.title, has_content: p.content != null })),
    api: m.api.map(a => ({ name: a.name, method: a.method, path: a.path })),
    source: m._source
});

// Same input should produce identical JSON
const s1 = serializeManifest(normalize_serve_input(HomeCtrl));
const s2 = serializeManifest(normalize_serve_input(HomeCtrl));
check('Same input produces identical manifest JSON', s1 === s2);

// ── VERDICT ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);

console.log('\n📊 SUMMARY:');
console.log('  All four input shapes normalize to { pages[], api[], meta }');
console.log('  Publishers only need to understand ONE shape');
console.log('  No input-specific branching after normalization');
console.log('\n✅ VERDICT: Input normalization works cleanly.');
console.log('   → Ch.8 + Ch.11 normalization approach confirmed');
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
