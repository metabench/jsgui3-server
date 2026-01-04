# Small examples

These examples are minimal and focus on how Sass can be placed near controls, extended, and overridden per server.

## Example 1: control-local Sass

```javascript
class Toast_Notice extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'toast_notice';
        super(spec);
        this.add_class('toast-notice');
    }
}

Toast_Notice.scss = `
.toast-notice {
  background: var(--theme-surface, #1f1f1f);
  color: var(--theme-on-surface, #ffffff);
  padding: 8px 12px;
}
`;
```

## Example 2: extending a control with new Sass

```javascript
class Window_Compact extends Window {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'window_compact';
        super(spec);
        this.add_class('window-compact');
    }
}

Window_Compact.scss = `
.window-compact .title-bar {
  font-size: 0.85em;
}
`;
```

## Example 3: workspace override via server config

```javascript
Server.serve({
    Ctrl: Demo_UI,
    style: {
        load_paths: ['styles/themes'],
        scss_sources: [
            "@use 'obsidian_theme' as *;",
            ":root { --theme-surface: $obsidian_surface; }"
        ]
    }
});
```

## Where to implement

- Control-local Sass: `jsgui3-html` control files or app-specific controls.
- Workspace overrides: `jsgui3-server` configuration for the host app.
- Theme tokens: a theme package consumed via `load_paths`.
