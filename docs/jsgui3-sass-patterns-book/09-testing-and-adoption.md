# Testing and adoption plan

This chapter proposes how to validate Sass behavior and phase it into new workspaces.

## Testing suggestions

- Add control-level Sass tests to confirm extraction order and compilation.
- Add theme override tests that validate token overrides in bundled CSS.
- Add sourcemap tests when a single compilation pass is used.

Relevant test locations:

- `tests/sass-controls.e2e.test.js`
- `tests/bundlers.test.js`

## Incremental adoption plan

1. Define token vocabulary in `jsgui3-html` control CSS.
2. Introduce a theme package with token overrides.
3. Add server-level `scss_sources` for the theme in examples.
4. Expand theme package usage in additional workspaces.

## Where to implement

- Test coverage: `jsgui3-server/tests`.
- Token vocabulary: `jsgui3-html` controls and docs.
- Theme package: new repo, consumed via `style.load_paths`.
