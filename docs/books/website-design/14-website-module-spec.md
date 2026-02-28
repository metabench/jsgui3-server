# Chapter 14: jsgui3-website Module Specification

This chapter is a complete implementation blueprint for the `jsgui3-website` package. An agent should be able to implement the module from this spec alone.

---

## 14.1 Package Identity

| Field | Value |
|-------|-------|
| **npm name** | `jsgui3-website` |
| **Current version** | 0.0.8 (skeleton: `Object.assign(this, spec)`) |
| **Target version** | 0.3.0 (full-spec track; see Ch.16 for v0.1 minimal track) |
| **License** | MIT (align with current package + repo conventions) |
| **Repository** | Separate repo (same GitHub org as jsgui3-server) |

---

## 14.2 Dependencies

| Dependency | Type | Rationale |
|-----------|------|-----------|
| `jsgui3-html` | **production** | Provides `Evented_Class` base class |
| `jsgui3-webpage` | **production** | For creating and type-checking Webpage instances |

### Why depend on jsgui3-webpage?

`add_page()` accepts both Webpage instances and plain specs. When given a plain spec, Website creates a Webpage internally. This ensures every page in the collection has the full Webpage API (content, i18n, finalize, etc.).

---

## 14.3 File Layout

```
jsgui3-website/
├── Website.js          # Main class
├── index.js            # Re-exports Website
├── package.json
├── README.md           # Usage documentation
├── LICENSE
└── test/
    └── website.test.js # Unit tests
```

### index.js

```js
module.exports = require('./Website');
```

---

## 14.4 Constructor Signature

```js
const site = new Website(spec);
```

Where `spec` is an optional plain object:

```js
{
    // ── Identity ──
    name:           String,         // Site name (e.g., 'My App')
    description:    String | i18n,  // Site description (translatable)

    // ── Configuration ──
    base_path:      String,         // Prefix for all routes (default: undefined → server decides)
    default_locale: String,         // Default locale for content resolution (e.g., 'en')

    // ── Collections (can also be added via methods) ──
    pages:          Array | Object, // Initial pages (see §14.6)
    api:            Object,         // Initial API endpoints (see §14.8)

    // ── Metadata ──
    meta:           Object,         // Site-wide metadata
    assets:         Object,         // Shared assets configuration
}
```

### Constructor behavior

1. Store known properties with defaults
2. Initialize `_pages` as empty `Map`
3. Initialize `_api` as empty `Map`
4. If `spec.pages` provided, call `add_page()` for each
5. If `spec.api` provided, call `add_endpoint()` for each
6. Normalize page renderer compatibility through `Webpage` rules (`ctrl` canonical, legacy `content: Function` accepted)
7. No validation at construction time (permissive, per Ch.11)

---

## 14.5 Property Reference

### Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string \| undefined` | `undefined` | Site name |
| `description` | `string \| object \| undefined` | `undefined` | Translatable site description |
| `base_path` | `string \| undefined` | `undefined` | URL prefix for all page paths |
| `default_locale` | `string \| undefined` | `undefined` | Default locale for content resolution |
| `meta` | `object` | `{}` | Site-wide metadata |
| `assets` | `object` | `{}` | Shared assets config |

### Computed Properties (getters)

| Property | Type | Description |
|----------|------|-------------|
| `pages` | `Webpage[]` | Array of all pages (from Map values, insertion-order) |
| `routes` | `string[]` | Array of all page paths |
| `page_count` | `number` | Number of registered pages |
| `api_endpoints` | `object[]` | Array of all API endpoint descriptors |
| `locales` | `string[]` | Union of all locales across all pages |
| `finalized` | `boolean` | `true` after `finalize()` |

### Private Properties

| Property | Type | Description |
|----------|------|-------------|
| `_pages` | `Map<string, Webpage>` | Page registry keyed by path |
| `_api` | `Map<string, object>` | API endpoint registry keyed by name |
| `_finalized` | `boolean` | Internal finalization flag |

---

## 14.6 Page Registry Methods

### `add_page(page_or_spec) → Webpage`

Add a page to the site.

**Accepts:**
- `Webpage` instance → stored directly
- Plain object → wrapped in `new Webpage(spec)`

**Throws** `Error` if a page with the same path already exists (duplicate detection via Map, confirmed by Lab 002).

**Raises** `'page-added'` event with the Webpage as payload.

```js
// From Webpage instance
site.add_page(new Webpage({ path: '/', ctrl: HomeCtrl }));

// From plain spec
site.add_page({ path: '/about', title: 'About', ctrl: AboutCtrl });
```

---

### `get_page(path) → Webpage | undefined`

Look up a page by path. O(1) via Map.

---

### `has_page(path) → boolean`

Check if a page exists at the given path. O(1).

---

### `remove_page(path) → boolean`

Remove a page by path. Returns `true` if page existed, `false` otherwise.

**Raises** `'page-removed'` event with the removed Webpage if it existed.

---

### `replace_page(page_or_spec) → Webpage`

Replace an existing page at the same path. Equivalent to `remove_page(path)` + `add_page(spec)`.

**Throws** if the new spec has no path.

---

### Iteration

```js
for (const page of site) {
    console.log(page.path);
}
```

Website implements `[Symbol.iterator]()` that yields pages in insertion order (delegating to Map values).

---

## 14.7 Page Constructor Specification

When `add_page()` receives a plain spec, it calls `_create_page(spec)`:

```js
_create_page(spec) {
    return new Webpage(spec);
}
```

This is a protected method that subclasses can override to use a custom Webpage subclass:

```js
class MyWebsite extends Website {
    _create_page(spec) {
        return new MyCustomWebpage(spec);
    }
}
```

Compatibility expectation:

1. Website treats `Webpage.ctrl` as canonical renderer.
2. Website accepts legacy page specs where renderer is supplied as `content: Function` (delegated to Webpage normalization).

---

## 14.8 API Registry Methods

### `add_endpoint(name, handler, meta?) → this`

Register an API endpoint.

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Endpoint identifier |
| `handler` | `function` | Request handler |
| `meta` | `object` | Optional: `{ method, path, description }` |

**Defaults:**
- `method` → `'GET'`
- `path` → `/api/${name}`

```js
site.add_endpoint('get-users', async (req) => {
    return await db.users.list();
}, { method: 'GET', path: '/api/users' });
```

**Throws** `Error` if an endpoint with the same name already exists.

---

### `get_endpoint(name) → object | undefined`

Look up an endpoint by name. Returns `{ name, handler, method, path, description }`.

---

### `has_endpoint(name) → boolean`

Check if an endpoint exists.

---

### `remove_endpoint(name) → boolean`

Remove an endpoint by name.

---

## 14.9 Site-Wide Content

### `default_locale`

When pages don't specify a locale, the site's default is used:

```js
const site = new Website({ name: 'My App', default_locale: 'en' });
```

This is passed through to `page.resolve_content(locale)` when the server doesn't have a request-specific locale.

### Site-level strings

Sites can have name and description as translatable values:

```js
const site = new Website({
    name: 'My App',
    description: { en: 'A great app', fr: 'Une super app' }
});
```

---

## 14.10 Finalize Cascade

### `finalize() → this`

Validates the entire site and cascades to all pages:

1. Check that at least one page exists
2. Call `page.finalize()` for each page
3. Collect all errors (don't stop at first)
4. If any errors, throw a single Error with all failures listed
5. Raise `'finalized'` event

```js
try {
    site.finalize();
} catch (e) {
    // e.message includes all page-level errors:
    // "Website finalization failed:
    //   - /about: ctrl is required
    //   - /blog: path is required"
}
```

**Idempotent**: calling `finalize()` on an already-finalized site is a no-op.

---

## 14.11 Serialization

### `toJSON() → object`

```js
{
    name: 'My App',
    base_path: undefined,
    default_locale: 'en',
    page_count: 3,
    routes: ['/', '/about', '/blog'],
    pages: [
        { path: '/', name: 'home', has_ctrl: true, locales: ['en', 'fr'] },
        { path: '/about', name: 'about', has_ctrl: true, locales: ['en'] },
        { path: '/blog', name: 'blog', has_ctrl: true, locales: ['en', 'fr', 'de'] }
    ],
    api: [
        { name: 'get-users', method: 'GET', path: '/api/users' }
    ],
    locales: ['en', 'fr', 'de'],
    finalized: false,
    meta: {}
}
```

Each page entry uses the page's `toJSON()`. The aggregate `locales` field shows the union across all pages.

---

## 14.12 Type Marker

```js
get [Symbol.for('jsgui3.website')]() { return true; }
```

Detection function:

```js
function isWebsite(obj) {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj[Symbol.for('jsgui3.website')] === true) return true;
    return typeof obj.add_page === 'function'
        && typeof obj.get_page === 'function'
        && typeof obj.toJSON === 'function';
}
```

---

## 14.13 Events

| Event | Payload | When |
|-------|---------|------|
| `'page-added'` | `Webpage` | After `add_page()` |
| `'page-removed'` | `Webpage` | After `remove_page()` |
| `'finalized'` | `undefined` | After `finalize()` cascade completes |

---

## 14.14 Validation Rules

### Construction time

No validation — the constructor is permissive. This allows incremental composition.

### `finalize()` time

| Condition | Behavior |
|-----------|----------|
| No pages | **throw** Error |
| Any page fails `finalize()` | collect error, **throw** aggregate |
| Duplicate paths | impossible (Map rejects at `add_page` time) |

---

## 14.15 Constructor Shorthand Formats

The constructor accepts pages in multiple formats:

### Array of specs

```js
new Website({
    pages: [
        { path: '/', ctrl: HomeCtrl },
        { path: '/about', ctrl: AboutCtrl }
    ]
});
```

### Object keyed by path

```js
new Website({
    pages: {
        '/': { ctrl: HomeCtrl, title: 'Home' },
        '/about': { ctrl: AboutCtrl, title: 'About' }
    }
});
```

### Object with function values (shorthand)

```js
new Website({
    pages: {
        '/': HomeCtrl,
        '/about': AboutCtrl
    }
});
```

The constructor normalizes all three to `add_page()` calls. When pages is an object with function values, each key becomes the path and each value becomes the `ctrl`.

### API shorthand

```js
new Website({
    api: {
        'get-users': () => db.users.list(),
        'get-posts': { handler: () => db.posts.list(), method: 'GET', path: '/api/posts' }
    }
});
```

Function values become the handler with method defaulting to `GET`.

---

## 14.16 Backward Compatibility

Same considerations as Webpage (Chapter 13 §13.11):

| Aspect | v0.0.8 | v0.3.0 |
|--------|--------|--------|
| Base class | None | `Evented_Class` |
| Properties | `Object.assign` | Explicit + Map registries |
| Methods | None | Full page/API registry |
| Validation | None | Two-stage |

**Breaking**: arbitrary spec properties no longer auto-assigned. Use `meta` for extras.

---

## 14.17 Usage Examples

### Simple multi-page site

```js
const Website = require('jsgui3-website');

const site = new Website({
    name: 'My Portfolio',
    pages: {
        '/': HomeCtrl,
        '/projects': ProjectsCtrl,
        '/contact': ContactCtrl
    }
});
```

### Rich site with content and API

```js
const site = new Website({
    name: 'My App',
    default_locale: 'en',
    pages: [
        {
            path: '/',
            title: { en: 'Home', fr: 'Accueil' },
            ctrl: HomeCtrl,
            content: {
                hero: { en: 'Build Faster', fr: 'Construisez plus vite' }
            }
        },
        {
            path: '/about',
            title: { en: 'About', fr: 'À propos' },
            ctrl: AboutCtrl,
            content: require('./content/about.json')
        }
    ],
    api: {
        'get-info': () => ({ version: '1.0' })
    }
});

site.finalize(); // validates everything
```

### Incremental site building

```js
const site = new Website({ name: 'My App' });

// Add pages over time
site.add_page({ path: '/', ctrl: HomeCtrl });
site.add_page({ path: '/about', ctrl: AboutCtrl });

// Add API
site.add_endpoint('health', () => ({ status: 'ok' }));

// Finalize when ready
site.finalize();
```

---

## 14.18 Test Plan

1. **Construction**: empty, with pages array, with pages object, with shorthand functions
2. **add_page**: from spec, from Webpage instance, duplicate detection throws
3. **get_page / has_page**: found, not found, O(1) performance
4. **remove_page**: exists, doesn't exist, event fires
5. **replace_page**: replaces correctly, size stays same
6. **Iteration**: `for...of` yields insertion order
7. **API**: add_endpoint, get_endpoint, has_endpoint, remove_endpoint
8. **finalize()**: cascades to pages, collects errors, idempotent
9. **toJSON()**: correct shape, includes page summaries and API
10. **Type marker**: `Symbol.for('jsgui3.website')` is `true`
11. **Computed**: `routes`, `page_count`, `locales`, `api_endpoints`
12. **Events**: `page-added`, `page-removed`, `finalized`
13. **Backward compatibility**: common property access patterns still work

---

*Next: [Chapter 15](15-multi-repo-plan.md) covers the multi-repo implementation coordination plan.*
