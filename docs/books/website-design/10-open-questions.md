# Chapter 10: Open Questions

These are design decisions that remain unresolved. Each one could go in multiple directions, and the right choice depends on how these modules will actually be used.

---

## 1. Should Webpage manage client-side JS paths?

Today, `serve-factory.js` resolves client-side JavaScript paths (`src_path_client_js`). The page just says "my content is this control" and the server figures out what to bundle.

**Option A**: Webpage has a `client_js` property that points to the entry file:
```js
new Webpage({
    content: MyCtrl,
    client_js: './client/main.js'
});
```

**Option B**: The server infers the bundle path from the content control, as it does today.

**Option C**: Both — `client_js` is optional, and if provided, overrides the server's inference.

**The tension**: If the Webpage knows its client-side JS path, it becomes more self-contained (good for static site generation, good for admin display). But if it doesn't, the server retains full control over bundling (simpler, less to coordinate).

---

## 2. Static vs. dynamic pages — who decides?

A static page serves the same HTML to every request. A dynamic page generates HTML per-request (SSR). Today, all pages are effectively static — bundled once, served forever.

**Option A**: Page declares its render mode:
```js
new Webpage({ path: '/profile', content: Profile, render_mode: 'dynamic' });
```

**Option B**: Server decides based on the content type (function = dynamic, instance = static).

**Option C**: Server decides, but page can opt in:
```js
new Webpage({ path: '/profile', content: Profile, dynamic: true });
```

**The tension**: Render mode has huge server implications (static pre-render vs. per-request handler). Should the page author decide this, or should the server operator? A page author might not understand the performance implications.

---

## 3. Can these modules be used without jsgui3-server?

Potential non-server use cases:
- **Static site generator** — iterate pages, render each to an HTML file
- **Sitemap generator** — iterate pages, output XML
- **Documentation tool** — display the website structure
- **Testing** — assert that a website has the right pages/endpoints

If the answer is "yes, these should work standalone," it pushes toward keeping them dependency-light and not assuming a server context. If the answer is "they're primarily for jsgui3-server," more coupling is acceptable.

**Current position**: Both packages will depend on `jsgui3-html` (for `Evented_Class`), but nothing from `jsgui3-server`. This makes standalone use possible.

---

## 4. Page ordering

Does the order of pages matter?

**Yes**: Navigation menus, sitemaps, breadcrumbs all have a natural order. If pages are in a Map, insertion order is preserved — but is that the intended display order?

**No**: Pages are identified by path, not position. A navigation component would use explicit ordering, not page insertion order.

**Maybe**: An optional `order` or `nav_index` property could let pages opt into ordered display:
```js
new Webpage({ path: '/about', title: 'About', nav_index: 2 });
```

This doesn't need to be decided now, but the data structure choice (Map preserves order; plain objects have less predictable iteration) has implications.

---

## 5. Nested routes

Should a Website support hierarchical page grouping?

```
/docs
/docs/getting-started
/docs/api
/docs/api/server
/docs/api/server/serve
```

**Option A**: Flat list — all pages are siblings. The path hierarchy is implicit in the path strings. Navigation code parses paths to build trees.

**Option B**: Page groups — pages can have child pages:
```js
site.add_page({
    path: '/docs',
    content: DocsIndex,
    children: [
        { path: '/docs/getting-started', content: GettingStarted },
        { path: '/docs/api', content: ApiDocs }
    ]
});
```

**Option C**: Separate concept — a `Route_Group` or `Page_Group` class that wraps related pages.

**The pragmatic answer**: Start flat. If path hierarchy matters, it can be derived from path strings. Adding a formal grouping mechanism before there's a concrete use case for it adds complexity without clear benefit.

---

## 6. Multiple websites on one server

Can a single `jsgui3-server` serve multiple websites?

Today, `server.js` uses `Website_Group` (a Collection) which implies yes. But the implementation is skeletal. If this is a real requirement, it affects how websites declare their `base_path` and how the server routes between them.

```js
Server.serve({
    websites: [
        new Website({ name: 'main', base_path: '/', pages: [...] }),
        new Website({ name: 'admin', base_path: '/admin', pages: [...] })
    ]
});
```

This might be over-engineering. The more common pattern is one server, one website, multiple pages.

---

## 7. Hot reloading and live updates

If a Website raises `'page-added'` events, could the server react to runtime page additions?

```js
const site = new Website({ pages: [...] });
Server.serve(site);

// Later:
site.add_page({ path: '/new', content: NewPage });
// → server automatically adds the route?
```

This would be powerful for development workflows (add a page, see it immediately without restarting). But it requires publisher support for incremental bundling and route registration. The `finalize()` lifecycle model from Chapter 4 explicitly prevents this by design.

**The safe answer**: Don't support it initially. Build for "define site → serve it" as a one-shot workflow. If hot reloading becomes important, `Evented_Class` as the base makes it possible later — the events are there, the server just needs to listen.

---

## 8. Error boundaries

When a page's content control throws during rendering, what happens?

**Option A**: The server catches it and shows an error page (500).  
**Option B**: The Website has an `error_page` property for a custom error control.  
**Option C**: Each page has its own error boundary.

This is entirely a server concern and probably shouldn't be in the Website/Webpage API at all. But it's worth noting because the proposals don't mention it.

---

## 9. The `server` property in Website

The current `Website.js` stores `this.server` from the spec:
```js
this.api = new API({ server: this.server });
```

Should the new Website know about its server?

**No**: The Website is an abstract definition. It shouldn't know *how* it's being served. The server consumes the Website, not the other way around.

**Yes**: Some use cases (publishing, URL generation) require knowing the server's hostname, port, or base URL. The Website could hold this as metadata.

**Compromise**: Don't store a server reference. If the Website needs deployment context, that's provided at serve-time by the server, not stored in the definition.

---

## 10. What to implement first

Given everything discussed in this book, what's the minimum viable Website + Webpage that would be useful?

**Suggested first pass**:

1. `Webpage` extending `Evented_Class` with explicit properties (Chapter 4, Approach B)
2. `Website` using Map-based pages and structured API (Chapter 5, Approach B)
3. Fix the API.js export bug (Chapter 2)
4. Ship as 0.0.9 of both packages
5. Add Website detection to `serve-factory.js` (Chapter 8, minimal approach)
6. Test with an example that creates a Website and serves it

Everything else — normalization layers, publisher refactoring, admin integration, lifecycle finalization — can follow once the basics work.

---

## Note on Chapter 11

Chapter 11 (`11-converged-recommendation.md`) provides an updated synthesis and phased plan that refines this first-pass list into a more explicit baseline contract and delivery sequence.
