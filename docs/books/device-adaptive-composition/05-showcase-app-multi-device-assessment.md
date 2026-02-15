# Chapter 5 — Showcase App Multi-Device Assessment

## About the Showcase App

The showcase app (`dev-examples/binding/showcase_app/`) is a comprehensive demo of jsgui3 controls featuring:

- A **navigation sidebar** with section links
- A **Theme Studio** panel with preset switching, CSS variable editing, and export/import
- A **main content area** with sections: status bars, button variants, filter chips, tabbed panels, accordions, drawers, code editors, and console panels
- **localStorage persistence** for theme preferences

The current layout uses a three-column CSS Grid shell: `240px` (nav) + `260px` (theme studio) + `1fr` (content). This chapter assesses how this app would behave across device categories and identifies concrete adaptation points.

## Current Layout Analysis

### What Works Well Already

The app benefits from several naturally responsive behaviors:

- **CSS Grid with `1fr`** — the content area is flexible and fills available space
- **Token-driven styling** — control sizes, padding, and typography are all token-based, not hardcoded
- **Section-based content architecture** — each demo section is independent and scrollable
- **Interactive controls work** — tab switching, accordion expansion, drawer toggle, console append all function correctly regardless of viewport

### Where It Breaks

At narrower widths, the three-column shell creates problems:

- Below ~800px, the nav + theme studio consume most of the width, leaving the content area cramped
- Below ~600px, the three fixed columns overflow horizontally
- The theme studio's color pickers and text inputs become too narrow to use comfortably
- The navigation sidebar provides no value on phone screens where vertical scrolling is the natural navigation pattern

## Phone Assessment (320–480px)

### Target Devices

iPhone SE (375×667), iPhone 14 (390×844), Android small (360×800)

### Structural Adaptation Needed

The three-column layout must collapse to a **single-column stack** with drawer-based access to navigation and theme tools:

| Desktop Component | Phone Adaptation |
|-------------------|-----------------|
| Navigation sidebar (240px) | Hamburger menu → Drawer overlay |
| Theme Studio panel (260px) | Settings icon → Drawer overlay or bottom sheet |
| Content area (1fr) | Full width, single column |
| Section headers | Become scroll-to anchors, possibly sticky |

### Specific Concerns

1. **Touch targets** — Button groups (icon buttons, split buttons) need minimum 44×44px hit areas. The current icon buttons may be too small for comfortable thumb interaction.

2. **Filter chips** — The Cluster layout wraps naturally, which is good. But on narrow screens, a horizontally-scrollable strip might be better than wrapping to 3–4 rows.

3. **Tabbed panels** — Horizontal tabs work on phone if there are ≤4 tabs. More tabs should overflow-scroll horizontally rather than wrapping to multiple lines.

4. **Code editor** — Horizontal scrolling for code is acceptable on phone (developers expect it), but the container should be full-bleed to maximize line length.

5. **Theme Studio** — The full theme editor is a power-user feature that may not need to be accessible on phone. A simplified "preset only" mode (just the preset buttons) is more appropriate.

### Recommended Composition

```
Phone layout:
┌──────────────────┐
│ [≡] App Title [⚙]│  ← hamburger (nav) + gear (theme presets)
├──────────────────┤
│                  │
│  Content area    │  ← full width, vertical scroll
│  (all sections   │
│   stacked)       │
│                  │
└──────────────────┘
```

## Tablet Portrait Assessment (768×1024)

### Target Devices

iPad (768×1024), iPad Air (820×1180), Surface Go (800×1280)

### Structural Adaptation Needed

Two columns work well at this width. The question is which two columns:

**Option A: Content + Theme Studio**

Drop the nav sidebar. Use a collapsible top bar or hamburger for navigation. Keep the theme studio visible because it's the interactive focus of a showcase app.

**Option B: Nav + Content**

Drop the theme studio to a slide-over panel. Keep the nav visible for section discovery. This prioritizes browse-ability.

For a showcase app, **Option A** is stronger — the theme studio is the unique value proposition. Section navigation can use a compact horizontal pill bar or a dropdown.

### Specific Concerns

1. **Three columns at 768px** — the current 240 + 260 + remaining = 268px for content. That's too cramped for code editors and data tables. Two columns are necessary.

2. **Spacing** — Desktop spacing tokens (`--j-space-5: 24px`) may feel too generous and waste tablet real estate. A `cozy` density mode with slightly tighter spacing would help.

3. **Split pane** — If both content and theme studio are visible, a Split_Pane with a drag handle would let users choose the balance. The existing Split_Pane primitive supports this.

### Recommended Composition

```
Tablet portrait layout:
┌─────────────────────────────┐
│ [≡] App Title    [Nav pills]│  ← hamburger for full nav, pills for top sections
├──────────────┬──────────────┤
│              │              │
│  Content     │  Theme       │
│  area        │  Studio      │
│              │              │
│              │              │
└──────────────┴──────────────┘
```

## Tablet Landscape Assessment (1024×768)

### Target Devices

iPad landscape (1024×768), Surface Go landscape (1280×800)

### Structural Adaptation

At 1024px, the full three-column layout becomes viable, though with tighter proportions than desktop:

- Nav: 180px (narrower than desktop's 240px)
- Theme Studio: 220px (narrower than desktop's 260px)  
- Content: 624px (adequate for most controls)

Alternatively, keep the two-column layout from tablet portrait and add the nav as a collapsible sidebar, deferring to the Drawer pattern when space gets tight.

### Specific Concerns

1. **Vertical space** — At 768px height, sticky panels should be limited. The theme studio shouldn't use `position: sticky` with a long panel because it would consume most of the viewport height.

2. **Keyboard navigation** — Tablet landscape is often used with a keyboard (Surface, iPad with Magic Keyboard). The full keyboard navigation paths should work, including tab-to-section and arrow-key-within-components.

## Desktop Assessment (1280–1920px+)

### What Works Well

The current layout is designed for desktop and works well:

- Three-column shell provides clear information hierarchy
- Generous spacing aids readability
- Theme studio is always accessible for experimentation
- Navigation sidebar gives quick section access

### Remaining Concerns

1. **Max content width** — On very wide screens (1920px+), text lines in the content area become too long for comfortable reading. Adding a `max-width: 900px` on text-heavy content or using the `Center` primitive would help.

2. **Pinnable panels** — On wide screens, users might want to unpin the theme studio or nav to gain more content space. A pin/unpin toggle on panel headers would add flexibility.

3. **Section subnavigation** — As the control catalog grows, flat scrolling through many sections becomes tedious. Section-level dropdowns or an accordion sidebar structure would improve discoverability.

## Cross-Device Summary Table

| Feature | Phone | Tablet Portrait | Tablet Landscape | Desktop |
|---------|-------|----------------|------------------|---------|
| Columns | 1 | 2 | 2–3 | 3 |
| Navigation | Drawer | Pills / dropdown | Sidebar or collapsible | Sidebar |
| Theme Studio | Presets only | Side panel | Side panel | Side panel |
| Density | Comfortable | Cozy | Cozy | Default |
| Touch targets | 44px+ | 44px+ | 36px+ | 32px+ |
| Content max-width | Full bleed | ~500px | ~600px | ~900px |

## Adaptation Points in the Current Code

Looking at the showcase app's `compose_ui()` method, the key adaptation opportunities are:

1. **Shell grid template** — currently hardcoded as `240px 260px 1fr`. Should be derived from `layout_mode`.

2. **Navigation panel** — currently composed inline. Should use `compose_adaptive` to switch between inline sidebar, pill bar, and drawer.

3. **Theme studio** — currently composed inline. Should collapse to presets-only on phone, slide-over on tablet.

4. **Section card widths** — currently use flexible styling. Could set `max-width` per layout mode to prevent overly wide content.

5. **Token density** — currently static. Should respond to `density_mode` attribute on root.

## Browser Window Variability

A final consideration: users frequently resize browser windows, especially when using split-screen on desktop. The layout should adapt fluidly between 600px and 1400px without sudden jumps or broken states.

The recommended approach uses CSS for fluid adaptation within a mode (e.g., flexible gaps and content wrapping) and JavaScript composition changes at mode boundaries (e.g., switching from two-column to drawer). This dual strategy avoids the flicker of constant recomposition while still handling structural changes cleanly.

**Next:** [Chapter 6](06-implementation-patterns-and-apis.md) provides the concrete patterns and API designs needed to implement these adaptations.
