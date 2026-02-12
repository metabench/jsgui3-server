# 6. Unused Module Elimination Strategy

## Design Goal

Add deterministic dead-module elimination while preserving runtime correctness and keeping current high-level APIs stable.

## Phase 1: Observability First

Introduce a bundle analysis artifact per build:

- `module_graph_manifest.json`
- fields: module path, retained/pruned flag, retention reason, side-effect classification, importer chain

Use esbuild `metafile` as baseline graph input. Do not prune yet in this phase.

## Phase 2: Policy-Based Pruning

Add pruning policies:

- `safe`: prune only modules proven side-effect free and unreachable from entry exports
- `balanced`: allow package-level side-effect allowlists
- `aggressive`: opt-in broader pruning with explicit risk declaration

Each pruned module must carry an auditable reason code.

## Phase 3: Runtime Safety Guardrails

Add optional runtime checks in debug mode:

- missing symbol trap hooks for known registries
- warning when dynamic lookup requests pruned modules

## Proposed Configuration Surface

```js
bundler: {
  elimination: {
    enabled: true,
    profile: 'safe',
    emit_manifest: true,
    fail_on_uncertain_prune: true
  }
}
```

## Contract

The contract must be: "No silent pruning." Every elimination decision is traceable in emitted metadata.

## Current Implementation (Initial)

`jsgui3-server` now includes an initial `jsgui3-html` control scan-and-package path in the advanced esbuild bundler.

Enable it with:

```js
bundler: {
  elimination: {
    enabled: true,
    jsgui3_html_controls: {
      enabled: true
    }
  }
}
```

Behavior:

- scans reachable source files from the entry file
- detects static `jsgui3-html` control usage patterns
- builds a lightweight shim exporting only selected controls
- aliases `require('jsgui3-html')` to that shim during bundling
- attaches scan metadata at `bundle.bundle_analysis.jsgui3_html_control_scan`

Safety:

- if dynamic control indexing is detected (`controls[some_var]`), optimization is disabled by default
