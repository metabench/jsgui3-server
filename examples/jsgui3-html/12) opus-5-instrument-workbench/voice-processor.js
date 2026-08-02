// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — additive voice AudioWorkletProcessor
//
// Served verbatim at /voice-processor.js and loaded with addModule(). It is NOT
// bundled with client.js: an AudioWorklet module is evaluated in a separate
// global scope with no window, no document and no DOM, so it cannot share the
// bundle.
//
// WHY THIS EXISTS
//
// The previous engine used one OscillatorNode per note driving a fixed
// PeriodicWave. A PeriodicWave has no properties, no methods and no AudioParam:
// once created its normalised spectrum can never change. Every note therefore
// had a frame-to-frame spectral correlation of exactly 1.0, where real
// instruments measure 0.94–1.00 — off the end of the natural range.
//
// In McAdams, Beauchamp & Meneguzzi, forcing all partials to share one
// amplitude envelope — precisely what one gain ADSR on a fixed waveform does —
// was discriminated by 91% of listeners, second only to smoothing the spectral
// envelope. This processor exists to give each partial its own envelope.
//
// WHAT IT ADDS OVER A FIXED WAVETABLE
//
//   1. Per-partial decay.  For any freely decaying mode tau = Q/(pi*f), so with
//      roughly constant Q the decay time is inversely proportional to partial
//      frequency. Higher partials die first, and the spectral centroid falls
//      through the note — the defining behaviour of struck and plucked tone.
//   2. Dynamics-driven spectral tilt.  Real instruments get BRIGHTER when
//      played harder, they do not simply get louder. A measured trombone
//      crescendo raises the fundamental 8 dB while the ninth harmonic rises
//      more than 45 dB. Velocity here scales upper partials superlinearly.
//   3. Inharmonicity.  Piano partials sit at n*f0*sqrt(1+B*n^2), not at integer
//      multiples. This is impossible with a PeriodicWave, whose partials are
//      rigidly harmonic by construction.
//   4. Onset asynchrony.  Partials do not all start together in a real
//      instrument; a few ms of stagger is below the ~20-30 ms fusion threshold
//      so it is heard as one event with a richer attack.
// ─────────────────────────────────────────────────────────────────────────────

const PARTIALS = 16;
const TWO_PI = Math.PI * 2;

// Mirrors shape() in instruments.js. Duplicated deliberately: the worklet
// global scope cannot import from the bundle, and a divergence here would make
// the sound disagree with the drawn envelope. The unit tests assert the two
// implementations agree numerically.
const JAG_STEPS = 6;
const JAG_AMOUNT = 0.13;

const shape = (t, mode, rising) => {
    const u = t < 0 ? 0 : t > 1 ? 1 : t;
    if (mode === 'curve') return rising ? u * u : 1 - (1 - u) * (1 - u);
    if (mode === 'jag') {
        const zig = Math.abs((u * JAG_STEPS) % 2 - 1) * 2 - 1;
        const v = u + JAG_AMOUNT * zig * Math.sin(Math.PI * u);
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }
    return u;
};

class Note {
    constructor(midi, voice, velocity, sample_rate) {
        this.midi = midi;
        this.voice = voice;
        this.sr = sample_rate;
        this.released = false;
        this.done = false;
        this.t = 0;

        const f0 = 440 * Math.pow(2, (midi - 69) / 12);
        const detune = voice.drift ? (Math.random() * 2 - 1) * voice.drift : 0;
        this.f0 = f0 * (1 + detune);

        const vel = velocity === undefined ? 0.8 : Math.max(0.05, Math.min(1, velocity));
        this.vel = vel;

        const B = voice.inharmonicity || 0;
        const tilt = voice.tilt === undefined ? 0.45 : voice.tilt;
        const decay_exp = voice.decay_exponent === undefined ? 1 : voice.decay_exponent;
        const async_ms = voice.asynchrony || 0;

        this.phase = new Float64Array(PARTIALS);
        this.freq = new Float64Array(PARTIALS);
        this.amp = new Float64Array(PARTIALS);
        this.tau = new Float64Array(PARTIALS);
        this.delay = new Float64Array(PARTIALS);

        for (let i = 0; i < PARTIALS; i++) {
            const n = i + 1;
            // Inharmonic partial placement. B = 0 gives exact harmonics.
            this.freq[i] = n * this.f0 * Math.sqrt(1 + B * n * n);

            // Dynamics tilt: at full velocity the spectrum is as drawn; quieter
            // playing rolls the upper partials off superlinearly, so the note
            // darkens as it softens rather than merely shrinking.
            const tilt_gain = Math.pow(vel, tilt * (n - 1) / PARTIALS + 0.0);
            this.amp[i] = voice.partials[i] * tilt_gain;

            // Per-partial decay time. decay_exponent 1 gives tau proportional
            // to 1/f (constant Q); 0 collapses to the old shared envelope.
            this.tau[i] = Math.max(0.02, voice.env.decay / Math.pow(n, decay_exp));

            // Onset asynchrony, deterministic per partial so a note is stable.
            this.delay[i] = (async_ms / 1000) * (i / PARTIALS);

            this.phase[i] = Math.random() * TWO_PI;
        }

        this.release_t = 0;
        this.rel_level = new Float64Array(PARTIALS);
    }

    release(now_t) {
        if (this.released) return;
        this.released = true;
        this.release_t = now_t;
        for (let i = 0; i < PARTIALS; i++) this.rel_level[i] = this.level(i, now_t);
    }

    // Per-partial amplitude at time t. This is the whole point of the worklet:
    // each partial has its own attack, its own decay constant, and its own
    // sustain floor, so the spectrum genuinely evolves.
    level(i, t) {
        const v = this.voice;
        const a = Math.max(0.001, v.env.attack);
        const d = this.tau[i];
        const sus = v.env.sustain;
        const local = t - this.delay[i];
        if (local <= 0) return 0;

        if (this.released) {
            const r = Math.max(0.02, v.env.release) / Math.pow(i + 1, 0.5);
            const p = (t - this.release_t) / r;
            if (p >= 1) return 0;
            return this.rel_level[i] * (1 - shape(p, v.curves.release, false));
        }
        if (local < a) return shape(local / a, v.curves.attack, true);
        // Exponential decay toward the sustain floor with a per-partial tau.
        const decayed = Math.exp(-(local - a) / d);
        return sus + (1 - sus) * decayed;
    }

    render(out, frames) {
        const sr = this.sr;
        const dt = 1 / sr;
        let alive = false;
        for (let f = 0; f < frames; f++) {
            const t = this.t + f * dt;
            let s = 0;
            for (let i = 0; i < PARTIALS; i++) {
                const a = this.amp[i];
                if (a === 0) continue;
                const lv = this.level(i, t);
                if (lv <= 1e-5) continue;
                alive = true;
                this.phase[i] += TWO_PI * this.freq[i] * dt;
                if (this.phase[i] > TWO_PI) this.phase[i] -= TWO_PI;
                s += a * lv * Math.sin(this.phase[i]);
            }
            out[f] += s * this.vel * (this.voice.gain === undefined ? 0.8 : this.voice.gain) * 0.16;
        }
        this.t += frames * dt;
        if (!alive && (this.released || this.t > 0.1)) this.done = true;
        return alive;
    }
}

class Additive_Voice_Processor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.notes = new Map();
        this.port.onmessage = (ev) => {
            const m = ev.data || {};
            if (m.type === 'note_on') {
                if (this.notes.has(m.midi)) this.notes.get(m.midi).release(this.notes.get(m.midi).t);
                this.notes.set(m.midi, new Note(m.midi, m.voice, m.velocity, sampleRate));
            } else if (m.type === 'note_off') {
                const n = this.notes.get(m.midi);
                if (n) { n.release(n.t); this.notes.delete(m.midi); this.dying = this.dying || []; this.dying.push(n); }
            } else if (m.type === 'all_off') {
                for (const n of this.notes.values()) { n.release(n.t); (this.dying = this.dying || []).push(n); }
                this.notes.clear();
            }
        };
    }

    process(inputs, outputs) {
        const out = outputs[0];
        const ch = out[0];
        const frames = ch.length;
        for (let i = 0; i < frames; i++) ch[i] = 0;

        for (const n of this.notes.values()) n.render(ch, frames);

        if (this.dying && this.dying.length) {
            for (let i = this.dying.length - 1; i >= 0; i--) {
                this.dying[i].render(ch, frames);
                if (this.dying[i].done) this.dying.splice(i, 1);
            }
        }

        // Soft clip — several held notes sum past full scale, and a chord
        // should compress rather than tear.
        for (let i = 0; i < frames; i++) {
            const v = ch[i];
            ch[i] = v > 1 || v < -1 ? Math.tanh(v) : v - (v * v * v) / 6;
        }

        for (let c = 1; c < out.length; c++) out[c].set(ch);
        return true;
    }
}

registerProcessor('additive-voice', Additive_Voice_Processor);
