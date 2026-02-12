# 2. JavaScript Bundling Core

## Active JS Bundler Chain

`resources/processors/bundlers/js-bundler.js` exports `./js/JS_Bundler`, which exports `./esbuild/Advanced_JS_Bundler_Using_ESBuild`.

That advanced bundler composes two core stages:

1. `Core_JS_Non_Minifying_Bundler_Using_ESBuild`
2. `Core_JS_Single_File_Minifying_Bundler_Using_ESBuild` (production branch)

## Stage A: Non-Minifying Bundle

`Core_JS_Non_Minifying_Bundler_Using_ESBuild` executes `esbuild.build` with:

- `bundle: true`
- `treeShaking: true`
- `write: false`
- optional sourcemap, controlled by `sourcemaps.enabled`, `debug`, and `includeInProduction`

It returns a one-item `Bundle` containing JavaScript text.

## Stage B: Style-Assignment Removal

`Advanced_JS_Bundler_Using_ESBuild` parses the Stage A JS, extracts style assignments, and produces CSS-free JS text for a second JS pass.

## Stage C: Debug/Production Split

- Debug path: re-bundle CSS-free JS without minification.
- Production path: re-bundle CSS-free JS, then run minifier bundler.

Minifier behavior is configurable by `bundler.minify` with levels `conservative | normal | aggressive` and option overrides.

## Existing Optimization Character

The current model is "bundle then sanitize" rather than "module graph first with explicit retained-module manifest." It relies heavily on esbuild tree shaking plus post-bundle style extraction.
