# 10. Further Research: Strategies and Upgrades

## Purpose

This chapter extends the initial roadmap with additional strategies validated against current official tooling documentation. The goal is to improve both:

- elimination quality (more dead code removed safely)
- operational confidence (clear reason codes and controlled risk)

## A. Strengthen Existing Esbuild-Centric Strategy

### A1. Turn Build Metadata into First-Class Artifact

Current proposal already introduces a manifest. Upgrade it to include:

- esbuild `metafile` `inputs` and `outputs` mapping
- importer chains for each retained module
- side-effect reason code (`annotation`, `package_side_effects`, `plugin_side_effects`, `unknown`)
- unresolved dynamic-import reason code where relevant

Why: esbuild exposes a structured metadata graph and textual analysis hooks suitable for deterministic retention explanations.

### A2. Add Plugin-Level Side-Effect Overrides (Safe Allowlist Only)

Esbuild plugin `onResolve` supports returning `sideEffects: false`. Use this only through a strict allowlist generated from audited modules, never broad regex defaults.

Why: this provides precision beyond package-level `sideEffects` fields and enables selective pruning of known-safe internal modules.

### A3. Improve Annotation Fault Tolerance

Support an explicit fallback mode for bad third-party annotations:

- default: respect annotations (`/* @__PURE__ */`, `package.json sideEffects`)
- safe fallback: set `ignoreAnnotations: true` for known-problem dependency subsets

Why: esbuild documents annotation misuse as a real breakage source; controlled fallback prevents production outages.

### A4. Prefer ESM Paths Where Safe

For packages that expose both CommonJS and ESM, prefer ESM paths where validated to improve tree shaking.

Why: esbuild explicitly notes tree shaking depends on ESM `import`/`export` and does not work on CommonJS modules the same way.

## B. Add Multi-Chunk Strategy (Not Just Single /js/js.js)

### B1. Optional ESM Split Build Profile

Add an optional bundler profile that emits ESM with splitting enabled (`format: 'esm'`, `splitting: true`) and chunk names with content hashes.

Use for:

- multi-page apps
- heavy optional controls loaded by `import()`

Do not force this profile for simple examples where a single file remains desirable.

### B2. Route and HTML Preparation Upgrade

Current static route assigner assumes one JS and one CSS file. Add a preparer mode that:

- maps every emitted JS/CSS asset to static routes
- injects `<script type="module">` plus chunk graph references where required
- supports content-hash file names for cache correctness

## C. Use Safety Ladder from Rollup Research as Policy Design Input

Even if the implementation remains esbuild-first, Rollup's treeshake policy surface is a useful design model:

- `safest`
- `recommended`
- `smallest`

Adopt equivalent policy semantics in `jsgui3-server` elimination config:

- `safe` (strict side-effect conservatism)
- `balanced` (some side-effect assumptions)
- `aggressive` (max pruning, stronger contracts)

Include explicit controls for assumptions analogous to:

- module side effects
- property-read side effects
- try/catch deoptimization behavior
- manually pure function sets

## D. Package Boundary Strategy for jsgui3-html

### D1. Subpath Exports for Feature Addressability

Restructure `jsgui3-html` package exports so controls and mixins have stable subpath entry points (for example, `./controls/date_picker.js`, `./mixins/draggable.js`, `./core/...`).

Why: Node package `exports` and subpath exports give explicit package contracts and allow bundlers to consume narrow entry points instead of broad index hubs.

### D2. Core vs Optional Feature Groups

Define package layers:

- `core` minimal runtime
- optional groups (`advanced-controls`, `diagnostics`, `themes`, etc.)

Then bind elimination policies to these boundaries for predictable pruning.

### D3. Internal Imports Field for Maintainability

Use package `imports` (private `#...` aliases) inside `jsgui3-html` to stabilize internal paths while allowing refactors that do not leak into public imports.

## E. Compression and Minification Escalation Path

### E1. Keep Esbuild as Default Minifier

Esbuild is very fast and adequate for most builds.

### E2. Optional High-Compression Pass

For release artifacts that need additional byte reduction, provide an optional second minification pass profile (e.g., Terser pure-function tuning). Keep this opt-in due to risk/perf tradeoffs.

### E3. Experimental Extreme Profile

Document (not default) an experimental path for Closure Compiler `ADVANCED_OPTIMIZATIONS` for controlled targets only, with strict compatibility guardrails.

## F. Coverage-Guided Optimization (Puppeteer + CDP)

### F1. Coverage Collection Pipeline

Use Puppeteer coverage APIs in E2E suites:

- `page.coverage.startJSCoverage(...)`
- `page.coverage.startCSSCoverage(...)`
- stop coverage and persist per-script ranges

Enable block-level coverage for high resolution.

### F2. Precise CDP Coverage for Deep Diagnostics

For targeted diagnostics, integrate CDP Profiler precise coverage APIs (`startPreciseCoverage`, `takePreciseCoverage`) in controlled runs.

### F3. Correct Interpretation Rule

Coverage is advisory, not authoritative:

- never auto-prune solely from observed runtime coverage
- use coverage to identify candidates for lazy loading or refactor, then validate with static safety rules

## G. Concrete Upgrades to Existing jsgui3-server Plan

### G1. New Config Surface (Proposed)

```js
bundler: {
  elimination: {
    enabled: true,
    profile: 'safe', // safe | balanced | aggressive
    emit_manifest: true,
    include_importer_chains: true,
    fail_on_uncertain_prune: true,
    plugin_side_effect_overrides: {
      allowlist: []
    }
  },
  chunking: {
    profile: 'single', // single | esm_split
    chunk_names: 'chunks/[name]-[hash]'
  }
}
```

### G2. Manifest Enrichment (Proposed)

Add fields:

- `retained_reason_code`
- `side_effect_source`
- `importer_chain`
- `dynamic_access_risk`
- `runtime_coverage_seen` (optional diagnostic field)

### G3. Test Expansion

- policy conformance tests per profile (`safe`, `balanced`, `aggressive`)
- split profile routing/injection tests
- manifest stability snapshots
- Puppeteer coverage capture and diff reporting

## H. Prioritized Execution Order

1. Implement manifest enrichment on top of current esbuild flow.
2. Add safe plugin-side-effect allowlist mechanism.
3. Add ESM split profile behind feature flag.
4. Add package-boundary changes in `jsgui3-html` (`exports`/subpaths/core layering).
5. Add optional secondary minifier profile.
6. Integrate coverage-guided diagnostics into CI reports.

## Source Notes

External strategies in this chapter are based on current official docs for esbuild, Rollup, webpack, Node package exports/imports, Puppeteer coverage APIs, and Chrome DevTools Protocol coverage APIs.

Primary references:

- https://esbuild.github.io/api/
- https://esbuild.github.io/plugins/
- https://rollupjs.org/configuration-options/
- https://webpack.js.org/guides/tree-shaking/
- https://webpack.js.org/plugins/split-chunks-plugin/
- https://nodejs.org/api/packages.html
- https://babeljs.io/docs/babel-plugin-transform-modules-commonjs
- https://terser.org/docs/options/#compress-options
- https://developers.google.com/closure/compiler/docs/compilation_levels
- https://developers.google.com/closure/compiler/docs/api-tutorial3
- https://pptr.dev/api/puppeteer.coverage.startjscoverage
- https://pptr.dev/api/puppeteer.coverage.startcsscoverage
- https://chromedevtools.github.io/devtools-protocol/tot/Profiler/#method-startPreciseCoverage
