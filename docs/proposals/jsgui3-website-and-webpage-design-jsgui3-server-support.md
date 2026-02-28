# Proposal: jsgui3-server Support for New Website/Webpage Primitives

> **Date**: 2026-02-16  
> **Status**: Proposal for review (no implementation)  
> **Companion docs**:  
> `docs/proposals/jsgui3-website-and-webpage-design.md`  
> `docs/proposals/jsgui3-website-and-webpage-design-review.md`

## 1. Purpose

Define the server-side changes required so `jsgui3-server` can fully support richer `jsgui3-website` / `jsgui3-webpage` primitives and the extra information they encapsulate, while preserving backward compatibility with existing `Server.serve(...)` usage.

## 2. Core Integration Principles

1. `jsgui3-server` should accept both classic inputs (Ctrl/functions/options) and new primitive objects.
2. Integration should use capability/shape normalization, not fragile runtime class identity checks.
3. Primitive metadata should flow into routing, bundling, HTTP headers, and admin introspection.
4. Static and dynamic page rendering must be first-class, explicit modes.
5. Existing behavior must remain intact by default.

## 3. Current Gaps in jsgui3-server

1. `publishers/http-website-publisher.js` depends on `instanceof Website` and `website.pages._arr` internals.
2. `publishers/http-website-publisher.js` has incomplete multi-page publication code paths (`NYI`).
3. `serve-factory.js` mainly normalizes function/options inputs, not richer website primitives.
4. API publishing currently assumes `api` as a plain name→handler map; endpoint metadata is not preserved.
5. Per-page metadata (render mode, page-level assets, cache hints, tags) is not represented in publication decisions.
6. Admin/tooling introspection is not using a stable website manifest contract.

## 4. Proposed Server Data Contract (Internal)

Add an internal, normalized manifest that all publishers consume.

### 4.1 `normalized_website_manifest`

```js
{
  name,
  base_path,
  meta,
  assets,
  pages: [normalized_page_manifest],
  api_endpoints: [normalized_api_manifest],
  policies
}
```

### 4.2 `normalized_page_manifest`

```js
{
  id,
  name,
  path,
  title,
  content,
  render_mode,      // 'static' | 'dynamic'
  head,
  meta,
  assets,
  scripts,
  stylesheets,
  cache_policy,
  route_priority
}
```

### 4.3 `normalized_api_manifest`

```js
{
  name,
  method,
  path,
  handler,
  description,
  auth,
  rate_limit,
  tags
}
```

The key idea: all incoming forms normalize into this one server contract before routing/bundling begins.

## 5. File-by-File Changes in jsgui3-server

### 5.1 `serve-factory.js`

Add a normalization phase before server startup.

1. Add helpers such as `normalize_serve_input`, `normalize_website_input`, `normalize_webpage_input`, `normalize_api_input`.
2. Accept additional input forms: `new Website(...)`, website-like plain objects with `pages`, `new Webpage(...)`, and webpage-like plain objects with `path` + `content`.
3. Build `normalized_website_manifest` and attach it to `server_instance`.
4. Preserve old `ctrl/page/pages/api` options by translating them into the same normalized manifest.
5. Resolve route conflicts early with deterministic precedence rules.

Impact: `serve-factory.js` becomes the single place where compatibility and input variability are handled.

### 5.2 `publishers/http-webpageorsite-publisher.js`

Refactor this shared base to consume a normalized manifest instead of raw ad hoc shape assumptions.

1. Add `prepare_manifest_bundle(manifest, options)` entrypoint.
2. Split shared logic into clear units such as `prepare_shared_client_bundle`, `prepare_page_static_assets`, and `build_static_route_response_items`.
3. Keep SSR-only mode supported when no client bundle path exists.

Impact: all page/site publishers share one bundling and route-item preparation pipeline.

### 5.3 `publishers/http-webpage-publisher.js`

Extend single-page publisher to honor encapsulated page metadata.

1. Respect `render_mode`.
2. `static`: pre-render HTML and serve static response items.
3. `dynamic`: register request-time render handler for that route.
4. Inject page-level assets/scripts/stylesheets in addition to shared site assets.
5. Apply page-level response policies (`cache_policy`, optional headers).
6. Include page manifest details in emitted `ready` payload for introspection.

Impact: one-page apps gain parity with multi-page site semantics.

### 5.4 `publishers/http-website-publisher.js`

This file needs the largest rewrite.

1. Remove hard dependency on `instanceof Website` and `website.pages._arr`.
2. Accept normalized website manifest from `serve-factory.js`.
3. For each page in `manifest.pages`, route by render mode (static page: pre-render + static route registration, dynamic page: register dynamic render handler).
4. Register API endpoints from `manifest.api_endpoints` with method/path semantics.
5. Add support for site-level `base_path` prefixing.
6. Emit a structured publication summary object (`routes`, `assets`, `api`, `warnings`).

Impact: `HTTP_Website_Publisher` becomes complete and deterministic for multi-page websites.

### 5.5 `server.js`

Add lightweight hooks so publication metadata can be surfaced consistently.

1. Add structured route registration helper for static and dynamic routes.
2. Add endpoint publication helper that accepts method/path metadata.
3. Preserve existing `publish(name, fn)` API but map it to default endpoint metadata.
4. Expose `server_instance.website_manifest` and `server_instance.publication_summary` for tooling/admin.

Impact: no breaking API change, but much better visibility.

### 5.6 `website/website.js` and `website/webpage.js`

Keep these wrappers, but add comments and type-guards that describe the normalized contract expected by server internals.

Impact: clearer boundaries between primitive packages and server adapters.

### 5.7 New helper modules (recommended)

Create a dedicated server-side normalization area.

1. `website/normalize_website_manifest.js`
2. `website/normalize_page_manifest.js`
3. `website/normalize_api_manifest.js`
4. `website/resolve_route_conflicts.js`
5. `website/build_publication_summary.js`

Impact: removes format-specific logic from publishers and centralizes compatibility policy.

## 6. Primitive Field → Server Behavior Mapping

| Primitive field | Server subsystem | Required behavior |
|---|---|---|
| `page.path` | Router | Normalize leading slash, register route, detect conflicts |
| `page.render_mode` | Publisher/rendering | Choose static pre-render vs dynamic request-time render |
| `page.content` | Renderer | Validate constructor/function and render consistently |
| `page.assets/scripts/stylesheets` | Bundling/publish | Include per-page resources in route item list |
| `page.cache_policy` | HTTP response | Set cache headers for HTML/assets |
| `page.meta/head` | HTML generation | Emit tags into rendered document |
| `website.base_path` | Routing | Prefix all page and API routes deterministically |
| `website.assets` | Bundling | Register site-wide static assets |
| `website.api` / endpoint metadata | API publisher | Publish endpoints with method/path/description/auth metadata |
| `website.meta` | Admin/introspection | Expose in summary and diagnostics APIs |

## 7. Backward Compatibility Strategy

1. Maintain current `Server.serve(Ctrl)` behavior unchanged.
2. Maintain current options object behavior (`ctrl`, `page`, `pages`, `api`).
3. Introduce a compatibility normalization layer that converts old options to manifest format.
4. Keep `server.publish(name, fn)` valid; internally convert to `{ method: 'GET', path: '/api/:name' }` (or current default route convention).
5. Log non-breaking warnings when deprecated shapes are detected.

## 8. Error Handling and Diagnostics

Standardize errors from normalization and publication stages.

1. `invalid_page_definition`
2. `invalid_api_endpoint`
3. `duplicate_route`
4. `unsupported_render_mode`
5. `asset_resolution_failure`

Each error should include:

1. `code`
2. `message`
3. `context` (`page_id`, `route`, `endpoint_name`, `source`)

This is necessary for actionable admin UX and debugging.

## 9. Testing Changes Required

### 9.1 Unit tests

1. Normalization from legacy inputs to manifest.
2. Route conflict detection and precedence.
3. API endpoint normalization (method/path defaults).
4. Render mode routing decisions.

### 9.2 Integration tests

1. Single-page static primitive.
2. Single-page dynamic primitive.
3. Multi-page mixed static/dynamic website.
4. Website with API endpoint metadata.
5. Base path + asset publication behavior.
6. Legacy `Server.serve` calls still passing unchanged.

### 9.3 Regression tests

1. No client JS path still starts server in SSR-only mode.
2. Admin route still comes up with website manifest present.
3. Existing compression and middleware pipeline remains intact.

## 10. Suggested Delivery Phases

1. **Phase 1: normalization + compatibility**  
Implement manifest normalization in `serve-factory.js`, keep existing publishers mostly intact.

2. **Phase 2: publisher modernization**  
Refactor `http-webpageorsite-publisher.js`, `http-webpage-publisher.js`, `http-website-publisher.js` to consume normalized manifest and remove `_arr`/`instanceof` coupling.

3. **Phase 3: metadata completeness**  
Implement full field mapping (assets, cache policy, endpoint metadata, introspection summary).

4. **Phase 4: admin/tooling surface**  
Expose publication summaries and diagnostics for admin views and debugging.

## 11. Recommended Initial Scope

For a practical first milestone, support this subset end-to-end.

1. `website.pages` with explicit `path` + `content`
2. `page.render_mode` (`static`/`dynamic`)
3. `website.api` endpoint metadata (`method`, `path`, `handler`)
4. normalized publication summary
5. full backward compatibility with current `Server.serve` signatures

This gives immediate value without requiring every advanced field on day one.

## 12. Outcome

With these changes, `jsgui3-server` will be able to serve richer website/webpage primitives as first-class inputs, preserve all encapsulated structure/metadata, and remain backward compatible with existing users.
