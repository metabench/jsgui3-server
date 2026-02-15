# Chapter 9: Domain Controls — Log Viewer & Activity Feed

## Overview

The Log Viewer is a scrolling, real-time log display that streams server activity — HTTP request/response entries, resource state changes, build events, and warnings. In the design reference, it appears as the "Recent Activity" group box and also as a dedicated "Logs" tab within the tabbed panel.

The control supports:
- Timestamped entries with color-coded severity
- Auto-scroll to bottom (with pause on manual scroll)
- Filtering by log level and source
- Search across visible entries

---

## Log_Viewer Control

### Spec

```javascript
{
    __type_name: 'log_viewer',
    title: 'Recent Activity',
    max_lines: 500,              // Maximum lines in buffer (FIFO)
    auto_scroll: true,           // Auto-scroll to bottom
    show_timestamps: true,       // Show timestamp column
    initial_entries: [           // Pre-populated entries (from recent events)
        {
            timestamp: 1739567000000,
            level: 'info',
            source: 'request',
            message: 'GET / — 200 OK (14ms)'
        }
    ]
}
```

### Visual Anatomy

```
┌─ Recent Activity ──────────────────────────────────────┐
│                                                        │
│  14:23:07  File change detected: client.js — rebuild   │
│  14:23:08  Bundle built successfully (245 KB, 1.2s)    │
│  14:23:08  CSS extracted (12 KB, 12 controls)          │
│  14:23:09  ⚠ Warning: unused variable in helpers.js:42 │
│  14:22:45  GET / — 200 OK (14ms)                       │
│  14:22:38  POST /api/validateUser — 200 OK (3ms)       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Constructor

```javascript
class Log_Viewer extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'log_viewer';
        super(spec);
        const { context } = this;

        this._max_lines = spec.max_lines || 500;
        this._auto_scroll = spec.auto_scroll !== false;
        this._show_timestamps = spec.show_timestamps !== false;
        this._entries = [];
        this._paused = false;  // User-scrolled pause

        const compose = () => {
            // Optional group box wrapper
            if (spec.title) {
                const group = new Group_Box({ context, title: spec.title });
                this.add(group);
                this._container = group;
            } else {
                this._container = this;
            }

            // Filter bar (collapsible)
            if (spec.show_filter !== false) {
                const filter_bar = new controls.div({ context, class: 'log-filter-bar' });
                this._container.add(filter_bar);
                this._filter_bar = filter_bar;

                // Level filter chips
                const levels = ['all', 'info', 'warn', 'error', 'debug'];
                levels.forEach(level => {
                    const chip = new controls.span({
                        context,
                        class: `log-filter-chip ${level === 'all' ? 'chip-active' : ''}`
                    });
                    chip.dom.attributes['data-level'] = level;
                    chip.add(level);
                    filter_bar.add(chip);
                });

                // Search input
                const search = new controls.div({ context, class: 'log-search' });
                filter_bar.add(search);
            }

            // Log output area
            const output = new controls.div({ context, class: 'log-output' });
            this._container.add(output);
            this._output = output;

            // Pre-populate initial entries
            if (spec.initial_entries) {
                spec.initial_entries.forEach(entry => this._render_entry(entry));
            }
        };

        if (!spec.el) { compose(); }
    }

    _render_entry(entry) {
        const { context } = this;
        const line = new controls.div({
            context,
            class: `log-line log-${entry.level || 'info'}`
        });

        // Timestamp
        if (this._show_timestamps) {
            const time = new controls.span({ context, class: 'log-timestamp' });
            time.add(format_time(entry.timestamp));
            line.add(time);
        }

        // Message
        const msg = new controls.span({ context, class: 'log-message' });
        msg.add(entry.message || '');
        line.add(msg);

        this._output.add(line);
        this._entries.push(entry);

        // Trim if over max
        if (this._entries.length > this._max_lines) {
            this._entries.shift();
            if (this._output.el && this._output.el.firstChild) {
                this._output.el.removeChild(this._output.el.firstChild);
            }
        }
    }

    // Client-side: append a new log entry
    append(entry) {
        this._render_entry(entry);

        // Auto-scroll to bottom
        if (this._auto_scroll && !this._paused && this._output.el) {
            this._output.el.scrollTop = this._output.el.scrollHeight;
        }
    }

    // Client-side: append from SSE data
    append_request(req_data) {
        const status_color = req_data.status >= 400 ? 'error'
            : req_data.status >= 300 ? 'warn' : 'info';

        this.append({
            timestamp: req_data.timestamp,
            level: status_color,
            source: 'request',
            message: `${req_data.method} ${req_data.url} — ${req_data.status} (${req_data.duration_ms}ms)`
        });
    }

    append_resource_event(event_data) {
        const level = event_data.to === 'crashed' ? 'error'
            : event_data.to === 'unhealthy' ? 'warn' : 'info';

        this.append({
            timestamp: event_data.timestamp || Date.now(),
            level: level,
            source: 'resource',
            message: `Resource "${event_data.resourceName}": ${event_data.from || '?'} → ${event_data.to || '?'}`
        });
    }

    append_build_event(build_data) {
        const js_item = build_data.items?.find(i => i.type === 'js');
        const css_item = build_data.items?.find(i => i.type === 'css');

        this.append({
            timestamp: build_data.built_at || Date.now(),
            level: 'info',
            source: 'build',
            message: `Bundle built: JS ${format_bytes(js_item?.size_identity || 0)}, CSS ${format_bytes(css_item?.size_identity || 0)}`
        });
    }

    clear() {
        this._entries = [];
        if (this._output && this._output.el) {
            this._output.el.innerHTML = '';
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Pause auto-scroll when user scrolls up
            if (this._output && this._output.el) {
                this._output.el.addEventListener('scroll', () => {
                    const el = this._output.el;
                    const at_bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
                    this._paused = !at_bottom;
                });
            }

            // Filter chip click handling
            const chips = document.querySelectorAll('.log-filter-chip');
            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    chips.forEach(c => c.classList.remove('chip-active'));
                    chip.classList.add('chip-active');
                    const level = chip.getAttribute('data-level');
                    this._apply_filter(level);
                });
            });
        }
    }

    _apply_filter(level) {
        if (!this._output || !this._output.el) return;
        const lines = this._output.el.querySelectorAll('.log-line');
        lines.forEach(line => {
            if (level === 'all') {
                line.style.display = '';
            } else {
                line.style.display = line.classList.contains(`log-${level}`) ? '' : 'none';
            }
        });
    }
}
```

### CSS

```css
.log_viewer {
    display: flex;
    flex-direction: column;
}

.log-filter-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid #E0DCD4;
    background: #F4F2EC;
    flex-wrap: wrap;
}

.log-filter-chip {
    font-size: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    cursor: pointer;
    background: transparent;
    color: #808080;
    border: 1px solid transparent;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.log-filter-chip:hover {
    background: rgba(68, 136, 204, 0.1);
    color: #4488CC;
}

.log-filter-chip.chip-active {
    background: rgba(68, 136, 204, 0.15);
    border-color: #4488CC;
    color: #2A5A8A;
}

.log-output {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5px;
    line-height: 1.8;
    overflow-y: auto;
    max-height: 300px;
    padding: 4px 8px;
}

.log-line {
    display: flex;
    gap: 12px;
    padding: 1px 0;
    border-bottom: 0.5px solid transparent;
}

.log-line:hover {
    background: rgba(0, 0, 0, 0.02);
}

.log-timestamp {
    color: #808080;
    min-width: 60px;
    flex-shrink: 0;
}

.log-message {
    flex: 1;
    word-break: break-word;
}

/* Level-based coloring */
.log-info .log-message   { color: #2A4060; }
.log-warn .log-message   { color: #D8A020; }
.log-error .log-message  { color: #CC4444; }
.log-debug .log-message  { color: #808080; }

.log-info .log-timestamp  { color: #808080; }
.log-warn .log-timestamp  { color: #B08800; }
.log-error .log-timestamp { color: #AA3333; }

/* Green highlights for success messages */
.log-line.log-success .log-message { color: #2A6A2A; }
```

---

## Activity Feed Entries

The log viewer receives entries from multiple SSE event types:

### Request Entries

From SSE event `request`:
```javascript
event_source.addEventListener('request', (e) => {
    const data = JSON.parse(e.data);
    log_viewer.append_request(data);
});
```

Rendered as:
```
14:22:45  GET / — 200 OK (14ms)
14:22:38  POST /api/validateUser — 200 OK (3ms)
```

### Resource State Change Entries

From SSE event `resource_state_change`:
```javascript
event_source.addEventListener('resource_state_change', (e) => {
    const data = JSON.parse(e.data);
    log_viewer.append_resource_event(data);
});
```

Rendered as:
```
14:20:12  Resource "Bundle Builder": stopped → running
```

### Build Entries

From SSE event `build_complete`:
```javascript
event_source.addEventListener('build_complete', (e) => {
    const data = JSON.parse(e.data);
    log_viewer.append_build_event(data);
});
```

Rendered as:
```
14:23:08  Bundle built: JS 245 KB, CSS 12 KB
```

### Warning/Error Entries

From SSE events `unhealthy`, `crashed`:
```javascript
event_source.addEventListener('crashed', (e) => {
    const data = JSON.parse(e.data);
    log_viewer.append({
        timestamp: data.timestamp,
        level: 'error',
        source: 'resource',
        message: `Resource "${data.resourceName}" crashed (exit code: ${data.code})`
    });
});
```

---

## Full Log View

When the user navigates to the "Logs" sidebar item, a dedicated full-page Log_Viewer is shown with:
- Larger output area (full content height)
- Search bar
- Export button
- Source filter (request, resource, build, all)

```javascript
const full_log_viewer = new Log_Viewer({
    context,
    max_lines: 2000,
    show_timestamps: true,
    auto_scroll: true,
    show_filter: true
});
```

### Search

The search function filters visible entries by text match:

```javascript
_search(query) {
    if (!this._output || !this._output.el) return;
    const lines = this._output.el.querySelectorAll('.log-line');
    const q = query.toLowerCase();
    lines.forEach(line => {
        const msg = line.querySelector('.log-message');
        if (!msg) return;
        const text = msg.innerText.toLowerCase();
        line.style.display = text.includes(q) ? '' : 'none';
        // Highlight match (simple approach)
        if (q && text.includes(q)) {
            line.style.borderBottom = '0.5px solid rgba(68, 136, 204, 0.3)';
        } else {
            line.style.borderBottom = '';
        }
    });
}
```

---

## Log Entry Schema

All log entries follow a consistent internal schema:

```typescript
interface Log_Entry {
    timestamp: number;           // Unix milliseconds
    level: 'info' | 'warn' | 'error' | 'debug' | 'success';
    source: 'request' | 'resource' | 'build' | 'system' | 'user';
    message: string;             // Human-readable message
    metadata?: {                 // Optional structured data
        method?: string;
        url?: string;
        status?: number;
        duration_ms?: number;
        resource_name?: string;
        [key: string]: any;
    };
}
```

This schema ensures consistent rendering regardless of the entry source.

---

## Performance Considerations

- **Circular buffer**: Entries beyond `max_lines` are dropped from both the array and the DOM. Default: 500 lines for the dashboard widget, 2000 for the full log view.
- **DOM recycling**: When entries exceed the max, the first child is removed from the DOM before appending a new one. This prevents unbounded DOM growth.
- **Throttling**: When SSE events arrive rapidly (e.g., during load testing), the log viewer batches DOM updates with `requestAnimationFrame` to avoid layout thrashing.
- **Auto-scroll pause**: Auto-scrolling is paused when the user scrolls up, to allow reading historical entries without being yanked to the bottom.

```javascript
// Throttled append for high-frequency updates
_throttled_append(entry) {
    this._pending_entries = this._pending_entries || [];
    this._pending_entries.push(entry);

    if (!this._flush_scheduled) {
        this._flush_scheduled = true;
        requestAnimationFrame(() => {
            this._pending_entries.forEach(e => this._render_entry(e));
            this._pending_entries = [];
            this._flush_scheduled = false;

            if (this._auto_scroll && !this._paused && this._output.el) {
                this._output.el.scrollTop = this._output.el.scrollHeight;
            }
        });
    }
}
```
