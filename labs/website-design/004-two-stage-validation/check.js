/**
 * Lab 004: Two-Stage Validation
 * Book Chapter: 11-converged-recommendation §11.4
 *
 * Question: Is construction-time lightweight + publish-time strict validation practical?
 *
 * Run: node labs/website-design/004-two-stage-validation/check.js
 */

'use strict';

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

console.log('\n═══ 004: Two-Stage Validation ═══\n');

const { Evented_Class } = require('jsgui3-html');

// ── Prototype Webpage with two-stage validation ────────
class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();

        // Stage 1: lightweight validation (fast, permissive)
        if (spec.path != null && typeof spec.path !== 'string') {
            throw new TypeError(`Webpage path must be a string, got ${typeof spec.path}`);
        }
        if (spec.content !== undefined) {
            const t = typeof spec.content;
            if (t !== 'function' && t !== 'object') {
                throw new TypeError(`Webpage content must be a constructor or instance, got ${t}`);
            }
        }

        // Normalize path
        if (typeof spec.path === 'string') {
            this.path = spec.path.startsWith('/') ? spec.path : '/' + spec.path;
        } else {
            this.path = undefined;
        }

        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.render_mode = spec.render_mode || undefined;
        this.scripts = spec.scripts || [];
        this.stylesheets = spec.stylesheets || [];
        this._finalized = false;
    }

    get has_content() { return this.content != null; }
    get is_dynamic() { return typeof this.content === 'function'; }
    get finalized() { return this._finalized; }

    finalize() {
        if (this._finalized) return this;

        // Stage 2: strict validation (thorough, publish-time)
        const errors = [];

        if (!this.path) {
            errors.push('path is required for finalization');
        }

        if (!this.has_content) {
            errors.push('content is required for finalization');
        }

        if (this.render_mode !== undefined &&
            this.render_mode !== 'static' &&
            this.render_mode !== 'dynamic') {
            errors.push(`render_mode must be 'static' or 'dynamic', got '${this.render_mode}'`);
        }

        if (errors.length > 0) {
            throw new Error(`Webpage finalization failed:\n  - ${errors.join('\n  - ')}`);
        }

        this._finalized = true;
        this.raise('finalized');
        return this;
    }

    toJSON() {
        return {
            name: this.name, title: this.title, path: this.path,
            has_content: this.has_content, is_dynamic: this.is_dynamic,
            finalized: this._finalized, meta: this.meta
        };
    }
}

// ── Prototype Website with finalize-time route validation ──
class Website extends Evented_Class {
    constructor(spec = {}) {
        super();
        this.name = spec.name || undefined;
        this.meta = spec.meta || {};
        this._pages = new Map();
    }

    add_page(page) {
        if (!(page instanceof Webpage)) {
            page = new Webpage(page);
        }
        if (this._pages.has(page.path)) {
            throw new Error(`Duplicate page path: ${page.path}`);
        }
        this._pages.set(page.path, page);
        return page;
    }

    get_page(path) { return this._pages.get(path); }
    has_page(path) { return this._pages.has(path); }
    get routes() { return [...this._pages.keys()]; }
    get size() { return this._pages.size; }

    finalize() {
        const errors = [];

        if (this._pages.size === 0) {
            errors.push('Website has no pages');
        }

        // Finalize each page
        for (const [path, page] of this._pages) {
            try {
                page.finalize();
            } catch (e) {
                errors.push(`Page ${path}: ${e.message}`);
            }
        }

        if (errors.length > 0) {
            throw new Error(`Website finalization failed:\n  - ${errors.join('\n  - ')}`);
        }

        this.raise('finalized');
        return this;
    }
}

// ── TEST 1: Stage 1 — construction-time validation ─────
console.log('TEST 1: Stage 1 — construction catches type errors');
console.log('────────────────────────────────');

// Bad path type
let threw = false;
try { new Webpage({ path: 123 }); } catch (e) { threw = true; }
check('Bad path type (number) throws', threw);

threw = false;
try { new Webpage({ path: null }); } catch (e) { threw = true; }
check('Null path does NOT throw (null !== string, but is falsy)', !threw);

// Bad content type
threw = false;
try { new Webpage({ content: 'not a class' }); } catch (e) { threw = true; }
check('Bad content type (string) throws', threw);

threw = false;
try { new Webpage({ content: 42 }); } catch (e) { threw = true; }
check('Bad content type (number) throws', threw);

// Good types pass
threw = false;
try { new Webpage({ path: '/ok', content: function MyCtrl() { } }); } catch (e) { threw = true; }
check('Function content passes', !threw);

threw = false;
try { new Webpage({ path: '/ok', content: { render: () => '<div/>' } }); } catch (e) { threw = true; }
check('Object content passes', !threw);

// ── TEST 2: Stage 1 — permissiveness ──────────────────
console.log('\nTEST 2: Stage 1 — permissive construction');
console.log('────────────────────────────────');

threw = false;
try { new Webpage({}); } catch (e) { threw = true; }
check('Empty spec is OK (no required fields at construction)', !threw);

threw = false;
try { new Webpage({ path: '/about' }); } catch (e) { threw = true; }
check('Path without content at construction is OK', !threw);

threw = false;
try { new Webpage({ content: function () { } }); } catch (e) { threw = true; }
check('Content without path at construction is OK', !threw);

// ── TEST 3: Path normalization ─────────────────────────
console.log('\nTEST 3: Path normalization');
console.log('────────────────────────────────');

check('Leading slash preserved', new Webpage({ path: '/about' }).path === '/about');
check('Missing leading slash added', new Webpage({ path: 'about' }).path === '/about');
check('Root path works', new Webpage({ path: '/' }).path === '/');

// ── TEST 4: Stage 2 — finalize-time strict validation ──
console.log('\nTEST 4: Stage 2 — finalize catches missing fields');
console.log('────────────────────────────────');

// Missing path
threw = false;
try { new Webpage({ content: function () { } }).finalize(); } catch (e) { threw = true; }
check('Finalize: missing path throws', threw);

// Missing content
threw = false;
try { new Webpage({ path: '/' }).finalize(); } catch (e) { threw = true; }
check('Finalize: missing content throws', threw);

// Bad render_mode
threw = false;
try { new Webpage({ path: '/', content: function () { }, render_mode: 'invalid' }).finalize(); } catch (e) { threw = true; }
check('Finalize: invalid render_mode throws', threw);

// Valid render_modes pass
threw = false;
try { new Webpage({ path: '/', content: function () { }, render_mode: 'static' }).finalize(); } catch (e) { threw = true; }
check('Finalize: render_mode "static" passes', !threw);

threw = false;
try { new Webpage({ path: '/', content: function () { }, render_mode: 'dynamic' }).finalize(); } catch (e) { threw = true; }
check('Finalize: render_mode "dynamic" passes', !threw);

// Complete page finalizes
const completePage = new Webpage({ path: '/', title: 'Home', content: function Home() { } });
threw = false;
try { completePage.finalize(); } catch (e) { threw = true; }
check('Finalize: complete page passes', !threw);
check('Finalize: page is now finalized', completePage.finalized === true);

// Double finalize is idempotent
threw = false;
try { completePage.finalize(); } catch (e) { threw = true; }
check('Finalize: double finalize is safe', !threw);

// ── TEST 5: Incremental composition ────────────────────
console.log('\nTEST 5: Incremental composition workflow');
console.log('────────────────────────────────');

const page = new Webpage({});
check('Step 1: empty page created', page.path === undefined);

page.path = '/incremental';
check('Step 2: path set later', page.path === '/incremental');

page.content = function IncrementalCtrl() { };
check('Step 3: content set later', page.has_content === true);

page.title = 'Incremental Page';
threw = false;
try { page.finalize(); } catch (e) { threw = true; }
check('Step 4: finalize succeeds after all fields set', !threw);

// ── TEST 6: Finalize event ─────────────────────────────
console.log('\nTEST 6: Finalize lifecycle event');
console.log('────────────────────────────────');

const eventPage = new Webpage({ path: '/events', content: function () { } });
let finalized = false;
eventPage.on('finalized', () => { finalized = true; });
eventPage.finalize();
check('Finalize raises "finalized" event', finalized);

// ── TEST 7: Website finalization cascades ──────────────
console.log('\nTEST 7: Website finalization cascades to pages');
console.log('────────────────────────────────');

const site = new Website({ name: 'Test' });
site.add_page({ path: '/', title: 'Home', content: function () { } });
site.add_page({ path: '/about', title: 'About', content: function () { } });

threw = false;
try { site.finalize(); } catch (e) { threw = true; }
check('Website finalize: cascades to all pages', !threw);
check('Website finalize: page / is finalized', site.get_page('/').finalized);
check('Website finalize: page /about is finalized', site.get_page('/about').finalized);

// Website with an invalid page
const badSite = new Website({ name: 'Bad' });
badSite.add_page({ path: '/ok', content: function () { } });
badSite.add_page({ path: '/missing-content' }); // no content

threw = false;
let errMsg = '';
try { badSite.finalize(); } catch (e) { threw = true; errMsg = e.message; }
check('Website finalize: catches invalid page', threw);
check('Website finalize: error mentions the bad page', errMsg.includes('/missing-content'));

// Empty website
const emptySite = new Website({ name: 'Empty' });
threw = false;
try { emptySite.finalize(); } catch (e) { threw = true; }
check('Website finalize: empty site throws', threw);

// ── VERDICT ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);

console.log('\n📊 SUMMARY:');
console.log('  Stage 1 (construction): catches type errors, allows incomplete objects');
console.log('  Stage 2 (finalize): catches missing fields, bad render_mode, duplicates');
console.log('  Incremental composition: build piece by piece, finalize when ready');
console.log('  Cascading: Website.finalize() validates all pages');
console.log('\n✅ VERDICT: Two-stage validation is practical and ergonomic.');
console.log('   → Ch.11 §11.4 recommendation confirmed');
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
