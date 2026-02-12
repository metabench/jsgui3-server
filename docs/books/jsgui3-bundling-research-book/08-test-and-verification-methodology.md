# 8. Test and Verification Methodology

## Verification Principle

Bundle-size optimization is valid only if behavioral equivalence is maintained for supported usage profiles.

## Test Layers

1. Unit tests for elimination graph logic
2. Integration tests for bundler output and route serving
3. E2E browser tests for real interaction flows (Puppeteer)
4. Size-regression tests with per-fixture budgets

## Bundle Correctness Tests

For each fixture app:

- generate baseline bundle (elimination disabled)
- generate optimized bundle (elimination enabled)
- compare runtime outcomes and key DOM/event traces
- compare bundle size deltas against expected thresholds

## Puppeteer Scenarios

For control-heavy examples:

- open page and wait for control activation markers
- perform high-specificity interactions (drag, resize, date pick, color pick, keyboard paths)
- assert expected UI state and emitted network/API behavior

For resource-integrated flows:

- verify client-visible state updates driven by server resources
- verify SSE/event paths where applicable
- confirm no missing-symbol/runtime errors caused by pruning

## Gating Policy

A prune policy cannot be promoted from experimental to default unless:

- all functional suites pass
- bundle manifest diff is stable and explainable
- size regression thresholds are met across representative fixtures.
