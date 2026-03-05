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

## Implemented Notes (Current Codebase)

Current `jsgui3-server` implementation now includes:

- static bracket control detection (`controls['Button']`) as optimizable/static,
- dynamic bracket fallback (`controls[name]`) as safety-disable for elimination,
- root-feature auto-selection from static references, including aliased `Resource` access patterns:
  - `const resource_api = require('jsgui3-html').Resource;`
  - `const resource_api = require('jsgui3-html')['Resource'];`
  - `resource_api.Compiler`, `resource_api.load_compiler`
  - `const { Data_KV } = resource_api`
  - `resource_api['Compiler']`
- controls alias auto-selection from bracket-derived registry references:
  - `const controls = jsgui['controls'];`
  - `controls['Button']`
- conservative fallback for unresolved dynamic `Resource` alias access (`resource_api[name]`):
  - keeps control elimination enabled
  - retains full `Resource` sub-feature family for runtime safety
- optional root-export pruning in shim generation for:
  - `Router`
  - `Resource` family (`Resource_Pool`, `Data_KV`, `Data_Transform`, `Compilation`, `Compiler`, `load_compiler`)
  - `gfx`
  - `mixins` / `mx`

The control-scan manifest now reports both:

- `selected_controls`
- `selected_root_features`
- `dynamic_control_access_detected`
- `dynamic_resource_access_detected`

to make pruning decisions auditable in tests and bundle diagnostics.
