// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — "Instrument Workbench" · voice definitions
//
// Shared by server and client. Plain data plus pure functions, no DOM, no audio.
//
// The model is additive: a voice is 16 harmonic partial amplitudes (which give
// it its timbre) plus an amplitude envelope (which gives it its articulation).
// That pairing is what actually separates a piano from an oboe — not a
// waveform name. A PeriodicWave is built from the partials and an envelope is
// applied to a gain node, so what the editor shows is literally what is heard.
// ─────────────────────────────────────────────────────────────────────────────

const PARTIAL_COUNT = 16;

// curve modes for an envelope segment
//   linear : straight ramp
//   curve  : exponential-ish ease, the natural shape for struck and plucked strings
//   jag    : stepped zig-zag, useful for reedy and buzzy attacks
const CURVE_MODES = ['linear', 'curve', 'jag'];

const pad = (arr) => {
    const out = arr.slice(0, PARTIAL_COUNT);
    while (out.length < PARTIAL_COUNT) out.push(0);
    return out;
};

const INSTRUMENTS = [
    {
        id: 'piano',
        name: 'Piano',
        // Dense but fast-rolling-off partials; the character is in the envelope:
        // near-instant attack, long decay, no sustain at all.
        partials: pad([1, 0.56, 0.38, 0.22, 0.16, 0.10, 0.085, 0.055, 0.042, 0.033, 0.026, 0.02, 0.016, 0.012, 0.01, 0.008]),
        env: { attack: 0.004, decay: 0.9, sustain: 0.0, release: 0.35 },
        curves: { attack: 'linear', decay: 'curve', release: 'curve' },
        vibrato: { rate: 0, depth: 0 },
        drift: 0.0015,
        gain: 0.9
    },
    {
        id: 'organ',
        name: 'Organ',
        // Odd harmonics only — clarinet-like, a stopped-pipe registration. The
        // even partials are genuinely absent; measured at -106 dB in the
        // rendered audio. Square-on attack and full sustain, because a pipe
        // does not decay.
        partials: pad([1, 0.0, 0.85, 0.0, 0.55, 0.0, 0.42, 0.0, 0.3, 0.0, 0.18, 0.0, 0.12, 0.0, 0.08, 0.0]),
        env: { attack: 0.012, decay: 0.04, sustain: 0.96, release: 0.06 },
        curves: { attack: 'linear', decay: 'linear', release: 'linear' },
        vibrato: { rate: 0, depth: 0 },
        drift: 0,
        gain: 0.62
    },
    {
        id: 'oboe',
        name: 'Oboe',
        // Weak fundamental, dominant 3rd partial — the classic nasal double-reed
        // formant. Jagged attack for the reed's initial bite.
        partials: pad([0.42, 0.3, 1, 0.55, 0.72, 0.34, 0.48, 0.24, 0.3, 0.16, 0.2, 0.11, 0.13, 0.07, 0.08, 0.05]),
        env: { attack: 0.045, decay: 0.14, sustain: 0.82, release: 0.12 },
        curves: { attack: 'jag', decay: 'linear', release: 'linear' },
        vibrato: { rate: 5.2, depth: 0.5 },
        drift: 0.001,
        gain: 0.6
    },
    {
        id: 'flute',
        name: 'Flute',
        // Almost a pure sine with a touch of second partial and breath. Soft
        // curved attack, gentle vibrato.
        partials: pad([1, 0.14, 0.07, 0.035, 0.022, 0.014, 0.01, 0.007, 0.005, 0.004, 0.003, 0.002, 0.002, 0.001, 0.001, 0.001]),
        env: { attack: 0.07, decay: 0.1, sustain: 0.88, release: 0.14 },
        curves: { attack: 'curve', decay: 'curve', release: 'curve' },
        vibrato: { rate: 5.6, depth: 0.85 },
        drift: 0.0022,
        gain: 0.72
    },
    {
        id: 'tuba',
        name: 'Tuba',
        // Heavy lower partials, slow lip-driven attack. Everything above the
        // 8th partial is essentially absent.
        partials: pad([1, 0.72, 0.5, 0.34, 0.2, 0.13, 0.08, 0.05, 0.03, 0.02, 0.012, 0.008, 0.005, 0.003, 0.002, 0.001]),
        env: { attack: 0.085, decay: 0.22, sustain: 0.8, release: 0.2 },
        curves: { attack: 'curve', decay: 'linear', release: 'curve' },
        vibrato: { rate: 0, depth: 0 },
        drift: 0.0012,
        gain: 0.95
    },
    {
        id: 'cello',
        name: 'Cello',
        // Sawtooth-leaning spectrum, as a bowed string is. Slow bow-speed
        // attack and pronounced vibrato.
        partials: pad([1, 0.62, 0.48, 0.36, 0.3, 0.24, 0.2, 0.16, 0.13, 0.11, 0.09, 0.07, 0.055, 0.045, 0.035, 0.028]),
        env: { attack: 0.095, decay: 0.2, sustain: 0.79, release: 0.24 },
        curves: { attack: 'curve', decay: 'linear', release: 'curve' },
        vibrato: { rate: 4.6, depth: 1.2 },
        drift: 0.0018,
        gain: 0.75
    }
];

const clone_voice = (v) => ({
    id: v.id,
    name: v.name,
    partials: v.partials.slice(),
    env: { attack: v.env.attack, decay: v.env.decay, sustain: v.env.sustain, release: v.env.release },
    curves: { attack: v.curves.attack, decay: v.curves.decay, release: v.curves.release },
    vibrato: { rate: v.vibrato.rate, depth: v.vibrato.depth },
    drift: v.drift,
    gain: v.gain,
    // Oscillation controls. Absent on the six built-ins, whose spectra are
    // hand-written rather than generated from a shape recipe.
    shape_kind: v.shape_kind || null,
    jag: v.jag || 0
});

// Shape a normalised 0..1 progress by curve mode. Shared by the envelope
// drawing and the audio scheduler so the picture cannot drift from the sound.
const JAG_STEPS = 6;
const JAG_AMOUNT = 0.13;

const shape = (t, mode, rising) => {
    const u = Math.max(0, Math.min(1, t));
    if (mode === 'curve') return rising ? u * u : 1 - (1 - u) * (1 - u);
    if (mode === 'jag') {
        // A linear ramp with triangular jags superimposed. The sin(pi*u) term
        // tapers the jags to nothing at both ends, which is what guarantees
        // shape(0)===0 and shape(1)===1.
        //
        // The earlier staircase form returned 0.08 at t=0, so every jagged
        // attack began with an 8% gain step — an audible click on every note,
        // and inaudible in the picture because 0.08 of panel height is 11px.
        const zig = Math.abs((u * JAG_STEPS) % 2 - 1) * 2 - 1;
        const v = u + JAG_AMOUNT * zig * Math.sin(Math.PI * u);
        return Math.max(0, Math.min(1, v));
    }
    return u;
};

// ── waveform character ───────────────────────────────────────────────────────
//
// Classic oscillator shapes expressed as harmonic recipes, so asking for a
// square is the same act as drawing one — there is no separate oscillator mode
// hiding behind the spectrum.
//
// Partials are SIGNED. Sawtooth and square are exact with positive coefficients
// alone, but a triangle needs alternating signs (odd harmonics, 1/n^2, flipping
// each time); without them you get a rounded wave that is not a triangle.
// The bar editor edits magnitude and preserves whatever sign a partial has.
const WAVE_SHAPES = ['sine', 'triangle', 'sawtooth', 'square'];

const shape_partials = (kind, jag) => {
    const out = new Array(PARTIAL_COUNT).fill(0);
    const amount = Math.max(0, Math.min(1, jag || 0));

    for (let i = 0; i < PARTIAL_COUNT; i++) {
        const n = i + 1;
        const odd = n % 2 === 1;
        if (kind === 'sine') out[i] = n === 1 ? 1 : 0;
        else if (kind === 'triangle') out[i] = odd ? Math.pow(-1, (n - 1) / 2) / (n * n) : 0;
        else if (kind === 'sawtooth') out[i] = 1 / n;
        else if (kind === 'square') out[i] = odd ? 1 / n : 0;
    }

    // "Jag" lifts the upper harmonics, which is what makes an oscillation look
    // and sound edgier without changing its fundamental character.
    if (amount > 0) {
        for (let i = 0; i < PARTIAL_COUNT; i++) {
            const n = i + 1;
            if (n === 1) continue;
            const lift = amount * 0.55 * Math.pow(n / PARTIAL_COUNT, 0.6);
            const sign = out[i] < 0 ? -1 : 1;
            out[i] = sign * Math.min(1, Math.abs(out[i]) + lift);
        }
    }

    const peak = Math.max.apply(null, out.map(Math.abs));
    if (peak > 0) for (let i = 0; i < PARTIAL_COUNT; i++) out[i] = out[i] / peak;
    return out;
};

// One cycle of the waveform implied by the partials, sampled to `n` points.
const wave_cycle = (partials, n) => {
    const pts = [];
    const denom = n > 1 ? n - 1 : 1;
    let peak = 0;
    for (let i = 0; i < n; i++) {
        const phase = (i / denom) * Math.PI * 2;
        let v = 0;
        for (let h = 0; h < partials.length; h++) {
            if (!partials[h]) continue;
            v += partials[h] * Math.sin(phase * (h + 1));
        }
        pts.push(v);
        if (Math.abs(v) > peak) peak = Math.abs(v);
    }
    if (peak > 0) for (let i = 0; i < pts.length; i++) pts[i] /= peak;
    return pts;
};

// Envelope as normalised points over a fixed display window, honouring the
// per-segment curve modes.
const env_points = (env, curves, n) => {
    const a = Math.max(0.001, env.attack);
    const d = Math.max(0.001, env.decay);
    const r = Math.max(0.001, env.release);
    const hold = 0.35;
    const total = a + d + hold + r;
    const pts = [];
    const denom = n > 1 ? n - 1 : 1;
    for (let i = 0; i < n; i++) {
        const t = (i / denom) * total;
        let v;
        if (t < a) {
            v = shape(t / a, curves.attack, true);
        } else if (t < a + d) {
            const p = (t - a) / d;
            v = 1 - (1 - env.sustain) * shape(p, curves.decay, false);
        } else if (t < a + d + hold) {
            v = env.sustain;
        } else {
            const p = (t - a - d - hold) / r;
            v = env.sustain * (1 - shape(p, curves.release, false));
        }
        pts.push(Math.max(0, Math.min(1, v)));
    }
    return pts;
};

module.exports = {
    PARTIAL_COUNT,
    CURVE_MODES,
    WAVE_SHAPES,
    INSTRUMENTS,
    pad,
    shape_partials,
    clone_voice,
    shape,
    wave_cycle,
    env_points
};

