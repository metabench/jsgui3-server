# Chapter 2 — Responsive Composition Model

## The Problem

Consider a typical admin dashboard built on jsgui3. On desktop, it shows a navigation sidebar, a main content area, and a property inspector panel — three columns. On tablet portrait, the property inspector should collapse to a slide-over panel. On phone, the sidebar should become a hamburger-triggered drawer and the inspector should become a full-screen modal.

The naive approach is to build one big layout and write CSS media queries to hide/show regions. But this creates problems:

1. **All three layouts are in the DOM simultaneously**, even when invisible — wasting memory and causing accessibility confusion (screen readers find hidden elements).
2. **Business logic couples to layout** — event handlers reference elements that may be hidden, requiring defensive checks everywhere.
3. **Controls can't adapt their own internal structure** — a data table might want to show 2 columns on phone and 8 on desktop, but CSS can only hide columns, not restructure the control.

jsgui3's compositional model offers a better path: compose different control trees for different environments, sharing the same domain data.

## Design Objective

**High-level app code should declare intent, not breakpoint math.**

An app developer should write something like *"use a three-column shell on desktop, two columns on tablet, single column with drawers on phone"* and have the platform resolve the details. The developer should not be manually checking `window.innerWidth` in fifteen places.

## The Four-Layer Composition Model

Adaptive composition in jsgui3 separates concerns into four layers. Each layer has a clear responsibility and communicates with adjacent layers through well-defined contracts.

```
┌─────────────────────────────────────────────┐
│  Layer A: Domain Composition                │
│  (entities, actions, permissions, workflow)  │
│  ─── completely device-agnostic ───         │
├─────────────────────────────────────────────┤
│  Layer B: View Composition                  │
│  (regions, component hierarchy, adaptive    │
│   intent declarations)                      │
├─────────────────────────────────────────────┤
│  Layer C: Adaptive Resolution               │
│  (environment service resolves intent →     │
│   concrete mode, density, interaction)      │
├─────────────────────────────────────────────┤
│  Layer D: Concrete Render                   │
│  (resolved CSS classes, DOM attributes,     │
│   control params, token values)             │
└─────────────────────────────────────────────┘
```

### Layer A: Domain Composition

This is the business logic layer. It defines what data exists, what actions are available, and what workflows the user follows. It should have **zero awareness of screen size or device type**.

Examples of Layer A concerns:
- "The user has a list of projects"
- "Each project has a name, status, and due date"
- "The user can archive a project"

In jsgui3, Layer A lives in `data.model` — the Data_Object instances managed by `ensure_control_models()`. Whether the app runs on a phone or a 4K monitor, the domain model is identical.

### Layer B: View Composition

This layer defines the UI structure: what regions exist, what controls they contain, and how they relate to each other. Critically, Layer B can express **adaptive intent** without committing to specific breakpoints.

Examples of Layer B declarations:
- "The app has a navigation region, a content region, and a tools region"
- "The navigation region can collapse to a drawer on narrow screens"
- "The tools region is optional and can be toggled"

In jsgui3, Layer B lives in the constructor's composition logic — the `compose_ui()` method that builds the control tree. The key design choice is that Layer B expresses *what should adapt* without specifying *when*.

### Layer C: Adaptive Resolution

This is the platform layer that answers the question: "given the current environment, how should composition intent be resolved?" It observes:

- Viewport width and height
- Orientation (portrait/landscape/square)
- Input modality (touch/pointer/hybrid)
- User preferences (reduced motion, contrast, density preference)

And produces a normalized environment contract:

```js
context.view_environment = {
    viewport: { width: 768, height: 1024, orientation: 'portrait' },
    layout_mode: 'tablet',     // 'phone' | 'tablet' | 'desktop'
    density_mode: 'cozy',      // 'compact' | 'cozy' | 'comfortable'
    interaction_mode: 'touch', // 'touch' | 'pointer' | 'hybrid'
    motion_mode: 'normal'      // 'normal' | 'reduced'
}
```

This contract is observable — controls and view models can listen for changes and recompose when the environment shifts (for instance, when a browser window is resized across a breakpoint boundary, or when a tablet is rotated).

### Layer D: Concrete Render

The resolved environment drives concrete rendering decisions: CSS classes on the root element (`data-layout-mode="tablet"`), specific token overrides for the density mode, and resolved control parameters.

At this layer, everything is deterministic. Given environment state X, the output is always CSS class set Y and token values Z. This makes testing straightforward — you can assert on Layer D output without needing a real browser.

## How the Layers Interact

Here's the flow for a realistic scenario — a dashboard app loading on a tablet in portrait:

1. **Layer A** is set up: the data model contains projects, user preferences, etc.
2. **Layer B** composes the shell: nav region, content region, tools region. The nav region is marked as "collapsible."
3. **Layer C** reads the viewport (768×1024), determines `layout_mode: 'tablet'`, `interaction_mode: 'touch'`.
4. **Layer D** applies: `data-layout-mode="tablet"` on root, nav region renders as a slide-over panel (not inline sidebar), touch density tokens are applied.
5. The user rotates to landscape (1024×768).
6. **Layer C** detects the change, updates to `layout_mode: 'desktop'` (1024px exceeds the tablet threshold).
7. **Layer B** recomposes: nav region switches from slide-over to inline sidebar.
8. **Layer D** updates: root attribute changes, CSS transitions the layout.

## SSR Considerations

On the server, there is no viewport. Layer C needs a default. Two strategies:

1. **Desktop-first SSR**: Compose for desktop, let the client refine on activation. This is the simplest approach and avoids layout shift on most users (majority of admin/dashboard users are desktop).

2. **Hint-based SSR**: Pass environment hints through the request (User-Agent parsing, explicit query param, or stored preference). The server composes for the hinted mode. The client validates and corrects if needed.

For most jsgui3 applications, desktop-first SSR is the right default. Mobile refinement happens in `activate()` and is fast because jsgui3's activation is already designed for incremental DOM updates.

## Why CSS-Only Approaches Fall Short

Pure CSS media queries can handle styling changes (font sizes, padding, hiding elements), but they cannot:

- **Restructure the control tree** — replace a sidebar with a tabbed panel
- **Change control parameters** — switch a table from 8 columns to 2
- **Coordinate across components** — ensure nav, content, and tools all agree on the same mode
- **Drive model updates** — notify the view model that the layout changed so other logic can respond

CSS is excellent for Layer D concerns (visual polish, transitions, token overrides). But Layers B and C require JavaScript-level composition decisions, which is exactly what jsgui3's constructor + activate pattern enables.

This doesn't mean we should ignore CSS entirely. The ideal approach is:

- **CSS handles continuous adaptation** — fluid typography, flexible gaps, wrapping
- **JS handles discrete adaptation** — structural changes at mode boundaries

## Example: Before and After

### Before (ad-hoc responsive code):

```js
compose_ui(context) {
    // Developer manually checks width, duplicates logic
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        this.nav = new Drawer({ context, position: 'left' });
        this.content = new Stack({ context, direction: 'column' });
        // phone layout...
    } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        this.nav = new Stack({ context, direction: 'column' });
        this.content = new Stack({ context, direction: 'column' });
        // tablet layout...
    } else {
        this.nav = new Stack({ context, direction: 'column' });
        this.tools = new Stack({ context, direction: 'column' });
        this.content = new Stack({ context, direction: 'column' });
        // desktop layout...
    }
}
```

Problems: breakpoint values are hardcoded, no coordination with other controls, no observable state, no SSR support, no recomposition on resize.

### After (with adaptive composition):

```js
compose_ui(context) {
    const env = context.view_environment;

    compose_adaptive(this, env, {
        phone:   () => this.compose_phone_shell(),
        tablet:  () => this.compose_tablet_shell(),
        desktop: () => this.compose_desktop_shell()
    });
}
```

The `compose_adaptive` helper reads `env.layout_mode`, calls the right branch, and registers a listener so the shell recomposes if the mode changes. The breakpoint thresholds are defined once in the environment service, not scattered across app code.

Each `compose_*_shell()` method shares the same domain model (Layer A) but builds a different control tree (Layer B). The developer writes three short, focused composition functions instead of one tangled conditional.

## Key Design Principles

1. **Domain state never knows about devices.** If you're putting `layout_mode` in your data model, something is wrong.
2. **Composition intent is separate from resolution.** A region declared as "collapsible" doesn't decide when to collapse — the environment service does.
3. **Continuous CSS, discrete JS.** Fluid sizing stays in CSS. Structural reorganization happens in constructors.
4. **Observable, not polled.** The environment service emits change events. Controls don't poll `window.innerWidth`.
5. **SSR-safe defaults.** Everything works without a viewport. Client activation refines.

**Next:** [Chapter 3](03-data-model-vs-view-model.md) explains how the MVVM model separation keeps adaptive state clean and testable.
