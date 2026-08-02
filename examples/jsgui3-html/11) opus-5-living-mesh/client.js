// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — "Living Mesh"
//
// A service-mesh topology drawn as SVG on the SERVER, delivered complete in the
// first HTML response, and then brought to life on the client by a named-event
// SSE stream.
//
// The point being showcased: with jsgui3 the picture is not assembled by the
// browser. View source on this page and the whole scene is already there —
// gradients, curved links, arrow markers, every node in its final position.
// Activation only makes it move.
//
// Built by Claude Opus 5 against an API surface verified by execution rather
// than by reading. Every technique below avoids a specific, confirmed defect:
//
//   * SVG attribute values are String()'d — the renderer drops falsy values,
//     so an unstringified x=0 silently disappears (control-core.js:561).
//   * SVG nodes are built with NO Page_Context — passing one injects four
//     data-jsgui-* attributes onto every node and roughly triples the payload.
//   * The client NEVER creates or appends an SVG element. Dynamic SVG append
//     lands in the XHTML namespace and renders invisibly (control-enh.js:723).
//     All animation is attribute mutation of nodes that arrived from the server.
//   * Interaction lives on real HTML controls, which provably survive
//     reattachment; the SVG is presentation only.
//   * Ctrl.css is a plain template literal with no ${} — the CSS extractor
//     keeps only the first quasi, so interpolation would truncate the sheet.
// ─────────────────────────────────────────────────────────────────────────────

const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Control, controls, Data_Object } = jsgui;

const VIEW_W = 960;
const VIEW_H = 520;

// ── the mesh ─────────────────────────────────────────────────────────────────
// Laid out by hand for a left-to-right flow rather than generated on a circle.

const NODES = [
    { id: 'gateway', label: 'gateway', x: 110, y: 250, r: 26, tier: 'edge' },
    { id: 'auth', label: 'auth', x: 320, y: 120, r: 21, tier: 'service' },
    { id: 'api', label: 'api', x: 320, y: 250, r: 24, tier: 'service' },
    { id: 'cache', label: 'cache', x: 320, y: 380, r: 20, tier: 'service' },
    { id: 'worker', label: 'worker', x: 570, y: 180, r: 22, tier: 'compute' },
    { id: 'ledger', label: 'ledger', x: 570, y: 330, r: 22, tier: 'compute' },
    { id: 'store', label: 'store', x: 810, y: 250, r: 27, tier: 'storage' }
];

const LINKS = [
    { id: 'l1', from: 'gateway', to: 'auth' },
    { id: 'l2', from: 'gateway', to: 'api' },
    { id: 'l3', from: 'gateway', to: 'cache' },
    { id: 'l4', from: 'auth', to: 'worker' },
    { id: 'l5', from: 'api', to: 'worker' },
    { id: 'l6', from: 'api', to: 'ledger' },
    { id: 'l7', from: 'cache', to: 'ledger' },
    { id: 'l8', from: 'worker', to: 'store' },
    { id: 'l9', from: 'ledger', to: 'store' }
];

const TIER_FILL = {
    edge: '#38bdf8',
    service: '#34d399',
    compute: '#fbbf24',
    storage: '#f472b6'
};

const node_by_id = (id) => NODES.filter((n) => n.id === id)[0];

// Curved link. Control points pulled toward the horizontal so the mesh reads
// as flow rather than a spider web.
const link_path = (a, b) => {
    const dx = b.x - a.x;
    const gap_a = a.r + 4;
    const gap_b = b.r + 10;
    const len = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)) || 1;
    const sx = a.x + ((b.x - a.x) / len) * gap_a;
    const sy = a.y + ((b.y - a.y) / len) * gap_a;
    const ex = b.x - ((b.x - a.x) / len) * gap_b;
    const ey = b.y - ((b.y - a.y) / len) * gap_b;
    const c = Math.abs(dx) * 0.45;
    return 'M ' + sx + ' ' + sy + ' C ' + (sx + c) + ' ' + sy + ', ' + (ex - c) + ' ' + ey + ', ' + ex + ' ' + ey;
};

// ── SVG factory ──────────────────────────────────────────────────────────────
// Handles both the nine exported SVG controls and every other tag. String()
// on every value is load-bearing, not defensive.

const el = (tag, attrs, kids) => {
    const K = controls[tag];
    const c = K ? new K({}) : new Control({ tag_name: tag });
    const bag = attrs || {};
    for (const k in bag) {
        if (bag[k] !== undefined && bag[k] !== null) c.dom.attributes[k] = String(bag[k]);
    }
    const children = kids || [];
    for (let i = 0; i < children.length; i++) c.add(children[i]);
    return c;
};

const SPARK_X = 70;
const SPARK_W = 820;
const SPARK_Y = 452;
const SPARK_H = 44;
const SPARK_POINTS = 48;

const flat_spark = () => {
    let d = 'M ' + SPARK_X + ' ' + (SPARK_Y + SPARK_H);
    for (let i = 0; i < SPARK_POINTS; i++) {
        d += ' L ' + (SPARK_X + (SPARK_W * i) / (SPARK_POINTS - 1)) + ' ' + (SPARK_Y + SPARK_H);
    }
    return d;
};

// ── the SVG scene, composed once, on the server ──────────────────────────────

class Mesh_Scene extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'mesh_scene';
        super(spec);
        if (!spec.el) this.compose();
    }

    compose() {
        this.add_class('mesh-scene');

        const defs = el('defs', {}, [
            el('linearGradient', { id: 'bg-grad', x1: '0%', y1: '0%', x2: '0%', y2: '100%' }, [
                el('stop', { offset: '0%', 'stop-color': '#0d1327' }),
                el('stop', { offset: '100%', 'stop-color': '#161d3a' })
            ]),
            el('linearGradient', { id: 'spark-grad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, [
                el('stop', { offset: '0%', 'stop-color': '#38bdf8' }),
                el('stop', { offset: '50%', 'stop-color': '#34d399' }),
                el('stop', { offset: '100%', 'stop-color': '#fbbf24' })
            ]),
            el('marker', {
                id: 'flow-arrow',
                markerWidth: 9,
                markerHeight: 7,
                refX: 8,
                refY: 3.5,
                orient: 'auto-start-reverse'
            }, [
                el('polygon', { points: '0 0, 9 3.5, 0 7', fill: '#3f4a72' })
            ])
        ]);

        const backdrop = el('rect', { x: 0, y: 0, width: VIEW_W, height: VIEW_H, fill: 'url(#bg-grad)' });

        // Faint rule lines, purely compositional.
        const rules = [];
        for (let gy = 60; gy < 430; gy += 62) {
            rules.push(el('line', {
                x1: 40, y1: gy, x2: VIEW_W - 40, y2: gy,
                stroke: '#1e2748', 'stroke-width': 1
            }));
        }

        const link_nodes = LINKS.map((lk) => {
            const a = node_by_id(lk.from);
            const b = node_by_id(lk.to);
            return el('path', {
                id: 'link-' + lk.id,
                d: link_path(a, b),
                fill: 'none',
                stroke: '#33406b',
                'stroke-width': 1.6,
                'stroke-linecap': 'round',
                'stroke-dasharray': '5 7',
                'stroke-dashoffset': 0,
                'marker-end': 'url(#flow-arrow)'
            });
        });

        const node_groups = NODES.map((n) => el('g', { id: 'node-' + n.id }, [
            el('circle', {
                id: 'halo-' + n.id,
                cx: n.x, cy: n.y, r: n.r + 10,
                fill: TIER_FILL[n.tier], 'fill-opacity': '0.08'
            }),
            el('circle', {
                id: 'ring-' + n.id,
                cx: n.x, cy: n.y, r: n.r + 4,
                fill: 'none', stroke: TIER_FILL[n.tier],
                'stroke-width': 1.5, 'stroke-opacity': '0.45'
            }),
            el('circle', {
                id: 'core-' + n.id,
                cx: n.x, cy: n.y, r: n.r,
                fill: '#111a35', stroke: TIER_FILL[n.tier], 'stroke-width': 2.5
            }),
            el('text', {
                id: 'label-' + n.id,
                x: n.x, y: n.y + n.r + 20,
                'text-anchor': 'middle',
                fill: '#93a2c9', 'font-size': 12,
                'font-family': 'system-ui, sans-serif'
            }, [n.label])
        ]));

        const spark = el('g', { id: 'spark-group' }, [
            el('line', {
                x1: SPARK_X, y1: SPARK_Y + SPARK_H, x2: SPARK_X + SPARK_W, y2: SPARK_Y + SPARK_H,
                stroke: '#2a3459', 'stroke-width': 1
            }),
            el('path', {
                id: 'spark-line',
                d: flat_spark(),
                fill: 'none',
                stroke: 'url(#spark-grad)',
                'stroke-width': 2,
                'stroke-linejoin': 'round'
            }),
            el('text', {
                x: SPARK_X, y: SPARK_Y - 8,
                fill: '#5b6893', 'font-size': 11,
                'font-family': 'system-ui, sans-serif'
            }, ['aggregate throughput'])
        ]);

        const svg = el('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 ' + VIEW_W + ' ' + VIEW_H,
            width: '100%',
            height: '100%',
            preserveAspectRatio: 'xMidYMid meet'
        }, [defs, backdrop].concat(rules, link_nodes, node_groups, [spark]));

        this.add(svg);
    }
}

// ── interaction layer ────────────────────────────────────────────────────────
// Real HTML controls, positioned as a percentage of the viewBox so they track
// the SVG at any size. These are what the user actually clicks.

class Node_Hit extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'node_hit';
        super(spec);
        this.node_id = spec.node_id;
        if (!spec.el) {
            this.add_class('hit');
            this.dom.attributes['data-node'] = String(spec.node_id || '');
            this.dom.attributes['title'] = String(spec.node_id || '');
            const n = node_by_id(spec.node_id);
            if (n) {
                const size = (n.r + 12) * 2;
                this.dom.attributes['style'] =
                    'left:' + ((n.x / VIEW_W) * 100) + '%;top:' + ((n.y / VIEW_H) * 100) + '%;' +
                    'width:' + ((size / VIEW_W) * 100) + '%;height:' + ((size / VIEW_H) * 100) + '%;';
            }
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            // Recover node_id after reattachment — spec fields do not survive.
            if (!this.node_id && this.dom.el) this.node_id = this.dom.el.getAttribute('data-node');
        }
    }
}

class Detail_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'detail_panel';
        super(spec);

        this.data.model = new Data_Object({ node: '—', load: 0, latency: 0, state: 'idle' });

        if (!spec.el) {
            this.add_class('detail');
            const title = new Control({ context: this.context, tag_name: 'div', class: 'detail-title' });
            title.add('select a service');
            const rows = new Control({ context: this.context, tag_name: 'dl', class: 'detail-rows' });

            const mk = (k) => {
                const dt = new Control({ context: this.context, tag_name: 'dt' });
                dt.add(k);
                const dd = new Control({ context: this.context, tag_name: 'dd' });
                dd.add('—');
                rows.add(dt);
                rows.add(dd);
                return dd;
            };

            this._ctrl_fields = this._ctrl_fields || {};
            // The _ctrl_fields KEY is what gets reassigned on the client, so it must
            // match the property name exactly. Naming this one `title` while reading
            // `this.title_ctrl` left the heading permanently stuck on its placeholder
            // while every other field updated — a five-minute bug to find and an
            // invisible one to notice.
            this._ctrl_fields.title_ctrl = this.title_ctrl = title;
            this._ctrl_fields.dd_load = this.dd_load = mk('load');
            this._ctrl_fields.dd_latency = this.dd_latency = mk('latency');
            this._ctrl_fields.dd_state = this.dd_state = mk('state');

            this.add(title);
            this.add(rows);
        }
    }

    // Written by hand on purpose: jsgui3 has no automatic view-to-DOM re-render,
    // and pretending otherwise is how examples end up silently static.
    paint() {
        const m = this.data.model;
        const set = (ctrl, text) => {
            if (!ctrl) return;
            if (ctrl.dom.el) { ctrl.dom.el.textContent = text; return; }
            ctrl.content.clear();
            ctrl.add(text);
        };
        set(this.title_ctrl, String(m.node || '—'));
        set(this.dd_load, Math.round(Number(m.load) || 0) + '%');
        set(this.dd_latency, (Number(m.latency) || 0).toFixed(1) + ' ms');
        set(this.dd_state, String(m.state || 'idle'));
    }

    activate() {
        if (!this.__active) {
            super.activate();
            this.paint();
        }
    }
}

// ── the page ─────────────────────────────────────────────────────────────────

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        if (!spec.el) this.compose();
    }

    compose() {
        const { context } = this;
        this.body.add_class('opus5');

        const shell = new Control({ context, tag_name: 'div', class: 'shell' });

        const header = new Control({ context, tag_name: 'header', class: 'head' });
        const h1 = new Control({ context, tag_name: 'h1' });
        h1.add('Living Mesh');
        const tag = new Control({ context, tag_name: 'p', class: 'tagline' });
        tag.add('An Opus 5 showcase — the entire scene below is server-rendered SVG. Activation only makes it move.');
        const badge = new Control({ context, tag_name: 'span', class: 'badge' });
        badge.add('Claude Opus 5 showcase');
        header.add(badge);
        header.add(h1);
        header.add(tag);

        const stage = new Control({ context, tag_name: 'div', class: 'stage' });
        const scene = new Mesh_Scene({ context });
        stage.add(scene);

        const overlay = new Control({ context, tag_name: 'div', class: 'overlay' });
        this._ctrl_fields = this._ctrl_fields || {};
        this.hits = [];
        for (let i = 0; i < NODES.length; i++) {
            const hit = new Node_Hit({ context, node_id: NODES[i].id });
            overlay.add(hit);
            this.hits.push(hit);
            this._ctrl_fields['hit_' + NODES[i].id] = hit;
        }
        stage.add(overlay);

        const side = new Control({ context, tag_name: 'aside', class: 'side' });
        const detail = new Detail_Panel({ context });
        const status = new Control({ context, tag_name: 'div', class: 'status' });
        status.add('connecting…');
        const alerts = new Control({ context, tag_name: 'ul', class: 'alerts' });
        side.add(detail);
        side.add(status);
        side.add(alerts);

        this._ctrl_fields.scene = this.scene = scene;
        this._ctrl_fields.overlay = this.overlay = overlay;
        this._ctrl_fields.detail = this.detail = detail;
        this._ctrl_fields.status = this.status = status;
        this._ctrl_fields.alerts = this.alerts = alerts;

        const foot = new Control({ context, tag_name: 'footer', class: 'foot' });
        foot.add('Server-rendered SVG · named-event SSE · no client-side element creation');

        shell.add(header);
        shell.add(stage);
        shell.add(side);
        shell.add(foot);
        this.body.add(shell);
    }

    activate() {
        if (!this.__active) {
            super.activate();
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            this.selected = null;
            this.history = [];
            this.telemetry = {};

            const root = this.dom.el || document;
            const q = (sel) => root.querySelector(sel);

            // Click-to-select. Delegated from the overlay so one listener covers
            // every hit target, and so it keeps working regardless of how the
            // hit controls were reattached.
            const overlay_el = this.overlay && this.overlay.dom.el;
            if (overlay_el) {
                overlay_el.addEventListener('click', (ev) => {
                    const target = ev.target && ev.target.closest ? ev.target.closest('.hit') : null;
                    if (!target) return;
                    this.select_node(target.getAttribute('data-node'));
                });
            }

            this.paint_selection();
            this.connect_stream();
        }
    }

    select_node(id) {
        if (!id) return;
        this.selected = id;
        const t = this.telemetry[id] || {};
        const m = this.detail && this.detail.data.model;
        if (m) {
            m.set('node', id);
            m.set('load', t.load || 0);
            m.set('latency', t.latency || 0);
            m.set('state', t.state || 'idle');
            this.detail.paint();
        }
        this.paint_selection();
    }

    paint_selection() {
        const root = this.dom.el || document;
        for (let i = 0; i < NODES.length; i++) {
            const n = NODES[i];
            const ring = root.querySelector('#ring-' + n.id);
            if (!ring) continue;
            const on = n.id === this.selected;
            // Attribute mutation only — never element creation.
            ring.setAttribute('stroke-opacity', on ? '1' : '0.45');
            ring.setAttribute('stroke-width', on ? '3' : '1.5');
            ring.setAttribute('r', String(n.r + (on ? 9 : 4)));
        }
        const overlay_el = this.overlay && this.overlay.dom.el;
        if (overlay_el) {
            const hits = overlay_el.querySelectorAll('.hit');
            for (let i = 0; i < hits.length; i++) {
                const is_on = hits[i].getAttribute('data-node') === this.selected;
                hits[i].setAttribute('class', is_on ? 'hit hit-on' : 'hit');
            }
        }
    }

    apply_telemetry(payload) {
        const root = this.dom.el || document;
        const nodes = (payload && payload.nodes) || {};

        for (const id in nodes) {
            const t = nodes[id];
            this.telemetry[id] = t;
            const n = node_by_id(id);
            if (!n) continue;

            const core = root.querySelector('#core-' + id);
            const halo = root.querySelector('#halo-' + id);
            if (core) {
                const load = Math.max(0, Math.min(100, Number(t.load) || 0));
                core.setAttribute('r', String(n.r + (load / 100) * 7));
                core.setAttribute('stroke-width', String(2.5 + (load / 100) * 2.5));
                core.setAttribute('fill', load > 85 ? '#3a1622' : '#111a35');
            }
            if (halo) halo.setAttribute('fill-opacity', String(0.06 + ((Number(t.load) || 0) / 100) * 0.22));
        }

        // Link traffic: dash offset marches, width follows load of the source.
        this.dash = ((this.dash || 0) + 2.4) % 24;
        for (let i = 0; i < LINKS.length; i++) {
            const lk = LINKS[i];
            const p = root.querySelector('#link-' + lk.id);
            if (!p) continue;
            const src = nodes[lk.from] || {};
            const load = Number(src.load) || 0;
            p.setAttribute('stroke-dashoffset', String(-this.dash));
            p.setAttribute('stroke-width', String(1.2 + (load / 100) * 3.2));
            p.setAttribute('stroke', load > 85 ? '#7c3050' : '#33406b');
        }

        // Sparkline: rebuild the d attribute. Still just an attribute write.
        // Seed from the server's rolling history on the first frame so the chart
        // arrives with shape instead of filling for a minute.
        if (!this.history.length && payload && payload.history && payload.history.length) {
            this.history = payload.history.slice(-SPARK_POINTS);
        }
        const total = Number(payload && payload.total) || 0;
        this.history.push(total);
        while (this.history.length > SPARK_POINTS) this.history.shift();
        const spark = root.querySelector('#spark-line');
        if (spark && this.history.length > 1) {
            const max = Math.max.apply(null, this.history.concat([1]));
            let d = '';
            for (let i = 0; i < this.history.length; i++) {
                const x = SPARK_X + (SPARK_W * i) / (SPARK_POINTS - 1);
                const y = SPARK_Y + SPARK_H - (this.history[i] / max) * SPARK_H;
                d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
            }
            spark.setAttribute('d', d);
        }

        if (this.selected) this.select_node(this.selected);
    }

    push_alert(payload) {
        const list = this.alerts && this.alerts.dom.el;
        if (!list) return;
        // Plain HTML elements here — the SVG-namespace defect does not apply
        // outside the <svg> subtree.
        const li = document.createElement('li');
        li.textContent = (payload && payload.text) || 'alert';
        list.insertBefore(li, list.firstChild);
        while (list.childNodes.length > 5) list.removeChild(list.lastChild);
    }

    set_status(text, cls) {
        const s = this.status && this.status.dom.el;
        if (!s) return;
        s.textContent = text;
        s.setAttribute('class', 'status ' + (cls || ''));
    }

    connect_stream() {
        if (typeof window.EventSource === 'undefined') {
            this.set_status('EventSource unavailable', 'bad');
            return;
        }
        const source = new window.EventSource('/api/telemetry');
        this.source = source;

        source.addEventListener('open', () => this.set_status('live', 'good'));
        source.addEventListener('error', () => this.set_status('reconnecting…', 'warn'));

        // Named events require an explicit listener per name. A generic
        // onmessage handler receives none of these — that asymmetry is the
        // single most common way an SSE integration silently receives nothing.
        source.addEventListener('telemetry', (ev) => {
            let payload = null;
            try { payload = JSON.parse(ev.data); } catch (e) { return; }
            this.apply_telemetry(payload);
        });

        source.addEventListener('alert', (ev) => {
            let payload = null;
            try { payload = JSON.parse(ev.data); } catch (e) { return; }
            this.push_alert(payload);
        });
    }
}

Demo_UI.css = `
* { box-sizing: border-box; }
body.opus5 {
    margin: 0;
    background: #080c1a;
    color: #dbe4f7;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
.shell {
    display: grid;
    grid-template-columns: 1fr 268px;
    grid-template-rows: auto auto 1fr;
    grid-template-areas: "head head" "stage side" "foot foot";
    gap: 18px;
    padding: 22px 26px 18px;
    min-height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
}
.head { grid-area: head; }
.badge {
    display: inline-block;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7dd3fc;
    border: 1px solid #1d3a5c;
    background: #0d1b2e;
    border-radius: 999px;
    padding: 4px 11px;
}
.head h1 {
    margin: 10px 0 4px;
    font-size: 27px;
    font-weight: 500;
    letter-spacing: -0.01em;
}
.tagline { margin: 0; color: #7c8bb3; font-size: 14px; max-width: 70ch; }
.stage {
    grid-area: stage;
    position: relative;
    border: 1px solid #1b2340;
    border-radius: 12px;
    overflow: hidden;
    background: #0d1327;
    aspect-ratio: 960 / 520;
}
.mesh-scene { display: block; width: 100%; height: 100%; }
.mesh-scene svg { display: block; width: 100%; height: 100%; }
.overlay { position: absolute; inset: 0; }
.hit {
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid transparent;
}
.hit:hover { border-color: #3d5480; background: rgba(120, 170, 255, 0.06); }
.hit-on { border-color: #7dd3fc; background: rgba(125, 211, 252, 0.10); }
.side { grid-area: side; display: flex; flex-direction: column; gap: 12px; }
.detail {
    border: 1px solid #1b2340;
    border-radius: 12px;
    background: #0d1327;
    padding: 14px 16px;
}
.detail-title {
    font-size: 15px;
    color: #e8eefc;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
}
.detail-rows { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; }
.detail-rows dt { color: #6b7aa3; font-size: 12px; }
.detail-rows dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
.status {
    font-size: 12px;
    color: #7c8bb3;
    border: 1px solid #1b2340;
    border-radius: 999px;
    padding: 5px 12px;
    align-self: flex-start;
}
.status.good { color: #6ee7b7; border-color: #14532d; }
.status.warn { color: #fcd34d; border-color: #4d3610; }
.status.bad { color: #fca5a5; border-color: #5b1a1a; }
.alerts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.alerts li {
    font-size: 12px;
    color: #fbbf24;
    background: #1a1508;
    border: 1px solid #3d310c;
    border-radius: 8px;
    padding: 6px 10px;
}
.foot { grid-area: foot; color: #4d5a80; font-size: 12px; }
@media (max-width: 880px) {
    .shell { grid-template-columns: 1fr; grid-template-areas: "head" "stage" "side" "foot"; }
}
`;

controls.Mesh_Scene = Mesh_Scene;
controls.mesh_scene = Mesh_Scene;
controls.Node_Hit = Node_Hit;
controls.node_hit = Node_Hit;
controls.Detail_Panel = Detail_Panel;
controls.detail_panel = Detail_Panel;
controls.Demo_UI = Demo_UI;
controls.demo_ui = Demo_UI;

module.exports = jsgui;
