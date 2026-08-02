# 11) Living Mesh — an Opus 5 showcase

> **Built by:** Claude Opus 5
> **Date:** 2026-08-02
> **Verified against:** jsgui3-server 0.0.157 · jsgui3-html 0.0.189 · jsgui3-client 0.0.131
> **Evidence grade:** measured — booted, fetched, streamed and driven in Chromium

```bash
node "examples/jsgui3-html/11) opus-5-living-mesh/server.js"
# http://127.0.0.1:52031/
```

## What it is

A service-mesh topology drawn as SVG **on the server**, delivered complete in the first HTML
response, then brought to life by a named-event SSE stream.

Seven services, nine curved links with arrow markers, a gradient backdrop and a rolling
throughput sparkline. Click any node for live detail.

## Why this, and not another counter

The existing examples already cover canvas rendering, windows, forms, data grids, routing,
theming, mixins and MVVM counters. Two things were genuinely uncovered:

- **Server-rendered SVG.** Every other visual example uses canvas, which is opaque to SSR — the
  browser has to run code before anything appears. Here, `curl` the page and the entire picture
  is already in the markup: gradients, marker definitions, every node at its final coordinates.
  That is the framework's actual thesis, and this is the example that demonstrates it.
- **`event:`-named SSE.** Examples 15, 18 and 19 all use anonymous `data:` frames. Nothing
  demonstrated named events with per-name `addEventListener`, which is what lets one connection
  carry two independent streams — here `telemetry` and `alert`.

## How it works

```
SSE 'telemetry' ──► addEventListener('telemetry')
                     │
                     ▼
              apply_telemetry(payload)
                     │
      ┌──────────────┼───────────────────┐
      ▼              ▼                   ▼
 setAttribute    setAttribute        rebuild path d
 on #core-*      on #link-*          on #spark-line
 (radius, fill)  (width, dashoffset) (pure attribute write)
```

Every visual update is an **attribute mutation of a node that came from the server**. Nothing
creates an SVG element on the client.

Interaction lives on a separate layer of ordinary HTML `<div class="hit">` controls, positioned
as a percentage of the viewBox so they track the SVG at any size. Those are real jsgui controls
that survive reattachment; the SVG is presentation only.

## Constraints this example is built around

Each of these is a confirmed behaviour, verified by execution rather than read from a doc.
They are the reason the code looks the way it does:

| Constraint | Consequence here |
|---|---|
| The renderer drops falsy attribute values (`control-core.js:561`) — an unstringified `x=0` silently vanishes | `el()` wraps every value in `String()` |
| Client-side SVG append lands in the **XHTML** namespace and renders invisibly (`control-enh.js:723` special-cases only `circle`/`line`/`polyline`) | The client never creates an SVG node. Animation is attribute-only |
| Passing a `Page_Context` injects four `data-jsgui-*` attributes onto every SVG node | SVG nodes are built with `{}`; the context lives on the wrapper |
| The CSS extractor keeps only the first quasi of a template literal | `Demo_UI.css` contains no `${}` |
| Reattachment rebuilds controls from exactly `{context, __type_name, id, el}` | `Node_Hit` recovers its id from `data-node`, not from spec |
| `__type_name` must equal the lowercased `controls` key or `activate()` never runs | Both cased and lowercase aliases are registered |
| There is no automatic view-to-DOM re-render | `paint()` is written by hand and is idempotent |

## A bug worth keeping

While building this, the detail heading stayed stuck on its placeholder while every other field
updated correctly. The cause: `_ctrl_fields.title` was registered under the key `title` while the
code read `this.title_ctrl`. The **key** is what gets reassigned on reattachment, so the heading
reference was simply never restored — and nothing warned.

It is left commented in `client.js` because it is a perfect miniature of the failure mode this
framework is prone to: server-side correct, client-side silently inert, visually almost right.

## Verified behaviour

Measured in Chromium against a running server:

- `GET /` → 200, 15,779 bytes, containing 21 `<circle>`, 10 `<path>`, both gradients, all 7 hit targets
- `GET /api/telemetry` → 200 `text/event-stream`, named `telemetry` frames with incrementing ids
- `document.querySelector('svg').namespaceURI` → `http://www.w3.org/2000/svg`
- `#core-api` → `SVGCircleElement` (a real SVG element, not an XHTML lookalike)
- `#core-gateway` radius changes between frames; `#spark-line` `d` grows to ~1,800 chars
- Clicking `worker` → detail panel reads `worker` / `46%` / `19.5 ms` / `healthy`, ring thickens
