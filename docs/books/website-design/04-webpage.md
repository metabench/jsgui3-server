# Chapter 4: Designing the Webpage

A `Webpage` represents a single page in the abstract. It holds everything needed to describe what the page *is*, without knowing how to serve it. This chapter explores three approaches with increasing richness.

---

## What properties should a Webpage have?

Before choosing an implementation, we need to agree on what a page knows about itself.

### Essential properties

| Property | Type | Purpose |
|----------|------|---------|
| `name` | `string` | Human-readable identifier |
| `title` | `string` | HTML `<title>` tag content |
| `path` | `string` | URL route (e.g. `/about`) |
| `content` | `Control` or constructor | The page body |
| `meta` | `object` | SEO and social metadata |

### Extended properties

| Property | Type | Purpose |
|----------|------|---------|
| `client_js` | `string` | Path to client-side JS entry point |
| `favicon` | `string` | Page-specific favicon |
| `scripts` | `string[]` | Additional script tags |
| `stylesheets` | `string[]` | Additional stylesheet links |

### Debatable properties

| Property | Type | Discussion |
|----------|------|-----------|
| `render_mode` | `'static'` or `'dynamic'` | See discussion below |
| `cache_policy` | `object` | Cache headers — abstraction or server detail? |
| `route_priority` | `number` | Ordering hint — useful or over-engineering? |

### Should `render_mode` live on the page?

The question: is rendering strategy a page concern or a server concern?

**The case for "server concern"**: The server decides how to bundle and serve. A page author shouldn't need to think about pre-rendering vs. per-request rendering — that's infrastructure. Keeping `render_mode` off the page keeps the page purely descriptive.

**The case for "page concern"**: Some pages *inherently* need dynamic rendering — a user profile that changes per-request can't be pre-rendered. The page author knows this; the server doesn't. Without a `render_mode` hint, the server either guesses (fragile) or forces all pages through the same pipeline (limiting).

**The deciding argument**: Today, `is_dynamic` (Approach B below) infers rendering strategy from the content type — `typeof content === 'function'` means dynamic. But this conflates "content is a class constructor" with "content must be rendered per-request." A control constructor might produce static output that's identical for every visitor. An explicit `render_mode` separates the *how to serve* question from the *what is the content* question.

**Resolution**: `render_mode` belongs on the Webpage as an **optional, recommended** field. It defaults to `undefined` (server decides based on content type, matching current behavior). When explicitly set, it overrides the server's inference. This is additive — existing code that doesn't set `render_mode` works exactly as before.

---

## Approach A: Enhanced Property Bag

The simplest evolution of the current skeleton. Explicitly declare known properties instead of blindly `Object.assign`.

```js
const { Evented_Class } = require('jsgui3-html');

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();

        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.path = spec.path;           // No default — explicit is safer
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.client_js = spec.client_js || undefined;
    }
}

module.exports = Webpage;
```

### Discussion

**What's good about this:**
- Dead simple — 13 lines of actual code
- Every property is visible in the constructor — excellent for discoverability
- Extends `Evented_Class` so lifecycle events are available if needed
- No default `path` — in a multi-page website, defaulting to `'/'` could silently create collisions

**What's missing:**
- No validation — `content` could be a string, a number, anything
- No computed properties — can't ask "does this page have content?"
- No serialization — no `toJSON()` for admin/tooling introspection
- No way to tell if a spec property was explicitly set vs. just absent

**Best for:** Getting started quickly. You can always add methods later without breaking anything because the base class is right.

---

## Approach B: With Computed Properties and Introspection

Adds helpers that make the Webpage useful to servers, admin UIs, and tooling.

```js
const { Evented_Class } = require('jsgui3-html');

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();

        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.path = spec.path;
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.client_js = spec.client_js || undefined;
        this.favicon = spec.favicon || undefined;
        this.scripts = spec.scripts || [];
        this.stylesheets = spec.stylesheets || [];
    }

    /** Does this page have renderable content? */
    get has_content() {
        return this.content !== undefined && this.content !== null;
    }

    /**
     * Is the content a constructor/function (needs instantiation)
     * vs. an existing instance?
     */
    get is_dynamic() {
        return typeof this.content === 'function';
    }

    /** Stable, deterministic serialization for admin/tooling */
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

### Discussion

**What's good about this:**

- `has_content` and `is_dynamic` answer questions that publishers currently figure out themselves — moves that logic to the source of truth
- `toJSON()` gives admin UIs and diagnostic tools a stable contract to rely on — they don't need to understand the class internals
- `scripts` and `stylesheets` arrays let pages declare additional assets beyond what the bundler produces — useful for third-party libraries, analytics scripts, etc.
- Still very readable — the computed properties are clearly getters, not hidden magic

**What's debatable:**

- Should `toJSON()` include `content`? The content is usually a class constructor, which doesn't serialize. Including it could cause confusion. Excluding it means the JSON is a summary, not a full representation.
- Are `scripts` and `stylesheets` page concerns or server concerns? Today the server/publisher decides what goes into the HTML `<head>`. Moving that to the page definition shifts responsibility.
- `is_dynamic` currently means "content is a function" — but the term "dynamic" could also mean "rendered per-request." The naming might be confusing when `render_mode` enters the picture.

**Best for:** A practical middle ground that's immediately useful without over-engineering.

---

## Approach C: With Validation and Lifecycle

Adds input validation and lifecycle semantics.

```js
const { Evented_Class, tof } = require('jsgui3-html');

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();

        // Validate path format
        if (spec.path !== undefined) {
            if (typeof spec.path !== 'string') {
                throw new TypeError(`Webpage path must be a string, got ${tof(spec.path)}`);
            }
            // Normalize: ensure leading slash
            this.path = spec.path.startsWith('/') ? spec.path : '/' + spec.path;
        } else {
            this.path = undefined;
        }

        // Validate content type
        if (spec.content !== undefined) {
            const ct = tof(spec.content);
            if (ct !== 'function' && ct !== 'object') {
                throw new TypeError(
                    `Webpage content must be a Control constructor or instance, got ${ct}`
                );
            }
        }

        this.name = spec.name || undefined;
        this.title = spec.title || undefined;
        this.content = spec.content || undefined;
        this.meta = spec.meta || {};
        this.client_js = spec.client_js || undefined;
        this.favicon = spec.favicon || undefined;
        this.scripts = spec.scripts || [];
        this.stylesheets = spec.stylesheets || [];

        this._finalized = false;
    }

    get has_content() {
        return this.content !== undefined && this.content !== null;
    }

    get is_dynamic() {
        return typeof this.content === 'function';
    }

    /**
     * Mark this webpage as finalized — no further mutations expected.
     * Called by the publisher before bundling. Optional but useful
     * for catching accidental late modifications.
     */
    finalize() {
        if (this._finalized) return this;
        this._finalized = true;
        this.raise('finalized');
        return this;
    }

    get finalized() {
        return this._finalized;
    }

    toJSON() {
        return {
            name: this.name,
            title: this.title,
            path: this.path,
            has_content: this.has_content,
            is_dynamic: this.is_dynamic,
            finalized: this._finalized,
            meta: this.meta
        };
    }
}

module.exports = Webpage;
```

### Discussion

**What's good about this:**

- **Path normalization** — ensures leading slash, catches non-string paths early. Today a missing `'/'` prefix would silently create a broken route.
- **Content validation** — catches `content: 42` or `content: 'whoops'` at construction time instead of deep in the publisher pipeline where the error is confusing.
- **`finalize()` lifecycle** — this was suggested by the OpenAI reviewer as an alternative to full reactivity. The idea: a Webpage is mutable during composition and read-mostly after `finalize()` is called. This gives publishers confidence that the page won't change under them without requiring a full event system for every property.
- Uses `tof()` from jsgui3-html for type checking — ecosystem-consistent.

**What's debatable:**

- Is validation in the constructor too strict? If someone passes `content: null` temporarily and sets it later, the validation could get in the way. Counter-argument: if content is set later, `null` would pass validation (only non-null non-function/object types are rejected).
- `finalize()` is a new concept not used elsewhere in jsgui3. It adds cognitive load. Counter-argument: it's simple enough to ignore — just don't call it.
- Path normalization makes an opinionated choice. What about root-relative vs. absolute paths? What about paths with query strings or fragments?

**Best for:** When you want construction-time safety and a clear lifecycle boundary.

---

## Comparison

| Criterion | A (Property Bag) | B (Computed + toJSON) | C (Validation + Lifecycle) |
|---|:---:|:---:|:---:|
| Lines of code | ~13 | ~40 | ~65 |
| Input validation | ☆ | ☆ | ★★★ |
| Introspection | ☆ | ★★★ | ★★★ |
| Lifecycle support | ☆ | ☆ | ★★ |
| Ease of understanding | ★★★ | ★★★ | ★★☆ |
| Catches bugs early | ☆ | ★ | ★★★ |
| Can evolve into C | ★★★ | ★★★ | — |

Note that all three extend `Evented_Class`, so they all have event capability. The difference is in how much the class *does* with that capability.

---

## Should `Object.assign(this, spec)` stay?

The current code does `Object.assign(this, spec)`, which copies ALL spec properties onto the instance — including unknown/unexpected ones. This is a double-edged sword:

**For**: Maximum flexibility. Users can put anything in spec and it "just works." Good for rapid prototyping and forward compatibility (adding new fields doesn't require class changes).

**Against**: No discoverability. Typos in property names silently create wrong properties. No way to enumerate "known" vs. "extra" properties. Makes the class contract unclear.

**A middle ground**: Explicitly assign known properties, then optionally store extras:

```js
// Known properties
this.name = spec.name;
this.title = spec.title;
// ...

// Store any additional spec properties for extensibility
this.extra = {};
for (const key of Object.keys(spec)) {
    if (!['name', 'title', 'path', 'content', 'meta', 'client_js'].includes(key)) {
        this.extra[key] = spec[key];
    }
}
```

This preserves flexibility while making the primary contract explicit. Whether this is worth the complexity depends on how important forward compatibility is.
