# Chapter 7: Domain Controls — Resource Pool Inspector

## Overview

The Resource Pool Inspector is a table-based control that lists every resource registered in the server's `Server_Resource_Pool`. It displays resource name, type, health status, and memory usage in a structured table with sortable columns and color-coded type badges.

In the design reference, this appears as the "Resource Pool" group box on the right side of the dashboard.

---

## Resource_Table Control

### Spec

```javascript
{
    __type_name: 'resource_table',
    title: 'Resource Pool',
    resources: {                     // Data from /api/admin/resources
        total: 5,
        running: 5,
        items: [
            {
                name: 'Compiler_Babel',
                type: 'Compiler_Resource',
                state: 'ready',
                memory: 42000000
            }
        ]
    }
}
```

### Visual Anatomy

```
┌─ Resource Pool ──────────────────────────────── [5 / 5] ─┐
│                                                           │
│  RESOURCE              TYPE                  STATUS   MEM │
│  ─────────────────────────────────────────────────────── │
│  ■ Compiler_Babel      Compiler_Resource     ● Ready  42M│
│  ■ Compilation_Mgr     Compilation_Resource  ● Ready  18M│
│  ■ Session_Store       Data_KV_Resource      ● Ready   8M│
│  ■ Template_Pipeline   Data_Transform_Res    ● Ready   4M│
│  ■ CSS_Extractor       Resource              ● Ready   2M│
│  ─────────────────────────────────────────────────────── │
│  All resources initialised · Total pool memory: 74 MB     │
└───────────────────────────────────────────────────────────┘
```

### Constructor

```javascript
class Resource_Table extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'resource_table';
        super(spec);
        const { context } = this;
        this._resources = spec.resources || { total: 0, items: [] };

        const compose = () => {
            // Group box with title and counter badge
            const group = new Group_Box({
                context,
                title: spec.title || 'Resource Pool'
            });
            this.add(group);
            this._group = group;

            // Counter badge (top-right)
            const counter = new controls.div({ context, class: 'resource-counter' });
            const running = this._resources.running || 0;
            const total = this._resources.total || 0;
            counter.add(`${running} / ${total}`);
            this.add(counter);
            this._counter = counter;

            // Table
            this._render_table();
        };

        if (!spec.el) { compose(); }
    }

    _render_table() {
        const { context } = this;
        const items = this._resources.items || [];

        // Header row
        const header = new controls.div({ context, class: 'resource-table-header' });
        this._group.add(header);

        const columns = ['RESOURCE', 'TYPE', 'STATUS', 'MEM'];
        columns.forEach(col => {
            const cell = new controls.span({ context, class: 'resource-header-cell' });
            cell.add(col);
            header.add(cell);
        });

        // Data rows
        const body = new controls.div({ context, class: 'resource-table-body' });
        this._group.add(body);
        this._body = body;

        items.forEach((item, i) => {
            const row = this._create_row(item, i);
            body.add(row);
        });

        // Footer
        const footer = new controls.div({ context, class: 'resource-table-footer' });
        const total_mem = items.reduce((sum, r) => sum + (r.memory || 0), 0);
        const all_ready = items.every(r =>
            ['ready', 'running', 'on'].includes(r.state)
        );
        footer.add(
            all_ready
                ? `All resources initialised · Total pool memory: ${format_bytes(total_mem)}`
                : `${items.filter(r => r.state === 'crashed').length} resource(s) need attention`
        );
        this._group.add(footer);
    }

    _create_row(item, index) {
        const { context } = this;
        const row = new controls.div({ context, class: 'resource-row' });

        // Type badge (colored square)
        const type_badge = new controls.span({
            context,
            class: `resource-type-badge badge-color-${index % 5}`
        });
        row.add(type_badge);

        // Name
        const name_cell = new controls.span({ context, class: 'resource-name' });
        name_cell.add(item.name || 'Unnamed');
        row.add(name_cell);

        // Type
        const type_cell = new controls.span({ context, class: 'resource-type' });
        type_cell.add(item.type || 'Unknown');
        row.add(type_cell);

        // Status
        const status_cell = new controls.span({ context, class: 'resource-status' });
        const health = new Health_Badge({
            context,
            state: item.state || 'unknown',
            text: this._format_state(item.state)
        });
        status_cell.add(health);
        row.add(status_cell);

        // Memory
        const mem_cell = new controls.span({ context, class: 'resource-mem' });
        mem_cell.add(item.memory ? format_bytes(item.memory) : '—');
        row.add(mem_cell);

        return row;
    }

    _format_state(state) {
        if (!state) return 'Unknown';
        return state.charAt(0).toUpperCase() + state.slice(1);
    }

    update(resources_data) {
        this._resources = resources_data;
        // Client-side: re-render table body
        if (this._body && this._body.el) {
            this._body.el.innerHTML = '';
            const items = resources_data.items || [];
            items.forEach((item, i) => {
                const row = this._create_row(item, i);
                this._body.add(row);
            });
        }
        if (this._counter && this._counter.el) {
            this._counter.el.innerText = `${resources_data.running || 0} / ${resources_data.total || 0}`;
        }
    }
}
```

### CSS

```css
.resource_table {
    position: relative;
}

.resource-counter {
    position: absolute;
    top: -4px;
    right: 16px;
    font-size: 8px;
    font-weight: 500;
    color: #2A6A2A;
    background: rgba(72, 184, 72, 0.12);
    border: 0.5px solid #48B848;
    border-radius: 3px;
    padding: 2px 8px;
}

.resource-table-header {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 0.5fr;
    padding: 6px 12px;
    background: #E8E4DC;
    border-top: 0.5px solid #C0B8A8;
    border-bottom: 0.5px solid #C0B8A8;
}

.resource-header-cell {
    font-size: 9px;
    font-weight: 600;
    color: #606060;
}

.resource-table-body {
    display: flex;
    flex-direction: column;
}

.resource-row {
    display: grid;
    grid-template-columns: auto 2fr 2fr 1fr 0.5fr;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-bottom: 0.5px solid #E0DCD4;
}

.resource-row:hover {
    background: rgba(68, 136, 204, 0.05);
}

.resource-type-badge {
    width: 7px;
    height: 7px;
    border-radius: 1.5px;
    display: inline-block;
}

.badge-color-0 { background: #9070C0; }
.badge-color-1 { background: #4488CC; }
.badge-color-2 { background: #48B848; }
.badge-color-3 { background: #D8A020; }
.badge-color-4 { background: #4098B8; }

.resource-name {
    font-size: 10px;
    font-weight: 500;
    color: #2A4060;
}

.resource-type {
    font-size: 9px;
    color: #808080;
}

.resource-status {
    font-size: 9px;
}

.resource-mem {
    font-size: 9px;
    color: #808080;
    text-align: right;
}

.resource-table-footer {
    font-size: 8px;
    color: #908888;
    padding: 8px 4px 0;
}
```

---

## Resource Data Mapping

The Resource_Table maps data from `/api/admin/resources`:

| API Response Field | Table Column | Rendering |
|-------------------|-------------|-----------|
| `item.name` | RESOURCE | Plain text, font-weight 500 |
| `item.type` | TYPE | Gray text, constructor name |
| `item.state` | STATUS | Health_Badge with dot + text |
| `item.memory` | MEM | `format_bytes()` or dash |
| `item.has_status` | — | Determines if status details available |

### Resource Type Color Coding

Resources are color-coded by category:

| Type Pattern | Color | Badge Class |
|-------------|-------|-------------|
| `*Compiler*` | Purple (#9070C0) | `badge-color-0` |
| `*Compilation*` | Blue (#4488CC) | `badge-color-1` |
| `Data_KV*` | Green (#48B848) | `badge-color-2` |
| `Data_Transform*` | Amber (#D8A020) | `badge-color-3` |
| `Resource` (generic) | Cyan (#4098B8) | `badge-color-4` |
| Router | Blue (#4488CC) | `badge-color-1` |
| Publisher | Purple (#9070C0) | `badge-color-0` |

---

## Resource Detail Expansion

When a resource row is clicked, it can expand to show additional details from the resource's `status` property:

```javascript
// Phase 2 feature
_expand_row(item_name) {
    const resource_status = this._resources.items.find(
        r => r.name === item_name
    )?.status;

    if (!resource_status) return;

    // Create detail panel below the row
    const detail = new controls.div({ context: this.context, class: 'resource-detail' });

    // Format status object as key-value pairs
    Object.entries(resource_status).forEach(([key, value]) => {
        const pair = new controls.div({ context: this.context, class: 'detail-pair' });
        const k = new controls.span({ context: this.context, class: 'detail-key' });
        k.add(key);
        pair.add(k);
        const v = new controls.span({ context: this.context, class: 'detail-value' });
        v.add(typeof value === 'object' ? JSON.stringify(value) : String(value));
        pair.add(v);
        detail.add(pair);
    });

    // Insert after the row
    // ...
}
```

### Detail Panel CSS

```css
.resource-detail {
    background: #F8F6F2;
    border: 1px solid #E0DCD4;
    border-radius: 3px;
    padding: 8px 12px;
    margin: 4px 12px;
}

.detail-pair {
    display: flex;
    gap: 12px;
    padding: 2px 0;
    font-size: 9px;
}

.detail-key {
    color: #808080;
    min-width: 120px;
    font-weight: 500;
}

.detail-value {
    color: #2A4060;
    font-family: 'Consolas', monospace;
}
```

---

## Real-Time Updates

The Resource_Table listens for pool events via SSE:

```javascript
// In activate()
const event_source = new EventSource('/api/admin/events');

event_source.addEventListener('resource_state_change', (e) => {
    const data = JSON.parse(e.data);
    this._update_resource_state(data.resourceName, data.to);
});

event_source.addEventListener('removed', (e) => {
    const data = JSON.parse(e.data);
    this._remove_resource_row(data.resourceName);
});
```

Update is targeted — only the affected row's Health_Badge changes, avoiding a full table re-render.

---

## Pool Summary Panel

In addition to the table, the sidebar shows a miniature pool health summary:

```javascript
class Pool_Health_Summary extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'pool_health_summary';
        super(spec);
        const { context } = this;

        const compose = () => {
            const items = spec.items || [];
            items.forEach(item => {
                const row = new controls.div({ context, class: 'health-row' });
                const dot = new Health_Badge({
                    context,
                    state: item.healthy ? 'running' : 'warning',
                    text: item.label
                });
                row.add(dot);
                this.add(row);
            });
        };

        if (!spec.el) { compose(); }
    }
}
```

Example usage (sidebar):
```javascript
const health_summary = new Pool_Health_Summary({
    context,
    items: [
        { label: 'Server Running', healthy: true },
        { label: 'Bundle Ready', healthy: true },
        { label: 'Pool 5/5', healthy: true },
        { label: '1 Warning', healthy: false }
    ]
});
```

---

## Adapter — `get_resources_tree()` Enhancement

The current `Admin_Module.get_resources_tree()` method provides basic data. For the v1 admin UI, it needs to be enhanced:

```javascript
get_resources_tree() {
    const pool = this.server.resource_pool;
    const summary = pool.summary;  // Uses the built-in summary getter

    const items = [];
    pool.resources.each(resource => {
        if (!resource) return;

        const item = {
            name: resource.name || 'Unnamed',
            type: resource.constructor?.name || 'Unknown',
            state: resource.status?.state || resource.state || 'unknown',
            has_status: typeof resource.status === 'object',
            memory: null
        };

        // Try to get memory from Process_Resource
        if (typeof resource.memory_usage === 'object') {
            item.memory = resource.memory_usage.rssBytes || null;
        }

        // Get full status if available
        if (item.has_status) {
            try {
                item.status = resource.status;
            } catch (e) {
                item.status = { error: e.message };
            }
        }

        items.push(item);
    });

    return {
        total: summary.total,
        running: summary.running,
        stopped: summary.stopped,
        crashed: summary.crashed,
        unreachable: summary.unreachable,
        by_type: summary.byType,
        items: items
    };
}
```

This enhancement is a minor change to the existing method — no new platform features required.
