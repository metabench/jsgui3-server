# Review: jsgui3-website-and-webpage-design

> **Date**: 2026-02-16  
> **Scope**: Review + design contributions only (no implementation)

## Best ideas

1. **Keeping `jsgui3-website` / `jsgui3-webpage` optional to `jsgui3-server` is the strongest architectural choice.**
Reason: this preserves low-friction serving for simple cases while still allowing richer abstractions for apps that want them.

2. **Making inspectability a first-class goal (`toJSON()`, metadata exposure) is excellent.**
Reason: admin tooling, diagnostics, docs generation, and tests all benefit from a stable introspection surface.

3. **Supporting multiple page input shapes (`Array` and object-map) is pragmatic.**
Reason: object-map is concise for route-centric definitions, while arrays are better for ordered or generated page sets.

4. **Calling out the `API.js` export bug explicitly is very good proposal hygiene.**
Reason: the proposal is grounded in reality and identifies a hard runtime blocker.

5. **The open-question section is high quality and correctly focused.**
Reason: it addresses exactly the unknowns that matter for primitives (dynamic rendering, ordering, nesting, server vs page concerns).

## Worst ideas

1. **Leaning on `Collection` internals (`pages._arr`) is the weakest technical direction.**
Reason: this bakes internal details into public behavior, increases fragility, and makes future refactors painful.

2. **Using `Evented_Class` as a default `Webpage` model is over-engineered for current needs.**
Reason: it adds boilerplate, coupling, and cognitive load before there is a concrete consumer that needs per-field change events.

3. **Hard-coupling primitives to `jsgui3-html` creates unnecessary dependency weight.**
Reason: website/webpage definitions are mostly domain objects; making them require the full UI/control stack limits reuse (including non-server tooling).

4. **`instanceof` as a core integration strategy is brittle across duplicated installs/workspaces.**
Reason: two copies of a package can fail `instanceof` even when shape-compatible; server boundaries should prefer capability checks and normalization.

5. **Defaulting page `path` to `'/'` can silently mask configuration mistakes.**
Reason: accidental missing routes become root collisions; this should be explicit in multi-page scenarios.

## Contributions to the design discussion

1. **Use a layered model: core primitives + server adapter layer.**
Core primitives should be plain and lightweight (`Webpage`, `Website`, `Website_Api`) with minimal runtime dependencies. Server-specific translation can stay in `jsgui3-server`.

2. **Define a strict minimal contract for primitives.**
For `Webpage`: `path`, `title`, `content`, `meta`, `assets`, `render_mode` (`static` / `dynamic`).  
For `Website`: page registry, endpoint registry, metadata, and deterministic serialization.

3. **Prefer `Map` semantics for page identity, but expose stable methods, not internals.**
Use `add_page`, `get_page`, `has_page`, `remove_page`, `list_pages`; do not expose storage internals like `_arr`.

4. **Separate endpoint declaration from server publishing.**
`Website_Api` should store endpoint definitions (`name`, `method`, `path`, `handler`, `description`, `auth`) while `jsgui3-server` decides how to publish them.

5. **Normalize and validate early.**
Route normalization (`/` prefix), duplicate policy, and handler/type checks should happen when constructing primitives, not at publish time.

6. **Add lifecycle semantics instead of full reactivity.**
A simple `finalize()` (or equivalent) model is likely enough: mutable during composition, read-mostly after publish. This gives safety without event-system complexity.

7. **Make introspection a formal API contract.**
Keep `toJSON()` deterministic and tool-friendly so admin UIs and docs generators can rely on it without peeking into implementation details.

## Suggested direction

A strong near-term path is effectively **Webpage B-lite + Website C-lite**:

- Keep property helpers and introspection.
- Use `Map`-style semantics for routes and endpoint registration.
- Avoid `Evented_Class` and `Collection._arr` coupling.
- Keep primitives lightweight and let `jsgui3-server` own serving/bundling mechanics.

This keeps the primitives expressive enough for creative website/page design while staying robust for server integration.
