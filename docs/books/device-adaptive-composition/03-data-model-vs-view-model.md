# Chapter 3 — Data Model vs View Model in Adaptive UI

## Why This Matters

The most common mistake in responsive UI architecture is mixing device-specific state into business data. When a developer stores `sidebar_width: 280` next to `project_name: "Alpha"`, two bad things happen:

1. **Serialization pollution.** Save the model to a database and you're persisting pixel values that are meaningless on a different device. Restore it on a phone and a 280px sidebar obscures everything.

2. **Fragile coupling.** Business logic starts depending on layout state. A function that calculates project metrics now has to guard against `undefined` view properties. Tests for business rules require mocking viewport dimensions.

jsgui3's MVVM architecture already provides the right separation. This chapter explains how to use it correctly for adaptive UI, ensuring device-specific decisions never contaminate domain data.

## The Three Model Layers in jsgui3

The `ensure_control_models()` factory creates a stack of model objects on every control:

```
┌──────────────────────────────────┐
│  this.data.model                 │  ← Domain state
│  (Data_Object from lang-tools)   │     "What does the business care about?"
├──────────────────────────────────┤
│  this.view.data.model            │  ← Presentation state
│  (Data_Object)                   │     "What does the view need to render?"
├──────────────────────────────────┤
│  this.view.model                 │  ← View-instance state
│  (Data_Object)                   │     "What is the current UI interaction state?"
├──────────────────────────────────┤
│  this.view.ui                    │  ← UI structure metadata
│  (Control_View_UI)               │     "What controls exist in this view?"
└──────────────────────────────────┘
```

Each layer serves a different purpose. Getting data into the right layer is the key to clean adaptive architecture.

## What Goes Where

### `data.model` — Domain State

This is the source of truth for business data. It should be serializable, restorable, and completely ignorant of how it's displayed.

**Belongs here:**
- `selected_project_id: 'proj-42'`
- `user_name: 'Alice'`
- `filter_active: true`
- `sort_field: 'due_date'`
- `saved_theme_preference: 'vs-dark'`

**Does NOT belong here:**
- `sidebar_open: true` (that's a view concern)
- `viewport_width: 768` (ephemeral device state)
- `panel_collapsed: false` (UI interaction state)
- `animation_in_progress: true` (transient rendering state)

The litmus test: *"Would this value make sense if I serialized it to a database and loaded it on a completely different device?"* If yes, it's domain state. If no, it belongs in a view model.

### `view.data.model` — Presentation State

This is derived data that the view needs to render but that doesn't belong in the domain model. It's often computed from the combination of domain state and environment state.

**Belongs here:**
- `layout_mode: 'tablet'` (resolved from viewport)
- `should_show_sidebar_inline: true` (derived from layout_mode)
- `visible_column_count: 4` (derived from available width)
- `formatted_due_date: 'Feb 14, 2026'` (derived from data.model.due_date)
- `density_mode: 'compact'` (resolved from interaction mode + user preference)

This is where adaptive decisions materialize as concrete values that controls can bind to.

### `view.model` — View-Instance State

This captures the user's current interaction state within the UI. It's ephemeral — losing it on page reload is acceptable (or it can be persisted to localStorage if desired).

**Belongs here:**
- `sidebar_open: true`
- `active_tab_index: 2`
- `panel_collapsed: false`
- `scroll_position: 340`
- `hover_row_id: 'row-7'`

### `view.ui` — UI Structure Metadata

This is structural metadata about what controls exist in the current view. It's managed by the control framework, not typically by app developers.

## A Worked Example

Consider a project dashboard that shows a list of projects and a detail panel. Let's trace a scenario where the user is on a tablet and rotates from portrait to landscape.

### The Models

```js
// Domain model — same regardless of device
this.data.model = new Data_Object({
    projects: [
        { id: 'p1', name: 'Alpha', status: 'active', due: '2026-03-01' },
        { id: 'p2', name: 'Beta',  status: 'draft',  due: '2026-04-15' }
    ],
    selected_project_id: 'p1',
    filter_status: 'all'
});

// View data model — derived from domain + environment
this.view.data.model = new Data_Object({
    layout_mode: 'tablet',
    visible_columns: ['name', 'status', 'due'],    // desktop would show more
    should_show_detail_inline: false,                // tablet portrait: overlay
    formatted_projects: [/* computed from domain */]
});

// View model — current interaction state
this.view.model = new Data_Object({
    detail_panel_open: true,
    list_scroll_position: 0,
    active_section: 'overview'
});
```

### Portrait (768×1024): `layout_mode: 'tablet'`

The environment service resolves `layout_mode: 'tablet'`. View composition responds:
- `should_show_detail_inline: false` → detail panel is a slide-over
- `visible_columns: ['name', 'status', 'due']` → 3 columns shown
- User rotates the device...

### Landscape (1024×768): `layout_mode: 'desktop'`

The environment service detects the change. `layout_mode` updates to `'desktop'`. The view data model recomputes:
- `should_show_detail_inline: true` → detail panel is now a side panel
- `visible_columns: ['name', 'status', 'due', 'owner', 'priority']` → 5 columns

**Crucially, nothing in `data.model` changed.** The selected project is still `'p1'`. The filter is still `'all'`. The domain is untouched. Only view-layer state responded to the environment change.

## Using Bindings for Adaptive Derived State

The `Data_Model_View_Model_Control` base class provides binding and computed property APIs that are ideal for deriving adaptive state:

```js
// In the control's constructor:
ensure_control_models(this, spec);

// Bind layout_mode changes to column visibility
this.watch(this.view.data.model, 'layout_mode', (mode) => {
    const columns = mode === 'phone'
        ? ['name']
        : mode === 'tablet'
        ? ['name', 'status', 'due']
        : ['name', 'status', 'due', 'owner', 'priority', 'created'];

    this.view.data.model.set('visible_columns', columns);
});

// Computed property: should detail show inline?
this.computed(this.view.data.model,
    ['layout_mode'],
    (mode) => mode === 'desktop',
    { property_name: 'should_show_detail_inline' }
);
```

When the environment service updates `layout_mode`, the watchers fire, derived state recomputes, and controls that bind to `visible_columns` or `should_show_detail_inline` update automatically. The reactive pipeline in lang-tools handles the propagation.

## The Persistence Rule

A simple rule for adaptive state and persistence:

| Model Layer | Persist to DB? | Persist to localStorage? | Transfer across devices? |
|-------------|----------------|--------------------------|--------------------------|
| `data.model` | Yes | If needed | Yes — it's device-agnostic |
| `view.data.model` | No | Rarely | No — it's derived from environment |
| `view.model` | No | Optionally | No — it's per-session |

When the showcase app persists theme preferences to localStorage, those preferences are domain-level choices (the user chose "vs-dark"). But the `layout_mode` that determines how the theme studio is displayed is view state — it shouldn't be persisted because it should always reflect the current device.

## Integration with Low-Level Complexity

The goal of this separation is to keep high-level app code simple. But the reactive binding infrastructure underneath is sophisticated — and that's fine. The complexity lives in the right place:

- **lang-tools** provides `Data_Object` with change events, property watching, and computed properties
- **ModelBinder** and **BindingManager** handle bi-directional syncing between model layers
- **control_model_factory** auto-wires the model stack

App developers don't need to understand how `BindingManager` resolves circular dependencies or how `Data_Object` batches change events. They need to know: *"put business data in data.model, put device-specific state in view.data.model, and use watchers to derive one from the other."*

## Anti-Patterns to Avoid

### 1. Domain model holding layout state

```js
// ❌ Bad: domain model knows about layout
this.data.model.set('sidebar_visible', window.innerWidth > 960);
```

```js
// ✅ Good: view model holds layout state
this.view.data.model.set('sidebar_visible', env.layout_mode !== 'phone');
```

### 2. Controls reading window dimensions directly

```js
// ❌ Bad: every control checks the viewport independently
if (window.innerWidth < 768) { /* phone layout */ }
```

```js
// ✅ Good: controls read from the shared environment contract
const mode = context.view_environment.layout_mode;
```

### 3. Persisting derived state

```js
// ❌ Bad: saving viewport-dependent state to the database
save_to_server({ columns: this.view.data.model.get('visible_columns') });
```

```js
// ✅ Good: saving only the user's preference, not the derived result
save_to_server({ preferred_column_set: this.data.model.get('column_preference') });
```

## Summary

The model separation already built into jsgui3 through `Data_Model_View_Model_Control` is the right foundation for adaptive UI. The key insight is that **adaptive state is view state, not domain state**. The view data model (`view.data.model`) is where layout mode, density, column visibility, and region configuration live. The domain model (`data.model`) remains pure, portable, and testable.

This separation means you can:
- Test business logic without mocking viewports
- Switch devices without corrupting saved state
- Add new adaptive behaviors without touching domain code
- Serialize and restore cleanly across sessions and devices

**Next:** [Chapter 4](04-styling-theme-breakpoints.md) covers how the token and theme system supports responsive density and mode-based styling.
