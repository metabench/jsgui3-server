# Chapter 5: Designing the Website

A `Website` is a collection of webpages plus site-wide configuration. It represents a complete website in the abstract — pages, API endpoints, assets, and metadata — without knowing how to serve any of it.

---

## What should a Website know?

### Core properties

| Property | Type | Purpose |
|----------|------|---------|
| `name` | `string` | Human-readable site name |
| `pages` | varies (see Ch. 6) | The pages in this website |
| `api` | varies (see Ch. 7) | API endpoint definitions |
| `meta` | `object` | Site-wide metadata (base title, description, favicon, etc.) |
| `assets` | `object` | Static asset directory mappings |

### Extended properties

| Property | Type | Purpose |
|----------|------|---------|
| `base_path` | `string` | URL prefix for all routes (e.g. `/myapp`) |
| `middleware` | `function[]` | Request middleware specific to this site |

### The `base_path` question

Should a Website know its own base path? Two perspectives:

**Yes**: A website deployed at `/myapp` needs pages at `/myapp/`, `/myapp/about`, etc. If the Website doesn't know this, the server has to rewrite all paths. The Website is a self-contained description — it should include its mount point.

**No**: The base path is a deployment concern, not a definition concern. The same Website might be at `/` in production and `/staging/v2` in testing. The server should prefix paths at serve-time.

Both are valid. A pragmatic approach: accept `base_path` in the spec but default it to `undefined`, letting the server decide if not specified.

---

## Approach A: Simple — Array Pages + Object API

The most straightforward design. Uses a plain array for pages and a plain object for API endpoints.

```js
const { Evented_Class } = require('jsgui3-html');
const Webpage = require('jsgui3-webpage');

class Website extends Evented_Class {
    constructor(spec = {}) {
        super();

        this.name = spec.name || undefined;
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};
        this.base_path = spec.base_path || undefined;

        // Pages as a simple array
        this.pages = [];

        // API as a simple object
        this.api = {};

        // Initialize from spec
        if (spec.pages) {
            if (Array.isArray(spec.pages)) {
                spec.pages.forEach(p => this.add_page(p));
            } else if (typeof spec.pages === 'object') {
                for (const [path, cfg] of Object.entries(spec.pages)) {
                    this.add_page({ path, ...cfg });
                }
            }
        }

        if (spec.api && typeof spec.api === 'object') {
            Object.assign(this.api, spec.api);
        }
    }

    add_page(page_or_spec) {
        const page = page_or_spec instanceof Webpage
            ? page_or_spec
            : new Webpage(page_or_spec);
        this.pages.push(page);
        this.raise('page-added', page);
        return this;
    }

    get_page(path) {
        return this.pages.find(p => p.path === path);
    }

    get page_count() {
        return this.pages.length;
    }

    toJSON() {
        return {
            name: this.name,
            page_count: this.page_count,
            pages: this.pages.map(p => p.toJSON ? p.toJSON() : { path: p.path }),
            api_endpoints: Object.keys(this.api),
            meta: this.meta
        };
    }
}

module.exports = Website;
```

### Discussion

**What's good:**
- Immediately readable — no unfamiliar data structures
- `add_page()` accepts both Webpage instances and plain specs — flexible
- Object-map format (`{ '/': {...}, '/about': {...} }`) mirrors `serve-factory.js`'s existing `pages` option
- `'page-added'` event is trivial to add since we extend `Evented_Class`
- `toJSON()` enables admin introspection

**What's limiting:**
- Array pages — O(n) lookup by path. Fine for 5–20 pages, potentially slow for content-heavy sites
- No duplicate-path detection — you can add two pages at `/about` and only discover the collision at serve time
- API is a plain object — no metadata per endpoint (method, description, auth)
- `api` mixes handler functions with potential metadata, making iteration awkward

**Best for:** Small to medium sites where simplicity matters more than rigour.

---

## Approach B: Map-Based Pages + Structured API

Uses `Map` for O(1) page lookup and a structured API registry.

```js
const { Evented_Class } = require('jsgui3-html');
const Webpage = require('jsgui3-webpage');

class Website extends Evented_Class {
    constructor(spec = {}) {
        super();

        this.name = spec.name || undefined;
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};
        this.base_path = spec.base_path || undefined;

        // Pages stored by path for O(1) lookup
        this._pages = new Map();

        // API endpoints stored by name
        this._api = new Map();

        // Initialize from spec
        if (spec.pages) {
            if (Array.isArray(spec.pages)) {
                spec.pages.forEach(p => this.add_page(p));
            } else if (typeof spec.pages === 'object') {
                for (const [path, cfg] of Object.entries(spec.pages)) {
                    this.add_page({ path, ...cfg });
                }
            }
        }

        if (spec.api && typeof spec.api === 'object') {
            for (const [name, handler] of Object.entries(spec.api)) {
                this.add_endpoint(name, handler);
            }
        }
    }

    // ── Pages ──

    add_page(page_or_spec) {
        const page = page_or_spec instanceof Webpage
            ? page_or_spec
            : new Webpage(page_or_spec);

        if (page.path && this._pages.has(page.path)) {
            throw new Error(`Duplicate page path: "${page.path}"`);
        }

        this._pages.set(page.path, page);
        this.raise('page-added', page);
        return this;
    }

    get_page(path) {
        return this._pages.get(path);
    }

    has_page(path) {
        return this._pages.has(path);
    }

    remove_page(path) {
        const page = this._pages.get(path);
        if (page) {
            this._pages.delete(path);
            this.raise('page-removed', page);
        }
        return this;
    }

    get pages() {
        return [...this._pages.values()];
    }

    get routes() {
        return [...this._pages.keys()];
    }

    get page_count() {
        return this._pages.size;
    }

    // ── API ──

    add_endpoint(name, handler, options = {}) {
        this._api.set(name, { handler, ...options });
        return this;
    }

    get_endpoint(name) {
        return this._api.get(name);
    }

    get api_endpoints() {
        return [...this._api.entries()].map(([name, cfg]) => ({
            name,
            method: cfg.method || 'GET',
            handler: cfg.handler,
            description: cfg.description
        }));
    }

    get page_count() {
        return this._pages.size;
    }

    // ── Serialization ──

    toJSON() {
        return {
            name: this.name,
            base_path: this.base_path,
            page_count: this.page_count,
            routes: this.routes,
            pages: this.pages.map(p => p.toJSON ? p.toJSON() : { path: p.path }),
            api_endpoints: this.api_endpoints.map(e => ({
                name: e.name, method: e.method, description: e.description
            })),
            meta: this.meta
        };
    }
}

module.exports = Website;
```

### Discussion

**What's good:**
- **Map-based pages** — O(1) lookup, insert-order preserved, duplicate detection
- **Structured API** — endpoints have metadata (method, description), not just bare functions
- **Event support** — `'page-added'` and `'page-removed'` events come naturally
- **Clean method API** — `add_page`, `get_page`, `has_page`, `remove_page`, `pages`, `routes`
- **No internal leakage** — `_pages` is a Map but the public API is clean methods. No `._arr` exposure
- **Admin-friendly** — `toJSON()` gives comprehensive introspection with endpoint descriptions

**What's debatable:**
- `pages` getter returns a new array each call — minor allocation. Could cache, but adds complexity.
- Duplicate detection throws an error — some use cases might want "last wins" override behavior. Could add a `{ replace: true }` option to `add_page()`.
- `_api` as a Map with structured objects is more complex than a plain `{ name: fn }` object. Is the metadata worth it right now?
- `remove_page()` implies runtime mutability. If publishers bundle pages at startup, removing a page after startup wouldn't un-serve it. This could be confusing.

**Best for:** Sites that need reliable path-based lookup, admin introspection, and structured API definitions.

---

## Approach C: Inheritable — Subclass-Friendly Design

Rather than defining everything in the constructor, this design uses overridable methods that subclasses can customize.

```js
const { Evented_Class } = require('jsgui3-html');
const Webpage = require('jsgui3-webpage');

class Website extends Evented_Class {
    constructor(spec = {}) {
        super();

        this.name = spec.name || undefined;
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};
        this.base_path = spec.base_path || undefined;

        this._pages = new Map();
        this._api = new Map();

        // Let subclasses define pages and API
        if (spec.pages) this._init_pages(spec.pages);
        if (spec.api)   this._init_api(spec.api);
    }

    // ── Override points ──

    /** Override to customize page initialization from spec */
    _init_pages(pages_spec) {
        if (Array.isArray(pages_spec)) {
            pages_spec.forEach(p => this.add_page(p));
        } else if (typeof pages_spec === 'object') {
            for (const [path, cfg] of Object.entries(pages_spec)) {
                this.add_page({ path, ...cfg });
            }
        }
    }

    /** Override to customize API initialization from spec */
    _init_api(api_spec) {
        for (const [name, handler] of Object.entries(api_spec)) {
            this.add_endpoint(name, handler);
        }
    }

    /** Override to use a custom Webpage subclass */
    _create_page(spec) {
        return new Webpage(spec);
    }

    // ── Page methods ──

    add_page(page_or_spec) {
        const page = page_or_spec instanceof Webpage
            ? page_or_spec
            : this._create_page(page_or_spec);

        this._pages.set(page.path, page);
        this.raise('page-added', page);
        return this;
    }

    get_page(path)  { return this._pages.get(path); }
    has_page(path)  { return this._pages.has(path); }
    get pages()     { return [...this._pages.values()]; }
    get routes()    { return [...this._pages.keys()]; }
    get page_count(){ return this._pages.size; }

    // ── API methods ──

    add_endpoint(name, handler, options = {}) {
        this._api.set(name, { handler, ...options });
        return this;
    }

    get_endpoint(name)    { return this._api.get(name); }
    get api_endpoints()   {
        return [...this._api.entries()].map(([name, cfg]) => ({
            name, handler: cfg.handler,
            method: cfg.method || 'GET',
            description: cfg.description
        }));
    }

    // ── Serialization ──

    toJSON() {
        return {
            name: this.name,
            base_path: this.base_path,
            page_count: this.page_count,
            routes: this.routes,
            pages: this.pages.map(p => p.toJSON ? p.toJSON() : { path: p.path }),
            api_endpoints: this.api_endpoints.map(({ name, method, description }) =>
                ({ name, method, description })),
            meta: this.meta
        };
    }
}

module.exports = Website;
```

### Discussion

**What's good:**
- **Subclass-friendly** — `_create_page()` lets a specialized website use a specialized webpage. `_init_pages()` lets a subclass change how pages are loaded (e.g. from a database, from a file system scan, from a CMS).
- **Same public API** as Approach B — consumers don't know whether they're dealing with the base class or a subclass
- **Template Method pattern** — well-established OOP pattern for extensible frameworks

**What's debatable:**
- Extra indirection — `_init_pages`, `_create_page` add method calls that plain code doesn't need
- YAGNI risk — do we need subclass-customizable website types right now?
- `_create_page()` creates a coupling: the Website decides what kind of Webpage to use. Some designs would prefer the caller to always create their own Webpage and pass it in.

**Best for:** When you anticipate multiple types of websites (blog, docs site, SPA, etc.) that share the same structure but differ in how pages are created or initialized.

---

## The `spec.pages` Format Question

All three approaches accept pages in multiple formats. This is a design choice worth discussing:

### Format 1: Array of specs

```js
new Website({
    pages: [
        { path: '/', content: Home, title: 'Home' },
        { path: '/about', content: About, title: 'About' }
    ]
});
```

**Pro**: Ordered. Can have pages without paths (maybe?). Familiar array syntax.  
**Con**: Verbose. Path is buried inside each object.

### Format 2: Object map

```js
new Website({
    pages: {
        '/': { content: Home, title: 'Home' },
        '/about': { content: About, title: 'About' }
    }
});
```

**Pro**: Path-centric. Concise. Mirrors `serve-factory.js`'s existing format.  
**Con**: Paths must be unique (can't have duplicate keys). No guaranteed order in older JS engines (though modern engines preserve insertion order for string keys).

### Format 3: Array of Webpage instances

```js
new Website({
    pages: [
        new Webpage({ path: '/', content: Home, title: 'Home' }),
        new Webpage({ path: '/about', content: About, title: 'About' })
    ]
});
```

**Pro**: Full control. Can use Webpage subclasses.  
**Con**: Most verbose. Requires importing Webpage separately.

All three approaches support all three formats — the constructor detects which format was used and normalizes. This is the pragmatic choice: accept what people give you.

---

## Comparison

| Criterion | A (Simple) | B (Map-based) | C (Inheritable) |
|---|:---:|:---:|:---:|
| Lines of code | ~55 | ~90 | ~85 |
| Page lookup speed | O(n) | O(1) | O(1) |
| Duplicate detection | ☆ | ★★★ | ★★ |
| Subclass-friendly | ★ | ★★ | ★★★ |
| Admin introspection | ★★ | ★★★ | ★★★ |
| API metadata | ☆ | ★★★ | ★★★ |
| Ease of understanding | ★★★ | ★★☆ | ★★☆ |
