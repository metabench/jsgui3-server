# Theme tokens and runtime theming

Theme tokens let controls share a common vocabulary for color, spacing, and typography. The current JSGUI3 theme mixin can set CSS variables and `data-theme` attributes, which makes CSS variable theming a natural fit.

## Pattern: CSS variables as the public theme API

- Controls should use CSS variables for colors, spacing, radii, and font styles.
- Sass can define fallback values and combine tokens with calculations.
- The HTML output should include `data-theme` on a root node when a theme is active.

Example Sass pattern:

```scss
.window {
  background: var(--theme-surface, #ffffff);
  color: var(--theme-text, #1b1b1b);
  border-color: var(--theme-border, #c0c0c0);
}
```

## Pattern: theme token maps

Allow a theme to be provided as a token map:

```javascript
const theme_tokens = {
    surface: '#f7f7f7',
    text: '#1f1f1f',
    border: '#c7c7c7'
};

const window_ctrl = new Window({
    context,
    theme_tokens
});
```

## Suggested token layers

- Global tokens for the design system: `--theme-surface`, `--theme-text`, `--theme-border`.
- Component tokens for customization: `--window-title-bg`, `--window-title-text`.
- State tokens for validation or status: `--status-error`, `--status-success`.

## Suggestions for improvement

- Publish a default token catalog in `jsgui3-html` so controls can rely on a stable set of names.
- Add a theme registry that merges tokens from multiple packages, with a final override layer from the host workspace.
- Define a `data-theme` selection policy at the document root to avoid per-control configuration.

## Where to implement

- Token catalog and defaults: `jsgui3-html` control CSS and docs.
- Theme registry: a new `jsgui3-theme` package or a module in `jsgui3-html`.
- Workspace overrides: `jsgui3-server` config that injects token overrides before bundling.
