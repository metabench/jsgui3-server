# 1. Pipeline and Runtime Semantics

## System Entry Point

For webpage/site publishing, the active bundling entry path is:

1. `HTTP_Webpage_Publisher.get_ready()`
2. `HTTP_Webpageorsite_Publisher.get_ready()`
3. `JS_Bundler.bundle(src_path_client_js)`
4. static route/response preparation

The concrete orchestrator is `publishers/http-webpageorsite-publisher.js`, which constructs `JS_Bundler` and awaits `js_bundler.bundle(...)`.

## Bundle Payload Contract

The bundle object is `Bundle` (a `Collection`) from `resources/processors/bundlers/bundle.js`. Effective convention is:

- bundle array with one `Bundle` instance
- `Bundle._arr` containing items such as:
  - `{ type: 'JavaScript', extension: 'js', text: '...' }`
  - `{ type: 'CSS', extension: 'css', text: '...' }`
  - `{ type: 'HTML', extension: 'html', text: '...' }` (added by webpage publisher)

This contract is implicit and shared by publishers/assigners.

## Readiness and Failure Semantics

`HTTP_Webpage_Publisher` starts an async readiness flow in constructor and emits `'ready'` on success. On error, it emits `'error'` and then still emits `'ready'` with `{}` so upstream startup can continue.

`HTTP_Webpageorsite_Publisher.get_ready()` also has defensive fallback for missing `src_path_client_js`, returning placeholder JS/CSS text items.

## Consequence

The current design prioritizes startup continuity over hard failure. This is operationally useful, but for strict production correctness a separate "fail-fast bundling" mode should exist.
