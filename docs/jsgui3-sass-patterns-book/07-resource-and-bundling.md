# Resource pipeline and bundling

This chapter proposes ways to make the Sass pipeline predictable and extensible, while building on the current server resources.

## Current entry points

- Style extraction: `resources/processors/extractors/js/css_and_js/AST_Node/CSS_And_JS_From_JS_String_Using_AST_Node_Extractor.js`
- Sass compilation: `resources/processors/bundlers/style-bundler.js`
- CSS resource: `resources/website-css-resource.js`
- JS resource: `resources/website-javascript-resource.js`

## Pattern: deterministic ordering

The extractor already returns `style_segments` in source order. A suggested improvement is to make ordering explicit in the bundler with named layers:

- layer: `base`
- layer: `component`
- layer: `override`

This can be implemented by grouping `style_segments` before compilation.

## Pattern: caching and invalidation

Suggested improvements for faster rebuilds:

- Cache compiled Sass output keyed by file hash and style config.
- Invalidate cache only when control source or theme sources change.
- Track `load_paths` and `scss_sources` in the cache key.

## Pattern: sourcemap policy

The style config already supports sourcemaps, inline maps, and source content. A suggested policy is:

- Enable inline maps only when a single Sass compilation pass is used.
- Disable inline maps when mixing `.sass` and `.scss` to avoid inaccurate mappings.

## Suggestions for improvement

- Add a public hook so other workspaces can provide a custom style bundler without forking the server.
- Add a `style.debug` flag to log the style pipeline steps in a consistent format.

## Where to implement

- Layer ordering and caching: `resources/processors/bundlers/style-bundler.js`.
- Debug hooks: `resources/website-css-resource.js` and `resources/website-javascript-resource.js`.
- Custom bundler hook: server configuration and resource factory in `jsgui3-server`.
