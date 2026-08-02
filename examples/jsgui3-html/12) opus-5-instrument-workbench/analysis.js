// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — timbre descriptors
//
// Objective measures of a voice's spectrum, so synthesis fidelity can be judged
// by number rather than by ear. Every threshold quoted here comes from published
// listener experiments; the citations are in the report that accompanied this
// work, and the key ones are named inline.
//
// The important property: all of these are defined on the NORMALISED amplitude
// distribution p(h) = a(h) / Σa, so they are invariant to the single global
// scalar that createPeriodicWave's peak normalisation applies. That is what
// makes them comparable against published values for real instruments even
// though absolute level here is meaningless.
//
// No FFT is needed for the steady-state descriptors: the partial amplitudes ARE
// the spectrum. An FFT is only required for temporal measures (attack time,
// spectral flux) and for anything with added noise.
// ─────────────────────────────────────────────────────────────────────────────

const EPS = 1e-12;

const magnitudes = (partials) => partials.map(Math.abs);

const normalise = (partials) => {
    const a = magnitudes(partials);
    const sum = a.reduce((s, v) => s + v, 0);
    if (sum < EPS) return a.map(() => 0);
    return a.map((v) => v / sum);
};

// ── spectral shape ───────────────────────────────────────────────────────────

// Centroid in HARMONIC RANKS. Use this to compare voices at a common pitch.
// Real instruments span roughly 2.5–5.5 ranks; a ten-instrument stimulus set
// used by Beauchamp averaged 3.7. Carral's morphing experiment on real trombone
// recordings puts the JND at 0.08 ranks for 50% discrimination, 0.11 for 75%.
const centroid_rank = (partials) => {
    const p = normalise(partials);
    let c = 0;
    for (let i = 0; i < p.length; i++) c += (i + 1) * p[i];
    return c;
};

// Centroid in Hz. Use this when comparing ACROSS pitches — Schubert & Wolfe
// found brightness ratings track raw Hz far better than centroid/f0 when pitch
// is not held constant.
const centroid_hz = (partials, f0) => centroid_rank(partials) * f0;

const spread_rank = (partials) => {
    const p = normalise(partials);
    const c = centroid_rank(partials);
    let v = 0;
    for (let i = 0; i < p.length; i++) v += Math.pow(i + 1 - c, 2) * p[i];
    return Math.sqrt(v);
};

const skewness = (partials) => {
    const p = normalise(partials);
    const c = centroid_rank(partials);
    const s = spread_rank(partials);
    if (s < EPS) return 0;
    let v = 0;
    for (let i = 0; i < p.length; i++) v += Math.pow(i + 1 - c, 3) * p[i];
    return v / Math.pow(s, 3);
};

// Tristimulus (Pollard & Jansson) on amplitudes, not powers. T1+T2+T3 === 1.
// T1 high  → fundamental-dominated, flute-like.
// T2 high  → mid partials 2–4 dominate, "warm".
// T3 high  → energy above partial 5, bright/reedy.
const tristimulus = (partials) => {
    const p = normalise(partials);
    const at = (n) => p[n - 1] || 0;
    const T1 = at(1);
    const T2 = at(2) + at(3) + at(4);
    let T3 = 0;
    for (let n = 5; n <= p.length; n++) T3 += at(n);
    return { T1, T2, T3 };
};

// Odd-to-even ENERGY ratio. > 1 means hollow / stopped-pipe / clarinet-like.
// A pure square wave is infinite; a sawtooth is near 1.
const odd_even_ratio = (partials) => {
    const a = magnitudes(partials);
    let odd = 0, even = 0;
    for (let i = 0; i < a.length; i++) {
        const n = i + 1;
        if (n % 2 === 1) odd += a[i] * a[i];
        else even += a[i] * a[i];
    }
    return even < EPS ? Infinity : odd / even;
};

// Harmonic spectral deviation — Krimphoff's "jaggedness". Each partial's
// departure from the local three-point average.
//
// THIS IS THE ONE THAT MATTERS MOST for an additive synth. In McAdams,
// Beauchamp & Meneguzzi, smoothing the spectral envelope was the single most
// discriminable simplification at 96%. A smooth exponential roll-off — the
// obvious thing to write by hand — gives HDEV ≈ 0, which is exactly the
// signature listeners latch onto as synthetic.
// Computed on LOG amplitudes, in dB. That is deliberate and it matters: on
// linear amplitudes the measure is sensitive to overall spectral tilt, so
// making a spectrum brighter shrinks every normalised value and the deviation
// falls even as genuine notches are added. Measured that happening: applying a
// physically correct strike comb to the piano — which zeroes partials 8 and 16
// — made a linear-amplitude deviation go DOWN, from 0.0070 to 0.0042. The log
// form is slope-invariant, so it measures jaggedness alone, which is what
// Krimphoff's irregularity is for.
//
// Units are dB. A smooth geometric roll-off gives ~0 regardless of how steep it
// is. Isolated notches and formant peaks are what raise it.
const FLOOR_DB = -80;

const spectral_deviation = (partials) => {
    const p = normalise(partials);
    const n = p.length;
    const db = p.map((v) => Math.max(FLOOR_DB, 20 * Math.log10(Math.max(v, EPS))));
    let dev = 0;
    for (let i = 0; i < n; i++) {
        const lo = i === 0 ? db[0] : db[i - 1];
        const hi = i === n - 1 ? db[n - 1] : db[i + 1];
        const local = (lo + db[i] + hi) / 3;
        dev += Math.abs(db[i] - local);
    }
    return dev / n;
};

// Rolloff: the harmonic rank below which `frac` of the ENERGY lies.
// Timbre Toolbox uses 0.95; state the threshold whenever quoting a value.
const rolloff_rank = (partials, frac) => {
    const a = magnitudes(partials);
    const total = a.reduce((s, v) => s + v * v, 0);
    if (total < EPS) return 0;
    const target = (frac === undefined ? 0.95 : frac) * total;
    let acc = 0;
    for (let i = 0; i < a.length; i++) {
        acc += a[i] * a[i];
        if (acc >= target) return i + 1;
    }
    return a.length;
};

// Slope of log-amplitude against harmonic rank, in dB per partial. Steeper
// (more negative) = darker. Useful as a single-number brightness proxy that is
// less sensitive than the centroid to one loud upper partial.
const spectral_slope_db = (partials) => {
    const a = magnitudes(partials);
    const xs = [], ys = [];
    for (let i = 0; i < a.length; i++) {
        if (a[i] < 1e-6) continue;               // genuinely absent partials skew the fit
        xs.push(i + 1);
        ys.push(20 * Math.log10(a[i]));
    }
    if (xs.length < 2) return 0;
    const n = xs.length;
    const mx = xs.reduce((s, v) => s + v, 0) / n;
    const my = ys.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - mx) * (ys[i] - my);
        den += (xs[i] - mx) * (xs[i] - mx);
    }
    return den < EPS ? 0 : num / den;
};

// ── comparing two spectra ────────────────────────────────────────────────────

// Relative-amplitude spectral error (Beauchamp/Horner). The best-validated
// whole-spectrum similarity measure available: at a = 1 it explains R² = 91% of
// listener-discrimination variance across eight instruments, beating
// critical-band, mel-band and MFCC distances.
//
// Detection thresholds from that work:
//   < 0.08  essentially undetectable
//   0.16–0.24  moderately detectable
//   > 0.32  obvious
//
// Note R² saturates around five harmonics — listeners discriminate on the low
// partials. Being accurate on 1–5 matters; above 8 barely does.
const relative_spectral_error = (a_partials, b_partials) => {
    const A = magnitudes(a_partials);
    const B = magnitudes(b_partials);
    const n = Math.max(A.length, B.length);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        const av = A[i] || 0;
        const bv = B[i] || 0;
        num += Math.abs(av - bv);
        den += av;
    }
    return den < EPS ? 0 : num / den;
};

// Mean absolute per-harmonic level error, in dB, after level-matching.
// Carral's 2AFC on synthesised trombone: 0.86 dB → 50% discrimination,
// 1.28 dB → 75%. Within ~0.9 dB RMS, listeners are at chance.
const level_error_db = (a_partials, b_partials) => {
    const A = normalise(a_partials);
    const B = normalise(b_partials);
    const n = Math.max(A.length, B.length);
    let sum = 0, count = 0;
    for (let i = 0; i < n; i++) {
        const av = A[i] || 0;
        const bv = B[i] || 0;
        if (av < 1e-6 && bv < 1e-6) continue;     // both silent — not a difference
        const adb = 20 * Math.log10(Math.max(av, 1e-6));
        const bdb = 20 * Math.log10(Math.max(bv, 1e-6));
        sum += Math.abs(adb - bdb);
        count++;
    }
    return count === 0 ? 0 : sum / count;
};

// ── published reference ranges ───────────────────────────────────────────────
//
// What a REAL instrument measures, so a synthesised voice can be compared
// against a number rather than a vibe. These are broad by design: they are
// drawn from the ranges reported in the literature, not from a single
// authoritative table, and they are a plausibility check rather than a target.

const REFERENCE = {
    centroid_rank: { min: 2.5, max: 5.5, typical: 3.7, note: 'Beauchamp 10-instrument set averaged 3.7' },
    centroid_jnd_rank: { p50: 0.08, p75: 0.11, note: 'Carral, trombone morphing' },
    level_error_db: { p50: 0.86, p75: 1.28, note: 'Carral, 2AFC synthesised trombone' },
    spectral_error: { undetectable: 0.08, moderate: 0.16, obvious: 0.32, note: 'Beauchamp/Horner, R2=0.91' },
    damping_jnd: { fraction: 0.20, note: 'Woodhouse — a factor of 2 is not clearly audible' }
};

const describe = (partials, f0) => ({
    centroid_rank: centroid_rank(partials),
    centroid_hz: f0 ? centroid_hz(partials, f0) : null,
    spread_rank: spread_rank(partials),
    skewness: skewness(partials),
    tristimulus: tristimulus(partials),
    odd_even_ratio: odd_even_ratio(partials),
    spectral_deviation: spectral_deviation(partials),
    rolloff_rank: rolloff_rank(partials, 0.95),
    spectral_slope_db: spectral_slope_db(partials)
});

module.exports = {
    normalise,
    centroid_rank,
    centroid_hz,
    spread_rank,
    skewness,
    tristimulus,
    odd_even_ratio,
    spectral_deviation,
    rolloff_rank,
    spectral_slope_db,
    relative_spectral_error,
    level_error_db,
    describe,
    REFERENCE
};
