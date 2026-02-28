# Design Proposals: jsgui3-website & jsgui3-webpage

> **Date**: 2026-02-15  
> **Status**: Proposals for review — no implementation yet  
> **Context**: These two sibling NPM packages are intended to provide abstract definitions of websites and webpages within the jsgui3 ecosystem. They should be useful abstractions but NOT required by `jsgui3-server`.

---

## 1. Current State of the Repos

Both repos are near-empty skeletons. Here is the **exact, complete** code in each.

### 1.1 jsgui3-webpage

**Repository**: `github.com/metabench/jsgui3-webpage`  
**Version**: 0.0.8  
**Files**: 4 source files (+ `.git`, `.gitignore`)

#### `Webpage.js` — The entire module (14 lines)

```js
/*
    Probably does not need to do very much apart from hold info for the moment.
    Could make subclasses do things like generare its specific parts from spec.
*/

class Webpage {
    constructor(spec) {
        Object.assign(this, spec);
    }
}

module.exports = Webpage;
```

#### `package.json`

```json
{
    "name": "jsgui3-webpage",
    "main": "Webpage.js",
    "license": "MIT",
    "comments": [
        "Just depend on jsgui3-html for the moment. This would be a website in the abstract sense.",
        { "jsgui3-html": "^0.0.139" }
    ],
    "dependencies": {},
    "repository": {
        "type": "git",
        "url": "https://github.com/metabench/jsgui3-webpage.git"
    },
    "author": "James Vickers <james@metabench.com>",
    "version": "0.0.8"
}
```

> **Note**: `jsgui3-html` is referenced in `comments` but is NOT in `dependencies`. There are zero runtime dependencies.

#### `README.md`

```
# jsgui3-webpage
A class that represents a webpage.
```

**Summary**: A single class that does `Object.assign(this, spec)`. No dependencies, no methods, no validation.

---

### 1.2 jsgui3-website

**Repository**: `github.com/metabench/jsgui3-website`  
**Version**: 0.0.8  
**Files**: 5 source files (+ `.git`, `.gitignore`)

#### `Website.js` — Main module (16 lines)

```js
/*
    Probably does not need to do very much apart from hold info for the moment.
    Could make subclasses do things like generare its specific parts from spec.
*/
const API = require('./API');

class Website {
    constructor(spec) {
        Object.assign(this, spec);
        this.api = new API({ server: this.server });
    }
}

module.exports = Website;
```

#### `API.js` — API stub (15 lines, contains a bug)

```js
class API {
    constructor(spec) {
        this.server = spec.server;
    }

    publish(name, fn) {
        // Need to access the appropriate resource publisher.
        const {server} = this;
    }
}

MediaSourceHandle.exports = API
```

> **BUG**: Line 15 says `MediaSourceHandle.exports = API` — this is a typo for `module.exports = API` and will crash at runtime.

#### `package.json`

```json
{
    "name": "jsgui3-website",
    "main": "Website.js",
    "license": "MIT",
    "comments": [
        "Just depend on jsgui3-html for the moment. This would be a website in the abstract sense.",
        { "jsgui3-html": "^0.0.139" }
    ],
    "dependencies": {},
    "repository": {
        "type": "git",
        "url": "https://github.com/metabench/jsgui3-website.git"
    },
    "author": "James Vickers <james@metabench.com>",
    "version": "0.0.8"
}
```

> **Note**: Same pattern — `jsgui3-html` mentioned in `comments` but zero actual dependencies.

#### `README.md`

```
# jsgui3-website
A class that represents a website. Also has functionality to deploy the website.
```

**Summary**: Two classes. `Website` does `Object.assign` + creates an `API`. `API` has an empty `publish()` stub and a fatal export bug. No dependencies, no pages collection, no routing.

---

### 1.3 How jsgui3-server Currently Uses These

`jsgui3-server` depends on both packages (`^0.0.8`). Here's how they're currently consumed:

| Server file | What it does |
|---|---|
| `website/website.js` | `module.exports = require('jsgui3-website')` — direct re-export (has dead `Obselete_Style_Website` class) |
| `website/webpage.js` | `module.exports = require('jsgui3-webpage')` — direct re-export (has dead `Obselete_Style_Webpage` class) |
| `server.js:354` | `new Webpage({ content: Ctrl })` — creates webpage from a control constructor |
| `server.js:428` | `new Website(opts_website)` — creates website when no Ctrl is provided |
| `http-website-publisher.js:117` | `spec.website instanceof Website` — type-checks the website |
| `serve-factory.js:33` | `new Webpage({ name, title, content, path })` — creates webpages from serve options |

The Webpage is used as a simple property bag. The Website is used as a placeholder that the publisher wraps.

---

## 2. Design Goals

1. **Useful abstraction** — describe a website/webpage in the abstract, independent of how it's served
2. **Optional** — `jsgui3-server` must continue to work without these modules being required in user code
3. **Ecosystem-consistent** — follow jsgui3 patterns (obext, Collection, etc.) where it makes sense
4. **Inspectable** — admin/tooling can introspect the website structure
5. **Extensible** — subclassable for specific website types

---

## 3. Proposals for jsgui3-webpage

### Proposal A: Minimal — Enhanced Property Bag

Keep the current approach but add explicit property support and documentation.

```js
const jsgui = require('jsgui3-html');

class Webpage {
    constructor(spec = {}) {
        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.path = spec.path || '/';
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.client_js = spec.client_js || undefined;
    }
}

module.exports = Webpage;
```

**Advantages**:
- Dead simple — easy to understand, debug, and extend
- Minimal surface area — less to break
- Consistent with the current usage pattern in `serve-factory.js`
- Easy for the server to duck-type (just check for `.path` and `.content`)
- Extremely small module size

**Disadvantages**:
- No validation — any rubbish can be put in
- No computed properties or helpers
- No change tracking — can't observe mutations
- Properties are all public and mutable — no encapsulation
- Not using any jsgui3-html features despite depending on it

---

### Proposal B: Observable Properties via obext

Use `obext` (already in the ecosystem) for getter/setter properties with potential change observation.

```js
const jsgui = require('jsgui3-html');
const { prop, read_only } = require('obext');

class Webpage {
    constructor(spec = {}) {
        prop(this, 'name', spec.name);
        prop(this, 'title', spec.title);
        prop(this, 'path', spec.path || '/');
        prop(this, 'content', spec.content);
        prop(this, 'meta', spec.meta || {});
        prop(this, 'client_js', spec.client_js);
        prop(this, 'favicon', spec.favicon);
        prop(this, 'scripts', spec.scripts || []);
        prop(this, 'stylesheets', spec.stylesheets || []);
    }

    get has_content() {
        return this.content !== undefined;
    }

    get is_dynamic() {
        return typeof this.content === 'function';
    }

    toJSON() {
        return {
            name: this.name,
            title: this.title,
            path: this.path,
            has_content: this.has_content,
            is_dynamic: this.is_dynamic,
            meta: this.meta
        };
    }
}

module.exports = Webpage;
```

**Advantages**:
- Consistent with how `jsgui3-server` defines properties (uses `obext` extensively)
- Properties are encapsulated via getter/setter — room for future change events
- `toJSON()` makes it inspectable (useful for admin, debugging, serialization)
- Computed properties (`has_content`, `is_dynamic`) are useful for the server/publisher
- Adding `obext` as a dependency is trivial since `jsgui3-html` already depends on it

**Disadvantages**:
- More complex than a plain object
- `obext` dependency (though it's already transitive via `jsgui3-html`)
- Property interception may have slight performance overhead (negligible in practice)
- Might be over-engineering for what is currently a property bag

---

### Proposal C: Evented — Extends jsgui3's Evented_Class

Make Webpage an evented object that can emit change events for reactive systems.

```js
const jsgui = require('jsgui3-html');
const { Evented_Class } = jsgui;

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();
        this._name = spec.name;
        this._title = spec.title;
        this._path = spec.path || '/';
        this._content = spec.content;
        this._meta = spec.meta || {};
        this._client_js = spec.client_js;
    }

    get name() { return this._name; }
    set name(v) {
        const old = this._name;
        this._name = v;
        this.raise('change', { field: 'name', old, value: v });
    }

    get title() { return this._title; }
    set title(v) {
        const old = this._title;
        this._title = v;
        this.raise('change', { field: 'title', old, value: v });
    }

    get path() { return this._path; }
    set path(v) {
        const old = this._path;
        this._path = v;
        this.raise('change', { field: 'path', old, value: v });
    }

    get content() { return this._content; }
    set content(v) {
        const old = this._content;
        this._content = v;
        this.raise('change', { field: 'content', old, value: v });
    }

    get has_content() { return this._content !== undefined; }
    get is_dynamic() { return typeof this._content === 'function'; }

    toJSON() {
        return {
            name: this._name, title: this._title, path: this._path,
            has_content: this.has_content, is_dynamic: this.is_dynamic,
            meta: this._meta
        };
    }
}

module.exports = Webpage;
```

**Advantages**:
- Fully reactive — admin UI or other systems can watch for page changes
- Consistent with other jsgui3 evented objects
- Enables live-reloading workflows (change page content → event fires → server re-bundles)
- `Evented_Class` is battle-tested within the ecosystem

**Disadvantages**:
- Significantly more code and complexity
- Every property setter fires events even when nobody is listening (slight overhead)
- Inheriting from `Evented_Class` couples this to jsgui3's event system
- YAGNI risk — no current use case needs change events on webpages
- Makes the class harder to understand for newcomers
- Boilerplate-heavy getter/setter pattern for every property

---

## 4. Proposals for jsgui3-website

### Proposal A: Minimal — Pages Array + API Object

```js
const jsgui = require('jsgui3-html');
const Webpage = require('jsgui3-webpage');

class Website {
    constructor(spec = {}) {
        this.name = spec.name || undefined;
        this.pages = [];
        this.api = {};
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};

        // Initialize pages from spec
        if (spec.pages) {
            if (Array.isArray(spec.pages)) {
                for (const p of spec.pages) {
                    this.add_page(p);
                }
            } else if (typeof spec.pages === 'object') {
                // { '/': { content: Home }, '/about': { content: About } }
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
        if (page_or_spec instanceof Webpage) {
            this.pages.push(page_or_spec);
        } else {
            this.pages.push(new Webpage(page_or_spec));
        }
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
            pages: this.pages.map(p => p.toJSON ? p.toJSON() : { path: p.path, title: p.title }),
            api_endpoints: Object.keys(this.api),
            meta: this.meta
        };
    }
}

module.exports = Website;
```

**Advantages**:
- Simple and understandable — uses standard JS arrays and objects
- `add_page()` accepts both `Webpage` instances and plain specs (flexible)
- `pages` object format mirrors `serve-factory.js`'s existing `pages` option exactly
- `toJSON()` provides admin/debug introspection
- Minimal code — easy to maintain, review, and extend
- No coupling to jsgui3 Collection internals

**Disadvantages**:
- Plain array — no built-in duplicate-path checking, no ordering semantics
- No event system — can't observe pages being added/removed
- Doesn't use `jsgui.Collection` — inconsistent with rest of ecosystem
- `api` is a plain object — no per-endpoint middleware or metadata

---

### Proposal B: Collection-Based — Ecosystem Consistent

Use `jsgui.Collection` for pages, matching the pattern used throughout `jsgui3-html` and `jsgui3-server`.

```js
const jsgui = require('jsgui3-html');
const { Collection } = jsgui;
const Webpage = require('jsgui3-webpage');

class Website {
    constructor(spec = {}) {
        this.name = spec.name || undefined;
        this.pages = new Collection();
        this.api = {};
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};

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
        return this;
    }

    get_page(path) {
        // Collection uses _arr internally
        return this.pages._arr.find(p => p.path === path);
    }

    get page_count() {
        return this.pages.length();
    }

    toJSON() {
        const page_list = this.pages._arr.map(p =>
            p.toJSON ? p.toJSON() : { path: p.path, title: p.title }
        );
        return {
            name: this.name,
            page_count: this.page_count,
            pages: page_list,
            api_endpoints: Object.keys(this.api),
            meta: this.meta
        };
    }
}

module.exports = Website;
```

**Advantages**:
- Consistent with `jsgui3-server/website/website.js` which already uses `Collection` for pages
- The existing `http-website-publisher.js` iterates `website.pages._arr` — this matches
- Collection provides `each()`, `length()`, etc. — ecosystem-native iteration
- Follows the pattern established in `website-group.js` (`extends Collection`)

**Disadvantages**:
- `Collection` has quirks — `length()` is a method not a property, requires `_arr` for array access
- Heavier dependency chain — Collection pulls in Data_Structures from jsgui3-html
- Less familiar to new developers — `pages._arr` is an internal detail leaking out
- Collection's API is not well-documented and could change

---

### Proposal C: Rich Model — API Class + Validation + Helpers

A more feature-rich approach with a proper API class, validation, and convenience methods.

```js
const jsgui = require('jsgui3-html');
const { Collection } = jsgui;
const Webpage = require('jsgui3-webpage');

class Website_API {
    constructor() {
        this._endpoints = new Map();
    }

    publish(name, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error(`API endpoint "${name}" handler must be a function`);
        }
        this._endpoints.set(name, { handler, ...options });
        return this;
    }

    get(name) {
        return this._endpoints.get(name);
    }

    get endpoints() {
        return [...this._endpoints.entries()].map(([name, cfg]) => ({
            name,
            method: cfg.method || 'GET',
            description: cfg.description
        }));
    }

    [Symbol.iterator]() {
        return this._endpoints[Symbol.iterator]();
    }
}

class Website {
    constructor(spec = {}) {
        this.name = spec.name || undefined;
        this._pages = new Map();  // path → Webpage
        this.api = new Website_API();
        this.meta = spec.meta || {};
        this.assets = spec.assets || {};

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
                if (typeof handler === 'function') {
                    this.api.publish(name, handler);
                }
            }
        }
    }

    add_page(page_or_spec) {
        const page = page_or_spec instanceof Webpage
            ? page_or_spec
            : new Webpage(page_or_spec);
        const path = page.path || '/';
        if (this._pages.has(path)) {
            throw new Error(`Duplicate page path: "${path}"`);
        }
        this._pages.set(path, page);
        return this;
    }

    get_page(path) {
        return this._pages.get(path);
    }

    get pages() {
        return [...this._pages.values()];
    }

    get page_count() {
        return this._pages.size;
    }

    get routes() {
        return [...this._pages.keys()];
    }

    has_page(path) {
        return this._pages.has(path);
    }

    remove_page(path) {
        return this._pages.delete(path);
    }

    toJSON() {
        return {
            name: this.name,
            page_count: this.page_count,
            routes: this.routes,
            pages: this.pages.map(p => p.toJSON ? p.toJSON() : { path: p.path, title: p.title }),
            api: this.api.endpoints,
            meta: this.meta
        };
    }
}

module.exports = Website;
```

**Advantages**:
- `Map`-based pages — O(1) lookup by path, duplicate detection, ordering preserved
- `Website_API` class — structured endpoint registration with optional metadata (`method`, `description`)
- Validation — throws on duplicate paths, validates handler is a function
- Rich query interface — `has_page()`, `remove_page()`, `routes` getter
- `Symbol.iterator` on API — modern JS iteration support
- Admin-friendly — `toJSON()` provides comprehensive introspection
- Ready for documentation generation (API endpoint descriptions)

**Disadvantages**:
- Most complex option — more code to maintain and test
- `Website_API` is a new class that doesn't exist elsewhere in the ecosystem
- `pages` getter returns a new array each call (minor allocation)
- Doesn't use `jsgui.Collection` — inconsistent with existing server code
- Duplicate path validation might be too strict (some apps want to override pages)
- The `remove_page()` method implies mutability that publishers might not handle well

---

## 5. Cross-Cutting Concerns

### 5.1 The API.js Bug

All proposals must fix `MediaSourceHandle.exports = API` → `module.exports = API` in the current `jsgui3-website/API.js`. This is a runtime crash.

### 5.2 Dependency on jsgui3-html

Both modules will depend on `jsgui3-html`. This is a significant dependency (~180 versions, many controls). The question is **how much** of it to use:

| Usage level | What it pulls in | Benefit |
|---|---|---|
| **Light** — just import, type-check controls | `require('jsgui3-html')` available for `instanceof` | Validates content is a proper control |
| **Medium** — use Collection, tof | Collection for pages, tof for type checking | Ecosystem consistency |
| **Heavy** — use Evented_Class, Data_Object | Event system, observable properties | Full reactivity |

### 5.3 Server Integration Strategy

Regardless of Webpage/Website design, the server integration is the same pattern:

```js
// In serve-factory.js — detect and unwrap Website/Webpage
const Website = require('jsgui3-website');
const Webpage = require('jsgui3-webpage');

if (input instanceof Website) {
    // Iterate pages, register each via prepare_webpage_route
    // Register API endpoints via server.publish()
} else if (input instanceof Webpage) {
    // Single page shorthand
    serve_options.ctrl = input.content;
    serve_options.page_route = input.path;
}
```

This is additive — all existing `Server.serve()` call patterns remain unchanged.

### 5.4 Backward Compatibility

The current server code does:
- `new Webpage({ content: Ctrl })` → all proposals support this
- `website.pages._arr` iteration → Proposal B (Collection) supports this natively; others would need adaptation in the publisher
- `spec.website instanceof Website` → all proposals support this (same class)

---

## 6. Recommendation Matrix

| Criterion | Webpage A<br>(Minimal) | Webpage B<br>(obext) | Webpage C<br>(Evented) | Website A<br>(Array) | Website B<br>(Collection) | Website C<br>(Rich) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Simplicity | ★★★ | ★★☆ | ★☆☆ | ★★★ | ★★☆ | ★☆☆ |
| Ecosystem consistency | ★☆☆ | ★★★ | ★★★ | ★☆☆ | ★★★ | ★★☆ |
| Extensibility | ★★☆ | ★★★ | ★★★ | ★★☆ | ★★☆ | ★★★ |
| Admin/tooling support | ★☆☆ | ★★☆ | ★★★ | ★★☆ | ★★☆ | ★★★ |
| Backward compat | ★★★ | ★★★ | ★★☆ | ★★☆ | ★★★ | ★★☆ |
| Code maintainability | ★★★ | ★★☆ | ★☆☆ | ★★★ | ★★☆ | ★★☆ |
| Future-proofing | ★☆☆ | ★★☆ | ★★★ | ★☆☆ | ★★☆ | ★★★ |

---

## 7. Possible Combinations

The Webpage and Website proposals can be mixed. Here are the most coherent pairings:

| Combo | Webpage | Website | Character |
|---|---|---|---|
| **Conservative** | A (Minimal) | A (Array) | Get it working with least code. Easy to review and extend later. |
| **Ecosystem-native** | B (obext) | B (Collection) | Matches existing jsgui3 patterns. Easiest server integration. |
| **Progressive** | B (obext) | C (Rich) | obext properties for pages, rich Map + API class for websites. Balance of simplicity and power. |
| **Full reactive** | C (Evented) | C (Rich) | Maximum capability. Good for admin UI, live workflows. Most code to maintain. |

---

## 8. Open Design Questions

1. **Should Webpage know about client-side JS?** Today `src_path_client_js` is a server/publisher concern. Should it move to the page definition, or stay on the server side?

2. **Dynamic pages**: Should there be explicit support for pages whose content is generated per-request (user dashboards, etc.) vs. static pages that can be pre-bundled?

3. **Non-server use cases**: Could these modules be used by a static site generator or a build tool that pre-renders pages to HTML files on disk?

4. **Page ordering**: In a multi-page website, does page order matter? (For menus, navigation, sitemaps.)

5. **Sub-routes and nesting**: Should a Website support nested route groups? (e.g. `/blog/*` routed to a sub-website or different handler pattern)
