/**
 * Lab 001: Base Class Overhead
 * Book Chapter: 03-base-class
 *
 * Question: Does Evented_Class add meaningful overhead vs. a plain class?
 *
 * Run: node labs/website-design/001-base-class-overhead/check.js
 */

'use strict';

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else    { console.log(`  ❌ ${label}`); fail++; }
}

// ── Option A: Plain class ──────────────────────────────
class Plain_Webpage {
    constructor(spec = {}) {
        this.name = spec.name;
        this.title = spec.title;
        this.path = spec.path;
        this.content = spec.content;
        this.meta = spec.meta || {};
    }
    toJSON() {
        return { name: this.name, title: this.title, path: this.path, meta: this.meta };
    }
}

// ── Option B: Evented_Class ────────────────────────────
const { Evented_Class } = require('jsgui3-html');

class Evented_Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();
        this.name = spec.name;
        this.title = spec.title;
        this.path = spec.path;
        this.content = spec.content;
        this.meta = spec.meta || {};
    }
    toJSON() {
        return { name: this.name, title: this.title, path: this.path, meta: this.meta };
    }
}

const N = 10000;

// ── TEST 1: Construction time ──────────────────────────
console.log('\n═══ 001: Base Class Overhead ═══\n');
console.log('TEST 1: Construction time (' + N + ' instances)');
console.log('────────────────────────────────');

const spec = { name: 'Home', title: 'Home Page', path: '/', meta: { description: 'test' } };

// warmup
for (let i = 0; i < 100; i++) { new Plain_Webpage(spec); new Evented_Webpage(spec); }

const t1 = process.hrtime.bigint();
for (let i = 0; i < N; i++) new Plain_Webpage(spec);
const t2 = process.hrtime.bigint();
for (let i = 0; i < N; i++) new Evented_Webpage(spec);
const t3 = process.hrtime.bigint();

const plainMs  = Number(t2 - t1) / 1e6;
const eventMs  = Number(t3 - t2) / 1e6;
const ratio = eventMs / plainMs;

console.log(`  Plain class:    ${plainMs.toFixed(2)} ms`);
console.log(`  Evented_Class:  ${eventMs.toFixed(2)} ms`);
console.log(`  Ratio:          ${ratio.toFixed(1)}x`);

// Even 10x is fine if absolute time is <50ms for 10k objects
check('Evented_Class < 50ms for 10k constructions', eventMs < 50);
check('Ratio < 20x (acceptable overhead)', ratio < 20);

// ── TEST 2: Memory per instance ────────────────────────
console.log('\nTEST 2: Memory per instance');
console.log('────────────────────────────────');

global.gc && global.gc();
const mem0 = process.memoryUsage().heapUsed;
const plainArr = [];
for (let i = 0; i < N; i++) plainArr.push(new Plain_Webpage(spec));
const mem1 = process.memoryUsage().heapUsed;
const eventArr = [];
for (let i = 0; i < N; i++) eventArr.push(new Evented_Webpage(spec));
const mem2 = process.memoryUsage().heapUsed;

const plainBytes  = (mem1 - mem0) / N;
const eventBytes  = (mem2 - mem1) / N;

console.log(`  Plain class:    ~${Math.round(plainBytes)} bytes/instance`);
console.log(`  Evented_Class:  ~${Math.round(eventBytes)} bytes/instance`);
console.log(`  Delta:          ~${Math.round(eventBytes - plainBytes)} bytes extra`);

// For page objects (dozens, not millions), even 1KB extra is fine
check('Evented_Class < 1KB per instance', eventBytes < 1024);
check('Delta < 500 bytes extra per instance', (eventBytes - plainBytes) < 500);

// Keep references alive to prevent GC
plainArr.length; eventArr.length;

// ── TEST 3: Event capability ───────────────────────────
console.log('\nTEST 3: Event capability (what you gain)');
console.log('────────────────────────────────');

const ew = new Evented_Webpage({ path: '/test' });
let eventCount = 0;

ew.on('finalized', () => eventCount++);
ew.raise('finalized');

check('Events fire correctly', eventCount === 1);

// Can we add lifecycle events?
let lifecycleLog = [];
ew.on('property-changed', (e) => lifecycleLog.push(e));
ew.raise('property-changed', { name: 'title', old: 'Old', value: 'New' });

check('Custom events carry data', lifecycleLog.length === 1 && lifecycleLog[0].name === 'title');

// Plain class can't do this without adding an EventEmitter
const pw = new Plain_Webpage({ path: '/test' });
check('Plain class has no .on()', typeof pw.on === 'undefined');
check('Plain class has no .raise()', typeof pw.raise === 'undefined');

// ── TEST 4: toJSON parity ──────────────────────────────
console.log('\nTEST 4: toJSON parity');
console.log('────────────────────────────────');

const pj = new Plain_Webpage(spec).toJSON();
const ej = new Evented_Webpage(spec).toJSON();

check('toJSON output is identical', JSON.stringify(pj) === JSON.stringify(ej));

// Does Evented_Class add hidden enumerable properties that leak into serialization?
const eKeys = Object.keys(new Evented_Webpage(spec));
const pKeys = Object.keys(new Plain_Webpage(spec));
const extraKeys = eKeys.filter(k => !pKeys.includes(k));
console.log(`  Plain keys:    [${pKeys.join(', ')}]`);
console.log(`  Evented keys:  [${eKeys.join(', ')}]`);
console.log(`  Extra keys:    [${extraKeys.join(', ')}]`);

check('No unexpected enumerable properties leaked', extraKeys.length === 0 || extraKeys.every(k => k.startsWith('_')));

// ── VERDICT ────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log(`RESULTS: ${pass} passed, ${fail} failed`);

if (fail === 0) {
    console.log('\n✅ VERDICT: Evented_Class adds acceptable overhead');
    console.log('   and provides event capability for free.');
    console.log('   → Recommend Evented_Class as base (Ch.3 confirmed)');
} else {
    console.log('\n⚠️  VERDICT: Some checks failed — review results above');
}
console.log('═══════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
