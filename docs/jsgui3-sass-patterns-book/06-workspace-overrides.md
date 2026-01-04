# Workspace overrides and shared themes

Workspace overrides allow a server or host app to change the look of upstream controls without editing the upstream repo. The server style configuration already supports extra Sass sources and load paths.

## Pattern: server-injected Sass sources

The server can inject shared Sass sources for a workspace:

```javascript
Server.serve({
    Ctrl: Demo_UI,
    style: {
        load_paths: ['styles', 'themes'],
        scss_sources: ["@use 'theme_tokens';"],
        sass_sources: []
    }
});
```

This pattern lets the workspace override tokens or provide mixins that are available to all control-local Sass.

## Pattern: theme packages

Create a theme package that exports Sass partials and token maps. Suggested structure:

- `themes/<theme_name>/_tokens.scss`
- `themes/<theme_name>/_components.scss`
- `themes/<theme_name>/index.scss`

Then add the theme directory to `load_paths` and include it in `scss_sources`.

## Pattern: host-specific CSS

Server-owned CSS can be appended or prepended to the bundle for host-specific layout or typography. This is useful for `examples/` and other demos.

## Suggestions for improvement

- Add a `style.layers` configuration that defines ordering for base styles, theme styles, and overrides.
- Add a workspace theme manifest format (JSON or JS) that maps theme names to Sass entry points.

## Where to implement

- Workspace injection: `jsgui3-server` style config passed into the bundler.
- Theme packages: separate repos that can be added to `load_paths`.
- Examples: `jsgui3-server/examples` with a `styles/` directory and `Demo_UI.scss` overrides.
