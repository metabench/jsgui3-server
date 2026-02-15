# Chapter 10: Domain Controls — Build Status & Bundle Inspector

## Overview

The Build Status panel surfaces information about the JavaScript and CSS bundles produced by jsgui3-server's ESBuild bundling pipeline. As documented in Chapter 3 (Server Introspection), the publisher system generates bundles and exposes some size/path data through the adapter layer.

In the design reference this appears as the "BUILD OUTPUT" group box containing file sizes and timing.

---

## Available Build Data

From Chapter 3, the following build information is available or capturable:

| Datum | Source | Available Now |
|-------|--------|:------------:|
| JS bundle path | `HTTP_Webpage_Publisher` `js_output_path` | ✅ |
| CSS bundle path | `HTTP_Webpage_Publisher` `css_output_path` | ✅ |
| JS file size (identity) | `fs.statSync` on output path | ✅ |
| CSS file size (identity) | `fs.statSync` on output path | ✅ |
| JS file size (gzipped) | `zlib.gzipSync` + measure | Adapter |
| CSS file size (gzipped) | `zlib.gzipSync` + measure | Adapter |
| Build timestamp | Captured on publisher `ready` | Adapter |
| Build duration | Captured via timing wrapper | Adapter |
| Module count | ESBuild `metafile.inputs` | Adapter |
| Source map status | Server config / publisher options | ✅ |
| Entry point | `src_path_client_js` | ✅ |
| Output directory | `build_path` or derived | ✅ |
| Compression ratios | Computed from identity/gzipped sizes | Adapter |

---

## Adapter Enhancement

The `Admin_Module_V1` adapter captures build data when the publisher fires its `ready` event. This was specified in Chapter 4 (`capture_bundle_info`):

```javascript
// Inside Admin_Module_V1.init()
capture_bundle_info(server) {
    const publishers = server.publishers || [];

    publishers.forEach(pub => {
        if (pub instanceof HTTP_Webpage_Publisher) {
            const capture = () => {
                const info = { publisher_name: pub.name || 'default', items: [] };

                if (pub.js_output_path && fs.existsSync(pub.js_output_path)) {
                    const js_stat = fs.statSync(pub.js_output_path);
                    const js_buf = fs.readFileSync(pub.js_output_path);
                    const js_gzip = zlib.gzipSync(js_buf);

                    info.items.push({
                        type: 'js',
                        path: pub.js_output_path,
                        size_identity: js_stat.size,
                        size_gzip: js_gzip.length,
                        compression_ratio: (js_gzip.length / js_stat.size * 100).toFixed(1)
                    });
                }

                if (pub.css_output_path && fs.existsSync(pub.css_output_path)) {
                    const css_stat = fs.statSync(pub.css_output_path);
                    const css_buf = fs.readFileSync(pub.css_output_path);
                    const css_gzip = zlib.gzipSync(css_buf);

                    info.items.push({
                        type: 'css',
                        path: pub.css_output_path,
                        size_identity: css_stat.size,
                        size_gzip: css_gzip.length,
                        compression_ratio: (css_gzip.length / css_stat.size * 100).toFixed(1)
                    });
                }

                info.built_at = Date.now();
                this._build_info = info;
            };

            if (pub._ready) {
                capture();
            }
            pub.on('ready', capture);
        }
    });
}
```

### API Endpoint

`GET /api/admin/v1/build`

Response:
```json
{
    "publisher_name": "default",
    "items": [
        {
            "type": "js",
            "path": "/tmp/jsgui-build/bundle.js",
            "size_identity": 254892,
            "size_gzip": 68420,
            "compression_ratio": "26.8"
        },
        {
            "type": "css",
            "path": "/tmp/jsgui-build/bundle.css",
            "size_identity": 12480,
            "size_gzip": 3120,
            "compression_ratio": "25.0"
        }
    ],
    "built_at": 1739567000000,
    "entry_point": "/home/user/app/client.js",
    "source_maps": true,
    "build_path": "/tmp/jsgui-build"
}
```

---

## Build_Status Control

### Spec

```javascript
{
    __type_name: 'build_status',
    title: 'Build Output'
}
```

### Visual Anatomy

```
┌─ BUILD OUTPUT ─────────────────────────────────────────┐
│                                                        │
│  JavaScript Bundle                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━████████  254 KB → 68 KB (27%) │
│                                                        │
│  CSS Bundle                                            │
│  ━━━━━█████████████████████████  12 KB → 3 KB (25%)    │
│                                                        │
│  ┌──────────────────────────────────────────────┐      │
│  │  Entry:   client.js                          │      │
│  │  Output:  /tmp/jsgui-build/                  │      │
│  │  Maps:    Enabled ✓                          │      │
│  │  Built:   2 minutes ago                      │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Constructor

```javascript
class Build_Status extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'build_status';
        super(spec);
        const { context } = this;

        const compose = () => {
            const group = new Group_Box({ context, title: spec.title || 'Build Output' });
            this.add(group);
            this._group = group;

            // Bundle bars container
            const bars_container = new controls.div({ context, class: 'build-bars' });
            group.add(bars_container);
            this._bars_container = bars_container;

            // Details summary
            const details = new controls.div({ context, class: 'build-details' });
            group.add(details);
            this._details = details;

            // Entry point row
            const entry_row = this._make_detail_row('Entry', '—');
            details.add(entry_row);
            this._entry_label = entry_row._value;

            // Output directory row
            const output_row = this._make_detail_row('Output', '—');
            details.add(output_row);
            this._output_label = output_row._value;

            // Source maps row
            const maps_row = this._make_detail_row('Maps', '—');
            details.add(maps_row);
            this._maps_label = maps_row._value;

            // Built timestamp row
            const built_row = this._make_detail_row('Built', '—');
            details.add(built_row);
            this._built_label = built_row._value;
        };

        if (!spec.el) { compose(); }
    }

    _make_detail_row(label, value) {
        const { context } = this;
        const row = new controls.div({ context, class: 'build-detail-row' });
        const lbl = new controls.span({ context, class: 'build-detail-label' });
        lbl.add(label + ':');
        const val = new controls.span({ context, class: 'build-detail-value' });
        val.add(value);
        row.add(lbl);
        row.add(val);
        row._value = val;
        return row;
    }

    update(build_data) {
        if (!build_data) return;

        // Clear existing bars
        if (this._bars_container && this._bars_container.el) {
            this._bars_container.el.innerHTML = '';
        }

        // Render bundle bars
        if (build_data.items) {
            build_data.items.forEach(item => {
                this._render_bundle_bar(item);
            });
        }

        // Update details
        if (build_data.entry_point && this._entry_label) {
            const basename = build_data.entry_point.split(/[/\\]/).pop();
            this._entry_label.el.innerText = basename;
        }
        if (build_data.build_path && this._output_label) {
            this._output_label.el.innerText = build_data.build_path;
        }
        if (this._maps_label) {
            this._maps_label.el.innerText = build_data.source_maps ? 'Enabled ✓' : 'Disabled';
        }
        if (build_data.built_at && this._built_label) {
            this._built_label.el.innerText = format_relative_time(build_data.built_at);
        }
    }

    _render_bundle_bar(item) {
        const { context } = this;
        const bar_group = new controls.div({ context, class: `build-bar-group build-bar-${item.type}` });

        // Label
        const label = new controls.div({ context, class: 'build-bar-label' });
        const type_name = item.type === 'js' ? 'JavaScript Bundle' : 'CSS Bundle';
        label.add(type_name);
        bar_group.add(label);

        // Bar + sizes
        const bar_row = new controls.div({ context, class: 'build-bar-row' });
        bar_group.add(bar_row);

        // Visual bar
        const bar_track = new controls.div({ context, class: 'build-bar-track' });
        const bar_fill = new controls.div({ context, class: 'build-bar-fill' });
        bar_track.add(bar_fill);
        bar_row.add(bar_track);

        // Set fill width proportional to compression ratio
        if (item.compression_ratio) {
            bar_fill.dom.attributes.style = `width: ${item.compression_ratio}%`;
        }

        // Sizes text
        const sizes = new controls.span({ context, class: 'build-bar-sizes' });
        sizes.add(
            `${format_bytes(item.size_identity)} → ${format_bytes(item.size_gzip)} (${item.compression_ratio}%)`
        );
        bar_row.add(sizes);

        if (this._bars_container.el) {
            // Client-side: direct DOM
            const temp = document.createElement('div');
            temp.innerHTML = bar_group.html();
            while (temp.firstChild) {
                this._bars_container.el.appendChild(temp.firstChild);
            }
        } else {
            this._bars_container.add(bar_group);
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            // Fetch initial build data
            this._fetch_build_data();
        }
    }

    async _fetch_build_data() {
        try {
            const res = await fetch('/api/admin/v1/build');
            if (res.ok) {
                const data = await res.json();
                this.update(data);
            }
        } catch (err) {
            console.warn('Build status fetch failed:', err);
        }
    }
}
```

### CSS

```css
.build_status {
    min-width: 280px;
}

.build-bars {
    padding: 8px 12px;
}

.build-bar-group {
    margin-bottom: 12px;
}

.build-bar-label {
    font-size: 8.5px;
    font-weight: 600;
    color: #2A4060;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.build-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.build-bar-track {
    flex: 1;
    height: 8px;
    background: #E8E4DC;
    border-radius: 4px;
    overflow: hidden;
}

.build-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.build-bar-js .build-bar-fill {
    background: linear-gradient(90deg, #4488CC, #66AAEE);
}

.build-bar-css .build-bar-fill {
    background: linear-gradient(90deg, #66AA66, #88CC88);
}

.build-bar-sizes {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8px;
    color: #666;
    white-space: nowrap;
}

/* Details section */
.build-details {
    border-top: 1px solid #E0DCD4;
    padding: 8px 12px;
    margin-top: 4px;
}

.build-detail-row {
    display: flex;
    padding: 2px 0;
    font-size: 8.5px;
}

.build-detail-label {
    min-width: 60px;
    color: #808080;
    font-weight: 500;
}

.build-detail-value {
    color: #2A4060;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8px;
}
```

---

## Bundle Size Visualization

The compression bar communicates two things at a glance:

1. **Bar fill width** = the gzipped size as a percentage of the original (the compression ratio)
2. **Text** = the exact sizes and percentage

A heavily compressed file (e.g., 250 KB → 65 KB = 26%) shows a narrow fill bar, indicating efficient compression. A less compressible file shows a wider bar.

**Color coding:**
- JavaScript: blue gradient (`#4488CC` → `#66AAEE`) — matches the server information theme
- CSS: green gradient (`#66AA66` → `#88CC88`) — matches the style/rendering theme

---

## Bundle Detail Expansion (Phase 2)

In Phase 2, clicking a bundle bar expands to show:
- Module list (from ESBuild metafile)
- Individual module sizes
- Import tree visualization
- Largest modules sorted by size

This requires the adapter to capture ESBuild's `metafile` option:

```javascript
// Enhanced adapter: capture metafile during build
async _build_with_metafile(entry_point, output_path) {
    const result = await esbuild.build({
        entryPoints: [entry_point],
        outfile: output_path,
        bundle: true,
        metafile: true  // Request module information
        // ... other options
    });

    this._metafile = result.metafile;
    return result;
}
```

### Module List Response (Phase 2)

`GET /api/admin/v1/build/modules`

```json
{
    "total_modules": 47,
    "modules": [
        {
            "path": "node_modules/jsgui3-html/controls/div.js",
            "size": 12480,
            "percentage": 4.9
        },
        {
            "path": "client/dashboard.js",
            "size": 8200,
            "percentage": 3.2
        }
    ],
    "largest": [
        { "path": "node_modules/jsgui3-html/core/control.js", "size": 45200 }
    ]
}
```

---

## Rebuild Trigger (Phase 2)

A "Rebuild" button in the Build Status panel triggers a manual rebundle:

`POST /api/admin/v1/build/rebuild`

```json
{
    "status": "ok",
    "duration_ms": 1240,
    "items": [
        { "type": "js", "size_identity": 254892, "size_gzip": 68420 },
        { "type": "css", "size_identity": 12480, "size_gzip": 3120 }
    ]
}
```

This uses the existing publisher's rebuild mechanism if available, or invokes esbuild directly with the same configuration.

---

## Integration with Dashboard

On the dashboard overview, the Build Status control is placed in the lower-right quadrant alongside the Route Table. It provides an at-a-glance view of the current bundle state.

```javascript
// In Admin_Dashboard compose()
const build_status = new Build_Status({ context, title: 'Build Output' });
content_grid.add(build_status);
```

When the SSE channel delivers a `build_complete` event, the dashboard's Build_Status control auto-refreshes:

```javascript
// In Admin_Dashboard activate()
event_source.addEventListener('build_complete', (e) => {
    const data = JSON.parse(e.data);
    build_status.update(data);
});
```

---

## Utility Functions

```javascript
function format_bytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function format_relative_time(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
    return new Date(timestamp).toLocaleString();
}
```
