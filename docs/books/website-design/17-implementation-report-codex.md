# Chapter 17: Implementation Report (Codex)

Date: 2026-02-16

## Summary

This implementation cycle completed the core multi-repo work proposed in the book:

1. Implemented full `Webpage` primitives in `jsgui3-webpage`.
2. Implemented full `Website` and `Website_Api` primitives in `jsgui3-website`.
3. Integrated Website/Webpage normalization and serving support into `jsgui3-server`.
4. Added and ran focused tests for the new input shapes and behavior.

## What Was Implemented

### 1. `jsgui3-webpage`

Main outcomes:

1. Replaced skeleton `Webpage` with a full class based on `Evented_Class`.
2. Added canonical renderer handling (`ctrl`) with legacy compatibility (`content: Function`).
3. Added path normalization, i18n/content helpers, locale collection, `finalize()`, and `toJSON()`.
4. Added marker-based type detection support (`Symbol.for('jsgui3.webpage')`).
5. Added module exports and helper:
   - `index.js`
   - `is_webpage.js`
6. Added test suite: `test/webpage.test.js`.

### 2. `jsgui3-website`

Main outcomes:

1. Implemented `Website_Api` endpoint registry in `API.js` (fixing previous export bug and missing behavior).
2. Replaced skeleton `Website` with Map-backed page registry and API integration.
3. Added page and endpoint lifecycle methods (`add_page`, `remove_page`, `replace_page`, `add_endpoint`, etc.).
4. Added `finalize()` cascade and `toJSON()` serialization.
5. Added marker-based type detection support (`Symbol.for('jsgui3.website')`).
6. Added module exports and helper:
   - `index.js`
   - `is_website.js`
7. Added test suite: `test/website.test.js`.

### 3. `jsgui3-server`

Main outcomes in `serve-factory.js`:

1. Added Website/Webpage-like input detection and normalization.
2. Added route/base-path normalization with duplicate-route protection.
3. Added endpoint normalization supporting metadata (`name`, `path`, `method`, `description`, handler).
4. Supported direct webpage-like and website-like inputs in `Server.serve(...)`.
5. Supported non-root page sets through manual page publication path.
6. Added server-side manifest visibility:
   - `server_instance.website_manifest`
   - `server_instance.publication_summary`
7. Improved route preparation robustness for API/manual-page servers by resolving router from either `server.router` or `server.server_router`.

Main outcomes in tests:

1. Added integration coverage in `tests/serve.test.js` for:
   - webpage-like input serving on declared path
   - website-like input with `base_path` and endpoint metadata
   - duplicate normalized route rejection

## Validation Results

Executed successfully:

1. `jsgui3-server`: `npm run test:serve`
2. `jsgui3-server`: `npm run test:serve:resources`
3. `jsgui3-webpage`: `npm test`
4. `jsgui3-website`: `npm test`

Note: `jsgui3-website` tests were run in this workspace using local sibling dependency installation for `jsgui3-webpage`, because `jsgui3-webpage@^0.3.0` is not yet published to npm.

## Current Limitation

Endpoint `method` metadata is preserved in normalization/manifests, but runtime request handling is still method-agnostic because endpoint publishing currently routes through `server.publish(...)`.

## Practical Next Step

Introduce method-aware API publishing in server/router integration so `GET/POST/...` metadata is enforced, not only stored.
