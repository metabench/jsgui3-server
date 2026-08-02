const assert = require('assert');
const path = require('path');

// Unit tests for the pure functions behind example 12, the Opus 5 Instrument
// Workbench. These are the mathematical core: they decide both the picture the
// SVG panels draw and the audio Web Audio synthesises, so an error here is
// simultaneously a visual bug and an audible one.
//
// Deliberately fast and deterministic — no DOM, no audio context, no server.
// The browser-level behaviour is covered separately by the puppeteer suite.

const EX = path.join(
    __dirname, '..', 'examples', 'jsgui3-html', '12) opus-5-instrument-workbench'
);
const V = require(path.join(EX, 'instruments'));

const { PARTIAL_COUNT, CURVE_MODES, INSTRUMENTS, pad, clone_voice, shape, wave_cycle, env_points } = V;

const sample = (n, fn) => Array.from({ length: n }, (_, i) => fn(i / (n - 1)));

describe('Instrument Workbench — voice definitions', () => {
    it('ships the six documented instruments', () => {
        assert.deepStrictEqual(
            INSTRUMENTS.map((v) => v.id),
            ['piano', 'organ', 'oboe', 'flute', 'tuba', 'cello']
        );
    });

    INSTRUMENTS.forEach((v) => {
        describe(v.id, () => {
            it('has exactly ' + PARTIAL_COUNT + ' finite partials in 0..1', () => {
                assert.strictEqual(v.partials.length, PARTIAL_COUNT);
                v.partials.forEach((p, i) => {
                    assert.ok(Number.isFinite(p), 'partial ' + i + ' is not finite');
                    assert.ok(p >= 0 && p <= 1, 'partial ' + i + ' out of range: ' + p);
                });
            });

            it('has a non-silent spectrum', () => {
                assert.ok(v.partials.some((p) => p > 0.05), 'every partial is near zero');
            });

            it('declares finite envelope times and a sustain in 0..1', () => {
                ['attack', 'decay', 'release'].forEach((k) => {
                    assert.ok(Number.isFinite(v.env[k]) && v.env[k] > 0, k + ' must be > 0');
                });
                assert.ok(v.env.sustain >= 0 && v.env.sustain <= 1);
            });

            it('uses only known curve modes', () => {
                ['attack', 'decay', 'release'].forEach((k) => {
                    assert.ok(CURVE_MODES.indexOf(v.curves[k]) !== -1, k + ': ' + v.curves[k]);
                });
            });
        });
    });

    it('gives the organ genuinely absent even partials', () => {
        // The README and the panel both claim odd-harmonics-only. If someone
        // edits the drawbars this catches the docs going stale.
        const organ = INSTRUMENTS.filter((v) => v.id === 'organ')[0];
        [1, 3, 5, 7].forEach((i) => assert.strictEqual(organ.partials[i], 0, 'partial ' + (i + 1)));
        assert.ok(organ.partials[0] > 0.5 && organ.partials[2] > 0.5);
    });

    it('gives the flute a near-pure fundamental', () => {
        const flute = INSTRUMENTS.filter((v) => v.id === 'flute')[0];
        assert.ok(flute.partials[0] > 0.9);
        assert.ok(flute.partials.slice(1).every((p) => p < 0.2));
    });
});

describe('Instrument Workbench — shape()', () => {
    CURVE_MODES.forEach((mode) => {
        describe(mode, () => {
            it('starts at exactly 0 and ends at exactly 1', () => {
                // 'jag' used to return 0.08 at t=0, putting an 8% gain step at
                // the start of every jagged attack — an audible click, and
                // invisible in the panel because 0.08 of height is 11px.
                assert.strictEqual(shape(0, mode, true), 0);
                assert.strictEqual(shape(1, mode, true), 1);
            });

            it('never leaves 0..1 across 201 samples', () => {
                sample(201, (t) => shape(t, mode, true)).forEach((v, i) => {
                    assert.ok(Number.isFinite(v), 'NaN at sample ' + i);
                    assert.ok(v >= 0 && v <= 1, 'out of range at sample ' + i + ': ' + v);
                });
            });

            it('clamps input outside 0..1', () => {
                assert.strictEqual(shape(-0.5, mode, true), 0);
                assert.strictEqual(shape(1.5, mode, true), 1);
            });
        });
    });

    it('linear is the identity', () => {
        sample(21, (t) => t).forEach((t) => {
            assert.ok(Math.abs(shape(t, 'linear', true) - t) < 1e-12);
        });
    });

    it('curve eases in when rising and out when falling', () => {
        assert.ok(shape(0.5, 'curve', true) < 0.5, 'rising curve should lag linear');
        assert.ok(shape(0.5, 'curve', false) > 0.5, 'falling curve should lead linear');
    });

    it('jag actually deviates from linear in the middle', () => {
        const deviations = sample(41, (t) => Math.abs(shape(t, 'jag', true) - t));
        assert.ok(Math.max.apply(null, deviations) > 0.05, 'jag is indistinguishable from linear');
    });
});

describe('Instrument Workbench — wave_cycle()', () => {
    it('normalises a pure fundamental to unit peak', () => {
        const p = new Array(PARTIAL_COUNT).fill(0);
        p[0] = 1;
        const w = wave_cycle(p, 256);
        assert.ok(Math.abs(Math.max.apply(null, w.map(Math.abs)) - 1) < 1e-9);
    });

    it('is continuous across the cycle boundary', () => {
        INSTRUMENTS.forEach((v) => {
            const w = wave_cycle(v.partials, 256);
            assert.ok(Math.abs(w[0] - w[w.length - 1]) < 0.02, v.id + ' wraps discontinuously');
        });
    });

    it('survives an all-zero spectrum without NaN', () => {
        // Reachable in about three seconds by dragging every bar to the floor.
        const w = wave_cycle(new Array(PARTIAL_COUNT).fill(0), 64);
        assert.ok(w.every((n) => n === 0), 'expected a flat line');
        assert.ok(w.every(Number.isFinite));
    });

    it('survives n = 1 without dividing by zero', () => {
        const w = wave_cycle(INSTRUMENTS[0].partials, 1);
        assert.strictEqual(w.length, 1);
        assert.ok(Number.isFinite(w[0]), 'got ' + w[0]);
    });

    it('produces a finite bounded cycle for every instrument', () => {
        INSTRUMENTS.forEach((v) => {
            wave_cycle(v.partials, 240).forEach((n) => {
                assert.ok(Number.isFinite(n), v.id + ' produced a non-finite sample');
                assert.ok(Math.abs(n) <= 1.000001, v.id + ' exceeded unit peak: ' + n);
            });
        });
    });

    it('changes shape when a partial changes', () => {
        const a = wave_cycle(INSTRUMENTS[0].partials, 64);
        const edited = INSTRUMENTS[0].partials.slice();
        edited[4] = edited[4] > 0.5 ? 0 : 1;
        const b = wave_cycle(edited, 64);
        assert.ok(a.some((n, i) => Math.abs(n - b[i]) > 1e-6), 'editing a partial did nothing');
    });
});

describe('Instrument Workbench — env_points()', () => {
    INSTRUMENTS.forEach((v) => {
        it(v.id + ' starts and ends silent, and peaks near full', () => {
            const e = env_points(v.env, v.curves, 200);
            assert.ok(e[0] < 1e-6, v.id + ' starts at ' + e[0] + ' — audible click');
            assert.ok(e[e.length - 1] < 1e-6, v.id + ' ends at ' + e[e.length - 1]);
            const peak = Math.max.apply(null, e);
            assert.ok(peak > 0.95 && peak <= 1, v.id + ' peaks at ' + peak);
        });

        it(v.id + ' is continuous when sampled finely enough to resolve its shortest segment', () => {
            // Sampling at a fixed count is not a fair test of continuity: the
            // piano's 4 ms attack sits entirely between samples 0 and 1 of a
            // 400-point sweep across a ~1.6 s window, which looks like a jump
            // and is not one. The audio schedules that same attack as a 48-step
            // ramp, so it is genuinely smooth. Resolve each segment instead.
            const shortest = Math.min(v.env.attack, v.env.decay, v.env.release);
            const total = v.env.attack + v.env.decay + 0.35 + v.env.release;
            const n = Math.min(40000, Math.max(400, Math.ceil((total / shortest) * 8)));
            const e = env_points(v.env, v.curves, n);
            for (let i = 1; i < e.length; i++) {
                assert.ok(
                    Math.abs(e[i] - e[i - 1]) < 0.2,
                    v.id + ' jumps ' + (e[i] - e[i - 1]).toFixed(3) + ' at sample ' + i + ' of ' + n
                );
            }
        });
    });

    it('holds the sustain level for a sustaining voice', () => {
        const organ = INSTRUMENTS.filter((v) => v.id === 'organ')[0];
        const e = env_points(organ.env, organ.curves, 200);
        const mid = e[Math.floor(e.length * 0.55)];
        assert.ok(Math.abs(mid - organ.env.sustain) < 0.06, 'sustain plateau is ' + mid);
    });

    it('decays to silence for a non-sustaining voice', () => {
        const piano = INSTRUMENTS.filter((v) => v.id === 'piano')[0];
        assert.strictEqual(piano.env.sustain, 0);
        const e = env_points(piano.env, piano.curves, 200);
        assert.ok(e[Math.floor(e.length * 0.75)] < 0.05, 'piano still sounding at 75%');
    });

    it('survives n = 1 without dividing by zero', () => {
        const e = env_points(INSTRUMENTS[0].env, INSTRUMENTS[0].curves, 1);
        assert.strictEqual(e.length, 1);
        assert.ok(Number.isFinite(e[0]), 'got ' + e[0]);
    });
});

describe('Instrument Workbench — shape_partials()', () => {
    const { WAVE_SHAPES, shape_partials } = V;

    it('offers the four documented oscillations', () => {
        assert.deepStrictEqual(WAVE_SHAPES, ['sine', 'triangle', 'sawtooth', 'square']);
    });

    WAVE_SHAPES.forEach((kind) => {
        it(kind + ' returns ' + PARTIAL_COUNT + ' finite partials with a unit peak', () => {
            const p = shape_partials(kind, 0);
            assert.strictEqual(p.length, PARTIAL_COUNT);
            p.forEach((n, i) => assert.ok(Number.isFinite(n), 'partial ' + i + ' not finite'));
            assert.ok(Math.abs(Math.max.apply(null, p.map(Math.abs)) - 1) < 1e-9);
        });
    });

    it('sine is the fundamental alone', () => {
        const p = shape_partials('sine', 0);
        assert.strictEqual(p[0], 1);
        assert.ok(p.slice(1).every((n) => n === 0));
    });

    it('square and triangle have no even harmonics', () => {
        ['square', 'triangle'].forEach((kind) => {
            const p = shape_partials(kind, 0);
            [1, 3, 5, 7, 9].forEach((i) => assert.strictEqual(p[i], 0, kind + ' partial ' + (i + 1)));
        });
    });

    it('sawtooth keeps every harmonic, falling as 1/n', () => {
        const p = shape_partials('sawtooth', 0);
        assert.ok(p.every((n) => n > 0));
        assert.ok(Math.abs(p[1] / p[0] - 0.5) < 1e-9, '2nd partial should be half the 1st');
        assert.ok(Math.abs(p[2] / p[0] - 1 / 3) < 1e-9);
    });

    it('triangle alternates sign — the reason partials are signed at all', () => {
        // Without alternating signs this is a rounded wave, not a triangle.
        const p = shape_partials('triangle', 0);
        assert.ok(p[0] > 0);
        assert.ok(p[2] < 0, '3rd partial should be inverted');
        assert.ok(p[4] > 0, '5th partial should be positive again');
    });

    it('produces four measurably different waveforms', () => {
        const cycles = WAVE_SHAPES.map((k) => wave_cycle(shape_partials(k, 0), 128));
        for (let a = 0; a < cycles.length; a++) {
            for (let b = a + 1; b < cycles.length; b++) {
                const diff = cycles[a].reduce((s, n, i) => s + Math.abs(n - cycles[b][i]), 0) / 128;
                assert.ok(diff > 0.05, WAVE_SHAPES[a] + ' and ' + WAVE_SHAPES[b] + ' are too alike: ' + diff);
            }
        }
    });

    it('square is flat-topped and triangle is peaky', () => {
        const loud = (w) => w.filter((v) => Math.abs(v) > 0.7).length;
        assert.ok(loud(wave_cycle(shape_partials('square', 0), 200)) > 150, 'square should sit near its rails');
        assert.ok(loud(wave_cycle(shape_partials('triangle', 0), 200)) < 100, 'triangle should spend time away from its peaks');
    });

    it('jag lifts the upper harmonics without touching the fundamental', () => {
        const plain = shape_partials('sawtooth', 0);
        const jagged = shape_partials('sawtooth', 1);
        assert.ok(jagged[11] > plain[11] * 2, 'upper harmonic barely moved');
        assert.strictEqual(jagged[0], 1, 'fundamental should stay at unit peak');
    });

    it('clamps the jag amount and tolerates rubbish', () => {
        [undefined, null, -5, 99, NaN].forEach((bad) => {
            const p = shape_partials('sawtooth', bad);
            assert.ok(p.every(Number.isFinite), 'jag=' + bad + ' produced a non-finite partial');
        });
    });

    it('returns silence for an unknown shape rather than NaN', () => {
        const p = shape_partials('not-a-shape', 0);
        assert.ok(p.every((n) => n === 0));
    });
});

describe('Instrument Workbench — clone_voice()', () => {
    it('deep-copies partials, env, curves and vibrato', () => {
        const src = INSTRUMENTS[0];
        const c = clone_voice(src);
        c.partials[0] = 0.123;
        c.env.attack = 9;
        c.curves.attack = 'jag';
        c.vibrato.rate = 99;
        assert.notStrictEqual(src.partials[0], 0.123, 'partials shared');
        assert.notStrictEqual(src.env.attack, 9, 'env shared');
        assert.notStrictEqual(src.curves.attack, 'jag', 'curves shared');
        assert.notStrictEqual(src.vibrato.rate, 99, 'vibrato shared');
    });

    it('round-trips every built-in voice unchanged', () => {
        INSTRUMENTS.forEach((v) => {
            const c = clone_voice(v);
            assert.deepStrictEqual(c.partials, v.partials);
            assert.deepStrictEqual(c.env, v.env);
            assert.deepStrictEqual(c.curves, v.curves);
            assert.strictEqual(c.gain, v.gain);
        });
    });
});

describe('Instrument Workbench — pad()', () => {
    it('pads short arrays and truncates long ones to PARTIAL_COUNT', () => {
        assert.strictEqual(pad([1, 2]).length, PARTIAL_COUNT);
        assert.strictEqual(pad(new Array(40).fill(1)).length, PARTIAL_COUNT);
        assert.deepStrictEqual(pad([0.5]).slice(0, 2), [0.5, 0]);
    });
});
