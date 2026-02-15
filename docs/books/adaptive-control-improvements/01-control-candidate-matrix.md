# Chapter 1 — Control Candidate Matrix and Findings

## Purpose

Prioritize the control catalog for adaptive upgrades based on real impact:

- Structural risk on phone/tablet/orientation change
- Data density and interaction complexity
- Existing gap between desktop and touch behavior
- Reuse value as a pattern for other controls

## Evidence Snapshot

Recent source-level review identified these concrete issues in key controls:

- `master_detail.js`: fixed two-column grid (`minmax(180px, 240px) 1fr`) with no layout-mode branch.
- `tabbed-panel.js`: horizontal tab strip is vulnerable to overflow in narrow widths.
- `split_pane.js`: pointer-oriented resize interaction with no touch-first fallback.
- `data_table.js`: large data surface with no responsive column-priority/card transformation strategy.
- `sidebar_nav.js`: manual collapse exists, but no environment-driven auto-collapse/morph.
- `Toolbar.js`: no overflow strategy for narrow widths.
- `modal.js`: static size variants only; no automatic phone full-screen mode.
- `form_container.js`: no adaptive multi-column to single-column strategy.
- `status_dashboard.js`: strongest baseline due to grid auto-fit, but no explicit density/layout-mode policy.

## Tiering Criteria

### Impact score (1-5)

- 5: Breaks or heavily degrades on common phone/tablet layouts
- 4: Usable but substantially reduced usability on touch/narrow layouts
- 3: Mostly usable; quality or accessibility debt
- 2: Minor adaptive polish only
- 1: Already adaptive enough through existing composition/tokens

### Effort score (1-5)

- 5: Significant API and behavior changes across composition + interaction + tests
- 4: Medium-high code and test work
- 3: Moderate scoped update
- 2: Small targeted update
- 1: Minimal changes

## Candidate Matrix

| Control | Impact | Effort | Priority | Why now |
|---|---:|---:|---|---|
| Master_Detail | 5 | 3 | Tier 1 | Canonical two-pane pattern; immediate phone pain; good first pattern anchor |
| Tabbed_Panel | 5 | 4 | Tier 1 | High usage + overflow + keyboard/touch adaptation needs |
| Split_Pane | 5 | 4 | Tier 1 | Pointer-first behavior conflicts with touch/mobile |
| Data_Table | 5 | 5 | Tier 1 | Highest value for admin UIs; biggest adaptation gap |
| Sidebar_Nav | 4 | 3 | Tier 2 | Shell-level navigation needs auto morphing |
| Form_Container | 4 | 3 | Tier 2 | Forms must adapt cleanly across orientation and width |
| Modal | 4 | 2 | Tier 2 | Quick high-value upgrade for phone usability |
| Toolbar | 4 | 3 | Tier 2 | Navigation/action density requires overflow strategy |
| Window / Window_Manager | 3 | 4 | Tier 3 | Desktop metaphor must degrade predictably on touch |
| Wizard | 3 | 2 | Tier 3 | Stepper strip and nav controls need mobile pattern |
| Status_Dashboard | 2 | 2 | Tier 4 | Mostly good; needs explicit density/mode tuning |
| Drawer | 2 | 2 | Tier 4 | Good baseline; mostly environment integration and polish |

## Top Discoveries

### Discovery A — the highest-value pattern is the two-pane morph

`Master_Detail`, `Split_Pane`, and many app-level shells all need the same adaptive morph:

- Desktop: dual pane
- Tablet portrait: primary + secondary as revealable overlay
- Phone: stacked flow or drawer/sheet secondary

This should be implemented once as a reusable adaptive region pattern and reused.

### Discovery B — navigation controls need shared overflow/morph infrastructure

`Tabbed_Panel`, `Sidebar_Nav`, and `Toolbar` all face narrow-width overflow and touch navigation constraints.

Without shared helpers, each control will reinvent:

- overflow detection
- “more” bucket behavior
- focus order and ARIA preservation across morphs

### Discovery C — Data_Table is both a control and a mode family

Treat `Data_Table` as a multi-mode control family:

- Desktop mode: full grid
- Tablet mode: reduced columns + optional detail pane
- Phone mode: list/card mode with row expansion

Trying to keep a single static grid shape across all modes will keep mobile quality low.

## Layer Analysis (A/B/C/D)

Applying the four-layer model:

- Layer A (Domain): mostly unaffected; business data stays stable.
- Layer B (View Composition): major work in Tier 1 and Tier 2 controls.
- Layer C (Adaptive Resolution): requires consistent environment service usage.
- Layer D (Concrete Render): token/mode-attribute CSS work across most controls.

## Model Placement Rules for This Program

For all upgrades in this book:

- `data.model`: business entities, user-intent preferences that are device-agnostic.
- `view.data.model`: resolved adaptive state (layout_mode, visible_columns, region presentation state).
- `view.model`: transient interaction state (open/closed, active tab index, temporary scroll/focus state).

Never persist runtime viewport-derived values as domain data.

## Success Criteria for Candidate Selection

A control is ready for implementation when:

1. Target mode behavior is specified for phone, tablet, desktop.
2. State placement is mapped to model layers.
3. CSS mode-attribute strategy is identified.
4. P0/P1/P2 viewport assertions are defined.
5. Regression impact on existing desktop behavior is bounded.

Next: Tier 1 playbooks with concrete upgrade recipes.
