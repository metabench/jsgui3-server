# Chapter 12: Admin Shell Layout, Sidebar, & Navigation

## Overview

The Admin Shell (`admin-ui/v1/controls/admin_shell.js`) is the root control for Admin UI v1. It is implemented as a jsgui3 control-first composition with no direct `document.querySelector(...)`, `innerHTML`, or manual DOM node construction for shell navigation/rendering.

The shell provides:

- Toolbar with page title and SSE connection dot.
- Sidebar navigation for built-in and custom sections.
- Main content area with a dashboard section and a dynamic section.
- Status bar text updates.
- Responsive interactions (hamburger + overlay + phone tab bar).

## Implemented Shell Structure

The shell composes these top-level regions:

- `.as-sidebar`
- `.as-main`
  - `.as-toolbar`
  - `.as-content`
    - `.as-section-dashboard`
    - `.as-section-dynamic`
  - `.as-statusbar`
- `.as-sidebar-overlay`
- `.as-bottom-bar`

The default active section is `dashboard`.

## Control-First Navigation Model

The implementation tracks interactive controls explicitly:

- `this._nav_items` for sidebar items.
- `this._tab_items` for phone tab items.
- `this._section_labels` for section title lookup.

Each nav/tab item is a jsgui control with click handlers attached via `control.on('click', ...)`.

```javascript
_add_nav_item(nav, label, id, active, options = {}) {
    const item = new controls.div({
        context: this.context,
        class: 'as-nav-item' + (active ? ' active' : '')
    });

    item.dom.attributes['data-section'] = id;
    item.add((options.icon ? options.icon + ' ' : '') + label);
    nav.add(item);

    this._nav_items.push({
        id,
        label: options.title || label,
        control: item,
        is_custom: !!options.is_custom
    });

    item.on('click', () => {
        this._activate_section_from_nav(id, options.title || label);
    });

    return item;
}
```

## Section Routing

Section routing is handled by `_select_section(section_id)`.

- `dashboard` shows dashboard section and hides dynamic section.
- `resources`, `routes`, `settings` show dynamic section and render data panels.
- `custom:*` routes to custom section renderer.

```javascript
_select_section(section) {
    this._active_section = section;

    if (section === 'dashboard') {
        this._dashboard_section.remove_class('hidden');
        this._dynamic_section.add_class('hidden');
        this._set_status_text('Dashboard view');
        return Promise.resolve();
    }

    this._dashboard_section.add_class('hidden');
    this._dynamic_section.remove_class('hidden');

    if (section === 'resources') return this._render_resources_section();
    if (section === 'routes')    return this._render_routes_section();
    if (section === 'settings')  return this._render_settings_section();
    if (section.startsWith('custom:')) {
        const custom_id = section.substring(7);
        const custom_section = this._custom_sections_list.find((s) => s.id === custom_id);
        if (custom_section) return this._render_custom_section(custom_section);
    }

    return Promise.resolve();
}
```

## Dynamic Content Rendering

Dynamic section rendering uses jsgui controls rather than HTML strings.

Helper builders:

- `_create_panel(title)`
- `_create_table_panel(title, column_names, rows_data)`
- `_create_kv_row(key_text, value_text)`

Read-only built-in sections:

- `Resources` (`GET /api/admin/v1/resources`)
- `Routes` (`GET /api/admin/v1/routes`)
- `Settings` (`GET /api/admin/v1/status`)

Each section supports:

- Loading state (`_render_loading(...)`)
- Empty state (`_render_empty(...)`)
- Error state with interactive retry button (`_render_error(...)`)

## Custom Section Lifecycle

Custom sections are loaded from:

- `GET /api/admin/v1/custom-sections`

Behavior:

1. Existing custom nav items are removed.
2. A separator (`.as-nav-separator`) is ensured.
3. New custom nav controls are appended.
4. Clicking a custom nav item clears phone tab active state and routes to `custom:<id>`.

This refresh behavior avoids duplicate nav entries after repeated metadata fetches.

## Responsive Interaction Pattern

The shell supports responsive navigation modes:

- Sidebar/hamburger/overlay for tablet and phone widths.
- Bottom tab bar for phone sections (`dashboard`, `resources`, `routes`, `settings`).

Key methods:

- `_toggle_sidebar()`
- `_close_sidebar()`
- `_set_active_nav(section_id)`
- `_set_active_tab(section_id)`

Layout mode is stored on the body as `data-layout-mode` (`desktop`, `tablet`, `phone`) via `_update_layout_mode()`.

## Activation and SSE Lifecycle

Activation is idempotent:

- `super.activate()` runs once (jsgui core active state)
- shell startup logic runs once via `_client_bootstrapped`

Startup steps:

1. Resolve layout mode and bind `window.resize` listener.
2. Fetch initial status (`/api/admin/v1/status`).
3. Connect SSE (`/api/admin/v1/events`).
4. Load custom sections.

SSE behavior:

- `open`: status dot becomes online, status text updated.
- `heartbeat`: updates cards and last-update timestamp.
- `error`: status dot offline, reconnect scheduled with backoff (`1s` doubling up to `30s`).

## Route and Publisher Wiring

Admin UI v1 is served on:

- `/admin/v1` (UI)
- `/api/admin/v1/*` (auth-protected admin APIs)

The shell is bundled from:

- `admin-ui/v1/client.js` (entry point)
- `admin-ui/v1/controls/admin_shell.js` (root control)

## Current File Layout (Implemented)

```text
admin-ui/v1/
├── client.js
├── server.js
├── admin_auth_service.js
├── admin_user_store.js
├── controls/
│   ├── admin_shell.js
│   ├── group_box.js
│   └── stat_card.js
└── utils/
    └── formatters.js
```

## Verification Checklist

- Sidebar and tab clicks update active state and page title.
- Dynamic section renders loading/error/empty/data states.
- Retry and logout buttons are interactive controls.
- Custom section refresh does not duplicate nav items.
- SSE open/error/heartbeat transitions are handled.
- No direct DOM selection/string patching in shell navigation/render pipeline.
