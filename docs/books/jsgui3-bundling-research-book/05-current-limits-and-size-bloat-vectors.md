# 5. Current Limits and Size-Bloat Vectors

## Bloat Vector 1: Entry-Point Over-Inclusion

If the client entry imports a broad namespace (or re-export hub), esbuild includes reachable modules conservatively. Tree shaking helps, but side-effect ambiguity limits elimination.

## Bloat Vector 2: Side Effects and Dynamic Access

Patterns like dynamic member access, side-effectful module initialization, or broad registry mutation make safe elimination harder. Bundlers retain uncertain modules by design.

## Bloat Vector 3: Post-Bundle Style Extraction Cost

Current strategy performs non-minifying bundle first, then AST style extraction, then JS rebundle/minify. This gives clean CSS separation but incurs additional processing and can retain JS content not representable as removable style assignments.

## Bloat Vector 4: Fixed Aggregate Assets

Everything converges to a single `/js/js.js` and `/css/css.css` asset pair. This simplifies runtime, but does not naturally support granular shared-chunk caching.

## Bloat Vector 5: Startup-Continuity Fallbacks

Bundling fallback behavior favors server startup continuity. If fallback text assets are accepted too loosely in operational workflows, latent size/perf regressions may go unnoticed.

## Core Observation

The system is robust and functionally coherent, but it lacks a first-class "reachability report + elimination policy" layer that explains exactly what was retained and why.
