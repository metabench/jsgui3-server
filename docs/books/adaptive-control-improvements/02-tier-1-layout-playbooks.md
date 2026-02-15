# Chapter 2 — Tier 1 Layout Control Playbooks

Tier 1 controls are the highest-impact adaptive targets and should be implemented first.

Patterns applied:

- Chapter 2 pattern: Four-layer composition split
- Chapter 3 pattern: adaptive state in view models
- Chapter 6 pattern: `compose_adaptive()` and environment contract

---

## 2.1 Master_Detail

### Current issue

Current CSS uses a fixed two-column grid and lacks mode-aware composition.

### Target behavior by mode

- Phone:
  - Single-column list-first flow
  - Selecting an item opens detail in a sheet or full panel (configurable)
- Tablet:
  - Portrait: list + toggleable detail overlay
  - Landscape: dual-pane with narrower master width
- Desktop:
  - Dual-pane default with stable side-by-side behavior

### Composition strategy

Use discrete JS composition + mode-attribute CSS polish:

- JS for pane structure/morphing
- CSS for spacing, typography, transitions per mode

### State placement

- `data.model`: items, selected_id
- `view.data.model`: layout_mode, detail_presentation (`inline` | `overlay` | `sheet`)
- `view.model`: detail_open, last_focus_item_id

### Implementation steps

1. Add `compose_phone_layout`, `compose_tablet_layout`, `compose_desktop_layout`.
2. Route through `compose_adaptive`.
3. Keep selected-item domain logic unchanged.
4. Add detail open/close mechanics only in view state.
5. Apply `[data-layout-mode]` CSS selectors for spacing and target sizes.

### Test essentials

- P0: no horizontal overflow in all six viewports.
- P1: selecting master item updates detail in all modes.
- P1: overlay/sheet opens and closes with keyboard + click/touch.
- P2: touch hit targets are at least 44px in touch profiles.

---

## 2.2 Tabbed_Panel

### Current issue

Tab strip is horizontal-first and can overflow on narrow screens.

### Target behavior by mode

- Phone:
  - Scrollable tab strip or compact segment mode
  - Optional icon-first labels with hidden text fallback for a11y
- Tablet:
  - Horizontal strip with controlled overflow handling
- Desktop:
  - Existing behavior preserved with richer indicators

### Composition strategy

Hybrid:

- JS: overflow bucket strategy and optional tab-list mode switching
- CSS: mode/density token scaling for tabs and indicators

### State placement

- `data.model`: tab definitions/content
- `view.data.model`: tab_layout (`scroll`, `fit`, `overflow_menu`)
- `view.model`: active_tab_index, overflow_open

### Implementation steps

1. Add tab measurement logic in activation with SSR-safe guards.
2. Resolve `tab_layout` from available width (container-aware where possible).
3. Preserve keyboard navigation semantics and ARIA roles across modes.
4. Ensure active indicator style uses tokens, not hardcoded colors.

### Test essentials

- P0: active tab always visible and selectable across matrix.
- P1: keyboard navigation (arrows/home/end) remains correct in overflow mode.
- P1: ARIA (`aria-selected`, `aria-controls`) remains accurate after mode switches.
- P2: indicator and tab touch targets remain legible and accessible.

---

## 2.3 Split_Pane

### Current issue

Resize interaction is pointer-centric; phone behavior should not rely on tiny drag handles.

### Target behavior by mode

- Phone:
  - Replace draggable split with stacked sections and toggle affordance
- Tablet:
  - Optional split in landscape, stacked in portrait by default
- Desktop:
  - Existing resizable split retained

### Composition strategy

Discrete JS composition with interaction-mode rules:

- `touch` and narrow mode disable drag-resize
- `pointer` mode allows drag-resize with guardrails

### State placement

- `data.model`: pane content/config (device-agnostic)
- `view.data.model`: split_enabled, orientation_mode, pane_ratio_policy
- `view.model`: current_ratio (session-level), active_pane

### Implementation steps

1. Introduce `split_enabled` resolver from layout and interaction mode.
2. Add adaptive orientation defaults.
3. Replace drag handle with mode-aware toggle controls on phone.
4. Persist only user intent preferences (if any), not live viewport-derived ratio.

### Test essentials

- P0: no unusable drag affordance in phone mode.
- P1: desktop drag-resize still works and obeys min/max boundaries.
- P1: orientation transitions preserve pane content and focus order.
- P2: touch mode controls meet target-size requirements.

---

## 2.4 Data_Table

### Current issue

Data-dense behavior is desktop-oriented; lacks formal mode family for phone/tablet.

### Target behavior by mode

- Phone:
  - Card/list row presentation
  - Primary fields shown inline; secondary fields in row detail expansion
- Tablet:
  - Priority-column strategy + optional side detail panel
- Desktop:
  - Full grid with advanced interactions (resize/frozen columns/etc.)

### Composition strategy

Discrete JS mode family + CSS density scaling.

### State placement

- `data.model`: rows, filters, sort state, selected ids
- `view.data.model`: table_mode (`grid` | `compact_grid` | `card_list`), visible_columns
- `view.model`: expanded_row_ids, hover/focus transient state

### Implementation steps

1. Introduce explicit render modes tied to layout mode.
2. Add column priority metadata and `visible_columns` resolver.
3. Implement phone card-list renderer behind mode switch.
4. Gate pointer-only features (column drag resize) to pointer-capable contexts.
5. Keep selection/filter/sort semantics identical across modes.

### Test essentials

- P0: core CRUD-adjacent row interactions survive all modes.
- P1: selected row consistency across mode transition (phone ⇄ desktop).
- P1: keyboard nav remains valid where grid mode is active.
- P2: card/list readability and token-driven spacing in compact/comfortable density.

---

## 2.5 Tier 1 Implementation Order

Recommended order:

1. Master_Detail
2. Split_Pane
3. Tabbed_Panel
4. Data_Table

Rationale:

- Master_Detail and Split_Pane establish the reusable two-pane morph pattern.
- Tabbed_Panel establishes shared overflow and keyboard guarantees.
- Data_Table then reuses both pattern families in the highest-complexity control.

Next: Tier 2 controls (navigation, forms, overlays) that depend on the Tier 1 patterns.
