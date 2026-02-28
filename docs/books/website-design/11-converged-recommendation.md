# Chapter 11: Converged Recommendation

This chapter turns the debate from previous chapters into a concrete baseline that can be implemented incrementally.

The goal is not to "win" every design argument. The goal is to define a stable, useful first version that keeps `jsgui3-server` backward-compatible while unlocking richer website/webpage primitives.

---

## 11.1 Decision Summary

| Area | Recommended baseline | Why |
|---|---|---|
| Base class | `Evented_Class` with plain property assignment | Ecosystem-consistent, low overhead, no per-property event boilerplate |
| Webpage contract | Explicit known fields + `toJSON()` + lightweight validation | Improves introspection and catches common mistakes early |
| Website pages storage | Internal `Map` keyed by normalized path | O(1) lookup, duplicate detection, insertion-order preserved |
| Website API layer | Structured endpoint registry (Map-backed) with metadata | Supports docs/admin/auth/method semantics without server coupling |
| Server input handling | Normalize all input shapes into one internal manifest | Keeps publishers simple and removes shape-specific branching |
| Type detection | Capability checks with optional explicit marker | Avoids brittle `instanceof` behavior in linked/workspace installs |
| Lifecycle | Optional `finalize()` boundary, not full reactive mutation system | Safer publishing without heavy event complexity |

---

## 11.2 Minimal Stable Primitive Contract

The first stable release should guarantee this contract.

### `Webpage`

Required:

1. `path` (string, normalized to leading slash)
2. `ctrl` (control constructor / renderer)

Recommended:

1. `name`
2. `title`
3. `content` (structured content/i18n data, optional)
4. `meta`
5. `scripts`
6. `stylesheets`
7. `render_mode` (`static` or `dynamic`) — see [Chapter 4 discussion](04-webpage.md)
8. `toJSON()` for deterministic introspection

Compatibility during migration:

1. Accept legacy `content: Function` as an alias for `ctrl`.
2. Normalize to `ctrl` internally so server/publisher code has one renderer field.

### `Website`

Required:

1. page registry (`add_page`, `get_page`, `has_page`, `remove_page`, `pages`, `routes`)
2. API registry (`add_endpoint`/`define_endpoint`, `get_endpoint`, `api_endpoints`)

Recommended:

1. `name`
2. `meta`
3. `assets`
4. `base_path`
5. `toJSON()` summary for admin/tooling

---

## 11.3 Server Integration Baseline

`jsgui3-server` should treat Website/Webpage support as additive and normalize all inputs.

### Input forms to support

1. `Server.serve(MyCtrl)`
2. `Server.serve({ pages: {...}, api: {...} })`
3. `Server.serve(new Webpage(...))`
4. `Server.serve(new Website(...))`
5. shape-compatible plain objects for page/site definitions

### Internal flow

1. Detect and normalize input into `normalized_website_manifest`
2. Validate normalized routes/endpoints
3. Build static and dynamic page route registrations
4. Publish API endpoints with method/path metadata
5. Expose publication summary for introspection/admin

This keeps the publisher pipeline focused on serving, not on input parsing.

---

## 11.4 Validation Policy

Use two-stage validation.

Construction-time lightweight validation:

1. route is string-like
2. handler/content types are sane
3. obvious shape errors fail fast

Publish-time strict validation:

1. duplicate routes
2. invalid HTTP methods
3. unresolved assets
4. unsupported render modes

This avoids over-strict constructors while still giving strong safety before serving.

---

## 11.5 Backward Compatibility Rules

These rules should hold through the migration.

1. Existing `Server.serve(...)` signatures continue to work unchanged.
2. Existing `api: { name: fn }` remains valid.
3. Existing control-first one-liner remains first-class.
4. New Website/Webpage primitives are optional convenience, not mandatory API layers.
5. Deprecations, if any, should be warning-only for at least one minor cycle.

Field migration rule:

1. `Webpage.ctrl` is the canonical renderer field.
2. Legacy `Webpage.content` used as a renderer remains accepted as input during migration.
3. Server normalization maps both shapes into one internal manifest (`ctrl` canonical, structured content separate).

---

## 11.6 Non-Goals for the First Release

To keep scope controlled, do not block first release on:

1. runtime hot-add/remove page re-publication
2. nested page-tree abstractions
3. full OpenAPI generation
4. advanced per-route auth/rate-limit engines
5. multi-website orchestration features

These can be layered in after stable primitive/server interoperability is proven.

---

## 11.7 Suggested Phased Delivery

1. **Phase A: Primitive stabilization**  
Finalize `Webpage` and `Website` contracts, including `toJSON()` and minimal validation.

2. **Phase B: Server normalization layer**  
Add `normalize_serve_input` + manifest conversion in `serve-factory.js`.

3. **Phase C: Publisher alignment**  
Refactor publishers to consume normalized manifests and remove `._arr`/`instanceof` coupling.

4. **Phase D: Tooling/admin surfacing**  
Expose website manifest and publication summary in admin APIs/UI.

Each phase should ship with targeted tests and can be released independently.

---

## 11.8 Recommended First Implementation Target

A pragmatic first milestone:

1. Webpage with explicit fields + `toJSON()` + path normalization
2. Website with Map-backed page registry + structured API endpoint registry
3. Server normalization for Website/Webpage inputs
4. Route conflict detection and clear error messages
5. No regressions for legacy `Server.serve` usage

If this milestone is stable, the architecture is validated and later enhancements become straightforward rather than speculative.

---

## 11.9 Acceptance Criteria for the Milestone

1. A `Website` with at least two pages serves both routes correctly.
2. A `Webpage` passed directly to `Server.serve(...)` serves at its declared path.
3. Duplicate page paths fail with a deterministic, actionable error.
4. API endpoint metadata (`method`, `path`) is preserved through normalization and publication.
5. Legacy usage (`Server.serve(MyCtrl)`, `Server.serve({ pages, api })`) still passes existing tests.

---

## 11.10 Forward References

The following chapters expand this recommendation into full implementation blueprints:

- **[Chapter 12](12-content-model.md)**: Defines the content model — how Webpage holds text strings, structured data, and i18n translations
- **[Chapter 13](13-webpage-module-spec.md)**: Complete module specification for `jsgui3-webpage` (constructor, every method, validation, test plan)
- **[Chapter 14](14-website-module-spec.md)**: Complete module specification for `jsgui3-website` (page registry, API registry, finalize cascade)
- **[Chapter 15](15-multi-repo-plan.md)**: Multi-repo implementation coordination (dependency graph, phased delivery, version pinning)

---

## 11.11 Version Track Alignment

To avoid ambiguity across later chapters:

1. **v0.1.x** is the minimal-first track from Chapter 16 (small surface, fast adoption).
2. **v0.3.x** is the full-spec target from Chapters 13 and 14 (lifecycle, introspection, i18n helpers, richer API).
3. Chapter 15 coordinates both tracks as one migration path, not competing plans.

**Current status (Feb 2026)**: Codex implemented the full spec (see [Ch.17](17-implementation-report-codex.md)). Implementation exists in repo source but packages have not yet been published to npm (still v0.0.8 on registry). Server integration (`normalize_serve_input`, `website_manifest`) is live in `serve-factory.js`.
