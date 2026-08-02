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

The partials are fed to `createPeriodicWave()` and the envelope is sampled directly into
`setValueCurveAtTime()`. **The picture and the sound come from the same functions**, in
`instruments.js`, shared by server and client — so the editor cannot drift out of agreement with
what you hear.

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

Both SVG editors and the waveform display are composed **on the server** with stable plain ids.
The client only calls `setAttribute` on nodes that arrived in the HTML — it never creates an SVG
element, because dynamic SVG append lands in the XHTML namespace and renders invisibly
(`control-enh.js:723`). Dragging a partial bar rewrites `y`/`height`; dragging an envelope handle
rewrites one path's `d`. Both are pure attribute writes.

## Endpoints

- `GET /api/instruments` — the six voice definitions as JSON
- `GET /api/preview?id=cello` — a sampled waveform and envelope, computed server-side with the
  same pure functions the browser uses

## A bug worth keeping

The ten accidentals were positioned by looking up `BLACK_AFTER[semitone]` in a table keyed by
*white-key index*. Every lookup returned `undefined`, so `left` became `NaN%` — which CSS
discards silently. All ten black keys stacked at position zero, and the keyboard still looked
superficially plausible.

It is commented in `client.js` because it is the same shape as the framework defects this
example is built around: no error, no warning, output that is almost right.

## Verified behaviour

Measured in Chromium against a running server:

- `GET /` → 200, 26 KB, containing 14 white keys, 10 black keys, 16 partial bars, 4 envelope
  handles, 6 instrument options and 9 curve-mode buttons — all server-rendered
- initial paint: waveform path 3,603 chars, envelope path 2,496 chars, fundamental bar at full height
- selecting *Organ* drives partial 2 to zero height and partial 3 to 122 — the drawbar pattern
- *Duplicate & edit* adds a seventh option, selects it, and names it `Organ copy 2`
- pressing a key applies `.down` and releases it cleanly
- dragging a partial bar redraws the waveform path
