# Chapter 8 — Roadmap and Adoption Plan

## Guiding Principle

Ship value incrementally. Each phase should produce usable outcomes — not just infrastructure that waits for future phases to become useful. Every phase ends with working code, passing tests, and updated documentation.

## Phase A: Standardize Environment Vocabulary

**Goal:** Establish a shared language so all controls and apps use the same terms for the same concepts.

### Deliverables

1. **Canonical mode taxonomy document** — formal definitions of:
   - Layout modes: `phone` (≤599px), `tablet` (600–1023px), `desktop` (≥1024px)
   - Density modes: `compact`, `cozy` (default), `comfortable`
   - Interaction modes: `touch`, `pointer`, `hybrid`
   - Motion modes: `normal`, `reduced`

2. **Root-level mode attributes** — CSS and JS both reference:
   - `data-layout-mode` on `<html>` or `<body>`
   - `data-density-mode`
   - `data-interaction-mode`

3. **Density token override CSS** — a small CSS file that overrides `--j-space-*` and `--admin-*` tokens per density mode (as described in Chapter 4).

### Estimated Effort

Small. Mostly documentation and a CSS file. No runtime code changes.

### Outcome

Every developer and every control has a common vocabulary. CSS selectors like `[data-layout-mode="phone"]` work immediately, even before the environment service exists, because developers can set the attributes manually for testing.

### Dependencies

None. This can start today.

---

## Phase B: Ship Adaptive Helper APIs

**Goal:** Provide the runtime infrastructure so controls can respond to environment changes.

### Deliverables

1. **`View_Environment` service** — the observer class described in Chapter 6, Pattern 1:
   - Viewport observation with debounced resize handling
   - Mode resolution from configurable breakpoints
   - Change events for layout, density, interaction, and motion modes
   - SSR-safe defaults
   - Sets root-level data attributes from Phase A

2. **`compose_adaptive()` helper** — the composition branching utility from Chapter 6, Pattern 2:
   - Reads layout_mode, calls matching branch
   - Registers change listener for recomposition
   - Handles fallback (tablet → phone → desktop)
   - Returns cleanup function

3. **Responsive param branch support in `theme_params`** — Chapter 6, Pattern 3:
   - Accept mode-keyed param objects
   - Auto-resolve based on current layout_mode
   - Re-resolve on mode change

### Estimated Effort

Medium. View_Environment is ~150 lines. compose_adaptive is ~60 lines. Param branching is a modest extension to existing theme_params resolver.

### Outcome

App developers can write `compose_adaptive(this, { phone, tablet, desktop })` and get correct behavior. The boilerplate for responsive composition drops from ~30 lines per control to ~5 lines.

### Dependencies

Phase A (vocabulary must be defined before the service uses it).

---

## Phase C: Upgrade Control Catalog Incrementally

**Goal:** Make existing controls responsive-aware, prioritized by impact.

### Priority Tiers

**Tier 1: Shell and navigation** (highest impact — these define app structure)

| Control | Adaptation |
|---------|-----------|
| Drawer | Already has breakpoint support; wire to View_Environment instead of manual resize |
| Tabbed_Panel | Overflow-scroll on phone when tabs > 4; vertical tabs on narrow embedded |
| Accordion | Becomes primary navigation pattern on phone |
| Stack | No changes needed (already flexible); document responsive patterns |

**Tier 2: Data-dense controls** (high visibility in admin/dashboard apps)

| Control | Adaptation |
|---------|-----------|
| Data tables | Column reduction via responsive params; card layout option for phone |
| Forms | Single-column on phone; multi-column on desktop |
| Code_Editor | Full-bleed on phone; constrained width on desktop |
| Filter_Chips | Horizontal scroll strip on narrow; wrapped on wide |

**Tier 3: Utility and overlay controls**

| Control | Adaptation |
|---------|-----------|
| Drawer (overlay variant) | Already works; ensure touch dismissal |
| Modals/dialogs | Full-screen on phone; centered constrained on desktop |
| Tooltips | Suppress on touch (use bottom sheet or inline); show on pointer |
| Split_Pane | Disable resize handle on phone (stack instead) |

**Tier 4: Atomic controls** (lowest priority — usually correct via token inheritance)

| Control | Adaptation |
|---------|-----------|
| Buttons | Touch target enforcement via density tokens |
| Inputs | Larger padding/height via density tokens |
| Chips, badges | Usually fine at all sizes |

### Approach

Each control upgrade follows the same pattern:
1. Add responsive params if needed
2. Use `compose_adaptive()` for structural changes (or skip if CSS-only adaptation suffices)
3. Wire to View_Environment instead of manual `window.innerWidth`
4. Add viewport-matrix test assertions
5. Update control documentation

### Estimated Effort

Large overall, but each individual control is small (hours, not days). Can be done incrementally by different contributors.

### Dependencies

Phase B (helpers must exist before controls use them).

---

## Phase D: Formalize Responsive Test Suites

**Goal:** Make responsive testing a first-class quality gate.

### Deliverables

1. **`run_viewport_matrix()` test utility** — the shared function from Chapter 7 that loops tests across 6 viewport profiles.

2. **Viewport-matrix tests** for each Tier 1 and Tier 2 control:
   - Showcase app responsive suite
   - Drawer responsive suite
   - Tabbed_Panel responsive suite
   - Data table responsive suite

3. **Screenshot baseline directory** — organized per-control, per-viewport screenshots checked into the repo for visual regression review.

4. **CI integration** — responsive suites run in the aggregate test runner alongside existing tests.

### Estimated Effort

Medium. The utility is small (~50 lines). Each control's responsive test is ~100 lines (mostly reusing the single-viewport test with a viewport loop wrapper).

### Outcome

Responsive regressions are caught before merge. No more "it works on my desktop" issues.

### Dependencies

Phase C (controls must be adaptive before their responsive tests can verify adaptation). However, the showcase app responsive test can ship with Phase B, since the showcase manually implements adaptive patterns.

---

## Phase E: Showcase App as Reference Implementation

**Goal:** The showcase app demonstrates every adaptive pattern, serving as both a demo and a regression test.

### Deliverables

1. **Adaptive showcase composition** — the showcase app uses `compose_adaptive()` for its shell layout, demonstrating:
   - 3-column → 2-column → 1-column shell transitions
   - Nav sidebar → pill bar → drawer morphing
   - Theme studio → slide-over → presets-only adaptation

2. **Theme profile persistence** — the showcase uses full theme profiles (theme + density + overrides) with export/import.

3. **Responsive Playwright suite** — 6-viewport test covering all showcase sections.

4. **Documentation** — the showcase README documents every adaptive pattern used, linking back to the relevant book chapter.

### Estimated Effort

Medium. Most of the work is refactoring the existing showcase composition to use the new helpers.

### Outcome

New developers can look at the showcase app and see: "this is how you build a responsive jsgui3 app." Every pattern from this book is demonstrated in working code.

### Dependencies

Phases A–D. This is the capstone.

---

## Phase Dependency Map

```
Phase A (Vocabulary)
    ↓
Phase B (Helper APIs)  ──→  Phase D.1 (Showcase responsive test)
    ↓
Phase C (Controls)     ──→  Phase D (Full test suites)
    ↓
Phase E (Showcase reference)
```

Phases A and B are sequential prerequisites. Phase C and D overlap — as each control is upgraded, its test is written. Phase E comes last.

## Recommended Near-Term Backlog

Starting from zero, the highest-value first steps are:

| # | Task | Phase | Why First |
|---|------|-------|-----------|
| 1 | Define mode taxonomy in docs | A | Foundation — everything references these terms |
| 2 | Write density-mode CSS overrides | A | Immediately usable in any app |
| 3 | Implement `View_Environment` service | B | Unlocks all adaptive patterns |
| 4 | Implement `compose_adaptive()` helper | B | Biggest developer productivity gain |
| 5 | Add viewport-matrix test for showcase | D.1 | Proves the test harness works |
| 6 | Wire Drawer to View_Environment | C | First control upgrade, validates the pattern |
| 7 | Refactor showcase to use compose_adaptive | E | Reference implementation |

## What Not to Build

Some things are explicitly **out of scope** for the near-term, either because they're premature or because simpler alternatives exist:

- **Automatic container-query composition** — useful later, but viewport-level adaptation covers 90% of cases. Ship viewport first.
- **Visual regression pixel comparison** — screenshot captures for human review are sufficient. Pixel-diff tools add complexity with marginal value at this scale.
- **Server-side device detection** — User-Agent parsing is unreliable and shrinking in value. Desktop-first SSR with client refinement is simpler and more robust.
- **per-control CSS-only responsive overrides** — mode attributes and token tiers handle this at scale. Per-control media queries should be the exception, not the pattern.

## Strategic Summary

The adaptive composition system is not a big-bang rewrite. It's a thin coordination layer on top of strong existing foundations:

- **Tokens** already handle theming → extend to density
- **MVVM** already separates models → use view.data.model for environment state
- **Drawer** already has breakpoints → generalize the pattern
- **Playwright** already tests interactivity → add viewport loops
- **Showcase** already demonstrates controls → make it responsive

Each phase delivers value independently. An app can use Phase A (manual mode attributes in CSS) without Phase B (automatic environment service). Phase C controls gracefully degrade when the environment service isn't present.

The goal is that within a few iterations, building a responsive jsgui3 app is **easier than building a non-responsive one**, because the platform defaults to adaptive behavior.
