# Chapter 16: Minimal First Implementation

Chapters 12–14 describe the full vision. This chapter defines the **smallest useful version** — what to build first, what to defer, and when to promote deferred features.

---

## 16.1 The Problem with the Full Spec

The full spec across Chapters 12–14 includes ~30 features. Both packages are currently 14 lines each. Jumping from 14 lines to a full Evented_Class-based, i18n-aware, finalize-cascading, event-emitting, Symbol-marked module is a big leap that introduces risk:

- Features built before they have consumers
- Dependencies added before they're justified
- Complexity that makes the first real usage harder to debug

**Principle**: ship the thinnest version that supports real usage, then grow it.

---

## 16.2 v0.1 — Store Data, Nothing More

### Webpage (~15 lines)

```js
class Webpage {
    constructor(spec = {}) {
        const has_legacy_ctrl = typeof spec.content === 'function' && spec.ctrl === undefined;

        this.path = spec.path;
        this.name = spec.name;
        this.title = spec.title;
        this.ctrl = spec.ctrl || (has_legacy_ctrl ? spec.content : undefined);
        this.content = has_legacy_ctrl ? undefined : spec.content;
        this.render_mode = spec.render_mode;
        this.scripts = spec.scripts || [];
        this.stylesheets = spec.stylesheets || [];
        this.meta = spec.meta || {};
    }
}

module.exports = Webpage;
```

### Website (~30 lines)

```js
const Webpage = require('jsgui3-webpage');

class Website {
    constructor(spec = {}) {
        this.name = spec.name;
        this.meta = spec.meta || {};
        this._pages = new Map();

        if (Array.isArray(spec.pages)) {
            for (const p of spec.pages) this.add_page(p);
        }
    }

    add_page(page_or_spec) {
        const page = page_or_spec instanceof Webpage
            ? page_or_spec
            : new Webpage(page_or_spec);
        if (page.path && this._pages.has(page.path)) {
            throw new Error(`Duplicate page path: "${page.path}"`);
        }
        this._pages.set(page.path, page);
        return page;
    }

    get_page(path) { return this._pages.get(path); }
    has_page(path) { return this._pages.has(path); }
    get pages() { return [...this._pages.values()]; }
    get page_count() { return this._pages.size; }
}

module.exports = Website;
```

### What this gets you

- ✅ Webpage holds path, title, content, ctrl, meta, scripts, stylesheets
- ✅ Website stores pages in a Map (O(1) lookup, duplicate detection — Lab 002)
- ✅ `add_page()` / `get_page()` / `has_page()` API
- ✅ Structured content objects are supported
- ✅ Legacy renderer input (`content: Function`) remains accepted as an alias for `ctrl`
- ✅ Zero dependencies (no jsgui3-html needed)
- ✅ ~45 lines total across both packages

### What this doesn't have

- ❌ No `Evented_Class` base (no events)
- ❌ No `finalize()` validation
- ❌ No `toJSON()` serialization
- ❌ No `Symbol.for()` type markers
- ❌ No i18n resolution (`get_string`, `resolve_content`)
- ❌ No API endpoint registry
- ❌ No path normalization

---

## 16.3 Layered Growth Plan

Each layer adds one area of functionality. Only add a layer when there's a real consumer.

### v0.2 — When you need server integration

**Trigger**: `jsgui3-server` needs to detect and route Website/Webpage inputs.

**Add**:
- Path normalization (leading slash)
- `toJSON()` for admin/debug
- API endpoint registry on Website (`add_endpoint`, `get_endpoint`)
- Normalize renderer field (`ctrl` canonical, legacy `content: Function` normalized)
- Duck-typing detection (check for `add_page` / `get_page`)

**Dependencies**: still none. Duck typing doesn't need `Symbol.for()`.

### v0.3 — When you need lifecycle safety

**Trigger**: bugs from serving incomplete pages, or need to gate publication.

**Add**:
- `finalize()` on Webpage (require path + ctrl)
- `finalize()` cascade on Website
- `Evented_Class` base (enables `'finalized'` event)

**Dependencies**: adds `jsgui3-html` (for `Evented_Class`).

### v0.4 — When you need cross-install safety

**Trigger**: npm link / monorepo setups where `instanceof` breaks.

**Add**:
- `Symbol.for('jsgui3.webpage')` / `Symbol.for('jsgui3.website')` markers
- `isWebpage()` / `isWebsite()` utility functions

### v0.5 — When you need i18n

**Trigger**: a real site with multi-language content.

**Add**:
- `get_string(key, locale)` with dotted path resolution
- `get_title(locale)` 
- `resolve_content(locale)` for Controls
- Locale fallback chains
- `locales` computed property

**Dependencies**: no new deps — just methods on Webpage.

---

## 16.4 Decision Matrix

Use this table to decide which version you need:

| You want to... | Minimum version |
|----------------|-----------------|
| Create a Website with pages and serve it | v0.1 |
| Have the server detect Website vs legacy input | v0.2 |
| Define API endpoints on a Website | v0.2 |
| Validate pages before publishing | v0.3 |
| Subscribe to page-added / finalized events | v0.3 |
| Use npm link across packages safely | v0.4 |
| Serve pages in multiple languages | v0.5 |

---

## 16.5 What the Labs Tell Us

The lab experiments tested the full-featured design. They remain valid as specs for future versions:

| Lab | Tests | Relevant from |
|-----|-------|---------------|
| 001 (Base class overhead) | Evented_Class perf | v0.3 onward |
| 002 (Pages storage) | Map vs Array | **v0.1** (already using Map) |
| 003 (Type detection) | Symbol + duck typing | v0.4 |
| 004 (Two-stage validation) | finalize() | v0.3 |
| 005 (Input normalization) | Manifest shape | v0.2 |
| 006 (Server integration) | End-to-end | v0.2 |

---

## 16.6 Recommendation

Start with **v0.1**. Build a real site with it. Discover what's missing through usage, not speculation. The full spec (Ch.12–14) is the *roadmap*, not the *first commit*.

The implementation effort for v0.1 is under an hour. Each subsequent layer is 1–2 hours. The total work is the same as implementing the full spec upfront — but each step is validated by a real need.

---

## 16.7 Version Track Alignment

To keep this chapter consistent with Chapters 13–15:

1. **v0.1.x** is the minimal-first release line described here.
2. **v0.3.x** is the full-spec line from Chapters 13 and 14.
3. Migration between lines keeps compatibility for legacy `content: Function` renderer inputs until server normalization is fully in place.

**Implementation note (Feb 2026)**: Codex implemented the full v0.3 spec directly (see [Ch.17](17-implementation-report-codex.md)), bypassing the minimal-first track. This chapter remains useful as a reference for understanding which features are foundational vs. which are convenience layers — and as a fallback plan if a simpler restart is ever needed.

---

*This chapter complements [Chapter 13](13-webpage-module-spec.md), [Chapter 14](14-website-module-spec.md), and [Chapter 15](15-multi-repo-plan.md), which describe the full target.*
