# Chapter 4 — Styling, Themes, and Breakpoint Strategy

## The Two Kinds of Responsiveness

Responsive UI involves two fundamentally different kinds of adaptation:

1. **Continuous adaptation** — sizes, spacing, and proportions that scale fluidly. A font might be 14px on desktop and 16px on mobile. Padding might shrink from 24px to 12px. These are gradients, not switches.

2. **Discrete adaptation** — structural changes at specific boundaries. A sidebar becomes a drawer. A table becomes a card list. Three columns become one. These are switches, not gradients.

CSS handles continuous adaptation well (fluid units, `clamp()`, flexible layouts). Discrete adaptation typically requires JavaScript composition decisions, as discussed in Chapter 2. But there's an important middle ground: **mode-qualified CSS** that uses data attributes set by the environment service.

This chapter covers how jsgui3's token and theme system supports both kinds of adaptation.

## Current Token Architecture

The token system in `css/jsgui-tokens.css` provides two tiers:

### Design tokens (`--j-*`)

Foundation-level tokens for spacing, typography, radii, shadows, motion, and color:

```css
/* Spacing scale (8px base) */
--j-space-1: 4px;    --j-space-2: 8px;    --j-space-3: 12px;
--j-space-4: 16px;   --j-space-5: 24px;   --j-space-6: 32px;

/* Typography scale */
--j-text-xs: 0.75rem;   --j-text-sm: 0.875rem;   --j-text-base: 1rem;
--j-text-lg: 1.125rem;  --j-text-xl: 1.5rem;

/* Motion (zeroed under prefers-reduced-motion) */
--j-duration-fast: 120ms;   --j-duration-normal: 200ms;   --j-duration-slow: 350ms;
```

### Component tokens (`--admin-*`)

Higher-level tokens consumed by admin/data controls:

```css
--admin-font-size: 13px;
--admin-row-height: 36px;
--admin-cell-padding: 8px 12px;
--admin-radius: 4px;
```

Both tiers include full dark-mode overrides via the `[data-theme="dark"]` selector.

## Strategy 1: Mode Classes Over Scattered Breakpoints

The traditional approach scatters `@media` queries across component stylesheets:

```css
/* ❌ Scattered: breakpoint values duplicated everywhere */
@media (max-width: 768px) {
    .project-list { flex-direction: column; }
}
@media (max-width: 768px) {
    .tool-panel { display: none; }
}
@media (max-width: 768px) {
    .nav-bar { font-size: 14px; }
}
```

Problems: the value `768px` is repeated in dozens of files; there's no single source of truth; changing the breakpoint requires a global search-and-replace.

The recommended approach uses **mode attributes** set by the environment service (Layer C):

```html
<body data-layout-mode="phone" data-density-mode="compact" data-interaction-mode="touch">
```

Component CSS then targets the mode, not the breakpoint:

```css
/* ✅ Mode-qualified: breakpoint logic lives in one place (the environment service) */
[data-layout-mode="phone"] .project-list {
    flex-direction: column;
}
[data-layout-mode="phone"] .tool-panel {
    display: none;
}
[data-layout-mode="phone"] .nav-bar {
    font-size: var(--j-text-sm);
}
```

Benefits:
- **Single source of truth** for breakpoint thresholds (the environment service)
- **Testable** — set `data-layout-mode="phone"` on any element in a test and verify styles
- **Composable** — combine mode, density, and interaction qualifiers: `[data-layout-mode="phone"][data-density-mode="compact"]`
- **SSR-friendly** — the server can set mode attributes based on request hints

This is the same pattern that dark mode already uses — `[data-theme="dark"]` overrides tokens. We're extending it to layout mode and density.

## Strategy 2: Responsive Token Tiers

Some styling changes are too pervasive to write as individual CSS rules. Font size, row height, padding, and spacing should adapt globally. The right approach is to override tokens at the root based on the active mode.

### Proposed density token overrides

```css
/* Compact — information-dense, smaller touch targets, less whitespace */
[data-density-mode="compact"] {
    --j-space-2: 4px;
    --j-space-3: 8px;
    --j-space-4: 12px;
    --j-space-5: 16px;
    --admin-font-size: 12px;
    --admin-row-height: 28px;
    --admin-cell-padding: 4px 8px;
}

/* Comfortable — generous whitespace, larger touch targets */
[data-density-mode="comfortable"] {
    --j-space-2: 12px;
    --j-space-3: 16px;
    --j-space-4: 20px;
    --j-space-5: 32px;
    --admin-font-size: 15px;
    --admin-row-height: 44px;
    --admin-cell-padding: 12px 16px;
}
```

No component CSS needs to change. Every control that uses `--j-space-*` or `--admin-row-height` automatically adapts. The token system does the work.

### Why density and theme are orthogonal

Theme (color identity: light, dark, vs-dark) and density (space economy: compact, cozy, comfortable) are independent axes. A user might want:

- `vs-dark` theme + `compact` density (power user, dark IDE-like)
- Light theme + `comfortable` density (presentation mode, accessibility)
- `vs-dark` theme + `comfortable` density (dark mode on a touch tablet)

Implementing them as separate data attributes ensures they compose freely:

```html
<body data-theme="vs-dark" data-density-mode="compact">
```

## Strategy 3: Theme Profiles

The showcase app already persists theme state to localStorage. Extending this to include density and layout preferences creates a clean **theme profile** object:

```js
const profile = {
    theme: 'vs-dark',
    density: 'compact',
    overrides: {
        '--admin-font-size': '12px',
        '--admin-radius': '2px'
    }
};
```

This profile object is:
- **Serializable** — JSON-safe for localStorage, export/import, server storage
- **Transferable** — share profiles between users or across projects
- **Testable** — apply a profile in a test fixture and assert visual outcomes
- **Composable** — merge a base profile with user overrides

The existing showcase app persistence (`showcase_theme_state_v1` localStorage key) can evolve to store full profiles.

## Strategy 4: Touch-Optimized Density

Touch interaction requires larger hit targets (minimum 44×44px per WCAG guidelines, 48×48px recommended by Google Material). The density system should enforce this:

```css
[data-interaction-mode="touch"] {
    --admin-row-height: max(var(--admin-row-height), 44px);
    --j-space-2: max(var(--j-space-2), 8px);
}

[data-interaction-mode="touch"] button,
[data-interaction-mode="touch"] [role="button"],
[data-interaction-mode="touch"] a {
    min-height: 44px;
    min-width: 44px;
}
```

This is applied as a CSS layer, so it works alongside any density setting — `compact` + `touch` still guarantees accessible hit targets.

## Reduced Motion and Accessibility

The token system already handles reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    :root {
        --j-duration-fast: 0ms;
        --j-duration-normal: 0ms;
        --j-duration-slow: 0ms;
    }
}
```

This should be extended to cover adaptive transitions — the panel collapse animations, nav morphing transitions, and drawer slide-ins that form part of the adaptive composition. If a control uses `transition: transform var(--j-duration-normal)`, reduced-motion users get instant changes automatically.

For high-contrast mode, the token system can add a `[data-contrast="high"]` tier that increases border widths, removes subtle shadows, and ensures minimum contrast ratios.

## Putting It Together: Token Cascade

The full cascade for a control's styling looks like:

```
Base tokens (--j-*, --admin-*)
  ↓ overridden by
Theme tier ([data-theme="vs-dark"])
  ↓ overridden by
Density tier ([data-density-mode="compact"])
  ↓ overridden by
Interaction tier ([data-interaction-mode="touch"])
  ↓ overridden by
User overrides (inline style from theme profile)
```

Each layer only overrides what it needs. Controls consume tokens through CSS custom properties and adapt automatically as the cascade resolves.

## Summary

| Strategy | Purpose | Mechanism |
|----------|---------|-----------|
| Mode classes | Structural CSS adaptation | `data-layout-mode`, `data-density-mode` attributes |
| Token tiers | Global spacing/sizing adaptation | Token overrides per density mode |
| Theme profiles | Persistence and transfer | Serializable JSON objects |
| Touch density | Accessible hit targets | Minimum size enforcement via CSS |
| Reduced motion | Motion accessibility | Duration tokens zeroed |

The key insight is that jsgui3's token system already handles one axis of adaptation (light/dark theming) very well. Extending the same pattern to density, layout mode, and interaction mode is a natural evolution, not a redesign.

**Next:** [Chapter 5](05-showcase-app-multi-device-assessment.md) applies these strategies to the showcase app to assess what works and what needs to change.
