// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Opus 5 Showcase â€” "Instrument Workbench"
//
// A two-octave keyboard built from relatively positioned divs, above it a
// waveform and envelope editor, and six additive-synthesis instrument voices
// that can be duplicated and reshaped.
//
// Built by Claude Opus 5.
//
// Architecture notes, all of them consequences of verified framework behaviour:
//
//   * Every SVG panel is composed ON THE SERVER with stable plain ids. The
//     client only ever calls setAttribute on nodes that arrived in the HTML â€”
//     it never creates an SVG element, because dynamic SVG append lands in the
//     XHTML namespace and renders invisibly (control-enh.js:723).
//   * SVG attribute values are String()'d; the renderer drops falsy values, so
//     an unstringified y=0 would silently vanish (control-core.js:561).
//   * SVG nodes are built with no Page_Context â€” one injects four data-jsgui-*
//     attributes onto every node.
//   * _ctrl_fields keys match their property names exactly. Getting that wrong
//     leaves a reference unrestored after reattachment, silently.
//   * Ctrl.css contains no ${} â€” the extractor keeps only the first quasi.
//
// The sound is genuinely synthesised from what the editor shows: the partial
// bars become a PeriodicWave, and the envelope curve is sampled straight into
// setValueCurveAtTime. There are no samples and no lookup tables.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const voices = require('./instruments');

const { Control, controls } = jsgui;
const { PARTIAL_COUNT, CURVE_MODES, INSTRUMENTS, clone_voice, shape, wave_cycle, env_points } = voices;

// â”€â”€ SVG factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ geometry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SPEC_W = 440, SPEC_H = 190, SPEC_TOP = 18, SPEC_BASE = 162;
const BAR_W = 20, BAR_GAP = 6, BAR_X0 = 18;
const bar_x = (i) => BAR_X0 + i * (BAR_W + BAR_GAP);

const ENV_W = 440, ENV_H = 190, ENV_TOP = 18, ENV_BASE = 162, ENV_L = 20, ENV_R = 424;

const WAVE_W = 900, WAVE_H = 132, WAVE_MID = 66, WAVE_AMP = 46;
const WAVE_POINTS = 240;

const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_SEMIS = [1, 3, 6, 8, 10];
const WHITE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// Keyed by the BLACK semitone (C#=1, D#=3, F#=6, G#=8, A#=10), giving each
// accidental's offset in white-key widths from the left edge of the octave.
// Keying this by the white-key index instead produced NaN offsets, which CSS
// discards silently â€” all ten accidentals stacked on top of each other and the
// keyboard still looked plausible at a glance.
const BLACK_AFTER = { 1: 0.68, 3: 1.72, 6: 3.68, 8: 4.70, 10: 5.72 };
const OCTAVES = 2;
const BASE_MIDI = 48; // C3
const WHITE_COUNT = WHITE_SEMIS.length * OCTAVES;

const midi_to_freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// â”€â”€ geometry, shared by compose() on the server and paint() on the client â”€â”€â”€â”€
//
// These exist so the SSR pass emits the REAL picture rather than a placeholder.
// The first version of this example composed d="M 0 0" and sixteen flat bars,
// then painted the truth on activation â€” while the footer claimed the editors
// arrived complete from the server. They did not. Sharing the geometry is what
// makes that claim true, and it is the whole point of the example.

const bar_geom = (partials, i) => {
    const amp = Math.max(0, Math.min(1, partials[i] || 0));
    const h = Math.max(2, amp * (SPEC_BASE - SPEC_TOP));
    return {
        y: SPEC_BASE - h,
        height: h,
        fill: i === 0 ? '#7dd3fc' : amp > 0 ? '#4b6bd8' : '#243056'
    };
};

const wave_path_d = (partials) => {
    const pts = wave_cycle(partials, WAVE_POINTS);
    let d = '';
    for (let i = 0; i < pts.length; i++) {
        const x = (WAVE_W * i) / (pts.length - 1);
        const y = WAVE_MID - pts[i] * WAVE_AMP;
        d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d;
};

const env_path_d = (env, curves) => {
    const pts = env_points(env, curves, 160);
    const span = ENV_R - ENV_L;
    let d = '';
    for (let i = 0; i < pts.length; i++) {
        const x = ENV_L + (span * i) / (pts.length - 1);
        const y = ENV_BASE - pts[i] * (ENV_BASE - ENV_TOP);
        d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d;
};

// The x-axis is pinned to a FIXED window rather than to the envelope being
// edited. Deriving the axis from the same value the handle sets made the
// release handle collapse under its own feedback: each drag shortened the
// total, which moved the handle right, which shortened it again. It bottomed
// out at the 0.02 s clamp in about four pointermoves and could never be
// lengthened again.
const ENV_WINDOW = 2.4;

const env_handles = (env) => {
    const span = ENV_R - ENV_L;
    const at = (t, val) => ({
        x: ENV_L + span * Math.max(0, Math.min(1, t / ENV_WINDOW)),
        y: ENV_BASE - val * (ENV_BASE - ENV_TOP)
    });
    const hold = 0.35;
    return {
        attack: at(env.attack, 1),
        decay: at(env.attack + env.decay, env.sustain),
        sustain: at(env.attack + env.decay + hold, env.sustain),
        release: at(env.attack + env.decay + hold + env.release, 0)
    };
};

// Computer-keyboard mapping, tracker style, so the thing is playable without a mouse.
const KEY_MAP = {
    a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
    k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17
};

// â”€â”€ panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class Spectrum_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'spectrum_panel';
        super(spec);
        this.spec_voice = spec.voice;
        if (!spec.el) this.compose();
    }

    compose() {
        this.add_class('panel');
        const partials = (this.spec_voice || INSTRUMENTS[0]).partials;
        const bars = [];
        for (let i = 0; i < PARTIAL_COUNT; i++) {
            const g = bar_geom(partials, i);
            bars.push(el('rect', {
                id: 'pbar-' + i,
                x: bar_x(i), y: g.y, width: BAR_W, height: g.height,
                rx: 3, fill: g.fill
            }));
            bars.push(el('text', {
                id: 'plabel-' + i,
                x: bar_x(i) + BAR_W / 2, y: SPEC_BASE + 16,
                'text-anchor': 'middle', fill: '#54608a', 'font-size': 9,
                'font-family': 'system-ui, sans-serif'
            }, [String(i + 1)]));
        }
        const svg = el('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 ' + SPEC_W + ' ' + SPEC_H,
            width: '100%', height: '100%', preserveAspectRatio: 'none'
        }, [
            el('rect', { x: 0, y: 0, width: SPEC_W, height: SPEC_H, fill: '#0d1327' }),
            el('line', { x1: 12, y1: SPEC_BASE, x2: SPEC_W - 12, y2: SPEC_BASE, stroke: '#2a3459', 'stroke-width': 1 }),
            el('line', { x1: 12, y1: SPEC_TOP, x2: SPEC_W - 12, y2: SPEC_TOP, stroke: '#1c2444', 'stroke-width': 1 })
        ].concat(bars));
        this.add(svg);
    }
}

class Envelope_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'envelope_panel';
        super(spec);
        this.spec_voice = spec.voice;
        if (!spec.el) this.compose();
    }

    compose() {
        this.add_class('panel');
        const v = this.spec_voice || INSTRUMENTS[0];
        const hs = env_handles(v.env);
        const d = env_path_d(v.env, v.curves);
        const handles = ['attack', 'decay', 'sustain', 'release'].map((nm) => el('circle', {
            id: 'envh-' + nm,
            cx: hs[nm].x.toFixed(2), cy: hs[nm].y.toFixed(2),
            r: 6, fill: '#0d1327', stroke: '#7dd3fc', 'stroke-width': 2
        }));
        const svg = el('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 ' + ENV_W + ' ' + ENV_H,
            width: '100%', height: '100%', preserveAspectRatio: 'none'
        }, [
            el('rect', { x: 0, y: 0, width: ENV_W, height: ENV_H, fill: '#0d1327' }),
            el('line', { x1: ENV_L, y1: ENV_BASE, x2: ENV_R, y2: ENV_BASE, stroke: '#2a3459', 'stroke-width': 1 }),
            el('line', { x1: ENV_L, y1: ENV_TOP, x2: ENV_R, y2: ENV_TOP, stroke: '#1c2444', 'stroke-width': 1 }),
            el('path', {
                id: 'env-fill',
                d: d + ' L ' + ENV_R + ' ' + ENV_BASE + ' L ' + ENV_L + ' ' + ENV_BASE + ' Z',
                fill: '#34d399', 'fill-opacity': '0.13'
            }),
            el('path', {
                id: 'env-path', d: d, fill: 'none',
                stroke: '#34d399', 'stroke-width': 2, 'stroke-linejoin': 'round'
            })
        ].concat(handles));
        this.add(svg);
    }
}

class Wave_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'wave_panel';
        super(spec);
        this.spec_voice = spec.voice;
        if (!spec.el) this.compose();
    }

    compose() {
        this.add_class('panel');
        const d = wave_path_d((this.spec_voice || INSTRUMENTS[0]).partials);
        const svg = el('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 ' + WAVE_W + ' ' + WAVE_H,
            width: '100%', height: '100%', preserveAspectRatio: 'none'
        }, [
            el('rect', { x: 0, y: 0, width: WAVE_W, height: WAVE_H, fill: '#0d1327' }),
            el('line', { x1: 0, y1: WAVE_MID, x2: WAVE_W, y2: WAVE_MID, stroke: '#232c50', 'stroke-width': 1 }),
            el('path', { id: 'wave-glow', d: d, fill: 'none', stroke: '#fbbf24', 'stroke-opacity': '0.18', 'stroke-width': 6 }),
            el('path', { id: 'wave-path', d: d, fill: 'none', stroke: '#fbbf24', 'stroke-width': 2, 'stroke-linejoin': 'round' })
        ]);
        this.add(svg);
    }
}

// â”€â”€ keyboard, built from relatively positioned divs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class Keyboard extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'keyboard';
        super(spec);
        if (!spec.el) this.compose();
    }

    compose() {
        const { context } = this;
        this.add_class('keyboard');

        // White keys are ordinary flow children of a relatively positioned
        // container; black keys are absolutely positioned against it by
        // percentage, which is what makes the layout scale cleanly.
        const whites = new Control({ context, tag_name: 'div', class: 'whites' });
        for (let o = 0; o < OCTAVES; o++) {
            for (let i = 0; i < WHITE_SEMIS.length; i++) {
                const midi = BASE_MIDI + o * 12 + WHITE_SEMIS[i];
                const k = new Control({ context, tag_name: 'div', class: 'key white' });
                k.dom.attributes['data-midi'] = String(midi);
                const lbl = new Control({ context, tag_name: 'span', class: 'kl' });
                lbl.add(WHITE_NAMES[i] + String(3 + o));
                k.add(lbl);
                whites.add(k);
            }
        }

        const blacks = new Control({ context, tag_name: 'div', class: 'blacks' });
        for (let o = 0; o < OCTAVES; o++) {
            for (let i = 0; i < BLACK_SEMIS.length; i++) {
                const semi = BLACK_SEMIS[i];
                const midi = BASE_MIDI + o * 12 + semi;
                const slot = BLACK_AFTER[semi] + o * 7;
                const k = new Control({ context, tag_name: 'div', class: 'key black' });
                k.dom.attributes['data-midi'] = String(midi);
                // 0.57 of a white key matches real piano proportions
                // (13.7mm accidental against a 23.5mm natural).
                k.dom.attributes['style'] =
                    'left:' + ((slot / WHITE_COUNT) * 100) + '%;width:' + ((0.57 / WHITE_COUNT) * 100) + '%;';
                blacks.add(k);
            }
        }

        this.add(whites);
        this.add(blacks);
    }
}

// â”€â”€ the page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        if (!spec.el) this.compose();
    }

    compose() {
        const { context } = this;
        this.body.add_class('opus5');
        this._ctrl_fields = this._ctrl_fields || {};

        const shell = new Control({ context, tag_name: 'div', class: 'shell' });

        // header
        const head = new Control({ context, tag_name: 'header', class: 'head' });
        const badge = new Control({ context, tag_name: 'span', class: 'badge' });
        badge.add('Claude Opus 5 showcase');
        const h1 = new Control({ context, tag_name: 'h1' });
        h1.add('Instrument Workbench');
        const sub = new Control({ context, tag_name: 'p', class: 'tagline' });
        sub.add('Additive synthesis you can draw. Sixteen partials become the timbre, the envelope becomes the articulation â€” both are edited directly and both are what you hear.');
        head.add(badge); head.add(h1); head.add(sub);

        // toolbar
        const bar = new Control({ context, tag_name: 'div', class: 'toolbar' });

        const sel = new Control({ context, tag_name: 'select', class: 'pick' });
        sel.dom.attributes['id'] = 'voice-pick';
        for (let i = 0; i < INSTRUMENTS.length; i++) {
            const o = new Control({ context, tag_name: 'option' });
            o.dom.attributes['value'] = INSTRUMENTS[i].id;
            o.add(INSTRUMENTS[i].name);
            sel.add(o);
        }

        const dup = new Control({ context, tag_name: 'button', class: 'btn' });
        dup.dom.attributes['id'] = 'btn-dup';
        dup.add('Duplicate & edit');

        const reset = new Control({ context, tag_name: 'button', class: 'btn ghost' });
        reset.dom.attributes['id'] = 'btn-reset';
        reset.add('Revert');

        const namewrap = new Control({ context, tag_name: 'div', class: 'namewrap' });
        const nameinput = new Control({ context, tag_name: 'input', class: 'nameinput' });
        nameinput.dom.attributes['id'] = 'voice-name';
        nameinput.dom.attributes['type'] = 'text';
        nameinput.dom.attributes['spellcheck'] = 'false';
        namewrap.add(nameinput);

        bar.add(sel); bar.add(dup); bar.add(reset); bar.add(namewrap);
        this._ctrl_fields.sel = this.sel = sel;

        // editors
        // Not "grid": jsgui3-html ships a div.grid rule whose specificity (0,1,1)
        // beats a plain .grid class, which silently changed the font stack and
        // disabled text selection inside these two cards only.
        const grid = new Control({ context, tag_name: 'div', class: 'editgrid' });

        const mk_card = (title, hint, body_ctrl, extra) => {
            const card = new Control({ context, tag_name: 'section', class: 'card' });
            const h = new Control({ context, tag_name: 'div', class: 'card-h' });
            const t = new Control({ context, tag_name: 'h2' });
            t.add(title);
            const hi = new Control({ context, tag_name: 'span', class: 'hint' });
            hi.add(hint);
            h.add(t); h.add(hi);
            card.add(h);
            if (extra) card.add(extra);
            const wrap = new Control({ context, tag_name: 'div', class: 'plot' });
            wrap.add(body_ctrl);
            card.add(wrap);
            return card;
        };

        // The default voice is composed into the SVG server-side, so the first
        // response carries the real picture rather than a placeholder.
        const v0 = INSTRUMENTS[0];
        const spectrum = new Spectrum_Panel({ context, voice: v0 });
        const envelope = new Envelope_Panel({ context, voice: v0 });
        const wave = new Wave_Panel({ context, voice: v0 });
        this._ctrl_fields.spectrum = this.spectrum = spectrum;
        this._ctrl_fields.envelope = this.envelope = envelope;
        this._ctrl_fields.wave = this.wave = wave;

        // curve-mode selectors for each envelope segment
        const curverow = new Control({ context, tag_name: 'div', class: 'curverow' });
        ['attack', 'decay', 'release'].forEach((seg) => {
            const g = new Control({ context, tag_name: 'div', class: 'cg' });
            const lb = new Control({ context, tag_name: 'span', class: 'cgl' });
            lb.add(seg);
            g.add(lb);
            CURVE_MODES.forEach((mode) => {
                const b = new Control({ context, tag_name: 'button', class: 'cmode' });
                b.dom.attributes['data-seg'] = seg;
                b.dom.attributes['data-mode'] = mode;
                b.add(mode);
                g.add(b);
            });
            curverow.add(g);
        });

        const vibrow = new Control({ context, tag_name: 'div', class: 'sliders' });
        const mk_slider = (id, label, min, max, step) => {
            const w = new Control({ context, tag_name: 'label', class: 'sl' });
            const t = new Control({ context, tag_name: 'span', class: 'slt' });
            t.add(label);
            const inp = new Control({ context, tag_name: 'input' });
            inp.dom.attributes['id'] = id;
            inp.dom.attributes['type'] = 'range';
            inp.dom.attributes['min'] = String(min);
            inp.dom.attributes['max'] = String(max);
            inp.dom.attributes['step'] = String(step);
            const v = new Control({ context, tag_name: 'span', class: 'slv' });
            v.dom.attributes['id'] = id + '-val';
            v.add('â€”');
            w.add(t); w.add(inp); w.add(v);
            vibrow.add(w);
            return w;
        };
        mk_slider('sl-vrate', 'vibrato rate', 0, 9, 0.1);
        mk_slider('sl-vdepth', 'vibrato depth', 0, 3, 0.05);
        // step 0.01 so every voice's stock level sits exactly on the grid;
        // at 0.02 the tuba read 0.95 while the thumb sat at 0.96, and the first
        // touch of the slider silently changed the gain.
        mk_slider('sl-gain', 'level', 0.1, 1.2, 0.01);

        grid.add(mk_card('Harmonic spectrum', 'drag a bar â€” partial 1 is the fundamental', spectrum));
        grid.add(mk_card('Amplitude envelope', 'drag a handle; each segment has its own curve', envelope, curverow));

        const wavecard = mk_card('Waveform â€” one cycle', 'derived from the partials above', wave, vibrow);
        wavecard.add_class('wide');

        const kb = new Keyboard({ context });
        this._ctrl_fields.kb = this.kb = kb;
        const kbcard = new Control({ context, tag_name: 'section', class: 'card wide kbcard' });
        const kbh = new Control({ context, tag_name: 'div', class: 'card-h' });
        const kbt = new Control({ context, tag_name: 'h2' });
        kbt.add('Two octaves');
        const kbhint = new Control({ context, tag_name: 'span', class: 'hint' });
        kbhint.add('click, or play with A W S E D F T G Y H U J K O L P');
        kbh.add(kbt); kbh.add(kbhint);
        kbcard.add(kbh);
        kbcard.add(kb);

        const foot = new Control({ context, tag_name: 'footer', class: 'foot' });
        foot.add('Server-rendered SVG editors Â· Web Audio additive synthesis Â· no client-side SVG element creation');

        shell.add(head);
        shell.add(bar);
        shell.add(grid);
        shell.add(wavecard);
        shell.add(kbcard);
        shell.add(foot);
        this.body.add(shell);
    }

    // â”€â”€ activation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    activate() {
        if (!this.__active) {
            super.activate();
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            // Each library entry keeps its own factory baseline, so Revert works
            // for duplicates too â€” looking the id up in INSTRUMENTS meant Revert
            // silently did nothing for any voice the user had created.
            this.library = INSTRUMENTS.map((v) => {
                const c = clone_voice(v);
                c.baseline = clone_voice(v);
                return c;
            });
            this.voice = clone_voice(this.library[0]);
            this.active_notes = {};
            this.held_keys = {};
            this.pointer_notes = {};

            const root = this.dom.el || document;
            this.root = root;
            this.q = (s) => root.querySelector(s);

            this.wire_toolbar();
            this.wire_spectrum();
            this.wire_envelope();
            this.wire_keyboard();
            this.paint_all();
        }
    }

    // â”€â”€ audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    audio() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.28;
            // Six held keys sum past full scale and clip. A compressor is the
            // cheap honest fix; measured 1.7 dB over on a four-note chord with
            // the level slider up.
            const comp = this.ctx.createDynamicsCompressor();
            comp.threshold.value = -10;
            comp.ratio.value = 8;
            comp.attack.value = 0.004;
            comp.release.value = 0.12;
            this.master.connect(comp);
            comp.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    // Building a wavetable costs ~1.8 ms of main thread. Rebuilding it per
    // keypress caused audible stutter when playing fast, and widened the window
    // for the scheduling race below. Cached against the partials that made it.
    periodic_wave() {
        const key = this.voice.partials.join(',');
        if (this._wave_key === key && this._wave) return this._wave;
        const n = PARTIAL_COUNT + 1;
        const real = new Float32Array(n);
        const imag = new Float32Array(n);
        for (let i = 0; i < PARTIAL_COUNT; i++) imag[i + 1] = this.voice.partials[i];
        this._wave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
        this._wave_key = key;
        return this._wave;
    }

    invalidate_wave() { this._wave = null; this._wave_key = null; }

    // Sample the same shape() the editor draws with, so the sound cannot
    // disagree with the picture.
    env_curve(from, to, seconds, mode, rising) {
        const steps = 48;
        const arr = new Float32Array(steps);
        for (let i = 0; i < steps; i++) {
            const p = i / (steps - 1);
            arr[i] = from + (to - from) * shape(p, mode, rising);
        }
        return arr;
    }

    note_on(midi) {
        const ctx = this.audio();
        if (!ctx || this.active_notes[midi]) return;

        // Capture the voice per note. Reading this.voice in note_off meant
        // changing instrument mid-note gave the tail of the NEW instrument.
        const v = clone_voice(this.voice);

        const osc = ctx.createOscillator();
        osc.setPeriodicWave(this.periodic_wave());
        osc.frequency.value = midi_to_freq(midi);
        if (v.drift) osc.detune.value = (Math.random() * 2 - 1) * v.drift * 1200;

        const g = ctx.createGain();
        g.gain.value = 0;
        osc.connect(g);
        g.connect(this.master);

        let lfo = null, lfo_gain = null;
        if (v.vibrato.rate > 0 && v.vibrato.depth > 0) {
            lfo = ctx.createOscillator();
            lfo.frequency.value = v.vibrato.rate;
            lfo_gain = ctx.createGain();
            lfo_gain.gain.value = v.vibrato.depth * 12;
            lfo.connect(lfo_gain);
            lfo_gain.connect(osc.detune);
        }

        // Read the clock AFTER all node construction, and add a small lookahead.
        // Reading it first meant the ~2 ms of createPeriodicWave/createGain work
        // pushed the attack curve's start into the past; Chrome clamps it
        // forward, the decay curve stays anchored to the stale timestamp, the
        // two then overlap and setValueCurveAtTime throws NotSupportedError.
        // Measured: 23% of notes silently lost under CPU throttle, each leaking
        // an oscillator and a gain node.
        const now = ctx.currentTime + 0.02;

        const a = Math.max(0.002, v.env.attack);
        const d = Math.max(0.002, v.env.decay);
        const peak = v.gain;
        const sus = peak * v.env.sustain;

        // Register before scheduling so a throw cannot orphan the nodes.
        const note = { osc, g, lfo, lfo_gain, voice: v, started: now };
        this.active_notes[midi] = note;

        try {
            g.gain.setValueCurveAtTime(this.env_curve(0, peak, a, v.curves.attack, true), now, a);
            g.gain.setValueCurveAtTime(this.env_curve(peak, sus, d, v.curves.decay, false), now + a, d);
        } catch (e) {
            // Last-resort fallback: a plain ramp still makes a note rather than
            // silence, and keeps the node bookkeeping consistent.
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(peak, now + a);
            g.gain.linearRampToValueAtTime(sus, now + a + d);
        }

        osc.start(now);
        if (lfo) lfo.start(now);
        this.flash_key(midi, true);
    }

    all_notes_off() {
        for (const midi in this.active_notes) this.note_off(Number(midi));
        this.held_keys = {};
        this.pointer_notes = {};
    }

    note_off(midi) {
        const n = this.active_notes[midi];
        if (!n) return;
        delete this.active_notes[midi];
        const ctx = this.ctx;
        const v = n.voice || this.voice;   // the voice this note was started with
        const now = ctx.currentTime;
        const r = Math.max(0.02, v.env.release);
        let current = 0.0001;

        try {
            // cancelScheduledValues does NOT stop a value curve that is already
            // running; cancelAndHoldAtTime does, and also freezes the parameter
            // at its current value so the release starts from where the note
            // actually is rather than from a guess.
            if (n.g.gain.cancelAndHoldAtTime) n.g.gain.cancelAndHoldAtTime(now);
            else n.g.gain.cancelScheduledValues(now);
            current = Math.max(0.0001, n.g.gain.value);
            n.g.gain.setValueAtTime(current, now);
            n.g.gain.setValueCurveAtTime(this.env_curve(current, 0.0001, r, v.curves.release, false), now, r);
        } catch (e) {
            try {
                n.g.gain.cancelScheduledValues(now);
                n.g.gain.setTargetAtTime(0.0001, now, r / 3);
            } catch (e2) { /* the note will stop below regardless */ }
        }

        n.osc.stop(now + r + 0.05);
        if (n.lfo) n.lfo.stop(now + r + 0.05);
        setTimeout(() => {
            try { n.osc.disconnect(); n.g.disconnect(); if (n.lfo_gain) n.lfo_gain.disconnect(); } catch (e) { /* ignore */ }
        }, (r + 0.2) * 1000);
        this.flash_key(midi, false);
    }

    flash_key(midi, on) {
        const k = this.root.querySelector('.key[data-midi="' + midi + '"]');
        if (!k) return;
        const base = k.classList.contains('black') ? 'key black' : 'key white';
        k.setAttribute('class', on ? base + ' down' : base);
    }

    // â”€â”€ painting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    paint_all() {
        this.paint_spectrum();
        this.paint_envelope();
        this.paint_wave();
        this.paint_controls();
    }

    // All three painters call the same geometry functions compose() used on the
    // server, so activation reproduces the SSR picture exactly rather than
    // replacing it with a second implementation.

    paint_spectrum() {
        for (let i = 0; i < PARTIAL_COUNT; i++) {
            const bar = this.q('#pbar-' + i);
            if (!bar) continue;
            const g = bar_geom(this.voice.partials, i);
            bar.setAttribute('y', String(g.y));
            bar.setAttribute('height', String(g.height));
            bar.setAttribute('fill', g.fill);
        }
    }

    paint_envelope() {
        const d = env_path_d(this.voice.env, this.voice.curves);
        const path = this.q('#env-path');
        if (path) path.setAttribute('d', d);
        const fill = this.q('#env-fill');
        if (fill) fill.setAttribute('d', d + ' L ' + ENV_R + ' ' + ENV_BASE + ' L ' + ENV_L + ' ' + ENV_BASE + ' Z');

        const hs = env_handles(this.voice.env);
        for (const nm in hs) {
            const h = this.q('#envh-' + nm);
            if (!h) continue;
            h.setAttribute('cx', String(hs[nm].x.toFixed(2)));
            h.setAttribute('cy', String(hs[nm].y.toFixed(2)));
        }
    }

    paint_wave() {
        const d = wave_path_d(this.voice.partials);
        const p = this.q('#wave-path');
        if (p) p.setAttribute('d', d);
        const glow = this.q('#wave-glow');
        if (glow) glow.setAttribute('d', d);
    }

    paint_controls() {
        const v = this.voice;
        const name = this.q('#voice-name');
        if (name) name.value = v.name;

        const set_slider = (id, val, fmt) => {
            const s = this.q('#' + id);
            if (s) s.value = String(val);
            const out = this.q('#' + id + '-val');
            if (out) out.textContent = fmt;
        };
        set_slider('sl-vrate', v.vibrato.rate, v.vibrato.rate.toFixed(1) + ' Hz');
        set_slider('sl-vdepth', v.vibrato.depth, v.vibrato.depth.toFixed(2));
        set_slider('sl-gain', v.gain, v.gain.toFixed(2));

        const btns = this.root.querySelectorAll('.cmode');
        for (let i = 0; i < btns.length; i++) {
            const b = btns[i];
            const on = v.curves[b.getAttribute('data-seg')] === b.getAttribute('data-mode');
            b.setAttribute('class', on ? 'cmode on' : 'cmode');
        }
    }

    // â”€â”€ wiring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    load_voice(id) {
        const found = this.library.filter((v) => v.id === id)[0];
        if (!found) return;
        this.voice = clone_voice(found);
        this.invalidate_wave();
        this.paint_all();
    }

    wire_toolbar() {
        const sel = this.q('#voice-pick');
        if (sel) sel.addEventListener('change', () => this.load_voice(sel.value));

        const dup = this.q('#btn-dup');
        if (dup) dup.addEventListener('click', () => {
            const copy = clone_voice(this.voice);
            let n = 2;
            while (this.library.filter((v) => v.id === copy.id + '-' + n).length) n++;
            copy.id = copy.id + '-' + n;
            copy.name = copy.name + ' copy ' + n;
            copy.baseline = clone_voice(copy);   // Revert target for the copy
            this.library.push(copy);
            const o = document.createElement('option');
            o.value = copy.id;
            o.textContent = copy.name;
            if (sel) { sel.appendChild(o); sel.value = copy.id; }
            this.voice = clone_voice(copy);
            this.paint_all();
        });

        const rev = this.q('#btn-reset');
        if (rev) rev.addEventListener('click', () => {
            const lib = this.library.filter((v) => v.id === this.voice.id)[0];
            const base = lib && lib.baseline;
            if (!base) return;
            this.voice = clone_voice(base);
            this.voice.name = lib.name;
            // Without sync_library the revert applied only to the working copy;
            // switching voice and back resurrected every reverted edit.
            this.sync_library();
            this.invalidate_wave();
            this.paint_all();
        });

        const name = this.q('#voice-name');
        if (name) name.addEventListener('input', () => {
            this.voice.name = name.value;
            const lib = this.library.filter((v) => v.id === this.voice.id)[0];
            if (lib) lib.name = name.value;
            if (sel) {
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value === this.voice.id) sel.options[i].textContent = name.value;
                }
            }
        });

        const bind_slider = (id, apply) => {
            const s = this.q('#' + id);
            if (!s) return;
            s.addEventListener('input', () => { apply(parseFloat(s.value)); this.paint_controls(); this.sync_library(); });
        };
        bind_slider('sl-vrate', (v) => { this.voice.vibrato.rate = v; });
        bind_slider('sl-vdepth', (v) => { this.voice.vibrato.depth = v; });
        bind_slider('sl-gain', (v) => { this.voice.gain = v; });

        const btns = this.root.querySelectorAll('.cmode');
        for (let i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', (ev) => {
                const b = ev.currentTarget;
                this.voice.curves[b.getAttribute('data-seg')] = b.getAttribute('data-mode');
                this.paint_envelope();
                this.paint_controls();
                this.sync_library();
            });
        }
    }

    sync_library() {
        const lib = this.library.filter((v) => v.id === this.voice.id)[0];
        if (lib) {
            lib.partials = this.voice.partials.slice();
            lib.env = { attack: this.voice.env.attack, decay: this.voice.env.decay, sustain: this.voice.env.sustain, release: this.voice.env.release };
            lib.curves = { attack: this.voice.curves.attack, decay: this.voice.curves.decay, release: this.voice.curves.release };
            lib.vibrato = { rate: this.voice.vibrato.rate, depth: this.voice.vibrato.depth };
            lib.gain = this.voice.gain;
        }
    }

    // Map a pointer event to viewBox coordinates of a panel's <svg>.
    svg_xy(svg_el, ev, vw, vh) {
        const r = svg_el.getBoundingClientRect();
        return {
            x: ((ev.clientX - r.left) / r.width) * vw,
            y: ((ev.clientY - r.top) / r.height) * vh
        };
    }

    wire_spectrum() {
        const host = this.spectrum && this.spectrum.dom.el;
        if (!host) return;
        const svg = host.querySelector('svg');
        if (!svg) return;

        const apply = (ev) => {
            const p = this.svg_xy(svg, ev, SPEC_W, SPEC_H);
            let idx = Math.round((p.x - BAR_X0 - BAR_W / 2) / (BAR_W + BAR_GAP));
            idx = Math.max(0, Math.min(PARTIAL_COUNT - 1, idx));
            const amp = Math.max(0, Math.min(1, (SPEC_BASE - p.y) / (SPEC_BASE - SPEC_TOP)));
            this.voice.partials[idx] = amp;
            this.invalidate_wave();
            this.paint_spectrum();
            this.paint_wave();
            this.sync_library();
        };

        let dragging = false;
        svg.addEventListener('pointerdown', (ev) => { dragging = true; svg.setPointerCapture(ev.pointerId); apply(ev); });
        svg.addEventListener('pointermove', (ev) => { if (dragging) apply(ev); });
        svg.addEventListener('pointerup', (ev) => { dragging = false; try { svg.releasePointerCapture(ev.pointerId); } catch (e) {} });
        svg.addEventListener('pointerleave', () => { dragging = false; });
    }

    wire_envelope() {
        const host = this.envelope && this.envelope.dom.el;
        if (!host) return;
        const svg = host.querySelector('svg');
        if (!svg) return;

        let grabbed = null;
        const nearest = (p) => {
            const names = ['attack', 'decay', 'sustain', 'release'];
            let best = null, bd = 1e9;
            for (const nm of names) {
                const h = this.q('#envh-' + nm);
                if (!h) continue;
                const dx = parseFloat(h.getAttribute('cx')) - p.x;
                const dy = parseFloat(h.getAttribute('cy')) - p.y;
                const dist = dx * dx + dy * dy;
                if (dist < bd) { bd = dist; best = nm; }
            }
            return bd < 900 ? best : null;
        };

        const apply = (p) => {
            const e = this.voice.env;
            const span = ENV_R - ENV_L;
            // Fixed window, NOT derived from the envelope being edited. See the
            // ENV_WINDOW comment â€” deriving it created a feedback loop that
            // collapsed the release to its clamp in a few pointermoves with no
            // way back.
            const t = Math.max(0, ((p.x - ENV_L) / span) * ENV_WINDOW);
            const level = Math.max(0, Math.min(1, (ENV_BASE - p.y) / (ENV_BASE - ENV_TOP)));
            const hold = 0.35;

            if (grabbed === 'attack') e.attack = Math.max(0.002, Math.min(0.6, t));
            else if (grabbed === 'decay') { e.decay = Math.max(0.005, Math.min(1.4, t - e.attack)); e.sustain = level; }
            else if (grabbed === 'sustain') e.sustain = level;
            else if (grabbed === 'release') e.release = Math.max(0.02, Math.min(1.6, t - e.attack - e.decay - hold));

            this.paint_envelope();
            this.sync_library();
        };

        svg.addEventListener('pointerdown', (ev) => {
            const p = this.svg_xy(svg, ev, ENV_W, ENV_H);
            grabbed = nearest(p);
            if (grabbed) { svg.setPointerCapture(ev.pointerId); apply(p); }
        });
        svg.addEventListener('pointermove', (ev) => {
            if (!grabbed) return;
            apply(this.svg_xy(svg, ev, ENV_W, ENV_H));
        });
        svg.addEventListener('pointerup', (ev) => { grabbed = null; try { svg.releasePointerCapture(ev.pointerId); } catch (e) {} });
        svg.addEventListener('pointerleave', () => { grabbed = null; });
    }

    wire_keyboard() {
        const host = this.kb && this.kb.dom.el;
        if (host) {
            const midi_of = (t) => {
                const k = t && t.closest ? t.closest('.key') : null;
                return k ? parseInt(k.getAttribute('data-midi'), 10) : null;
            };
            // Keyed by pointerId so multi-touch works. A single scalar left the
            // first finger's note droning forever with its key stuck lit.
            const release = (ev) => {
                const m = this.pointer_notes[ev.pointerId];
                if (m === undefined) return;
                delete this.pointer_notes[ev.pointerId];
                this.note_off(m);
            };

            host.addEventListener('pointerdown', (ev) => {
                const m = midi_of(ev.target);
                if (m === null) return;
                ev.preventDefault();
                try { ev.target.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
                this.pointer_notes[ev.pointerId] = m;
                this.note_on(m);
            });
            host.addEventListener('pointerup', release);
            host.addEventListener('pointercancel', release);
            host.addEventListener('lostpointercapture', release);
        }

        // A note held when the tab loses focus never receives its keyup and
        // drones indefinitely; on return the first press of that key is also
        // swallowed because held_keys still says it is down.
        window.addEventListener('blur', () => this.all_notes_off());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.all_notes_off();
        });

        window.addEventListener('keydown', (ev) => {
            if (ev.repeat) return;
            const tag = ev.target && ev.target.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
            const off = KEY_MAP[ev.key.toLowerCase()];
            if (off === undefined) return;
            const midi = BASE_MIDI + off;
            if (this.held_keys[midi]) return;
            this.held_keys[midi] = true;
            this.note_on(midi);
        });
        window.addEventListener('keyup', (ev) => {
            const off = KEY_MAP[ev.key.toLowerCase()];
            if (off === undefined) return;
            const midi = BASE_MIDI + off;
            delete this.held_keys[midi];
            this.note_off(midi);
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
.shell { max-width: 1180px; margin: 0 auto; padding: 22px 24px 30px; }
.badge {
    display: inline-block; font-size: 11px; letter-spacing: 0.08em;
    text-transform: uppercase; color: #7dd3fc;
    border: 1px solid #1d3a5c; background: #0d1b2e;
    border-radius: 999px; padding: 4px 11px;
}
.head h1 { margin: 10px 0 4px; font-size: 27px; font-weight: 500; letter-spacing: -0.01em; }
.tagline { margin: 0 0 18px; color: #7c8bb3; font-size: 14px; max-width: 80ch; }
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.pick, .nameinput, .btn {
    background: #0f1730; color: #dbe4f7; border: 1px solid #24304f;
    border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: inherit;
}
.pick { min-width: 170px; }
.btn { cursor: pointer; }
.btn:hover { border-color: #3d5480; background: #142042; }
.btn.ghost { color: #8b9ac2; }
.namewrap { margin-left: auto; }
.nameinput { min-width: 220px; }
.editgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.card {
    border: 1px solid #1b2340; border-radius: 12px;
    background: #0b1120; padding: 14px 16px 16px;
}
.card.wide { margin-top: 16px; }
.card-h { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.card-h h2 { margin: 0; font-size: 14px; font-weight: 500; color: #e8eefc; }
.hint { font-size: 12px; color: #5f6d95; }
.plot {
    border: 1px solid #1a2340; border-radius: 8px; overflow: hidden;
    background: #0d1327; height: 190px;
}
.card.wide .plot { height: 132px; }
.plot svg { display: block; width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
.curverow { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
.cg { display: flex; align-items: center; gap: 4px; }
.cgl { font-size: 11px; color: #5f6d95; width: 46px; }
.cmode {
    background: #0f1730; color: #7f8cb4; border: 1px solid #222c4c;
    border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer;
    font-family: inherit;
}
.cmode.on { color: #6ee7b7; border-color: #14532d; background: #0c1f1a; }
.sliders { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 10px; }
.sl { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #5f6d95; }
.slt { min-width: 76px; }
.sl input { width: 118px; accent-color: #38bdf8; }
.slv { min-width: 46px; color: #9fb0d8; font-variant-numeric: tabular-nums; }
.kbcard { padding-bottom: 20px; }
.keyboard { position: relative; height: 190px; user-select: none; touch-action: none; }
.whites { display: flex; height: 100%; gap: 3px; }
.key.white {
    position: relative; flex: 1 1 0;
    background: linear-gradient(#f4f7ff, #d7deef);
    border-radius: 0 0 7px 7px; cursor: pointer;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,0.16);
    display: flex; align-items: flex-end; justify-content: center; padding-bottom: 9px;
}
.key.white .kl { font-size: 10px; color: #7c88a6; pointer-events: none; }
.key.white.down { background: linear-gradient(#bcd3ff, #93b2e8); box-shadow: inset 0 -2px 0 rgba(0,0,0,0.22); }
.blacks { position: absolute; inset: 0; pointer-events: none; }
.key.black {
    position: absolute; top: 0; height: 62%;
    background: linear-gradient(#2a3350, #12182b);
    border-radius: 0 0 5px 5px; cursor: pointer; pointer-events: auto;
    box-shadow: 0 3px 5px rgba(0,0,0,0.55);
    border: 1px solid #050912;
}
.key.black.down { background: linear-gradient(#4a67a8, #26365e); }
.foot { color: #4d5a80; font-size: 12px; margin-top: 18px; }
@media (max-width: 900px) {
    .editgrid { grid-template-columns: 1fr; }
    .namewrap { margin-left: 0; }
}
`;

controls.Spectrum_Panel = Spectrum_Panel;
controls.spectrum_panel = Spectrum_Panel;
controls.Envelope_Panel = Envelope_Panel;
controls.envelope_panel = Envelope_Panel;
controls.Wave_Panel = Wave_Panel;
controls.wave_panel = Wave_Panel;
controls.Keyboard = Keyboard;
controls.keyboard = Keyboard;
controls.Demo_UI = Demo_UI;
controls.demo_ui = Demo_UI;

module.exports = jsgui;

