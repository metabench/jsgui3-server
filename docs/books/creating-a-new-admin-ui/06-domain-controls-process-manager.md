# Chapter 6: Domain Controls — Process Manager Panel

## Overview

The Process Manager Panel is a group-box control that visualizes the server's process tree: the main Node.js process at the top, with fork arrows pointing down to child processes. Each process displays its name, state, PID, and memory usage.

In the design reference, this appears as the "Processes" group box on the left side of the dashboard, showing:
- A large main server process bar with a blue accent strip
- Fork arrows (`fork()`) connecting to child process cards
- Each child card has a distinctive color (purple for Bundle Builder, amber for Compiler, cyan for File Watcher)
- Health indicators (green dots) on each process

---

## Process_Panel Control

### Spec

```javascript
{
    __type_name: 'process_panel',
    title: 'Processes',           // Group box label
    processes: {                  // Data from /api/admin/processes
        main: { pid, state, uptime_seconds, memory },
        children: [
            { name, pid, state, memory, restart_count, type }
        ]
    }
}
```

### Visual Anatomy

```
┌─ Processes ────────────────────────────────────────────┐
│                                                        │
│  ┌════════════════════════════════════════════════════┐ │
│  │▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ (blue bar) │ │
│  │ ● Main Server Process                  [RUNNING]  │ │
│  │   HTTP Server · Router · SSR Engine   PID 7824    │ │
│  │                                        128 MB     │ │
│  └═══════════════════╤═══════════╤══════════╤════════┘ │
│                      │           │          │          │
│                   fork()      fork()     fork()       │
│                      │           │          │          │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐          │
│  │ ▔▔ (purple)  │ │ ▔▔(amber)│ │ ▔▔(cyan) │          │
│  │ ● Bundle     │ │ ●Compiler│ │ ● File   │          │
│  │   Builder    │ │          │ │   Watcher │          │
│  │ PID 7830     │ │ PID 7836 │ │ PID 7842 │          │
│  │ 86 MB        │ │ 64 MB    │ │ 24 MB    │          │
│  └──────────────┘ └──────────┘ └──────────┘          │
│                                                        │
│  Total memory: 302 MB across 4 processes               │
└────────────────────────────────────────────────────────┘
```

### Constructor

```javascript
class Process_Panel extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'process_panel';
        super(spec);
        const { context } = this;
        this._processes = spec.processes || { main: null, children: [] };

        const compose = () => {
            // Group box wrapper
            const group = new Group_Box({
                context,
                title: spec.title || 'Processes'
            });
            this.add(group);
            this._group = group;

            this._render_processes();
        };

        if (!spec.el) { compose(); }
    }

    _render_processes() {
        const { context } = this;
        const data = this._processes;

        // Main process card
        if (data.main) {
            const main_card = new Process_Card({
                context,
                name: 'Main Server Process',
                description: 'HTTP Server · Router · SSR Engine · API Publisher',
                pid: data.main.pid,
                state: data.main.state,
                memory_bytes: data.main.memory?.rss,
                accent: 'blue',
                is_main: true
            });
            this._group.add(main_card);
            this._main_card = main_card;
        }

        // Fork arrows + children
        if (data.children && data.children.length > 0) {
            const fork_row = new controls.div({ context, class: 'fork-row' });
            this._group.add(fork_row);

            const children_row = new controls.div({ context, class: 'children-row' });
            this._group.add(children_row);

            const accent_colors = ['purple', 'amber', 'cyan', 'green', 'pink'];

            data.children.forEach((child, i) => {
                // Fork arrow
                const arrow = new controls.div({ context, class: 'fork-arrow' });
                const arrow_label = new controls.span({ context, class: 'fork-label' });
                arrow_label.add('fork()');
                arrow.add(arrow_label);
                fork_row.add(arrow);

                // Child card
                const child_card = new Process_Card({
                    context,
                    name: child.name,
                    description: child.description || '',
                    pid: child.pid,
                    state: child.state,
                    memory_bytes: child.memory?.rss_bytes,
                    accent: accent_colors[i % accent_colors.length],
                    restart_count: child.restart_count
                });
                children_row.add(child_card);
            });
        }

        // Total memory line
        const total_memory = this._calculate_total_memory(data);
        const total_line = new controls.div({ context, class: 'process-total' });
        total_line.add(
            `Total memory: ${format_bytes(total_memory)} across ${1 + (data.children?.length || 0)} processes`
        );
        this._group.add(total_line);
    }

    _calculate_total_memory(data) {
        let total = data.main?.memory?.rss || 0;
        if (data.children) {
            data.children.forEach(c => {
                total += c.memory?.rss_bytes || 0;
            });
        }
        return total;
    }

    update(processes_data) {
        this._processes = processes_data;
        // Client-side: clear and re-render
        if (this._group && this._group.el) {
            // Clear children
            while (this._group.el.firstChild) {
                this._group.el.removeChild(this._group.el.firstChild);
            }
            this._render_processes();
        }
    }
}
```

---

## Process_Card Sub-Control

An individual process card within the panel.

### Spec

```javascript
{
    __type_name: 'process_card',
    name: 'Bundle Builder',
    description: 'JS bundling · CSS extraction',
    pid: 7830,
    state: 'running',
    memory_bytes: 90177536,
    accent: 'purple',        // 'blue', 'purple', 'amber', 'cyan', 'green'
    is_main: false,
    restart_count: 0
}
```

### Constructor

```javascript
class Process_Card extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'process_card';
        super(spec);
        const { context } = this;

        const compose = () => {
            // Accent bar at top
            const accent = new controls.div({
                context,
                class: `process-accent accent-${spec.accent || 'blue'}`
            });
            this.add(accent);

            // Health dot + name
            const header = new controls.div({ context, class: 'process-header' });
            this.add(header);

            const health = new Health_Badge({
                context,
                state: spec.state || 'unknown'
            });
            header.add(health);
            this._health = health;

            const name_el = new controls.span({ context, class: 'process-name' });
            name_el.add(spec.name || 'Unknown');
            header.add(name_el);

            // Status badge (if main)
            if (spec.is_main) {
                const status_badge = new controls.div({
                    context,
                    class: `process-status-badge badge-${spec.state || 'unknown'}`
                });
                status_badge.add(spec.state?.toUpperCase() || 'UNKNOWN');
                header.add(status_badge);
            }

            // Description
            if (spec.description) {
                const desc = new controls.div({ context, class: 'process-desc' });
                desc.add(spec.description);
                this.add(desc);
            }

            // Footer: PID + memory
            const footer = new controls.div({ context, class: 'process-footer' });
            this.add(footer);

            const pid_el = new controls.span({ context, class: 'process-pid' });
            pid_el.add(spec.pid ? `PID ${spec.pid}` : '—');
            footer.add(pid_el);

            const mem_el = new controls.span({ context, class: 'process-mem' });
            mem_el.add(spec.memory_bytes ? format_bytes(spec.memory_bytes) : '—');
            footer.add(mem_el);
        };

        if (!spec.el) { compose(); }
    }
}
```

### CSS

```css
.process_card {
    border-radius: 4px;
    border: 1px solid #B0A898;
    overflow: hidden;
    background: linear-gradient(to bottom, #F4F8FD, #D8E4F0 45%, #C0D4E8 55%, #CCDDEE);
}

.process_card.process-main {
    width: 100%;
}

.process-accent {
    height: 4px;
    border-radius: 2px 2px 0 0;
}

.accent-blue   { background: linear-gradient(to right, #7AACE0, #5090D0); }
.accent-purple { background: #9070C0; }
.accent-amber  { background: #D8A020; }
.accent-cyan   { background: #4098B8; }
.accent-green  { background: #48B848; }

.process-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px 4px;
}

.process-name {
    font-size: 11px;
    font-weight: 600;
    color: #1A3060;
    flex: 1;
}

.process-status-badge {
    font-size: 8px;
    font-weight: 500;
    padding: 2px 10px;
    border-radius: 3px;
}

.badge-running {
    background: rgba(72, 184, 72, 0.15);
    border: 0.5px solid #48B848;
    color: #2A6A2A;
}

.badge-stopped {
    background: rgba(128, 128, 128, 0.15);
    border: 0.5px solid #808080;
    color: #606060;
}

.badge-crashed {
    background: rgba(204, 68, 68, 0.15);
    border: 0.5px solid #CC4444;
    color: #992222;
}

.process-desc {
    font-size: 8px;
    color: #808080;
    padding: 0 12px 4px;
}

.process-footer {
    display: flex;
    justify-content: space-between;
    padding: 4px 12px 8px;
    font-size: 8px;
    color: #908888;
}

/* Fork visualization */
.fork-row {
    display: flex;
    justify-content: space-around;
    padding: 4px 60px;
}

.fork-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.fork-arrow::before {
    content: '';
    width: 1px;
    height: 16px;
    background: #7090B0;
}

.fork-arrow::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 6px solid #7090B0;
}

.fork-label {
    font-size: 8px;
    color: #7090B0;
    margin: 2px 0;
}

.children-row {
    display: flex;
    gap: 12px;
    padding: 0 16px;
    flex-wrap: wrap;
}

.children-row .process_card {
    flex: 1 1 120px;
    min-width: 110px;
}

.process-total {
    font-size: 8px;
    color: #908888;
    padding: 12px 4px 4px;
}

/* Child card accent colors */
.process_card[data-accent="purple"] {
    background: linear-gradient(to bottom, #E8E0F0, #D8D0E8);
    border-color: #A090C0;
}

.process_card[data-accent="amber"] {
    background: linear-gradient(to bottom, #FFF0D0, #F0E4C0);
    border-color: #C0A860;
}

.process_card[data-accent="cyan"] {
    background: linear-gradient(to bottom, #D8F0F8, #C8E4F0);
    border-color: #70A8C0;
}
```

---

## Group_Box Control

A classic Windows-style group box with an inset label. Used by Process_Panel, Resource_Table, and other group-level controls.

### Spec

```javascript
{
    __type_name: 'group_box',
    title: 'Processes'
}
```

### Constructor

```javascript
class Group_Box extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'group_box';
        super(spec);
        const { context } = this;

        const compose = () => {
            // Title overlay (positioned to interrupt the border)
            if (spec.title) {
                const title = new controls.div({ context, class: 'group-box-title' });
                title.add(spec.title);
                this.add(title);
            }

            // Content container
            const content = new controls.div({ context, class: 'group-box-content' });
            this.add(content);
            this._content = content;
        };

        if (!spec.el) { compose(); }
    }

    // Override add to route children into content area
    add_child(child) {
        if (this._content) {
            return this._content.add(child);
        }
        return super.add(child);
    }
}

Group_Box.css = `
.group_box {
    position: relative;
    border: 1px solid #B0A898;
    border-radius: 4px;
    background: linear-gradient(to bottom, #FFFFFF, #F4F2EC);
    padding: 20px 16px 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

.group-box-title {
    position: absolute;
    top: -8px;
    left: 10px;
    background: linear-gradient(to bottom, #F0EDE6, #E8E4DC);
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    color: #2A4060;
}

.group-box-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
`;
```

---

## Process Data Mapping

The Process_Panel maps data from the `/api/admin/processes` endpoint:

| API Field | Process_Card Spec | Notes |
|-----------|-------------------|-------|
| `main.pid` | `pid: data.main.pid` | Always available |
| `main.state` | `state: 'running'` | Derived from server._started |
| `main.memory.rss` | `memory_bytes: data.main.memory.rss` | From `process.memoryUsage()` |
| `main.uptime_seconds` | Not shown in card | Shown in status bar |
| `children[].name` | `name: child.name` | Resource name |
| `children[].pid` | `pid: child.pid` | From Process_Resource.pid |
| `children[].state` | `state: child.state` | Lifecycle state |
| `children[].memory.rss_bytes` | `memory_bytes: child.memory.rss_bytes` | From Process_Resource.memory_usage |
| `children[].restart_count` | `restart_count: child.restart_count` | Auto-restart counter |

---

## Actions

The Process_Panel will eventually support interactive actions:

| Action | UI Element | API Call |
|--------|-----------|----------|
| Restart child | Button on card (hover) | `POST /api/admin/action { "action":"restart_resource", "target": name }` |
| Stop child | Button on card (hover) | `POST /api/admin/action { "action":"stop_resource", "target": name }` |
| View stdout | Click on card | Opens Log_Viewer filtered to process |

These are Phase 2 features — the initial implementation is display-only.

---

## Real-Time Updates

The Process_Panel subscribes to SSE events for live state changes:

```javascript
// In activate()
const event_source = new EventSource('/api/admin/events');

event_source.addEventListener('resource_state_change', (e) => {
    const data = JSON.parse(e.data);
    // Find matching child process card and update health badge
    this._update_child_state(data.resourceName, data.to);
});

event_source.addEventListener('crashed', (e) => {
    const data = JSON.parse(e.data);
    this._update_child_state(data.resourceName, 'crashed');
});

event_source.addEventListener('recovered', (e) => {
    const data = JSON.parse(e.data);
    this._update_child_state(data.resourceName, 'running');
});
```

This means the process panel never needs to poll — state changes are pushed instantly.
