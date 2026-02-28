# Chapter 13: jsgui3-webpage Module Specification

This chapter is a complete implementation blueprint for the `jsgui3-webpage` package. An agent should be able to implement the module from this spec alone.

---

## 13.1 Package Identity

| Field | Value |
|-------|-------|
| **npm name** | `jsgui3-webpage` |
| **Current version** | 0.0.8 (skeleton: `Object.assign(this, spec)`) |
| **Target version** | 0.3.0 (full-spec track; see Ch.16 for v0.1 minimal track) |
| **License** | MIT (align with current package + repo conventions) |
| **Repository** | Separate repo (same GitHub org as jsgui3-server) |

---

## 13.2 Dependencies

| Dependency | Type | Rationale |
|-----------|------|-----------|
| `jsgui3-html` | **production** | Provides `Evented_Class` as base class (confirmed by Lab 001: acceptable overhead) |

No other dependencies. Keep this package minimal — it's a data container, not a framework.

### Why depend on jsgui3-html?

`Evented_Class` is needed for `on()`/`raise()` lifecycle events (`finalized`, `content-changed`). Lab 001 confirmed the overhead is acceptable (~100 bytes/instance, <3ms for 10k constructions). The alternative — bundling a standalone event emitter — would duplicate ecosystem functionality.

---

## 13.3 File Layout

```
jsgui3-webpage/
├── Webpage.js          # Main class
├── index.js            # Re-exports Webpage (for require('jsgui3-webpage'))
├── package.json
├── README.md           # Usage documentation
├── LICENSE
└── test/
    └── webpage.test.js # Unit tests
```

### index.js

```js
module.exports = require('./Webpage');
```

This preserves the current `require('jsgui3-webpage')` behavior.

---

## 13.4 Constructor Signature

```js
const page = new Webpage(spec);
```

Where `spec` is an optional plain object:

```js
{
    // ── Routing ──
    path:           String,         // URL path (normalized to leading slash)

    // ── Identity ──
    name:           String,         // Machine-readable identifier
    title:          String | i18n,  // Human-readable page title (translatable)

    // ── Content ──
    ctrl:           Function,       // Control constructor (the UI component)
    content:        Object | Function, // Structured content. If Function and ctrl unset: legacy ctrl alias (deprecated).
    render_mode:    String,         // 'static' | 'dynamic' (optional, server can infer)

    // ── Assets ──
    scripts:        String[],       // Client JS file paths
    stylesheets:    String[],       // CSS file paths

    // ── Metadata ──
    meta:           Object,         // SEO: { description, keywords, og:* }
}
```

### i18n values

Any string field can alternatively be an object keyed by locale:

```js
title: 'About Us'                                    // plain string
title: { en: 'About Us', fr: 'À propos' }           // translatable
```

### Migration compatibility contract (`ctrl` vs `content`)

Canonical model:

1. `ctrl` is the renderer.
2. `content` is structured page data/i18n payload.

Legacy compatibility (for current server ecosystem):

1. If `spec.ctrl` is missing and `spec.content` is a `function`, treat it as renderer input.
2. Normalize internally to `ctrl`, and treat structured `content` as unset.
3. Emit a deprecation warning for legacy `content: Function` shape (remove no earlier than v0.4.x).

---

## 13.5 Property Reference

### Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `path` | `string \| undefined` | `undefined` | URL path, auto-normalized to leading `/` |
| `name` | `string \| undefined` | `undefined` | Machine identifier |
| `title` | `string \| object \| undefined` | `undefined` | Translatable page title |
| `ctrl` | `function \| undefined` | `undefined` | Control constructor for rendering |
| `content` | `object \| undefined` | `undefined` | Named strings / structured data (post-normalization) |
| `render_mode` | `string \| undefined` | `undefined` | `'static'` or `'dynamic'` |
| `scripts` | `string[]` | `[]` | Client-side JS paths |
| `stylesheets` | `string[]` | `[]` | CSS paths |
| `meta` | `object` | `{}` | SEO/OpenGraph metadata |

### Computed Properties (getters)

| Property | Type | Description |
|----------|------|-------------|
| `has_ctrl` | `boolean` | `true` if `ctrl` is set |
| `has_content` | `boolean` | `true` if `content` is set and non-empty |
| `is_dynamic` | `boolean` | `true` if `ctrl` is a function |
| `finalized` | `boolean` | `true` after `finalize()` called |
| `locales` | `string[]` | Unique locale keys found across title + content |

### Private Properties

| Property | Type | Description |
|----------|------|-------------|
| `_finalized` | `boolean` | Internal finalization flag |

---

## 13.6 Method Reference

### `finalize() → this`

Mark the page as ready for publication. Performs strict validation:

**Throws** if:
- `path` is not set
- `ctrl` is not set (page needs a renderer, after legacy alias normalization)
- `render_mode` is set but not `'static'` or `'dynamic'`

**Does not throw** if:
- `content` is missing (some pages are purely interactive)
- `title` is missing (some pages don't need titles)
- Already finalized (idempotent)

**Raises** `'finalized'` event after validation passes.

---

### `get_string(key, locale?) → string | undefined`

Resolve a content string by dotted path, with optional locale:

```js
page.get_string('hero.heading', 'fr');
```

**Resolution order:**
1. Walk `content` using dotted key path
2. If value is a string → return it
3. If value is an i18n object → resolve locale with fallback chain
4. If value is not found → return `undefined`

**Locale fallback:**
```
exact match → language-only → first available
'en-GB'     → 'en'         → Object.keys(value)[0]
```

---

### `get_title(locale?) → string | undefined`

Resolve the page title with locale fallback. Same resolution logic as `get_string` but operates on `this.title` directly.

---

### `resolve_content(locale?) → object`

Return a copy of `content` with all i18n values resolved to the requested locale:

```js
page.resolve_content('fr');
// → { heading: 'À propos', body: 'Nous construisons...' }
```

Controls receive this resolved object — they never see locale keys.

---

### `toJSON() → object`

Return an admin-friendly summary:

```js
{
    path: '/about',
    name: 'about',
    title: { en: 'About Us', fr: 'À propos' },
    has_ctrl: true,
    has_content: true,
    content_keys: ['heading', 'body', 'cta'],
    locales: ['en', 'fr'],
    is_dynamic: true,
    finalized: false,
    render_mode: undefined,
    meta: {}
}
```

Note: full content values are **not** included in `toJSON()` — only keys and locale summary. Access `page.content` directly for full data.

---

## 13.7 Type Marker

For cross-install detection (see Lab 003):

```js
get [Symbol.for('jsgui3.webpage')]() { return true; }
```

Detection function (exported as a utility):

```js
function isWebpage(obj) {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj[Symbol.for('jsgui3.webpage')] === true) return true;
    return typeof obj.path === 'string'
        && typeof obj.finalize === 'function'
        && typeof obj.toJSON === 'function';
}
```

---

## 13.8 Events

| Event | Payload | When |
|-------|---------|------|
| `'finalized'` | `undefined` | After `finalize()` completes |

Future events (not for v0.3.0):
- `'content-changed'` — when content is set or updated
- `'path-changed'` — when path is modified

---

## 13.9 Validation Rules

### Stage 1: Construction time

| Condition | Behavior |
|-----------|----------|
| `path` is set and not a string | **throw** `TypeError` |
| `path` is `null` or `undefined` | allowed (set later) |
| `ctrl` is set and not a function/object | **throw** `TypeError` |
| `content` is a function and `ctrl` is unset | accepted as legacy alias; normalized to `ctrl` |
| `content` is set and is neither object nor function | **throw** `TypeError` |
| Everything else | allowed — the page is a work-in-progress |

### Stage 2: `finalize()`

| Condition | Behavior |
|-----------|----------|
| `path` is not set | **throw** Error |
| `ctrl` is not set | **throw** Error |
| `render_mode` is set but invalid | **throw** Error |
| `content` is not set | allowed |
| Already finalized | no-op (return `this`) |

---

## 13.10 Path Normalization

Applied at construction time if `path` is a string:

```js
this.path = spec.path.startsWith('/') ? spec.path : '/' + spec.path;
```

No further normalization (no trailing slash stripping, no query string parsing). The path is an opaque route key.

---

## 13.11 Backward Compatibility

The current package (v0.0.8) has the contract:

```js
class Webpage {
    constructor(spec) { Object.assign(this, spec); }
}
```

The full-spec version (v0.3.0) changes:

| Aspect | v0.0.8 | v0.3.0 |
|--------|--------|--------|
| Base class | None | `Evented_Class` |
| Properties | `Object.assign` (anything) | Explicit known fields + extras |
| Methods | None | `finalize()`, `get_string()`, `toJSON()`, etc. |
| Validation | None | Two-stage |

**Breaking changes:**
1. Properties not in the known list are no longer auto-assigned. Use `meta` for arbitrary extras.
2. The instance is now an `Evented_Class`, so `instanceof Evented_Class` will be `true`.

**Compatibility bridge included:**
1. Legacy `content: Function` input is still accepted as renderer alias during migration.

**Migration path:** Code that only reads properties set in the constructor (`page.path`, `page.title`) will continue to work. Code that relies on arbitrary spec properties being copied needs updating.

---

## 13.12 Usage Examples

### Minimal page

```js
const Webpage = require('jsgui3-webpage');
const page = new Webpage({ path: '/', ctrl: HomeCtrl });
```

### Page with content

```js
const page = new Webpage({
    path: '/about',
    title: 'About Us',
    ctrl: AboutCtrl,
    content: {
        heading: 'About Our Company',
        body: 'We build tools for developers.',
        team_size: '50+'
    }
});
```

### Multi-language page

```js
const page = new Webpage({
    path: '/about',
    title: { en: 'About Us', fr: 'À propos', de: 'Über uns' },
    ctrl: AboutCtrl,
    content: {
        heading: { en: 'About Our Company', fr: 'À propos de notre entreprise' },
        body: { en: 'We build tools...', fr: 'Nous construisons...' }
    }
});

page.get_title('fr');                    // → 'À propos'
page.get_string('heading', 'fr');        // → 'À propos de notre entreprise'
page.resolve_content('fr');              // → { heading: '...', body: '...' }
```

### Incremental composition

```js
const page = new Webpage({});
page.path = '/pricing';
page.ctrl = PricingCtrl;
page.content = await loadContent('pricing');
page.finalize(); // validates everything is set
```

---

## 13.13 Test Plan

The following test areas should be covered:

1. **Construction**: empty spec, partial spec, full spec, bad types throw
2. **Path normalization**: leading slash added, root path, already-normalized
3. **Content access**: `get_string` with dotted paths, plain strings, i18n objects
4. **Locale resolution**: exact match, language fallback, first-available fallback
5. **`resolve_content`**: resolves nested i18n, preserves plain strings
6. **`get_title`**: plain string, i18n object, undefined
7. **Computed properties**: `has_ctrl`, `has_content`, `is_dynamic`, `locales`
8. **`finalize()`**: validates path+ctrl, rejects bad render_mode, idempotent
9. **Events**: `'finalized'` event fires
10. **`toJSON()`**: correct shape, content_keys, locales, no raw content values
11. **Type marker**: `Symbol.for('jsgui3.webpage')` is `true`
12. **Backward compatibility**: setting common properties works as before

---

*Next: [Chapter 14](14-website-module-spec.md) defines the `jsgui3-website` module specification.*
