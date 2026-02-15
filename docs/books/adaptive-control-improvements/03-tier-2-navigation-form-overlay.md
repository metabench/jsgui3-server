# Chapter 3 — Tier 2 Playbooks: Navigation, Forms, and Overlays

Tier 2 focuses on controls that shape shell usability and input workflows.

---

## 3.1 Sidebar_Nav

### Current issue

Sidebar supports collapse behavior, but not environment-driven automatic morphing.

### Target behavior by mode

- Phone: drawer/overlay nav with explicit open/close controls
- Tablet: collapsed-icon rail by default; expandable overlay section groups
- Desktop: full inline sidebar

### Composition approach

- Discrete JS morphing to drawer/rail/full variants
- CSS mode attributes for spacing and typography

### State placement

- `data.model`: nav schema (sections/items), permissions
- `view.data.model`: nav_presentation (`drawer` | `rail` | `inline`)
- `view.model`: nav_open, expanded_section_ids

### Key implementation notes

- Ensure focus trap only when in overlay drawer mode.
- Preserve section expansion state when moving between rail and inline where practical.
- Use existing Drawer behavior as foundational primitive where possible.

---

## 3.2 Toolbar

### Current issue

No formal overflow policy for narrow layouts.

### Target behavior by mode

- Phone: icon-first primary actions + overflow menu for secondary actions
- Tablet: mixed icon+label with medium overflow threshold
- Desktop: full action set inline

### Composition approach

- Hybrid:
  - JS for overflow resolution and action bucketing
  - CSS for density and label visibility rules

### State placement

- `data.model`: action registry and semantics
- `view.data.model`: visible_action_ids, overflow_action_ids
- `view.model`: overflow_open, focused_action_id

### Key implementation notes

- Keep action semantics stable regardless of location (inline vs overflow).
- Preserve keyboard order and shortcut mappings.
- Avoid duplicate action handlers by sharing command layer.

---

## 3.3 Modal

### Current issue

Size variants exist but no automatic phone-first adaptation.

### Target behavior by mode

- Phone: full-screen modal (or sheet variant for low-criticality flows)
- Tablet: large centered modal with safe margins
- Desktop: existing size variants

### Composition approach

- Mostly CSS/token policy with a small JS default resolver

### State placement

- `data.model`: modal content model / business state
- `view.data.model`: resolved_modal_size, modal_presentation
- `view.model`: is_open, active_focus_scope

### Key implementation notes

- Ensure ESC/backdrop behavior remains consistent.
- Focus return target should survive mode changes.
- Use motion tokens for transitions and respect reduced-motion.

---

## 3.4 Form_Container

### Current issue

No explicit adaptive field grid strategy for orientation and width changes.

### Target behavior by mode

- Phone: single-column form flow
- Tablet portrait: mostly single-column, selective two-column groups
- Tablet landscape/Desktop: two or more columns where appropriate

### Composition approach

- Primarily CSS mode selectors for grid columns
- JS only for field-group structural changes where required

### State placement

- `data.model`: form values and validation outcomes
- `view.data.model`: form_layout_mode, visible_field_groups
- `view.model`: active_field_id, section_expanded_state

### Key implementation notes

- Keep validation state and messages independent of presentation layout.
- Avoid moving domain values during layout transitions.
- Ensure tab/focus order remains logical in both column and stacked modes.

---

## 3.5 Tier 2 Test Priorities

Required assertions for each upgraded Tier 2 control:

- P0: no horizontal overflow and all primary actions reachable.
- P1: keyboard and ARIA behavior preserved after adaptive morph.
- P1: orientation changes do not lose active/expanded/open state unexpectedly.
- P2: touch target and spacing quality in compact/cozy/comfortable densities.

Next: cross-cutting platform functionality needed so these upgrades do not duplicate logic.
