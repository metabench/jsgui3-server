/**
 * Lab 003: Type Detection Strategies
 * Book Chapter: 08-server-integration
 *
 * Question: instanceof vs duck typing vs Symbol.for() — which is reliable?
 *
 * Run: node labs/website-design/003-type-detection/check.js
 */

'use strict';

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

console.log('\n═══ 003: Type Detection Strategies ═══\n');

// ── Setup: real Website/Webpage from node_modules ──────
const Website = require('jsgui3-website');
const Webpage = require('jsgui3-webpage');

const site = new Website({ name: 'Test Site' });
const page = new Webpage({ path: '/', title: 'Home' });

// ── STRATEGY A: instanceof ─────────────────────────────
console.log('TEST 1: instanceof detection');
console.log('────────────────────────────────');

check('site instanceof Website', site instanceof Website);
check('page instanceof Webpage', page instanceof Webpage);
check('plain object is NOT instanceof Website', !({} instanceof Website));

// Simulate cross-install: different constructor with same shape
function FakeWebsite(spec) { Object.assign(this, spec); }
FakeWebsite.prototype.toJSON = function () { return this; };
const fake = new FakeWebsite({ name: 'Fake', pages: new Map() });

check('FakeWebsite fails instanceof (correct rejection)', !(fake instanceof Website));

// Simulate a re-evaluation scenario (like loading same module from different path)
// This tests whether two copies of the same class share instanceof
const Website2 = Website; // same reference = same constructor
const site2 = new Website2({ name: 'Test 2' });
check('Same-reference require: instanceof works', site2 instanceof Website);

console.log('  ⚠️  Note: instanceof breaks if jsgui3-website is installed');
console.log('     in two different node_modules trees (npm link, workspaces)');

// ── STRATEGY B: Duck typing ────────────────────────────
console.log('\nTEST 2: Duck typing detection');
console.log('────────────────────────────────');

function isWebsite_duck(obj) {
    return obj != null
        && typeof obj === 'object'
        && typeof obj.name === 'string';
    // Current Website is too minimal for meaningful duck typing
    // With the proposed API: check for add_page, get_page, etc.
}

function isWebsite_duck_proposed(obj) {
    return obj != null
        && typeof obj === 'object'
        && typeof obj.add_page === 'function'
        && typeof obj.get_page === 'function'
        && typeof obj.toJSON === 'function';
}

function isWebpage_duck(obj) {
    return obj != null
        && typeof obj === 'object'
        && 'path' in obj
        && typeof obj.path === 'string';
}

check('Duck typing: site detected (current)', isWebsite_duck(site));
check('Duck typing: page detected', isWebpage_duck(page));

// False positive: plain object with a name
const plainObj = { name: 'Just an object' };
check('Duck typing (current): plain object FALSE POSITIVE', isWebsite_duck(plainObj));
console.log('  ⚠️  Current Website is too minimal — duck typing produces false positives');

// With proposed API (add_page, get_page), false positive is much harder
check('Duck typing (proposed): plain object correctly rejected',
    !isWebsite_duck_proposed(plainObj));

// With proposed API: FakeWebsite correctly rejected
check('Duck typing (proposed): FakeWebsite correctly rejected',
    !isWebsite_duck_proposed(fake));

// Simulate a correct duck-typed object (not instanceof but has the right shape)
const duckSite = {
    name: 'Duck Site',
    add_page(p) { this._pages = this._pages || new Map(); this._pages.set(p.path, p); },
    get_page(path) { return (this._pages || new Map()).get(path); },
    toJSON() { return { name: this.name }; }
};
check('Duck typing (proposed): shape-correct object accepted',
    isWebsite_duck_proposed(duckSite));

// ── STRATEGY C: Symbol.for() marker ───────────────────
console.log('\nTEST 3: Symbol.for() marker');
console.log('────────────────────────────────');

const WEBSITE_MARKER = Symbol.for('jsgui3.website');
const WEBPAGE_MARKER = Symbol.for('jsgui3.webpage');

// Simulate adding markers to prototypes
class MarkedWebsite {
    constructor(spec = {}) { Object.assign(this, spec); }
    get [WEBSITE_MARKER]() { return true; }
}

class MarkedWebpage {
    constructor(spec = {}) { Object.assign(this, spec); }
    get [WEBPAGE_MARKER]() { return true; }
}

function isWebsite_symbol(obj) {
    return obj != null && obj[Symbol.for('jsgui3.website')] === true;
}

function isWebpage_symbol(obj) {
    return obj != null && obj[Symbol.for('jsgui3.webpage')] === true;
}

const ms = new MarkedWebsite({ name: 'Marked' });
const mp = new MarkedWebpage({ path: '/' });

check('Symbol: MarkedWebsite detected', isWebsite_symbol(ms));
check('Symbol: MarkedWebpage detected', isWebpage_symbol(mp));
check('Symbol: plain object correctly rejected', !isWebsite_symbol({}));
check('Symbol: wrong type correctly rejected', !isWebsite_symbol(mp));

// Cross-realm: Symbol.for() is global, survives across different module loads
const markerFromOtherContext = Symbol.for('jsgui3.website');
check('Symbol.for() is globally unique', markerFromOtherContext === WEBSITE_MARKER);

// ── STRATEGY D: Combined (recommended) ────────────────
console.log('\nTEST 4: Combined detection (duck + optional symbol)');
console.log('────────────────────────────────');

function detectWebsite(obj) {
    if (obj == null || typeof obj !== 'object') return false;
    // Fast path: symbol marker
    if (obj[Symbol.for('jsgui3.website')] === true) return true;
    // Fallback: duck typing on proposed API
    return typeof obj.add_page === 'function'
        && typeof obj.get_page === 'function'
        && typeof obj.toJSON === 'function';
}

check('Combined: symbol-marked object detected', detectWebsite(ms));
check('Combined: duck-typed object detected', detectWebsite(duckSite));
check('Combined: plain object rejected', !detectWebsite({}));
check('Combined: null rejected', !detectWebsite(null));

// ── Benchmark ──────────────────────────────────────────
console.log('\nTEST 5: Detection speed comparison');
console.log('────────────────────────────────');

const ITERS = 1000000;
const target = ms; // has both symbol and duck interface

const t1 = process.hrtime.bigint();
for (let i = 0; i < ITERS; i++) target instanceof MarkedWebsite;
const t2 = process.hrtime.bigint();
for (let i = 0; i < ITERS; i++) isWebsite_symbol(target);
const t3 = process.hrtime.bigint();
for (let i = 0; i < ITERS; i++) detectWebsite(target);
const t4 = process.hrtime.bigint();

console.log(`  instanceof:  ${(Number(t2 - t1) / 1e6).toFixed(2)} ms (${ITERS} checks)`);
console.log(`  Symbol:      ${(Number(t3 - t2) / 1e6).toFixed(2)} ms`);
console.log(`  Combined:    ${(Number(t4 - t3) / 1e6).toFixed(2)} ms`);

// ── VERDICT ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);

console.log('\n📊 SUMMARY:');
console.log('  instanceof:  Fast, but breaks across npm link/workspaces');
console.log('  Duck typing: Works cross-install, but current Website too minimal');
console.log('  Symbol.for:  Cross-realm safe, no false positives, explicit');
console.log('  Combined:    Best reliability — symbol fast path + duck fallback');
console.log('\n✅ VERDICT: Use combined detection (symbol + duck typing).');
console.log('   → Ch.8 recommendation: capability checks with optional marker');
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
