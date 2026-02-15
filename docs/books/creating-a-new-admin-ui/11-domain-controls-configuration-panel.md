# Chapter 11: Domain Controls — Configuration Panel

## Overview

The Configuration Panel provides a read-only view of the server's runtime configuration with selective edit capability for safe, hot-reloadable settings. It reflects the "Server Configuration" section in the design reference, showing port, bundle paths, debug mode, source map settings, and other operational parameters.

Key principle: **read-only by default**. Only settings that can be safely changed at runtime (debug mode, log level) are editable. Structural settings (port, entry point) are displayed but locked.

---

## Available Configuration Data

From Chapter 3 (Server Introspection), the following configuration data is available:

| Setting | Source | Editable | Notes |
|---------|--------|:--------:|-------|
| Port | `server.port` | ❌ | Requires restart; display only |
| Host | `server.host` or implicit | ❌ | Requires restart |
| Entry point JS | `server.src_path_client_js` | ❌ | Requires restart |
| Build output path | Publisher build path | ❌ | Set at initialization |
| Source maps | `server.source_maps` or publisher option | ⚠️ | Could toggle for next build |
| Debug mode | `process.env.JSGUI_DEBUG` | ✅ | Hot-reloadable |
| Log level | Adapter-managed | ✅ | Hot-reloadable |
| Minification | Publisher option | ⚠️ | Affects next build only |
| Compression | `server.compression` | ❌ | Requires middleware change |
| Process title | `process.title` | ✅ | Can be set at runtime |
| Node version | `process.version` | ❌ | System info |
| Platform | `process.platform` | ❌ | System info |

---

## Adapter Enhancement

### API Endpoint

`GET /api/admin/v1/config`

```json
{
    "server": {
        "port": 8080,
        "host": "0.0.0.0",
        "entry_point": "client.js",
        "build_path": "/tmp/jsgui-build",
        "source_maps": true,
        "minification": false,
        "compression": false
    },
    "runtime": {
        "debug_mode": false,
        "log_level": "info",
        "process_title": "jsgui3-server",
        "node_version": "v20.11.0",
        "platform": "linux",
        "arch": "x64",
        "pid": 12345,
        "uptime_seconds": 3600
    },
    "environment": {
        "NODE_ENV": "development",
        "JSGUI_DEBUG": "0"
    }
}
```

### Mutable Settings Endpoint

`POST /api/admin/v1/config`

Request body (only mutable fields accepted):
```json
{
    "debug_mode": true,
    "log_level": "debug",
    "process_title": "my-app-server"
}
```

Response:
```json
{
    "status": "ok",
    "applied": {
        "debug_mode": true,
        "log_level": "debug",
        "process_title": "my-app-server"
    },
    "rejected": {}
}
```

### Adapter Implementation

```javascript
// In Admin_Module_V1
get_config(server) {
    return {
        server: {
            port: server.port || null,
            host: server.host || '0.0.0.0',
            entry_point: this._get_entry_point(server),
            build_path: this._get_build_path(server),
            source_maps: this._get_source_maps(server),
            minification: this._get_minification(server),
            compression: !!server.compression
        },
        runtime: {
            debug_mode: !!process.env.JSGUI_DEBUG,
            log_level: this._log_level || 'info',
            process_title: process.title,
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime_seconds: Math.floor(process.uptime())
        },
        environment: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            JSGUI_DEBUG: process.env.JSGUI_DEBUG || '0'
        }
    };
}

set_config(changes) {
    const applied = {};
    const rejected = {};

    const mutable_fields = {
        debug_mode: (val) => {
            process.env.JSGUI_DEBUG = val ? '1' : '0';
            applied.debug_mode = val;
        },
        log_level: (val) => {
            const valid_levels = ['error', 'warn', 'info', 'debug'];
            if (valid_levels.includes(val)) {
                this._log_level = val;
                applied.log_level = val;
            } else {
                rejected.log_level = `Invalid level: ${val}`;
            }
        },
        process_title: (val) => {
            if (typeof val === 'string' && val.length > 0 && val.length < 256) {
                process.title = val;
                applied.process_title = val;
            } else {
                rejected.process_title = 'Invalid title';
            }
        }
    };

    for (const [key, value] of Object.entries(changes)) {
        if (mutable_fields[key]) {
            mutable_fields[key](value);
        } else {
            rejected[key] = 'Field is not mutable at runtime';
        }
    }

    return { status: 'ok', applied, rejected };
}

_get_entry_point(server) {
    if (server.src_path_client_js) {
        return server.src_path_client_js.split(/[/\\]/).pop();
    }
    return null;
}

_get_build_path(server) {
    // Check publishers for build path
    if (server.publishers) {
        for (const pub of server.publishers) {
            if (pub.build_path) return pub.build_path;
        }
    }
    return null;
}

_get_source_maps(server) {
    if (server.source_maps !== undefined) return server.source_maps;
    // Check publisher options
    if (server.publishers) {
        for (const pub of server.publishers) {
            if (pub.source_maps !== undefined) return pub.source_maps;
        }
    }
    return false;
}

_get_minification(server) {
    if (server.publishers) {
        for (const pub of server.publishers) {
            if (pub.minify !== undefined) return pub.minify;
        }
    }
    return false;
}
```

---

## Config_Panel Control

### Spec

```javascript
{
    __type_name: 'config_panel',
    title: 'Server Configuration'
}
```

### Visual Anatomy

```
┌─ Server Configuration ────────────────────────────────┐
│                                                        │
│  SERVER                                                │
│  ──────────────────────────────────────────────        │
│  Port          8080                         🔒         │
│  Host          0.0.0.0                      🔒         │
│  Entry Point   client.js                    🔒         │
│  Build Path    /tmp/jsgui-build             🔒         │
│  Source Maps   ✓ Enabled                    🔒         │
│  Minification  ✗ Disabled                   🔒         │
│                                                        │
│  RUNTIME                                               │
│  ──────────────────────────────────────────────        │
│  Debug Mode    [  OFF  |  ON  ]             ✏️         │
│  Log Level     [ info ▾ ]                   ✏️         │
│  Process Title [ jsgui3-server         ]    ✏️         │
│                                                        │
│  ENVIRONMENT                                           │
│  ──────────────────────────────────────────────        │
│  Node.js       v20.11.0                                │
│  Platform      linux x64                               │
│  PID           12345                                   │
│  Uptime        1h 23m                                  │
│                                                        │
│                              [ Apply Changes ]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Constructor

```javascript
class Config_Panel extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'config_panel';
        super(spec);
        const { context } = this;

        this._pending_changes = {};

        const compose = () => {
            const group = new Group_Box({ context, title: spec.title || 'Server Configuration' });
            this.add(group);
            this._group = group;

            // Server section
            const server_section = this._make_section('Server');
            group.add(server_section);
            this._server_section = server_section;

            this._port_row = this._make_readonly_row('Port', '—');
            server_section.add(this._port_row);

            this._host_row = this._make_readonly_row('Host', '—');
            server_section.add(this._host_row);

            this._entry_row = this._make_readonly_row('Entry Point', '—');
            server_section.add(this._entry_row);

            this._build_path_row = this._make_readonly_row('Build Path', '—');
            server_section.add(this._build_path_row);

            this._source_maps_row = this._make_readonly_row('Source Maps', '—');
            server_section.add(this._source_maps_row);

            this._minify_row = this._make_readonly_row('Minification', '—');
            server_section.add(this._minify_row);

            // Runtime section
            const runtime_section = this._make_section('Runtime');
            group.add(runtime_section);
            this._runtime_section = runtime_section;

            this._debug_row = this._make_toggle_row('Debug Mode', false);
            runtime_section.add(this._debug_row);

            this._log_level_row = this._make_select_row('Log Level', 'info', ['error', 'warn', 'info', 'debug']);
            runtime_section.add(this._log_level_row);

            this._title_row = this._make_text_row('Process Title', '');
            runtime_section.add(this._title_row);

            // Environment section
            const env_section = this._make_section('Environment');
            group.add(env_section);
            this._env_section = env_section;

            this._node_row = this._make_readonly_row('Node.js', '—');
            env_section.add(this._node_row);

            this._platform_row = this._make_readonly_row('Platform', '—');
            env_section.add(this._platform_row);

            this._pid_row = this._make_readonly_row('PID', '—');
            env_section.add(this._pid_row);

            this._uptime_row = this._make_readonly_row('Uptime', '—');
            env_section.add(this._uptime_row);

            // Apply button
            const button_row = new controls.div({ context, class: 'config-button-row' });
            group.add(button_row);

            const apply_btn = new controls.Button({ context, text: 'Apply Changes' });
            apply_btn.dom.attributes.class = 'config-apply-btn';
            button_row.add(apply_btn);
            this._apply_btn = apply_btn;
        };

        if (!spec.el) { compose(); }
    }

    _make_section(title) {
        const { context } = this;
        const section = new controls.div({ context, class: 'config-section' });
        const header = new controls.div({ context, class: 'config-section-header' });
        header.add(title);
        section.add(header);
        return section;
    }

    _make_readonly_row(label, value) {
        const { context } = this;
        const row = new controls.div({ context, class: 'config-row config-row-readonly' });

        const lbl = new controls.span({ context, class: 'config-label' });
        lbl.add(label);
        row.add(lbl);

        const val = new controls.span({ context, class: 'config-value' });
        val.add(value);
        row.add(val);

        const lock = new controls.span({ context, class: 'config-lock' });
        lock.add('🔒');
        row.add(lock);

        row._value_el = val;
        return row;
    }

    _make_toggle_row(label, initial_value) {
        const { context } = this;
        const row = new controls.div({ context, class: 'config-row config-row-editable' });

        const lbl = new controls.span({ context, class: 'config-label' });
        lbl.add(label);
        row.add(lbl);

        const toggle_wrap = new controls.div({ context, class: 'config-toggle' });

        const off_btn = new controls.span({ context, class: `toggle-option ${!initial_value ? 'toggle-active' : ''}` });
        off_btn.dom.attributes['data-value'] = 'false';
        off_btn.add('OFF');
        toggle_wrap.add(off_btn);

        const on_btn = new controls.span({ context, class: `toggle-option ${initial_value ? 'toggle-active' : ''}` });
        on_btn.dom.attributes['data-value'] = 'true';
        on_btn.add('ON');
        toggle_wrap.add(on_btn);

        row.add(toggle_wrap);
        row._toggle = toggle_wrap;
        row._field = label.toLowerCase().replace(/\s/g, '_');
        return row;
    }

    _make_select_row(label, initial_value, options) {
        const { context } = this;
        const row = new controls.div({ context, class: 'config-row config-row-editable' });

        const lbl = new controls.span({ context, class: 'config-label' });
        lbl.add(label);
        row.add(lbl);

        // Rendered as a simple dropdown on client
        const select_wrap = new controls.div({ context, class: 'config-select-wrap' });
        const display = new controls.span({ context, class: 'config-select-display' });
        display.add(initial_value);
        select_wrap.add(display);

        const arrow = new controls.span({ context, class: 'config-select-arrow' });
        arrow.add('▾');
        select_wrap.add(arrow);

        row.add(select_wrap);
        row._display = display;
        row._options = options;
        row._field = label.toLowerCase().replace(/\s/g, '_');
        return row;
    }

    _make_text_row(label, initial_value) {
        const { context } = this;
        const row = new controls.div({ context, class: 'config-row config-row-editable' });

        const lbl = new controls.span({ context, class: 'config-label' });
        lbl.add(label);
        row.add(lbl);

        const input_wrap = new controls.div({ context, class: 'config-text-wrap' });
        const display = new controls.span({ context, class: 'config-text-display' });
        display.add(initial_value || '—');
        input_wrap.add(display);

        row.add(input_wrap);
        row._display = display;
        row._field = label.toLowerCase().replace(/\s/g, '_');
        return row;
    }

    update(config_data) {
        if (!config_data) return;

        // Server section (read-only)
        const s = config_data.server || {};
        this._set_readonly(this._port_row, s.port);
        this._set_readonly(this._host_row, s.host);
        this._set_readonly(this._entry_row, s.entry_point);
        this._set_readonly(this._build_path_row, s.build_path);
        this._set_readonly(this._source_maps_row, s.source_maps ? '✓ Enabled' : '✗ Disabled');
        this._set_readonly(this._minify_row, s.minification ? '✓ Enabled' : '✗ Disabled');

        // Runtime section
        const r = config_data.runtime || {};
        this._set_toggle(this._debug_row, r.debug_mode);
        this._set_select(this._log_level_row, r.log_level);
        this._set_text(this._title_row, r.process_title);

        // Environment section
        this._set_readonly(this._node_row, r.node_version);
        this._set_readonly(this._platform_row, `${r.platform || '?'} ${r.arch || ''}`);
        this._set_readonly(this._pid_row, r.pid);
        this._set_readonly(this._uptime_row, format_uptime(r.uptime_seconds));
    }

    _set_readonly(row, value) {
        if (row && row._value_el && row._value_el.el) {
            row._value_el.el.innerText = value != null ? String(value) : '—';
        }
    }

    _set_toggle(row, value) {
        if (!row || !row._toggle || !row._toggle.el) return;
        const options = row._toggle.el.querySelectorAll('.toggle-option');
        options.forEach(opt => {
            const is_active = (opt.getAttribute('data-value') === 'true') === !!value;
            opt.classList.toggle('toggle-active', is_active);
        });
    }

    _set_select(row, value) {
        if (row && row._display && row._display.el) {
            row._display.el.innerText = value || '—';
        }
    }

    _set_text(row, value) {
        if (row && row._display && row._display.el) {
            row._display.el.innerText = value || '—';
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Fetch initial config
            this._fetch_config();

            // Toggle click handlers
            this._activate_toggles();

            // Select dropdown handlers
            this._activate_selects();

            // Text edit handlers
            this._activate_text_inputs();

            // Apply button
            if (this._apply_btn && this._apply_btn.el) {
                this._apply_btn.el.addEventListener('click', () => this._apply_changes());
            }
        }
    }

    _activate_toggles() {
        const toggle_rows = [this._debug_row];
        toggle_rows.forEach(row => {
            if (!row || !row._toggle || !row._toggle.el) return;
            const options = row._toggle.el.querySelectorAll('.toggle-option');
            options.forEach(opt => {
                opt.addEventListener('click', () => {
                    options.forEach(o => o.classList.remove('toggle-active'));
                    opt.classList.add('toggle-active');
                    this._pending_changes[row._field] = opt.getAttribute('data-value') === 'true';
                    this._mark_dirty();
                });
            });
        });
    }

    _activate_selects() {
        const select_rows = [this._log_level_row];
        select_rows.forEach(row => {
            if (!row || !row._display || !row._display.el) return;
            const display_el = row._display.el.parentElement;

            display_el.addEventListener('click', () => {
                // Simple cycling through options
                const current = row._display.el.innerText;
                const idx = row._options.indexOf(current);
                const next = row._options[(idx + 1) % row._options.length];
                row._display.el.innerText = next;
                this._pending_changes[row._field] = next;
                this._mark_dirty();
            });
        });
    }

    _activate_text_inputs() {
        const text_rows = [this._title_row];
        text_rows.forEach(row => {
            if (!row || !row._display || !row._display.el) return;

            row._display.el.contentEditable = true;
            row._display.el.addEventListener('input', () => {
                this._pending_changes[row._field] = row._display.el.innerText.trim();
                this._mark_dirty();
            });
        });
    }

    _mark_dirty() {
        if (this._apply_btn && this._apply_btn.el) {
            this._apply_btn.el.classList.add('config-btn-dirty');
        }
    }

    async _fetch_config() {
        try {
            const res = await fetch('/api/admin/v1/config');
            if (res.ok) {
                const data = await res.json();
                this.update(data);
            }
        } catch (err) {
            console.warn('Config fetch failed:', err);
        }
    }

    async _apply_changes() {
        if (Object.keys(this._pending_changes).length === 0) return;

        try {
            const res = await fetch('/api/admin/v1/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this._pending_changes)
            });

            if (res.ok) {
                const result = await res.json();
                if (Object.keys(result.rejected).length > 0) {
                    console.warn('Some config changes rejected:', result.rejected);
                }
                this._pending_changes = {};
                if (this._apply_btn && this._apply_btn.el) {
                    this._apply_btn.el.classList.remove('config-btn-dirty');
                }
                // Refresh config display
                this._fetch_config();
            }
        } catch (err) {
            console.error('Config apply failed:', err);
        }
    }
}
```

### CSS

```css
.config_panel {
    min-width: 280px;
}

.config-section {
    margin-bottom: 12px;
}

.config-section-header {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #808080;
    padding: 8px 12px 4px 12px;
    border-bottom: 1px solid #E0DCD4;
    margin-bottom: 4px;
}

.config-row {
    display: flex;
    align-items: center;
    padding: 4px 12px;
    font-size: 8.5px;
    gap: 8px;
}

.config-row:hover {
    background: rgba(0, 0, 0, 0.015);
}

.config-label {
    min-width: 100px;
    color: #666;
    font-weight: 500;
}

.config-value {
    flex: 1;
    color: #2A4060;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8px;
}

.config-lock {
    font-size: 7px;
    opacity: 0.4;
}

/* Toggle */
.config-toggle {
    display: flex;
    border: 1px solid #D0CCC4;
    border-radius: 3px;
    overflow: hidden;
}

.toggle-option {
    padding: 2px 10px;
    font-size: 8px;
    font-weight: 600;
    cursor: pointer;
    color: #808080;
    transition: all 0.15s;
}

.toggle-option:first-child {
    border-right: 1px solid #D0CCC4;
}

.toggle-option.toggle-active {
    background: #4488CC;
    color: #FFFFFF;
}

.toggle-option:hover:not(.toggle-active) {
    background: rgba(68, 136, 204, 0.1);
}

/* Select */
.config-select-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid #D0CCC4;
    border-radius: 3px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 8px;
    color: #2A4060;
    transition: border-color 0.15s;
}

.config-select-wrap:hover {
    border-color: #4488CC;
}

.config-select-arrow {
    font-size: 7px;
    color: #808080;
}

/* Text input */
.config-text-wrap {
    flex: 1;
}

.config-text-display {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8px;
    color: #2A4060;
    padding: 2px 6px;
    border: 1px solid transparent;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s;
    display: inline-block;
    min-width: 100px;
}

.config-text-display:focus {
    border-color: #4488CC;
    background: #FFFFFF;
}

/* Apply button */
.config-button-row {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
    border-top: 1px solid #E0DCD4;
}

.config-apply-btn {
    font-size: 8px;
    padding: 4px 16px;
    background: #F4F2EC;
    border: 1px solid #D0CCC4;
    border-radius: 3px;
    cursor: pointer;
    color: #808080;
    transition: all 0.15s;
}

.config-apply-btn:hover {
    border-color: #4488CC;
    color: #4488CC;
}

.config-btn-dirty {
    background: #4488CC;
    color: #FFFFFF;
    border-color: #3377BB;
}

.config-btn-dirty:hover {
    background: #3377BB;
    color: #FFFFFF;
}
```

---

## Safety Considerations

### Why Most Settings Are Read-Only

Changing the server port, host, or entry point at runtime would require:
1. Closing the HTTP listener
2. Rebinding to a new port
3. Potentially losing active connections
4. Rebuilding bundles with new configuration

This is inherently dangerous for a production server. The config panel avoids this by showing these values for informational purposes only, marked with a lock icon.

### Mutable Settings — Safe Changes

The three editable fields were chosen because they have no destructive side effects:

| Field | Effect | Risk |
|-------|--------|------|
| Debug Mode | Sets `JSGUI_DEBUG` env var; increases logging verbosity | Low — extra log output |
| Log Level | Controls adapter-managed log filtering | Low — changes what's logged |
| Process Title | Sets `process.title`; visible in `ps`/task manager | None |

### Input Validation

All mutable settings are validated server-side in the adapter:
- `debug_mode`: Must be boolean
- `log_level`: Must be one of `['error', 'warn', 'info', 'debug']`
- `process_title`: Must be a non-empty string under 256 characters

Invalid values are returned in the `rejected` field of the response, and the UI displays the original value unchanged.

---

## Integration with Dashboard

The Config_Panel appears as a dedicated sidebar section ("Configuration") rather than on the main dashboard. This keeps the dashboard focused on live metrics while configuration is a separate concern.

```javascript
// In Admin_Shell navigation handler
case 'configuration':
    const config_panel = new Config_Panel({ context, title: 'Server Configuration' });
    this._content_area.add(config_panel);
    break;
```

Changes applied through the config panel are reflected immediately in the adapter layer. For example, toggling debug mode causes subsequent requests to include debug timing headers, and the log viewer begins showing debug-level entries.
