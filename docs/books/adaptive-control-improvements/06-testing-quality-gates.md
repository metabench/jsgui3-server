# Chapter 6 — Testing and Quality Gates for Adaptive Upgrades

Responsive behavior is a quality gate, not an optional enhancement.

This chapter defines mandatory test coverage for the improvements in this book.

## 6.1 Viewport Matrix

Minimum matrix for all Tier 1 and Tier 2 controls:

1. Phone portrait: 390×844
2. Phone landscape: 844×390
3. Tablet portrait: 768×1024
4. Tablet landscape: 1024×768
5. Desktop narrow: 1280×720
6. Desktop wide: 1920×1080

## 6.2 Assertion Classes

### P0 — Structural integrity

- no horizontal overflow
- control renders with non-zero functional area
- primary action path remains available

### P1 — Adaptive behavior integrity

- mode-specific composition appears as specified
- state transitions preserve user context where intended
- keyboard and ARIA semantics remain correct after morphs

### P2 — Visual and ergonomic integrity

- density mode variants maintain readability
- touch target sizing and spacing pass thresholds
- reduced-motion users receive non-disorienting transitions

## 6.3 Tier-Specific Test Scope

### Tier 1

- full P0 + P1 + P2 matrix required before merge

### Tier 2

- full P0 + P1 required
- P2 mandatory for touch-heavy controls (`Toolbar`, `Sidebar_Nav`, `Modal`)

### Tier 3/4

- P0 mandatory
- selective P1/P2 where risk justifies coverage

## 6.4 Test Harness Pattern

Use self-contained E2E files per control:

- build SSR test page
- activate client behavior
- run matrix assertions
- capture screenshots per viewport
- tear down server/browser

This follows project testing guidance and avoids cross-test coupling.

## 6.5 Required Regression Scenarios

Every upgraded control must include:

1. Mode transition scenario (phone → desktop and desktop → phone)
2. Orientation transition scenario (portrait ↔ landscape)
3. Keyboard-only navigation scenario
4. Touch interaction scenario (for touch-relevant controls)
5. Reduced-motion behavior scenario where animations exist

## 6.6 Exit Criteria Per Control

A control upgrade is complete when:

1. Functional tests pass on all required viewport profiles.
2. No new console errors are introduced by mode transitions.
3. Screenshot set is captured for review and retained in expected location.
4. Existing desktop behavior remains backward compatible unless explicitly changed.

## 6.7 Program-Level Quality Dashboard

Track adaptive rollout readiness with a simple control checklist:

- composition complete
- state placement audited
- token/mode styling complete
- P0/P1/P2 tests green
- docs updated

This should be maintained alongside roadmap execution to prevent partially adaptive shipping.

Next: delivery sequencing, ownership model, and milestone plan.
