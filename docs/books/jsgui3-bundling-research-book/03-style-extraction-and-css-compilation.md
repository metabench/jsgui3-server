# 3. Style Extraction and CSS Compilation

## Extraction Target

`CSS_And_JS_From_JS_String_Using_AST_Node_Extractor` scans bundled JS AST and finds assignment expressions where:

- left side is a member expression ending in `css`, `scss`, or `sass`
- right side is a template literal

Matched style source is collected, and assignment source spans are removed from JS output.

## Output Shape

Extractor returns:

- `css` (concatenated)
- `scss` (concatenated)
- `sass` (concatenated)
- `style_segments` (ordered typed segments)
- `js` (style-assignment-free JS)

## Compilation Phase

`resources/processors/bundlers/style-bundler.js` compiles style payloads via `SASS_Compiler` when SCSS/SASS is present (or when CSS is configured to compile through sass). It supports:

- mixed segment compilation
- load paths
- output style
- optional inline sourcemaps

The compiled CSS is appended as a `CSS` bundle item.

## Current Limits

Extraction currently depends on a specific syntactic shape (`AssignmentExpression` + template literal). Non-matching style declaration patterns can evade extraction and remain in JS, which both bloats JS and risks duplicate style semantics.
