# Chapter 6 — Implementation Patterns and APIs

## Design Goal

Make high-level app code easy to write. A developer building a dashboard shouldn't need to understand viewport detection, mode resolution, or responsive token cascades. They should express adaptive intent in a few lines and get correct behavior across devices.

Complexity belongs in the mid-level platform code — the services, helpers, and mixins that resolve intent into concrete outcomes. And the low-level foundations in lang-tools and html-core handle eventing, model synchronization, and rendering.

This chapter defines the concrete patterns and APIs that make this work.

## Pattern 1: View Environment Service

### What It Does

A lightweight service that observes the runtime environment and publishes normalized state. Every control and view model can read from it. It runs client-side only (on the server, it returns safe defaults).

### API Design

```js
const View_Environment = require('jsgui3-html/utils/view_environment');

// Created once per page context
const env = new View_Environment({
    // Optional: override default breakpoints
    breakpoints: {
        phone_max: 599,
        tablet_max: 1023
    },
    // Optional: default for SSR
    defaults: {
        layout_mode: 'desktop',
        density_mode: 'cozy',
        interaction_mode: 'pointer',
        motion_mode: 'normal'
    }
});
```

### Published State

```js
env.state
// → {
//     viewport: { width: 768, height: 1024, orientation: 'portrait' },
//     layout_mode: 'tablet',
//     density_mode: 'cozy',
//     interaction_mode: 'touch',
//     motion_mode: 'normal'
// }
```

### Change Events

```js
env.on('change', (new_state, old_state) => {
    // Fires when any property changes
});

env.on('change:layout_mode', (new_mode, old_mode) => {
    // Fires only when layout_mode changes
});
```

### Integration with Page Context

```js
// In the app's initialization:
const ctx = new jsgui.Page_Context();
ctx.view_environment = new View_Environment();

// In any control:
const mode = this.context.view_environment.state.layout_mode;
```

### Implementation Notes

The service should:
- Listen to `window.resize` (debounced) and `matchMedia` for reduced-motion and pointer queries
- Derive `layout_mode` from viewport width using configurable breakpoints
- Derive `interaction_mode` from `matchMedia('(pointer: coarse)')` — coarse = touch, fine = pointer, both = hybrid
- Derive `motion_mode` from `matchMedia('(prefers-reduced-motion: reduce)')`
- Set `data-layout-mode`, `data-density-mode`, and `data-interaction-mode` attributes on `document.documentElement`
- On the server (`typeof window === 'undefined'`), return static defaults

### Server-Side Behavior

```js
// On the server, the environment returns defaults:
const env = new View_Environment();
env.state.layout_mode  // → 'desktop' (safe default)
env.state.viewport     // → { width: 1280, height: 900, orientation: 'landscape' }

// Controls can use this for SSR composition:
if (env.state.layout_mode === 'phone') {
    // Only reached if server received a mobile hint
    this.compose_phone_shell();
} else {
    this.compose_desktop_shell();
}
```

## Pattern 2: Adaptive Composition Helper

### The Problem It Solves

Without a helper, every adaptive control writes the same boilerplate:

```js
// Repeated in every control:
const mode = this.context.view_environment.state.layout_mode;
if (mode === 'phone') this.compose_phone();
else if (mode === 'tablet') this.compose_tablet();
else this.compose_desktop();

// And then separately, resize handling:
this.context.view_environment.on('change:layout_mode', (new_mode) => {
    this.clear();
    if (new_mode === 'phone') this.compose_phone();
    else if (new_mode === 'tablet') this.compose_tablet();
    else this.compose_desktop();
});
```

### The Helper API

```js
const { compose_adaptive } = require('jsgui3-html/utils/adaptive');

class My_Dashboard extends Data_Model_View_Model_Control {
    constructor(spec) {
        super(spec);

        compose_adaptive(this, {
            phone:   () => this.compose_phone_shell(),
            tablet:  () => this.compose_tablet_shell(),
            desktop: () => this.compose_desktop_shell()
        });
    }

    compose_phone_shell() {
        const { context } = this;
        this.header = new Stack({ context, direction: 'row', align: 'center' });
        this.header.add(new Icon_Button({ context, icon: '≡', action: () => this.nav_drawer.open() }));
        this.header.add(new Control({ context, text: 'Dashboard' }));
        this.add(this.header);

        this.nav_drawer = new Drawer({ context, position: 'left' });
        this.add(this.nav_drawer);

        this.content = new Stack({ context, direction: 'column' });
        this.add(this.content);
    }

    compose_tablet_shell() {
        const { context } = this;
        this.shell = new Grid_Gap({ context, columns: '1fr 260px', gap: 12 });
        this.content = new Stack({ context, direction: 'column' });
        this.tools = new Stack({ context, direction: 'column' });
        this.shell.add(this.content);
        this.shell.add(this.tools);
        this.add(this.shell);
    }

    compose_desktop_shell() {
        const { context } = this;
        this.shell = new Grid_Gap({ context, columns: '240px 1fr 260px', gap: 16 });
        this.nav = new Stack({ context, direction: 'column' });
        this.content = new Stack({ context, direction: 'column' });
        this.tools = new Stack({ context, direction: 'column' });
        this.shell.add(this.nav);
        this.shell.add(this.content);
        this.shell.add(this.tools);
        this.add(this.shell);
    }
}
```

### What `compose_adaptive` Does Internally

1. Reads `this.context.view_environment.state.layout_mode`
2. Calls the matching composition function
3. Registers a listener for `change:layout_mode`
4. On mode change: clears the control's children, calls the new composition function
5. Returns a cleanup function for the listener (used in `destroy()`)

### Fallback Behavior

If no exact match exists, the helper falls back intelligently:

```js
compose_adaptive(this, {
    phone: () => this.compose_narrow(),
    desktop: () => this.compose_wide()
    // No explicit tablet branch
});
// tablet falls back to → phone (nearest smaller mode)
```

The fallback order is: exact match → next smaller mode → `desktop` default.

## Pattern 3: Responsive Param Resolver

### The Problem

Controls accept configuration parameters (`size`, `columns`, `density`). Currently, these are static — the same value is used regardless of screen size. Developers end up writing per-mode overrides manually.

### The Solution

Extend `theme_params.js` to accept mode-branched parameter objects:

```js
class My_Table extends Data_Model_View_Model_Control {
    constructor(spec) {
        super(spec);

        // Responsive params — resolved automatically by layout_mode
        this.resolve_responsive_params({
            default:  { columns: 8, row_height: 36, show_header: true },
            phone:    { columns: 2, row_height: 44, show_header: false },
            tablet:   { columns: 5, row_height: 40, show_header: true }
        });

        // this.params.columns → 8 (on desktop), 2 (on phone), etc.
    }
}
```

The resolver:
1. Reads `context.view_environment.state.layout_mode`
2. Merges the matching branch over the `default` branch
3. Exposes the merged result as `this.params`
4. Re-resolves and emits change events when mode changes

## Pattern 4: Container-Aware Adaptation

### Why Viewport Isn't Always Enough

A control embedded in a narrow sidebar behaves like a "phone" control even on a desktop viewport. Container queries (CSS `@container`) address this for styling, but composition decisions need JavaScript-level container awareness too.

### Proposed Utility

```js
const { container_mode } = require('jsgui3-html/utils/adaptive');

// In a control's activate():
activate() {
    super.activate();

    // Observe own container width, map to local mode
    container_mode(this, {
        narrow: { max_width: 400 },
        medium: { max_width: 800 },
        wide:   { min_width: 801 }
    }, (mode) => {
        this.view.data.model.set('container_mode', mode);
    });
}
```

This uses `ResizeObserver` on the control's parent element to track available width, independent of viewport size.

### When to Use Container vs Viewport Mode

| Concern | Use Viewport | Use Container |
|---------|-------------|---------------|
| App shell structure | ✅ | |
| Navigation morphing | ✅ | |
| Control internal layout | | ✅ |
| Embedded widget adaptation | | ✅ |
| Touch target sizing | ✅ | |
| Column count in a table | | ✅ |

## Pattern 5: Declarative Region Morphing

### The Concept

Some adaptive changes follow repeatable patterns: a sidebar becomes a drawer, a multi-panel becomes tabs, a toolbar becomes an overflow menu. Rather than writing this logic from scratch each time, the platform can provide declarative region morphing:

```js
// Declarative: specify what morphs into what
this.nav_region = adaptive_region(this, 'nav', {
    desktop: { as: Stack,  options: { direction: 'column', gap: 8 } },
    tablet:  { as: Drawer, options: { position: 'left', breakpoint: 768 } },
    phone:   { as: Drawer, options: { position: 'left', overlay_mode: true } }
});

// The region control changes type based on layout_mode
// Content added to the region transfers across morphs
```

This is a more advanced pattern that builds on `compose_adaptive`. It's best suited for standard layout regions (nav, tools, inspector) where the morph pattern is well-defined.

## Pattern 6: Composition-Safe Persistence

### What to Persist

Not all state should survive across sessions. A clear rule:

```
Persist:
  ✅ User's chosen theme name ('vs-dark')
  ✅ User's density preference ('compact')
  ✅ Panel pinning preference (pinned/unpinned)
  ✅ Custom token overrides ({'--admin-font-size': '12px'})

Don't persist:
  ❌ Current layout_mode (should always reflect current viewport)
  ❌ Viewport dimensions
  ❌ Container widths
  ❌ Transient interaction state (hover, focus, scroll position)
```

### Persistence Integration

```js
// Save: extract only stable preferences
const prefs = {
    theme: this.data.model.get('theme_name'),
    density: this.data.model.get('density_preference'),
    overrides: this.data.model.get('token_overrides')
};
localStorage.setItem('app_prefs', JSON.stringify(prefs));

// Restore: apply preferences, let environment service handle the rest
const prefs = JSON.parse(localStorage.getItem('app_prefs'));
this.data.model.set('theme_name', prefs.theme);
this.data.model.set('density_preference', prefs.density);
// layout_mode is NOT restored — it's derived from the current viewport
```

## Complexity Budget

Each pattern has a different cost for app developers vs platform maintainers:

| Pattern | App Developer Effort | Platform Effort | Priority |
|---------|---------------------|-----------------|----------|
| View Environment Service | Near zero (read from context) | Medium | P0 |
| compose_adaptive() | Low (declare branches) | Medium | P0 |
| Responsive params | Low (declare param branches) | Medium | P1 |
| Container-aware mode | Medium (choose thresholds) | High | P2 |
| Region morphing | Low (declare morph map) | High | P2 |
| Persistence integration | Low (use conventions) | Low | P1 |

P0 patterns should ship first — they provide the most value with reasonable implementation cost.

**Next:** [Chapter 7](07-testing-harness-and-quality-gates.md) explains how to test responsive behavior systematically across viewport sizes.
