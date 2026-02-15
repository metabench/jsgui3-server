# Chapter 4 — Cross-Cutting Platform Functionality

Control-specific improvements will be expensive and inconsistent unless shared adaptive infrastructure is added first.

This chapter defines those shared capabilities.

## 4.1 View Environment Service (Required)

### Responsibility

Resolve and publish:

- viewport dimensions + orientation
- layout_mode
- density_mode
- interaction_mode
- motion_mode

### Why first

Without this, controls will continue ad-hoc viewport checks and duplicated breakpoint logic.

### Output contract

```js
context.view_environment = {
    viewport: { width, height, orientation },
    layout_mode: 'phone' | 'tablet' | 'desktop',
    density_mode: 'compact' | 'cozy' | 'comfortable',
    interaction_mode: 'touch' | 'pointer' | 'hybrid',
    motion_mode: 'normal' | 'reduced'
};
```

### CSS bridge

Set root attributes:

- `data-layout-mode`
- `data-density-mode`
- `data-interaction-mode`
- `data-motion-mode`

## 4.2 Adaptive Composition Helper (Required)

### Responsibility

Single utility to switch composition branches by layout mode and recompose on mode change.

### Why first

Prevents control-specific conditional composition boilerplate and inconsistent fallback behavior.

### Baseline usage

```js
compose_adaptive(this, {
    phone: () => this.compose_phone(),
    tablet: () => this.compose_tablet(),
    desktop: () => this.compose_desktop()
});
```

## 4.3 Responsive Parameter Resolution (Required)

### Responsibility

Allow mode-branching in control params resolved through a single path.

### Why first

Many controls need per-mode variants (columns, row height, visible labels, etc.) without custom code per control.

### Existing alignment

`control_mixins/theme_params.js` already centralizes param schemas and hook derivation, making it the right extension point.

## 4.4 Container-Aware Mode Utility (Recommended)

### Responsibility

Resolve local mode from control container width for embedded widgets.

### Why

Viewport mode alone is insufficient for controls rendered in narrow side panels on desktop.

### Priority

P2 relative to first shipping pass, but strongly recommended for table/tab/toolbar quality.

## 4.5 Shared Overflow Policy Utility (Recommended)

### Responsibility

Provide a reusable strategy for:

- action overflow bucketing
- tab overflow handling
- consistent keyboard/focus behavior in overflow menus

### Why

`Tabbed_Panel`, `Toolbar`, and potentially `Horizontal_Menu` need similar overflow logic.

## 4.6 Adaptive Region Morph Utility (Recommended)

### Responsibility

Declare region morphs (inline sidebar ↔ rail ↔ drawer; panel ↔ sheet) in one consistent abstraction.

### Why

Reduces repeated custom morph logic in shell controls.

## 4.7 Other Functional Improvements

Beyond control-level updates, these functional additions materially improve adaptive behavior quality:

1. Preference persistence boundary:
   - persist theme + density preference
   - do not persist runtime layout mode
2. Focus restoration helpers for mode transitions:
   - return focus to sensible targets when overlays close or mode morphs
3. Motion policy adapter:
   - enforce reduced-motion behavior for adaptive transitions
4. Touch-target audit utility:
   - runtime test utility for minimum target sizes on touch mode

## 4.8 Dependency Order

Implement shared platform functionality in this order:

1. View Environment Service
2. Adaptive Composition Helper
3. Responsive Parameter Resolution
4. Shared Overflow Policy
5. Adaptive Region Morph Utility
6. Container-Aware Mode Utility

This order unlocks rapid control upgrades with minimal rework.
