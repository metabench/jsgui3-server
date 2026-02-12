# 9. Roadmap and Rollout

## Phase A: Baseline Instrumentation

- emit module graph manifest without pruning
- add CI artifact publishing for manifests
- add docs for reading retention reasons

Exit criteria:
- manifests generated for all target example fixtures
- no behavior changes

## Phase B: Safe Pruning Profile

- implement `safe` elimination profile
- prune only proven unreachable and side-effect-safe modules
- add fail-fast option for uncertain prune attempts

Exit criteria:
- full test suite green
- measurable JS size reductions on simple apps
- zero runtime regressions

## Phase C: jsgui3-html Symbol-Aware Pruning

- add control/mixin symbol graph pass
- integrate registry publication edge tracking
- support optional feature-group retention manifests

Exit criteria:
- significant size reductions for minimal-control apps
- controlled retention for dynamic access cases

## Phase D: Operational Hardening

- add deterministic chunk/hash strategy if route model evolves
- enforce size budgets in CI
- document migration path for package authors to declare side effects explicitly

## Non-Goal

Runtime hot-switching of elimination profiles is not required. Build-time consistency with predictable APIs is the target.
