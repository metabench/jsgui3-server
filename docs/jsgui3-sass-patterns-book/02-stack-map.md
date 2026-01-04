# Stack map

This map shows how styles flow through the JSGUI3 stack today and where new patterns can attach.

## Current flow (summary)

1. Control classes can define static `css`, `scss`, or `sass` template literals.
2. The server extracts style segments from the client bundle source.
3. The style bundler compiles Sass and outputs a single CSS bundle.
4. The CSS bundle is served via the website CSS resource.
5. Controls apply theme tokens via CSS variables and `data-theme` attributes.

## Key integration points

- Extraction and ordering
  - `resources/processors/extractors/js/css_and_js/AST_Node/CSS_And_JS_From_JS_String_Using_AST_Node_Extractor.js`
  - `style_segments` preserve per-control ordering as they appear in source files.

- Sass compilation and bundling
  - `resources/processors/bundlers/style-bundler.js`
  - `resources/processors/compilers/SASS_Compiler.js`

- CSS resource delivery
  - `resources/website-css-resource.js`
  - `resources/website-javascript-resource.js`

- Theme tokens
  - `jsgui3-html/control_mixins/theme.js`

## Suggested additions to the stack

- A theme registry module that can merge theme tokens from multiple packages.
- A style layering policy that is explicit about ordering (base, component, overrides).
- A workspace override registry that can be shared across servers.

## Where to implement

- Theme registry: `jsgui3-html` or a new `jsgui3-theme` package.
- Style layering policy: `jsgui3-server` style bundler plus docs in `jsgui3-html`.
- Workspace override registry: `jsgui3-server` configuration with reusable defaults.
