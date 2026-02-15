# Chapter 1 — Platform Feature Audit

Before proposing new infrastructure, we need to understand what jsgui3 already provides and where the real gaps are. This chapter walks through the existing capabilities, illustrates them with actual platform code, and identifies what's missing.

## Existing Strengths

### 1) Isomorphic Composition Model

Controls in jsgui3 are composed on the server and activated on the client. The constructor builds the DOM tree; the `activate()` method wires up event listeners. This gives us a crucial advantage for adaptive UI: we can make **structural composition decisions** at construction time, not just CSS overrides.

For responsive design, this means a control can choose entirely different internal compositions based on environment state — a sidebar can be composed as a `Drawer` on mobile and as a static panel on desktop, using the same business logic, without CSS gymnastics.

### 2) Layout Primitives with Practical APIs

The layout primitives in `controls/organised/1-standard/6-layout/` provide building blocks for most responsive patterns:

**Stack** — flexbox container with direction, gap, alignment, wrapping:

```js
const nav = new Stack({
    context,
    direction: 'row',    // or 'column'
    gap: 8,
    align: 'center',
    justify: 'between',
    wrap: true            // allows items to flow to next line
});
```

Stack supports runtime property changes (`set_direction()`, `set_gap()`, etc.), which means a control can switch from horizontal to vertical layout without rebuilding its DOM tree.

**Cluster** — wrapped inline groups for tags, chips, buttons:

```js
const chips = new Cluster({ context, gap: 6, align: 'center' });
```

**Center** — centering with max-width constraint:

```js
const content = new Center({ context, max: 960 });
```

**Grid_Gap** — CSS Grid with column/row templates and gap.

**Split_Pane** — resizable dual-panel layout:

```js
const editor = new Split_Pane({
    context,
    orientation: 'horizontal',
    initial_ratio: 0.3
});
```

**Drawer** — the most responsive-aware primitive today. It already has a `breakpoint` property and an `overlay_mode` that switches between overlay and docked behavior:

```js
const nav_drawer = new Drawer({
    context,
    position: 'left',
    breakpoint: 960,      // below this width: overlay mode
    overlay_mode: true,
    content: nav_panel
});
```

In `activate()`, the Drawer listens for `window.resize` and calls `update_responsive_state()`:

```js
update_responsive_state() {
    if (typeof window === 'undefined') return;
    const is_overlay = this.overlay_mode && window.innerWidth < this.breakpoint;
    if (is_overlay) {
        this.remove_class('drawer-docked');
        this.add_class('drawer-overlay-mode');
    } else {
        this.add_class('drawer-docked');
        this.remove_class('drawer-overlay-mode');
    }
}
```

This is the closest thing to adaptive composition behavior in the current platform. It proves the pattern works; the question is how to generalize it.

### 3) Design Token Infrastructure

The token system in `css/jsgui-tokens.css` provides a comprehensive set of CSS custom properties with the `--j-` prefix:

- **Spacing scale** (8px base): `--j-space-1` through `--j-space-8`
- **Typography scale**: `--j-text-xs` through `--j-text-xl`
- **Radius, shadow, motion**: `--j-radius-sm` through `--j-radius-full`, `--j-shadow-sm` through `--j-shadow-xl`
- **Color system**: semantic foreground/background tokens with full dark-mode overrides
- **Motion tokens**: `--j-duration-fast`, `--j-duration-normal`, `--j-duration-slow` with automatic zeroing under `prefers-reduced-motion`

The admin theme bridge (`--admin-*` tokens) provides an additional layer used by data-oriented controls like tables, forms, and editors.

Dark mode is handled via `[data-theme="dark"]` or `.jsgui-dark-mode` selectors, and the `Admin_Theme` presets map named themes to token overrides. This gives a solid foundation for device-adaptive theming — the same token-override pattern can drive density and layout-mode styling.

### 4) MVVM Foundations

`Data_Model_View_Model_Control` and `control_model_factory.js` provide explicit separation between:

- **`data.model`** — domain state (business data)
- **`view.data.model`** — presentation state (what the view needs to render)
- **`view.model`** — view-instance state (UI interaction state)
- **`view.ui`** — UI structure metadata

The factory function `ensure_control_models()` sets up this stack automatically:

```js
ensure_control_models(this, spec);
// After this call:
//   this.data.model       → Data_Object (domain state)
//   this.view.data.model  → Data_Object (presentation state)
//   this.view.ui          → Control_View_UI (structure)
```

This separation is essential for adaptive UI. Device-specific state (layout mode, sidebar visibility, density) belongs in the view model, not the data model. The infrastructure already exists; we just need conventions for using it with environment state.

### 5) Interaction and Accessibility Utilities

`control_mixins/keyboard_navigation.js` provides orientation-aware keyboard handling — arrow keys navigate differently in vertical vs horizontal contexts, which is directly relevant when layouts change orientation across breakpoints.

The guidance in `docs/accessibility_and_semantics.md` establishes patterns for ARIA roles, focus management, and screen reader support. The existing `prefers-reduced-motion` reset in the token system ensures motion tokens go to `0ms` when the user requests reduced motion.

## Current Gaps

### 1) No Unified Responsive Policy Layer

Responsive behavior is currently ad-hoc. The Drawer has its own `breakpoint` property and resize listener. Other controls rely on whatever `@media` queries the app developer writes. There is no shared service that answers the question "what layout mode are we in?" and notifies controls when it changes.

This means every control that needs responsive behavior reinvents its own detection logic, and controls can't coordinate — a sidebar might think it's in "desktop" mode while a toolbar uses a different breakpoint to decide it's in "tablet" mode.

### 2) No Declarative Viewport/Container Model

The platform doesn't currently expose semantic mode labels. A developer can read `window.innerWidth`, but there's no first-class concept of:

- **Layout mode**: phone / tablet / desktop
- **Density mode**: compact / cozy / comfortable
- **Interaction mode**: touch / pointer / hybrid
- **Motion mode**: normal / reduced

These concepts exist implicitly — Drawer's breakpoint check is really a layout-mode check — but they aren't formalized into a shared vocabulary.

### 3) Display-Mode System: Architecturally Rich but Not Productionized

`control_mixins/display.js` contains a sophisticated class hierarchy (`Ctrl_Display`, `Ctrl_Display_Modes`, `Ctrl_Display_Mode_Category`, `Ctrl_Display_Modes_Categories`) designed to let controls express multiple display modes with categories like size, layout, colors, and interactivity. The architecture envisions controls that can render as icons, thumbnails, cards, or full panels depending on context.

However, this system is still in design-exploration phase. The classes exist and work, but no production controls use them as their display-mode API. The code contains extensive design notes like:

> "Want it to be easy to call on and use display mode functionality."
> "May want nice CSS transitions between display modes."

This is valuable forward thinking that aligns well with adaptive composition. The question is whether to productionize this existing architecture or build the adaptive system alongside it and unify later.

### 4) Responsive Testing Is Not Standardized

The Playwright test suite validates rich interactivity across 14+ test suites, but all tests run at a single viewport size. There is no systematic viewport-matrix testing (run the same assertions at phone, tablet, and desktop sizes) and no structural assertions like "no horizontal overflow at 390px width."

## Summary

| Area | Status | Key Asset |
|------|--------|-----------|
| Isomorphic composition | Strong | Constructor + activate() split |
| Layout primitives | Strong | Stack, Drawer, Split_Pane, Grid_Gap |
| Token/theme system | Strong | `--j-*` and `--admin-*` tokens, dark mode |
| MVVM model separation | Strong | data.model, view.data.model, view.ui |
| Accessibility | Adequate | keyboard_navigation, reduced-motion |
| Responsive policy | Gap | No shared environment service |
| Declarative adaptive modes | Gap | No layout_mode / density_mode vocabulary |
| Display-mode API | In design | Classes exist, not productionized |
| Viewport-matrix testing | Gap | No multi-viewport Playwright runner |

The platform is well-positioned. The composition model, token system, and model separation give us the right foundations. What's needed is a thin coordination layer — an environment service and adaptive composition helpers — that turns ad-hoc responsive code into a consistent, testable pattern.

**Next:** [Chapter 2](02-responsive-composition-model.md) introduces the four-layer composition model that organizes adaptive decisions.
