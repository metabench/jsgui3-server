# 7. jsgui3-html Control and Mixin Pruning

## Objective

Allow `jsgui3-html` to grow in feature breadth while keeping simple app bundles lightweight by pruning unused controls, mixins, and helper modules.

## Constraint Surface

`jsgui3-html` usage often includes:

- direct imports (`const {Window} = require('jsgui3-html').controls`)
- registry-style access (`jsgui.controls.some_control`)
- inheritance chains and mixin composition

Pruning must account for all three.

## Reachability Model

Build a typed symbol graph with nodes:

- controls
- mixins
- utility helpers
- transitive runtime support modules

Edges:

- static import/require edges
- inheritance edges
- mixin application edges
- registry publication edges

A module is retained if any retained symbol depends on it.

## Beyond Controls and Mixins

The same graph can prune additional payload classes:

- optional theme packs
- optional icon packs
- optional debug instrumentation
- optional adapter layers (for features not used by the app)
- feature-local helper modules that are only referenced by pruned controls

## Packaging Recommendation

Within `jsgui3-html`, define explicit boundaries:

- `core` (always lightweight baseline)
- optional feature groups (advanced controls, diagnostics, heavy widgets)

Then allow bundler elimination to prune unused optional groups based on symbol reachability.

## Dynamic-Access Safety

When dynamic registry access is detected and symbol resolution is uncertain:

- `safe` profile retains uncertain candidates
- manifest records reason as `dynamic_access_uncertain`

## Result

This produces consistent APIs while allowing bundle contents to shrink significantly for narrow use cases.
