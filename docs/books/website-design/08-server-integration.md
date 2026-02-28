# Chapter 8: Server Integration

This chapter discusses how `jsgui3-server` would consume Website and Webpage objects — without requiring them.

---

## The Constraint

`jsgui3-server` must continue to work in all its current modes:

```js
// Mode 1: Single control
Server.serve(MyCtrl);

// Mode 2: Multi-page options
Server.serve({ pages: { '/': { content: Home } } });

// Mode 3: API-only
Server.serve({ api: { 'get-data': handler } });

// Mode 4: Full options
Server.serve({ Ctrl: MyCtrl, api: {...}, middleware: [...] });
```

Website and Webpage support is **additive** — new input shapes that the server learns to accept alongside the existing ones.

---

## Detection Strategy

### Option A: `instanceof` checks

```js
const Website = require('jsgui3-website');
const Webpage = require('jsgui3-webpage');

if (input instanceof Website) { ... }
if (input instanceof Webpage) { ... }
```

**Pro**: Clean, readable, unambiguous.  
**Con**: Breaks when packages are duplicated (npm link, workspaces, multiple installs). Two copies of `jsgui3-website` will have different class references, so `instanceof` fails even when the object is shape-compatible.

### Option B: Duck typing / capability checks

```js
function is_website(input) {
    return input
        && typeof input.add_page === 'function'
        && typeof input.get_page === 'function'
        && (input._pages instanceof Map || Array.isArray(input.pages));
}

function is_webpage(input) {
    return input
        && input.hasOwnProperty('path')
        && input.hasOwnProperty('content');
}
```

**Pro**: Works across duplicate installs, works with subclasses, works with compatible plain objects.  
**Con**: Could false-positive on objects that happen to have the right properties. More code.

### Option C: Both — `instanceof` first, duck type as fallback

```js
function is_website(input) {
    try {
        const Website = require('jsgui3-website');
        if (input instanceof Website) return true;
    } catch (e) { /* jsgui3-website not installed */ }

    // Fallback: duck typing
    return input && typeof input.add_page === 'function'
        && typeof input.get_page === 'function';
}
```

**Pro**: Best of both. `instanceof` when available (fastest, most reliable), duck typing as a safety net.  
**Con**: Most code. The `try/catch` around `require` is somewhat unusual.

### Option D: Explicit type marker

```js
// In jsgui3-website:
class Website {
    get [Symbol.for('jsgui.type')]() { return 'Website'; }
}

// In jsgui3-server:
function is_website(input) {
    return input && input[Symbol.for('jsgui.type')] === 'Website';
}
```

**Pro**: Works across duplicate installs. No false positives. Clean.  
**Con**: Requires coordination between packages. Symbol-based type markers aren't a common JavaScript pattern.

---

## Integration Points

### Where `serve-factory.js` would change

Today, `Server.serve()` inspects its input to determine the mode:

```js
if (typeof input === 'function') → single control
if (input.Ctrl) → control from options
if (input.pages) → multi-page
if (input.api) → API mode
```

Adding Website/Webpage support means adding branches:

```js
if (is_website(input)) {
    // Extract pages, register each route
    // Extract API endpoints, publish each
    // Apply site-wide metadata
}

if (is_webpage(input)) {
    // Single-page shorthand — extract path and content
}
```

### The Normalization Approach

Rather than adding more `if` branches, an alternative design normalizes all inputs into a common internal format first:

```js
function normalize_serve_input(input) {
    const manifest = {
        pages: [],
        api: [],
        meta: {},
        assets: {}
    };

    if (is_website(input)) {
        manifest.pages = input.pages.map(normalize_page);
        manifest.api = input.api_endpoints || [];
        manifest.meta = input.meta || {};
    } else if (is_webpage(input)) {
        manifest.pages = [normalize_page(input)];
    } else if (typeof input === 'function') {
        manifest.pages = [{ path: '/', content: input }];
    } else if (input.pages) {
        // Existing multi-page format
        for (const [path, cfg] of Object.entries(input.pages)) {
            manifest.pages.push({ path, ...cfg });
        }
    }
    // ... etc

    return manifest;
}
```

All publishers then consume the normalized manifest, not the raw input. This has two benefits:

1. **Single place for input handling** — all format detection and conversion lives in one function
2. **Publishers are simpler** — they don't need to handle multiple input shapes

The OpenAI reviewer's server support document proposed this approach in detail (see Chapter 9).

---

## What Changes in the Server?

### Minimal approach

Add Website/Webpage detection to `serve-factory.js`. When detected, iterate pages and call the existing `prepare_webpage_route()` for each. Register API endpoints using the existing `server.publish()`.

```js
if (is_website(input)) {
    const website = input;
    const page_routes = [];

    for (const page of website.pages) {
        page_routes.push(
            prepare_webpage_route(server, page.path, {
                content: page.content,
                title: page.title,
                name: page.name,
                client_js: page.client_js
            }, defaults)
        );
    }

    if (website.api_endpoints) {
        for (const endpoint of website.api_endpoints) {
            server.publish(endpoint.name, endpoint.handler);
        }
    }

    await Promise.all(page_routes);
}
```

**Pro**: Minimal change to the server. Reuses existing pipeline.  
**Con**: Doesn't surface website-level metadata. No normalization layer — the special-casing stays.

### Full approach

Introduce the normalization layer, refactor publishers to consume manifests, add introspection APIs.

**Pro**: Cleaner architecture, better admin support.  
**Con**: Significant refactoring of working code such as the publisher pipeline.

### Pragmatic recommendation

Start minimal. Get Website/Webpage objects flowing through the existing pipeline. Add normalization and publisher refactoring as a follow-up when the basic integration proves out.

---

## Recommended Contract (Converged)

From the tradeoffs in this chapter and the cross-agent review, a practical contract emerges:

1. **Normalize first** — convert all `Server.serve(...)` input variants into one internal manifest
2. **Publish second** — publishers consume only normalized manifests, never raw user input
3. **Detect by capability** — avoid hard `instanceof` dependence at server boundaries
4. **Keep compatibility** — legacy inputs (`Ctrl`, `pages`, `api`) must map cleanly into the manifest
5. **Expose introspection** — surface manifest/publication summaries for admin tooling

This keeps the integration additive and reduces future complexity in publisher code.

---

## Admin UI Opportunities

The admin UI already introspects the resource pool, router, and publishers. With Website/Webpage objects, it could show:

1. **Website manifest** — name, base path, page count
2. **Page catalog** — path, title, content control name, render mode
3. **API endpoint catalog** — name, method, description
4. **Route table** — which routes are static vs. dynamic, which have bundles

This requires the server to expose `server.website_manifest` or equivalent. The `toJSON()` methods on Website and Webpage make this straightforward.

---

## Integration with the Publisher Pipeline

Today's pipeline:

```
Ctrl → Webpage → HTTP_Webpage_Publisher → bundled output → router
```

With Website support:

```
Website → for each page:
    Webpage → HTTP_Webpage_Publisher → bundled output → router
  for each API endpoint:
    → server.publish() → HTTP_Function_Publisher → router
```

The Website itself doesn't need a publisher — it's a container that the server iterates. Each page gets its own publisher, and each API endpoint gets its own publisher. The Website provides the structure; the server provides the pipeline.

This means `HTTP_Website_Publisher` might become a thin coordinator rather than a monolithic publisher. It would:

1. Accept a Website
2. Create per-page publishers
3. Wait for all publishers to be ready
4. Emit a combined `'ready'` event

This is much simpler than the current 580-line stub with NYI comments.
