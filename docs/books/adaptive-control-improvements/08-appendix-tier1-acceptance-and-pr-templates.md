# Chapter 8 — Appendix: Tier 1 Acceptance Checklists and PR Templates

This appendix provides implementation-ready acceptance criteria and copy/paste PR templates
for the first four Tier 1 controls:

1. Master_Detail
2. Split_Pane
3. Tabbed_Panel
4. Data_Table

Use this appendix as the final gate before merge.

## 8.1 Shared Tier 1 Acceptance Gate

Every Tier 1 control PR must satisfy all items below.

### A. Layer and state architecture

- [ ] Adaptive behavior is mapped to Layer B/C/D (not Layer A domain logic).
- [ ] No viewport/layout/density state is stored in `data.model`.
- [ ] Resolved adaptive state is in `view.data.model`.
- [ ] Transient UI state is in `view.model`.

### B. Composition and environment

- [ ] Uses shared environment contract (`layout_mode`, `density_mode`, `interaction_mode`, `motion_mode`).
- [ ] Uses adaptive composition branching (or equivalent shared helper), not ad-hoc per-method viewport checks.
- [ ] Supports phone, tablet, desktop behavior as defined in this book.
- [ ] Preserves backward compatibility for desktop behavior unless explicitly changed.

### C. Styling and theming

- [ ] Uses mode attributes (`data-layout-mode` etc.) for adaptive styling policy.
- [ ] Adaptive-relevant hardcoded spacing/sizing values are tokenized.
- [ ] Touch-target policy is satisfied in touch contexts (minimum 44px where actionable).
- [ ] Reduced-motion behavior is respected for adaptive transitions.

### D. Accessibility and interaction

- [ ] Keyboard paths remain valid after mode transitions.
- [ ] ARIA roles/attributes remain correct after adaptive morphing.
- [ ] Focus management and focus return behavior are defined for overlays/morphs.

### E. Testing and validation

- [ ] Viewport matrix includes: 390x844, 844x390, 768x1024, 1024x768, 1280x720, 1920x1080.
- [ ] P0 assertions pass in all profiles.
- [ ] P1 assertions pass in all profiles.
- [ ] P2 assertions pass for controls where touch/visual ergonomics are central.
- [ ] No new console errors during mode/orientation transitions.

### F. Documentation and delivery

- [ ] Control docs updated with adaptive mode behavior.
- [ ] PR includes before/after screenshots for required profiles.
- [ ] PR notes include known limitations and follow-ups.

## 8.2 Master_Detail Checklist

### Required behavior

- [ ] Desktop: dual-pane (master + detail) default.
- [ ] Tablet portrait: detail can be inline or overlay per resolved presentation mode.
- [ ] Phone: list-first flow with detail in sheet/full detail panel pattern.

### State and composition

- [ ] `selected_id` remains domain state in `data.model`.
- [ ] `detail_presentation` is resolved in `view.data.model`.
- [ ] `detail_open` is transient in `view.model`.
- [ ] Mode transition preserves selected item.

### Interaction and a11y

- [ ] Selecting master item updates detail in all modes.
- [ ] Keyboard selection (Enter/Space) remains valid after morph.
- [ ] Overlay detail has focus containment and proper close return target.

### Test-specific

- [ ] No horizontal overflow in phone profiles.
- [ ] Selection-change event contract remains stable.

## 8.3 Split_Pane Checklist

### Required behavior

- [ ] Desktop pointer mode: split + resize handle behavior retained.
- [ ] Phone mode: no tiny drag-handle dependency (stack/toggle behavior used).
- [ ] Tablet behavior follows defined portrait/landscape policy.

### State and composition

- [ ] `split_enabled` and orientation policy live in `view.data.model`.
- [ ] Live ratio and active pane state are `view.model` (session-level).
- [ ] Domain model remains device-agnostic.

### Interaction and a11y

- [ ] Pointer-only resize paths are gated by interaction mode.
- [ ] Keyboard accessibility remains valid for pane switching controls.
- [ ] Focus order is stable across orientation and mode changes.

### Test-specific

- [ ] Desktop drag resize min/max bounds still pass.
- [ ] Phone profile has a usable pane-switch affordance.

## 8.4 Tabbed_Panel Checklist

### Required behavior

- [ ] Narrow profiles use defined overflow strategy (`scroll`, `fit`, or `overflow_menu`).
- [ ] Active tab remains visible/selectable in all profiles.
- [ ] Desktop behavior remains functionally equivalent to prior baseline.

### State and composition

- [ ] Tab content definitions remain domain-side.
- [ ] `tab_layout` is resolved in `view.data.model`.
- [ ] Active tab and overflow menu open state are in `view.model`.

### Interaction and a11y

- [ ] Arrow/Home/End keyboard semantics preserved in all supported layouts.
- [ ] `aria-selected` and control linkage attributes remain correct post-transition.
- [ ] Focus behavior is deterministic when overflow menu opens/closes.

### Test-specific

- [ ] Mode transitions do not break tab/page pairing.
- [ ] Touch target policy passes for tab labels in touch profiles.

## 8.5 Data_Table Checklist

### Required behavior

- [ ] Desktop: full grid mode with existing advanced interactions retained.
- [ ] Tablet: reduced/prioritized column mode.
- [ ] Phone: card/list representation with access to secondary fields.

### State and composition

- [ ] Row data/filter/sort/selection remain in domain model structures.
- [ ] `table_mode` and `visible_columns` resolved in `view.data.model`.
- [ ] Expanded-row and transient interaction state remains in `view.model`.

### Interaction and a11y

- [ ] Selection semantics remain consistent across mode changes.
- [ ] Keyboard navigation remains valid in grid modes.
- [ ] Pointer-only features (for example column drag resize) are correctly gated.

### Test-specific

- [ ] Switching between table modes preserves selected row identity.
- [ ] No data-loss in presentation transitions (grid ⇄ card/list).
- [ ] Performance and rendering remain acceptable for representative row counts.

## 8.6 Generic Tier 1 PR Template

Use this template for any Tier 1 adaptive control PR.

Repository shortcut:

- `.github/pull_request_template_adaptive_tier1.md`

```md
# Adaptive Upgrade: <Control_Name>

## Summary
- Control: <Control_Name>
- Tier: Tier 1
- Scope: <brief summary>

## Book Alignment
- Four-layer impact: <A/B/C/D>
- Model placement:
  - data.model: <...>
  - view.data.model: <...>
  - view.model: <...>
- Composition approach: <CSS-only | JS-composition | hybrid>

## Behavior by Mode
- Phone: <...>
- Tablet: <...>
- Desktop: <...>

## Implementation Notes
- Shared adaptive utilities used: <...>
- Compatibility notes: <...>
- Known tradeoffs: <...>

## Testing
- Viewport profiles covered: 390x844, 844x390, 768x1024, 1024x768, 1280x720, 1920x1080
- P0 status: <pass/fail>
- P1 status: <pass/fail>
- P2 status: <pass/fail>
- Console error check: <clean/issues>

## Evidence
- Screenshots: <paths>
- Test files: <paths>

## Checklist
- [ ] Shared Tier 1 gate complete
- [ ] Control-specific gate complete
- [ ] Docs updated
```

## 8.7 Control-Specific PR Template Add-ons

Append one of these blocks to the generic template.

### Master_Detail add-on

```md
## Master_Detail Specific Checks
- [ ] Selection persistence across mode transitions
- [ ] Detail presentation policy implemented (inline/overlay/sheet)
- [ ] Keyboard select behavior validated in all modes
```

### Split_Pane add-on

```md
## Split_Pane Specific Checks
- [ ] Touch mode disables tiny-handle dependency
- [ ] Desktop resize path unchanged and validated
- [ ] Orientation and pane focus order validated
```

### Tabbed_Panel add-on

```md
## Tabbed_Panel Specific Checks
- [ ] Overflow strategy implemented and validated
- [ ] ARIA and keyboard behavior intact after layout changes
- [ ] Active tab visibility guaranteed in narrow profiles
```

### Data_Table add-on

```md
## Data_Table Specific Checks
- [ ] Grid/tablet/card-list mode family implemented
- [ ] Visible column policy resolved by mode
- [ ] Selection and sort/filter consistency across mode changes validated
```

## 8.8 Reviewer Fast-Path Checklist

For rapid review, reviewers can verify in this order:

1. State placement sanity (`data.model` vs view models)
2. Mode behavior correctness (phone/tablet/desktop)
3. Keyboard/ARIA integrity
4. Viewport matrix evidence and pass status
5. Desktop regression risk and screenshot evidence

If all five checks are green, the PR is generally safe to merge.
