# 12) Instrument Workbench — an Opus 5 showcase

> **Built by:** Claude Opus 5
> **Date:** 2026-08-02
> **Verified against:** jsgui3-server 0.0.157 · jsgui3-html 0.0.189 · jsgui3-client 0.0.131
> **Evidence grade:** measured — booted, fetched, and driven in Chromium

```bash
node "examples/jsgui3-html/12) opus-5-instrument-workbench/server.js"
# http://127.0.0.1:52032/
```

## What it is

A playable two-octave keyboard with a live instrument designer above it. Six built-in voices —
piano, organ, oboe, flute, tuba, cello — each of which can be duplicated and reshaped.

Play with the mouse, or with `A W S E D F T G Y H U J K O L P` on the computer keyboard.

## The sound model

Nothing here is sampled. A voice is:

- **16 harmonic partial amplitudes** — its timbre
- **an ADSR envelope with a per-segment curve mode** — its articulation
- vibrato rate and depth, tuning drift, and level

The partials are fed to `createPeriodicWave()` and the envelope is sampled into
`setValueCurveAtTime()` from the same `shape()` the panel draws with. **The *shape* of what you
see is the shape of what you hear** — the waveform panel plots the identical Fourier series Web
Audio synthesises, and the envelope panel plots the identical curve that gets scheduled.

Measured, not asserted. Rendering each voice through an `OfflineAudioContext` and correlating
against the drawn cycle gives 0.999998 (tuba), 0.999995 (cello), 0.999987 (oboe). Every non-zero
partial renders at 1.0000–1.0004 of its declared amplitude; the organ's absent even partials
measure −106 dB. Envelope RMS error against `env_points()` is 0.004–0.019 across the six voices.

**One caveat, and it is a real one: the spectrum panel's vertical axis is relative, not
absolute.** `createPeriodicWave` peak-normalises the wavetable, and `wave_cycle` normalises the
drawing the same way. Drag all sixteen bars down in proportion and the picture changes while the
loudness does not — measured identical to five decimal places. Absolute level comes only from the
`level` slider. That is deliberate, because it lets you edit timbre without fighting volume, but
the panel is a ratio axis and should be read as one.

That pairing is what actually separates the instruments, and you can see it in the spectrum:

| Voice | Spectrum | Articulation |
|---|---|---|
| Piano | dense, fast roll-off | near-instant attack, long curved decay, **no sustain** |
| Organ | drawbars — 1st, 3rd, 5th, 7th partials, even ones absent | square-on attack, full sustain; a pipe does not decay |
| Oboe | weak fundamental, dominant 3rd partial | **jagged** attack for the reed's bite |
| Flute | almost a pure sine | soft curved attack, gentle vibrato |
| Tuba | heavy lower partials, nothing above the 8th | slow lip-driven attack |
| Cello | sawtooth-leaning, as a bowed string is | slow bow attack, pronounced vibrato |

Switch between organ and flute and watch the bars: the organ's even-numbered partials drop to
zero while the flute collapses to almost the fundamental alone.

## Three curve modes

Each envelope segment — attack, decay, release — independently selects:

- **linear** — straight ramp
- **curve** — exponential ease; the natural shape for struck and plucked strings
- **jag** — stepped zig-zag, for reedy and buzzy onsets

The same `shape()` function draws the envelope and generates the audio curve.

## Layout notes

The keyboard is what was asked for: **relatively positioned divs**. White keys are ordinary
flex children of a `position: relative` container; the ten accidentals are `position: absolute`
against it, placed by percentage of the container width, so the whole thing scales cleanly with
no fixed pixel maths.

## Tests

```bash
node tests/test-runner.js --test=instrument-workbench.test.js
```

63 assertions, 16 ms, no DOM and no audio context — `tests/instrument-workbench.test.js` covers
`shape`, `wave_cycle`, `env_points`, `clone_voice` and `pad`, plus the six voice definitions.
The maths is the heart of this example: an error there is simultaneously a visual bug and an
audible one, so it is the part worth pinning.

Two of those assertions exist because they already caught something. `shape(0, mode)` must equal
exactly 0 for every mode — that is the jag click. And `jag` must measurably deviate from linear —
verified by forcing `JAG_AMOUNT` to 0 and confirming the suite goes red.

The continuity test samples each voice proportionally to its own shortest segment rather than at
a fixed count. A fixed 400-point sweep reports the piano's 4 ms attack as a discontinuity when it
is nothing of the kind; the audio schedules it as a 48-step ramp.

## Layout notes

Both SVG editors and the waveform display are composed **on the server** with stable plain ids —
`compose()` and `paint()` call the same geometry functions, so activation reproduces the SSR
picture exactly instead of replacing it.
The client only calls `setAttribute` on nodes that arrived in the HTML — it never creates an SVG
element, because dynamic SVG append lands in the XHTML namespace and renders invisibly
(`control-enh.js:723`). Dragging a partial bar rewrites `y`/`height`; dragging an envelope handle
rewrites one path's `d`. Both are pure attribute writes.

## Endpoints

- `GET /api/instruments` — the six voice definitions as JSON
- `GET /api/preview?id=cello` — a sampled waveform and envelope, computed server-side with the
  same pure functions the browser uses

## Bugs worth keeping

Four defects found by review and testing after the first version shipped. Each is commented at
its site, because each is the same shape as the framework defects this example is built around:
no error, no warning, output that is almost right.

**The accidentals all stacked at zero.** `BLACK_AFTER` was keyed by white-key index and looked up
by semitone, so every lookup returned `undefined` and `left` became `NaN%` — which CSS discards
silently. The keyboard still looked superficially plausible.

**Every jagged attack began with an audible click.** `shape(0, 'jag')` returned `0.08`, not `0`,
so the gain jumped to 8% instantly at note start. Invisible in the panel, because 0.08 of panel
height is eleven pixels.

**Roughly a quarter of notes were silently lost under load.** `note_on` read `ctx.currentTime`
*before* building the oscillator and wavetable. That work took ~2 ms, Chrome clamped the
now-past attack curve forward, the decay curve stayed anchored to the stale timestamp, and the
two overlapped — `setValueCurveAtTime` threw `NotSupportedError`, skipping `osc.start`,
registration and the key highlight, and leaking a node pair each time. Measured at 23% loss under
6× CPU throttle; near zero when idle, which is exactly why it looked fine.

**The release handle could be destroyed and never recovered.** The envelope's x-axis was derived
from the envelope being edited, so dragging release shortened the total, which moved the handle
right, which shortened it again. It hit the 0.02 s clamp in about four pointermoves with no way
back. The axis is now a fixed window.

And the one that mattered most, described above: the panels claimed to be server-rendered and
were not.

## Verified behaviour

Measured in Chromium against a running server:

- `GET /` → 200, 26 KB, containing 14 white keys, 10 black keys, 16 partial bars, 4 envelope
  handles, 6 instrument options and 9 curve-mode buttons — all server-rendered
- initial paint: waveform path 3,603 chars, envelope path 2,496 chars, fundamental bar at full height
- selecting *Organ* drives partial 2 to zero height and partial 3 to 122 — the drawbar pattern
- *Duplicate & edit* adds a seventh option, selects it, and names it `Organ copy 2`
- pressing a key applies `.down` and releases it cleanly
- dragging a partial bar redraws the waveform path
