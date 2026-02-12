# JSGUI3 Bundling Research Book

This book documents how JS and CSS bundling currently works in `jsgui3-server`, then defines a practical path to remove unused modules, controls, mixins, and related code from final bundles without breaking runtime behavior.

## Scope

- Current runtime bundling semantics (implementation-first, file-path grounded)
- Existing optimization surface and current limits
- Dead-module elimination strategy for application code and `jsgui3-html`
- Control/mixin reachability and pruning model
- Verification strategy (unit, integration, e2e, and size-regression)

## Intended Readers

- Maintainers changing bundling internals
- Contributors adding controls or mixins to `jsgui3-html`
- Agents implementing bundle-size reduction work

## Reading Order

1. [00 Table of Contents](00-table-of-contents.md)
2. [01 Pipeline and Runtime Semantics](01-pipeline-and-runtime-semantics.md)
3. [02 JavaScript Bundling Core](02-javascript-bundling-core.md)
4. [03 Style Extraction and CSS Compilation](03-style-extraction-and-css-compilation.md)
5. [04 Static Publishing and Delivery](04-static-publishing-and-delivery.md)
6. [05 Current Limits and Size-Bloat Vectors](05-current-limits-and-size-bloat-vectors.md)
7. [06 Unused Module Elimination Strategy](06-unused-module-elimination-strategy.md)
8. [07 jsgui3-html Control and Mixin Pruning](07-jsgui3-html-control-and-mixin-pruning.md)
9. [08 Test and Verification Methodology](08-test-and-verification-methodology.md)
10. [09 Roadmap and Rollout](09-roadmap-and-rollout.md)
11. [10 Further Research: Strategies and Upgrades](10-further-research-strategies-and-upgrades.md)

## Status

This is a working research book. It is designed to be updated as the bundling system evolves.
