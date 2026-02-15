# Chapter 15: Styling & Theming — The Aero-Inspired Design System

## Overview

The Admin UI draws visual inspiration from the Windows Aero design language: translucent glass panels, warm parchment backgrounds, subtle gradients, soft shadows, and a restrained color palette. This chapter codifies the design system into a token-based architecture compatible with jsgui3-html's existing CSS infrastructure.

---

## Design Principles

1. **Warm, not cold** — Parchment tones (`#F5F3ED`, `#EAE6DE`) instead of cold grays
2. **Glass, not flat** — Subtle translucency and layered depth through gradients and `backdrop-filter`
3. **Restraint** — A limited palette of accent colors used consistently across controls
4. **Legibility** — Small monospace text for data, larger sans-serif for headers
5. **Professional utility** — This is a developer tool, not a consumer app; favor density and information

---

## Color Palette

### Background Tones

```css
:root {
    --admin-bg-base:        #F5F3ED;    /* Main content background */
    --admin-bg-sidebar:     #EAE6DE;    /* Sidebar gradient start */
    --admin-bg-sidebar-end: #E0DCD4;    /* Sidebar gradient end */
    --admin-bg-toolbar:     #E8E4DC;    /* Toolbar gradient start */
    --admin-bg-toolbar-end: #D8D4CC;    /* Toolbar gradient end */
    --admin-bg-statusbar:   #E0DCD4;    /* Status bar */
    --admin-bg-hover:       rgba(0, 0, 0, 0.02);   /* Row hover */
    --admin-bg-active:      rgba(68, 136, 204, 0.12); /* Active item */
}
```

### Text Colors

```css
:root {
    --admin-text-primary:   #2A4060;    /* Primary text (headings, values) */
    --admin-text-secondary: #666666;    /* Labels, descriptions */
    --admin-text-muted:     #808080;    /* Timestamps, meta info */
    --admin-text-disabled:  #AAAAAA;    /* Disabled/unavailable */
}
```

### Accent Colors

Each accent color is used for a specific domain:

```css
:root {
    /* Server / Infrastructure — Blue */
    --admin-accent-blue:       #4488CC;
    --admin-accent-blue-light: #66AAEE;
    --admin-accent-blue-bg:    rgba(68, 136, 204, 0.08);

    /* Processes — Purple */
    --admin-accent-purple:       #9966CC;
    --admin-accent-purple-light: #BB88EE;
    --admin-accent-purple-bg:    rgba(153, 102, 204, 0.08);

    /* Health / Resources — Green */
    --admin-accent-green:       #66AA66;
    --admin-accent-green-light: #88CC88;
    --admin-accent-green-bg:    rgba(102, 170, 102, 0.08);

    /* Warnings / Caution — Amber */
    --admin-accent-amber:       #E8A838;
    --admin-accent-amber-light: #F0C060;
    --admin-accent-amber-bg:    rgba(232, 168, 56, 0.08);

    /* Errors / Critical — Red */
    --admin-accent-red:       #CC4444;
    --admin-accent-red-light: #EE6666;
    --admin-accent-red-bg:    rgba(204, 68, 68, 0.08);

    /* Routes / Cyan */
    --admin-accent-cyan:       #44AAAA;
    --admin-accent-cyan-light: #66CCCC;
    --admin-accent-cyan-bg:    rgba(68, 170, 170, 0.08);
}
```

### Border Colors

```css
:root {
    --admin-border-light:  #E0DCD4;    /* Group box borders, section dividers */
    --admin-border-medium: #C8C4B8;    /* Sidebar border, toolbar border */
    --admin-border-dark:   #C0BCA8;    /* Strong separators */
}
```

---

## Typography

### Font Stack

```css
:root {
    --admin-font-ui:   'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --admin-font-mono: 'Consolas', 'Courier New', monospace;
}
```

### Size Scale

The admin UI uses intentionally small font sizes for high information density:

| Token | Size | Usage |
|-------|------|-------|
| `--admin-font-xs` | 7px | Section headers, filter chips |
| `--admin-font-sm` | 8px | Code values, badge text, detail labels |
| `--admin-font-base` | 8.5px | Body text, table cells, sidebar items |
| `--admin-font-md` | 9px | Toolbar text, status bar |
| `--admin-font-lg` | 11px | Toolbar title |
| `--admin-font-xl` | 14px | View headers (h2) |
| `--admin-font-2xl` | 18px | Stat card values |
| `--admin-font-3xl` | 22px | Dashboard hero numbers |

```css
:root {
    --admin-font-xs:  7px;
    --admin-font-sm:  8px;
    --admin-font-base: 8.5px;
    --admin-font-md:  9px;
    --admin-font-lg:  11px;
    --admin-font-xl:  14px;
    --admin-font-2xl: 18px;
    --admin-font-3xl: 22px;
}
```

---

## Glass Effect — The Aero Signature

The translucent glass effect is achieved through `backdrop-filter` and semi-transparent backgrounds:

```css
.admin-glass {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

Applied to:
- Group boxes (stat cards, process panels, etc.)
- Modal dialogs (Phase 2)
- Tooltip overlays (Phase 2)

### Fallback for Non-Supporting Browsers

```css
@supports not (backdrop-filter: blur(12px)) {
    .admin-glass {
        background: rgba(245, 243, 237, 0.95);
    }
}
```

---

## Group Box — Windows Classic Reference

The Group Box control (Chapter 6) is the most explicitly Windows-inspired element:

```css
.group_box {
    border: 1px solid var(--admin-border-light);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(8px);
    position: relative;
    padding: 16px 12px 8px 12px;
    margin: 0;
}

.group_box_title {
    position: absolute;
    top: -7px;
    left: 12px;
    background: var(--admin-bg-base);
    padding: 0 6px;
    font-size: var(--admin-font-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--admin-text-muted);
}
```

This reproduces the classic Windows group box pattern where the title text sits on the border line.

---

## Stat Card Styling

```css
.stat_card {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(8px);
    border: 1px solid var(--admin-border-light);
    border-radius: 6px;
    border-left: 3px solid var(--admin-accent-blue);  /* Accent override per card */
    padding: 12px 16px;
    min-width: 140px;
    transition: box-shadow 0.2s, border-color 0.2s;
}

.stat_card:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat_card_value {
    font-family: var(--admin-font-mono);
    font-size: var(--admin-font-2xl);
    font-weight: 700;
    color: var(--admin-text-primary);
    line-height: 1.2;
}

.stat_card_label {
    font-size: var(--admin-font-xs);
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--admin-text-muted);
    margin-top: 2px;
}

.stat_card_detail {
    font-size: var(--admin-font-sm);
    color: var(--admin-text-secondary);
    font-family: var(--admin-font-mono);
    margin-top: 4px;
}
```

### Per-Card Accent Overrides

```css
.stat_card[data-accent="blue"]   { border-left-color: var(--admin-accent-blue); }
.stat_card[data-accent="purple"] { border-left-color: var(--admin-accent-purple); }
.stat_card[data-accent="green"]  { border-left-color: var(--admin-accent-green); }
.stat_card[data-accent="amber"]  { border-left-color: var(--admin-accent-amber); }
.stat_card[data-accent="red"]    { border-left-color: var(--admin-accent-red); }
```

---

## Badge System

Badges are used extensively for status indicators, method labels, and route types:

### Health Badges

```css
.health_badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--admin-font-sm);
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 10px;
}

.health-running   { background: var(--admin-accent-green-bg); color: var(--admin-accent-green); }
.health-stopped   { background: rgba(128, 128, 128, 0.1); color: var(--admin-text-muted); }
.health-crashed   { background: var(--admin-accent-red-bg); color: var(--admin-accent-red); }
.health-unhealthy { background: var(--admin-accent-amber-bg); color: var(--admin-accent-amber); }
```

### Method Badges

```css
.method_badge {
    display: inline-block;
    font-size: 7px;
    font-weight: 700;
    font-family: var(--admin-font-mono);
    padding: 1px 6px;
    border-radius: 2px;
    letter-spacing: 0.5px;
}

.method-get    { background: var(--admin-accent-green-bg); color: var(--admin-accent-green); }
.method-post   { background: var(--admin-accent-purple-bg); color: var(--admin-accent-purple); }
.method-put    { background: var(--admin-accent-blue-bg); color: var(--admin-accent-blue); }
.method-delete { background: var(--admin-accent-red-bg); color: var(--admin-accent-red); }
.method-any    { background: rgba(128, 128, 128, 0.1); color: var(--admin-text-muted); }
```

---

## Transitions & Animations

Animations are subtle and fast — this is a monitoring tool, not a marketing site:

```css
:root {
    --admin-transition-fast: 0.12s ease;
    --admin-transition-base: 0.2s ease;
    --admin-transition-slow: 0.3s ease;
}
```

### Sidebar Item Hover

```css
.sidebar-item {
    transition: background var(--admin-transition-fast),
                color var(--admin-transition-fast),
                border-color var(--admin-transition-fast);
}
```

### Stat Card Pulse (on value change)

```css
@keyframes stat-pulse {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.stat_card.stat-updating {
    animation: stat-pulse 0.3s ease;
}
```

### Log Entry Slide-In

```css
@keyframes log-slide {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}

.log-line {
    animation: log-slide 0.15s ease;
}
```

### Connection Status Pulse

```css
@keyframes status-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
}

.toolbar-status-dot.status-connected {
    animation: status-pulse 2s infinite;
}
```

---

## CSS Architecture

### Static `.css` Property Pattern

Each control class attaches its CSS as a static property, following jsgui3-html convention:

```javascript
Admin_Shell.css = `
    .admin-layout { ... }
    .admin-toolbar { ... }
    .admin-sidebar { ... }
    .admin-content { ... }
    .admin-statusbar { ... }
`;

Stat_Card.css = `
    .stat_card { ... }
    .stat_card_value { ... }
    .stat_card_label { ... }
`;

Group_Box.css = `
    .group_box { ... }
    .group_box_title { ... }
`;

// ... etc for each control
```

The CSS extraction system collects all static `.css` properties from controls used in the page and bundles them into a single stylesheet.

### Token Override File

Admin-specific tokens are placed in `admin-ui/v1/css/admin-tokens.css`:

```css
/* admin-ui/v1/css/admin-tokens.css */

:root {
    /* Background */
    --admin-bg-base: #F5F3ED;
    --admin-bg-sidebar: #EAE6DE;
    --admin-bg-sidebar-end: #E0DCD4;

    /* ... all tokens defined above ... */
}
```

This file is loaded as a static CSS asset alongside the bundled control CSS.

---

## Dark Mode (Phase 2)

A dark mode variant would override the background and text tokens:

```css
[data-theme="dark"] {
    --admin-bg-base:         #1E1E2E;
    --admin-bg-sidebar:      #252535;
    --admin-bg-sidebar-end:  #2A2A3A;
    --admin-bg-toolbar:      #2E2E3E;
    --admin-bg-toolbar-end:  #353545;
    --admin-bg-statusbar:    #252535;

    --admin-text-primary:    #E0E0E0;
    --admin-text-secondary:  #A0A0A0;
    --admin-text-muted:      #808080;

    --admin-border-light:    #3A3A4A;
    --admin-border-medium:   #454555;
    --admin-border-dark:     #505060;
}

/* Glass effect in dark mode */
[data-theme="dark"] .admin-glass {
    background: rgba(30, 30, 46, 0.75);
    border-color: rgba(255, 255, 255, 0.08);
}
```

A toggle in the toolbar or config panel would set `document.documentElement.setAttribute('data-theme', 'dark')`.

---

## Responsive Considerations

The Admin UI is primarily a desktop tool, but basic tablet support is included via a responsive sidebar:

```css
/* Narrow sidebar on screens under 900px */
@media (max-width: 900px) {
    .admin-sidebar {
        width: 48px;
    }
    .sidebar-section-header,
    .sidebar-item-label {
        display: none;
    }
    .sidebar-item {
        justify-content: center;
        padding: 8px;
    }
    .sidebar-item-icon {
        font-size: 14px;
    }

    /* Stack dashboard columns */
    .dashboard-main-row {
        flex-direction: column;
    }

    /* Wrap stat cards */
    .dashboard-stats-row {
        flex-wrap: wrap;
    }
}

/* Very narrow: stack everything */
@media (max-width: 600px) {
    .admin-body {
        flex-direction: column;
    }
    .admin-sidebar {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
        padding: 4px;
    }
    .sidebar-section {
        display: flex;
        gap: 4px;
    }
    .sidebar-section-header {
        display: none;
    }
}
```

---

## Consistency Checklist

When adding a new control to the Admin UI, ensure it follows this styling checklist:

| Item | Requirement |
|------|-------------|
| Background | Use `var(--admin-bg-base)` or glass effect |
| Text colors | Use `--admin-text-primary/secondary/muted` |
| Font family | UI text: `--admin-font-ui`; Data/code: `--admin-font-mono` |
| Font size | Pick from the scale (xs through 3xl) |
| Borders | Use `--admin-border-light/medium/dark` |
| Accents | Use the domain-appropriate accent color |
| Transitions | Use `--admin-transition-fast/base/slow` |
| Hover states | Subtle background change (`--admin-bg-hover`) |
| Padding | 8px / 12px / 16px consistent with existing controls |
| Border radius | 3px for small elements, 6px for cards |
