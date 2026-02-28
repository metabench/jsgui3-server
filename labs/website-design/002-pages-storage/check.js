/**
 * Lab 002: Pages Storage Comparison
 * Book Chapter: 06-pages-storage
 *
 * Question: Array vs Map vs Array+Index — which is best for page storage?
 *
 * Run: node labs/website-design/002-pages-storage/check.js
 */

'use strict';

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

// ── Simulated page objects ─────────────────────────────
function makePage(path, name) {
    return { path, name, title: name, content: function () { }, meta: {} };
}

const samplePages = [
    makePage('/', 'Home'),
    makePage('/about', 'About'),
    makePage('/contact', 'Contact'),
    makePage('/blog', 'Blog'),
    makePage('/blog/post-1', 'Post 1'),
    makePage('/docs', 'Documentation'),
    makePage('/docs/api', 'API Reference'),
    makePage('/pricing', 'Pricing'),
    makePage('/login', 'Login'),
    makePage('/signup', 'Sign Up'),
];

console.log('\n═══ 002: Pages Storage Comparison ═══\n');

// ── APPROACH A: Plain Array ────────────────────────────
class ArrayStore {
    constructor() { this._pages = []; }
    add(page) { this._pages.push(page); }
    get(path) { return this._pages.find(p => p.path === path); }
    has(path) { return this._pages.some(p => p.path === path); }
    remove(path) {
        const idx = this._pages.findIndex(p => p.path === path);
        if (idx >= 0) this._pages.splice(idx, 1);
    }
    get routes() { return this._pages.map(p => p.path); }
    get size() { return this._pages.length; }
    [Symbol.iterator]() { return this._pages[Symbol.iterator](); }
    toJSON() { return this._pages.map(p => ({ path: p.path, name: p.name })); }
}

// ── APPROACH B: Map ────────────────────────────────────
class MapStore {
    constructor() { this._pages = new Map(); }
    add(page) {
        if (this._pages.has(page.path)) {
            throw new Error(`Duplicate page path: ${page.path}`);
        }
        this._pages.set(page.path, page);
    }
    get(path) { return this._pages.get(path); }
    has(path) { return this._pages.has(path); }
    remove(path) { this._pages.delete(path); }
    get routes() { return [...this._pages.keys()]; }
    get size() { return this._pages.size; }
    [Symbol.iterator]() { return this._pages.values(); }
    toJSON() { return [...this._pages.values()].map(p => ({ path: p.path, name: p.name })); }
}

// ── APPROACH C: Array + Index ──────────────────────────
class IndexedArrayStore {
    constructor() { this._pages = []; this._index = {}; }
    add(page) {
        if (this._index[page.path] !== undefined) {
            throw new Error(`Duplicate page path: ${page.path}`);
        }
        this._index[page.path] = this._pages.length;
        this._pages.push(page);
    }
    get(path) {
        const idx = this._index[path];
        return idx !== undefined ? this._pages[idx] : undefined;
    }
    has(path) { return this._index[path] !== undefined; }
    remove(path) {
        const idx = this._index[path];
        if (idx !== undefined) {
            this._pages.splice(idx, 1);
            delete this._index[path];
            // Rebuild index after splice
            for (let i = idx; i < this._pages.length; i++) {
                this._index[this._pages[i].path] = i;
            }
        }
    }
    get routes() { return this._pages.map(p => p.path); }
    get size() { return this._pages.length; }
    [Symbol.iterator]() { return this._pages[Symbol.iterator](); }
    toJSON() { return this._pages.map(p => ({ path: p.path, name: p.name })); }
}

const stores = {
    'Array': () => new ArrayStore(),
    'Map': () => new MapStore(),
    'Array+Index': () => new IndexedArrayStore(),
};

// ── TEST 1: Basic operations ───────────────────────────
console.log('TEST 1: Basic operations');
console.log('────────────────────────────────');

for (const [name, factory] of Object.entries(stores)) {
    const store = factory();
    samplePages.forEach(p => store.add(p));

    check(`${name}: add 10 pages → size is 10`, store.size === 10);
    check(`${name}: get('/about') works`, store.get('/about')?.name === 'About');
    check(`${name}: has('/contact') is true`, store.has('/contact') === true);
    check(`${name}: has('/missing') is false`, store.has('/missing') === false);

    store.remove('/blog');
    check(`${name}: remove('/blog') → size is 9`, store.size === 9);
    check(`${name}: get('/blog') is undefined after remove`, store.get('/blog') === undefined);
}

// ── TEST 2: Duplicate detection ────────────────────────
console.log('\nTEST 2: Duplicate detection');
console.log('────────────────────────────────');

// Array allows duplicates (silent bug)
const arrStore = new ArrayStore();
arrStore.add(makePage('/dup', 'First'));
arrStore.add(makePage('/dup', 'Second'));
check('Array: allows duplicates (silent bug)', arrStore.size === 2);

// Map catches duplicates
const mapStore = new MapStore();
mapStore.add(makePage('/dup', 'First'));
let mapThrew = false;
try { mapStore.add(makePage('/dup', 'Second')); } catch (e) { mapThrew = true; }
check('Map: throws on duplicate', mapThrew === true);
check('Map: only first page stored', mapStore.size === 1);

// Array+Index catches duplicates
const idxStore = new IndexedArrayStore();
idxStore.add(makePage('/dup', 'First'));
let idxThrew = false;
try { idxStore.add(makePage('/dup', 'Second')); } catch (e) { idxThrew = true; }
check('Array+Index: throws on duplicate', idxThrew === true);

// ── TEST 3: Insertion order ────────────────────────────
console.log('\nTEST 3: Iteration preserves insertion order');
console.log('────────────────────────────────');

for (const [name, factory] of Object.entries(stores)) {
    const store = factory();
    const ordered = ['/z-last', '/a-first', '/m-middle'];
    ordered.forEach(p => store.add(makePage(p, p)));

    const iterated = [...store].map(p => p.path);
    const orderPreserved = iterated[0] === '/z-last' && iterated[1] === '/a-first' && iterated[2] === '/m-middle';
    check(`${name}: insertion order preserved`, orderPreserved);
}

// ── TEST 4: Lookup benchmark ───────────────────────────
console.log('\nTEST 4: Lookup benchmark');
console.log('────────────────────────────────');

const bigN = 1000;
const bigPages = [];
for (let i = 0; i < bigN; i++) bigPages.push(makePage(`/page-${i}`, `Page ${i}`));

const lookupTarget = `/page-${bigN - 1}`; // worst case for array
const ITERS = 100000;

for (const [name, factory] of Object.entries(stores)) {
    const store = factory();
    bigPages.forEach(p => store.add(p));

    const start = process.hrtime.bigint();
    for (let i = 0; i < ITERS; i++) store.get(lookupTarget);
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

    console.log(`  ${name}: ${ITERS} lookups in ${bigN} pages → ${elapsed.toFixed(2)} ms`);
}

// Map should be fastest for large N
const mapBench = stores['Map']();
const arrBench = stores['Array']();
bigPages.forEach(p => { mapBench.add(p); arrBench.add(p); });

const mapStart = process.hrtime.bigint();
for (let i = 0; i < ITERS; i++) mapBench.get(lookupTarget);
const mapElapsed = Number(process.hrtime.bigint() - mapStart) / 1e6;

const arrStart = process.hrtime.bigint();
for (let i = 0; i < ITERS; i++) arrBench.get(lookupTarget);
const arrElapsed = Number(process.hrtime.bigint() - arrStart) / 1e6;

check('Map lookup faster than Array.find() at 1000 pages', mapElapsed < arrElapsed);
console.log(`  Map: ${mapElapsed.toFixed(2)} ms vs Array: ${arrElapsed.toFixed(2)} ms (${(arrElapsed / mapElapsed).toFixed(1)}x faster)`);

// ── TEST 5: toJSON output ──────────────────────────────
console.log('\nTEST 5: toJSON output');
console.log('────────────────────────────────');

for (const [name, factory] of Object.entries(stores)) {
    const store = factory();
    samplePages.slice(0, 3).forEach(p => store.add(p));
    const json = store.toJSON();

    check(`${name}: toJSON returns array`, Array.isArray(json));
    check(`${name}: toJSON entries have path+name`, json[0].path === '/' && json[0].name === 'Home');
}

// ── TEST 6: Replace page ───────────────────────────────
console.log('\nTEST 6: Replace page (remove + add)');
console.log('────────────────────────────────');

for (const [name, factory] of Object.entries(stores)) {
    const store = factory();
    store.add(makePage('/about', 'About v1'));
    store.remove('/about');
    store.add(makePage('/about', 'About v2'));

    check(`${name}: replace works`, store.get('/about')?.name === 'About v2');
    check(`${name}: size stays 1`, store.size === 1);
}

// ── VERDICT ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);

console.log('\n📊 SUMMARY:');
console.log('  Array:       Simple but no duplicate detection, O(n) lookup');
console.log('  Map:         O(1) lookup, duplicate detection, insertion order ✓');
console.log('  Array+Index: O(1) lookup, duplicate detection, but remove is O(n) to reindex');
console.log('\n✅ VERDICT: Map is the best balance of performance and API cleanliness.');
console.log('   → Ch.6 recommendation confirmed');
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
