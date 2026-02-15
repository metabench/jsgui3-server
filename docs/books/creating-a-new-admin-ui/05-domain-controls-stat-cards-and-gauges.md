# Chapter 5: Domain Controls — Stat Cards & Gauges

## Overview

Stat cards are the most prominent visual elements in the admin UI. They appear as a horizontal row across the top of the dashboard, each displaying a single key metric with a label, a large value, and a supplementary detail line. The design reference shows five stat cards:

1. **Main Process** — PID with running status and memory
2. **Child Processes** — Count with child names
3. **Resource Pool** — Loaded count with health status
4. **Routes** — Total count with category breakdown
5. **Requests/Min** — Throughput with trend indicator

This chapter specifies the `Stat_Card` control and supporting gauge/indicator primitives.

---

## Stat_Card Control

### Spec

```javascript
{
    __type_name: 'stat_card',
    label: 'MAIN PROCESS',           // Small caps label at top
    value: 'PID 7824',               // Large primary value
    detail: '▲ Running — 128 MB RSS', // Small detail line at bottom
    detail_color: 'green',           // 'green', 'blue', 'amber', 'red', 'gray'
    indicator: 'running',            // Optional status indicator: 'running', 'stopped', 'warning', 'error'
    width: 220                       // Optional fixed width (default: flex)
}
```

### Visual Anatomy

```
┌──────────────────────────┐
│ MAIN PROCESS             │  ← label (9px, gray, caps, letter-spacing)
│                          │
│ PID 7824            ●    │  ← value (22px, bold, dark) + optional indicator
│                          │
│ ▲ Running — 128 MB RSS   │  ← detail (9px, colored)
└──────────────────────────┘
```

### Constructor Pattern

```javascript
class Stat_Card extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'stat_card';
        super(spec);
        const { context } = this;

        this._label_text = spec.label || '';
        this._value_text = spec.value || '';
        this._detail_text = spec.detail || '';
        this._detail_color = spec.detail_color || 'gray';
        this._indicator = spec.indicator || null;

        const compose = () => {
            // Label
            const label = new controls.div({ context, class: 'stat-card-label' });
            label.add(this._label_text);
            this.add(label);

            // Value row
            const value_row = new controls.div({ context, class: 'stat-card-value-row' });
            this.add(value_row);

            const value = new controls.span({ context, class: 'stat-card-value' });
            value.add(this._value_text);
            value_row.add(value);
            this._value_el = value;

            if (this._indicator) {
                const indicator = new controls.span({
                    context,
                    class: `stat-card-indicator indicator-${this._indicator}`
                });
                value_row.add(indicator);
                this._indicator_el = indicator;
            }

            // Detail
            const detail = new controls.div({
                context,
                class: `stat-card-detail detail-${this._detail_color}`
            });
            detail.add(this._detail_text);
            this.add(detail);
            this._detail_el = detail;
        };

        if (!spec.el) { compose(); }
    }

    // Client-side update methods
    set_value(text) {
        if (this._value_el && this._value_el.el) {
            this._value_el.el.innerText = text;
        }
    }

    set_detail(text, color) {
        if (this._detail_el && this._detail_el.el) {
            this._detail_el.el.innerText = text;
            if (color) {
                this._detail_el.el.className = `stat-card-detail detail-${color}`;
            }
        }
    }

    set_indicator(state) {
        if (this._indicator_el && this._indicator_el.el) {
            this._indicator_el.el.className = `stat-card-indicator indicator-${state}`;
        }
    }
}
```

### CSS

```css
.stat_card {
    background: linear-gradient(to bottom, #F6F4F0, #EAE8E2);
    border: 1px solid #C0B8A8;
    border-radius: 4px;
    padding: 12px 16px;
    min-width: 130px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

.stat-card-label {
    font-size: 9px;
    color: #808080;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.stat-card-value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.stat-card-value {
    font-size: 22px;
    font-weight: 700;
    color: #2A4060;
}

.stat-card-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.indicator-running {
    background: #48B848;
    box-shadow: 0 0 4px rgba(72, 184, 72, 0.5);
}

.indicator-stopped {
    background: #808080;
}

.indicator-warning {
    background: #D8A020;
    box-shadow: 0 0 4px rgba(216, 160, 32, 0.5);
}

.indicator-error {
    background: #CC4444;
    box-shadow: 0 0 4px rgba(204, 68, 68, 0.5);
}

.stat-card-detail {
    font-size: 9px;
}

.detail-green  { color: #48A848; }
.detail-blue   { color: #4488CC; }
.detail-amber  { color: #D8A020; }
.detail-red    { color: #CC4444; }
.detail-gray   { color: #808080; }
```

---

## Stat Card Instances — Dashboard Row

### 1. Main Process Card

```javascript
const main_process_card = new Stat_Card({
    context,
    label: 'MAIN PROCESS',
    value: `PID ${snapshot.server.pid}`,
    detail: `▲ Running — ${format_bytes(snapshot.memory.rss)} RSS`,
    detail_color: 'green',
    indicator: 'running'
});
```

**Data source**: `GET /api/admin/snapshot` → `server.pid`, `memory.rss`

**Update strategy**: Poll every 5s, update value and detail text.

### 2. Child Processes Card

```javascript
const children_card = new Stat_Card({
    context,
    label: 'CHILD PROCESSES',
    value: `${snapshot.processes.children.length}`,
    detail: snapshot.processes.children.map(c => c.name).join(' · ') || 'No child processes',
    detail_color: 'blue'
});
```

**Data source**: `GET /api/admin/snapshot` → `processes.children`

### 3. Resource Pool Card

```javascript
const resource_card = new Stat_Card({
    context,
    label: 'RESOURCE POOL',
    value: `${snapshot.resources.total}`,
    detail: snapshot.resources.crashed > 0
        ? `${snapshot.resources.crashed} crashed`
        : 'All requirements met',
    detail_color: snapshot.resources.crashed > 0 ? 'red' : 'green'
});
```

**Data source**: `GET /api/admin/snapshot` → `resources.total`, `resources.crashed`

### 4. Routes Card

```javascript
const routes_card = new Stat_Card({
    context,
    label: 'ROUTES',
    value: `${snapshot.routes.length}`,
    detail: summarize_route_categories(snapshot.routes),
    detail_color: 'blue'
});
```

**Helper function:**
```javascript
function summarize_route_categories(routes) {
    const counts = {};
    routes.forEach(r => {
        counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([cat, n]) => `${n} ${cat}`)
        .join(' · ');
}
```

### 5. Requests/Min Card

```javascript
const requests_card = new Stat_Card({
    context,
    label: 'REQUESTS / MIN',
    value: `${snapshot.requests.per_minute}`,
    detail: '— no trend data yet',
    detail_color: 'gray'
});
```

**Data source**: `GET /api/admin/snapshot` → `requests.per_minute`

**Update strategy**: Recalculate client-side from SSE `request` events received in the last 60 seconds.

---

## Stat Card Row Layout

The five cards sit in a flex row at the top of the dashboard content area:

```css
.stat-card-row {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    flex-wrap: wrap;
}

.stat-card-row .stat_card {
    flex: 1 1 180px;
    max-width: 260px;
}
```

---

## Supporting Primitives

### Health_Badge

A small inline badge showing resource health.

```javascript
class Health_Badge extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'health_badge';
        super(spec);
        const { context } = this;

        const compose = () => {
            const dot = new controls.span({ context, class: `health-dot health-${spec.state || 'unknown'}` });
            this.add(dot);

            if (spec.text) {
                const label = new controls.span({ context, class: 'health-label' });
                label.add(spec.text);
                this.add(label);
            }
        };

        if (!spec.el) { compose(); }
    }

    set_state(state, text) {
        // Client-side update
        if (this.el) {
            const dot = this.el.querySelector('.health-dot');
            if (dot) dot.className = `health-dot health-${state}`;
            if (text) {
                const label = this.el.querySelector('.health-label');
                if (label) label.innerText = text;
            }
        }
    }
}

Health_Badge.css = `
.health_badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 8px;
    font-weight: 500;
}

.health-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
}

.health-running, .health-ready, .health-on {
    background: #48B848;
}

.health-stopped, .health-off {
    background: #808080;
}

.health-warning, .health-unhealthy {
    background: #D8A020;
}

.health-crashed, .health-error, .health-unreachable {
    background: #CC4444;
}

.health-unknown {
    background: #B0A898;
}

.health-label {
    font-size: 9px;
}
`;
```

### Status_Indicator

A simple colored circle used inline. Used inside the toolbar to show "Server Online."

```javascript
class Status_Indicator extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'status_indicator';
        super(spec);
        const { context } = this;

        const compose = () => {
            const dot = new controls.span({
                context,
                class: `status-dot status-${spec.state || 'unknown'}`
            });
            this.add(dot);

            const label = new controls.span({ context, class: 'status-label' });
            label.add(spec.text || '');
            this.add(label);
        };

        if (!spec.el) { compose(); }
    }
}

Status_Indicator.css = `
.status_indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-running { background: #48B848; }
.status-stopped { background: #808080; }
.status-warning { background: #D8A020; }
.status-error   { background: #CC4444; }

.status-label {
    font-size: 10px;
    font-weight: 500;
}
`;
```

---

## Utility Functions

```javascript
function format_bytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes === null || bytes === undefined) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + units[i];
}

function format_uptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function format_time(timestamp) {
    const d = new Date(timestamp);
    return d.toTimeString().split(' ')[0]; // "14:23:07"
}
```

---

## Data Binding Pattern

Each stat card can be bound to a data model for reactive updates:

```javascript
// In Admin_Shell.activate():
const { Data_Object, field } = require('obext');

const stats_model = new Data_Object({
    pid: field(0),
    memory_rss: field(0),
    child_count: field(0),
    resource_count: field(0),
    route_count: field(0),
    requests_per_minute: field(0)
});

// Bind card updates to model changes
stats_model.on('change.memory_rss', (e) => {
    main_process_card.set_detail(
        `▲ Running — ${format_bytes(e.value)} RSS`,
        'green'
    );
});

stats_model.on('change.requests_per_minute', (e) => {
    requests_card.set_value(String(e.value));
});

// Poll for updates
setInterval(async () => {
    const snapshot = await fetch('/api/admin/snapshot').then(r => r.json());
    stats_model.pid = snapshot.server.pid;
    stats_model.memory_rss = snapshot.memory.rss;
    stats_model.child_count = snapshot.processes.children.length;
    stats_model.resource_count = snapshot.resources.total;
    stats_model.route_count = snapshot.routes.length;
    stats_model.requests_per_minute = snapshot.requests.per_minute;
}, 5000);
```

This separates data acquisition from UI updates, making the controls testable in isolation.
