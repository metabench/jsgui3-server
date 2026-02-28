# Chapter 3: The Base Class Question

The most foundational design decision for both `Webpage` and `Website` is what they inherit from. This choice shapes everything that follows — how properties work, whether events exist, what ecosystem patterns are available.

---

## Option 1: Plain Class

```js
class Webpage {
    constructor(spec = {}) {
        this.name = spec.name;
        this.title = spec.title;
        this.path = spec.path;
        this.content = spec.content;
    }
}
```

### The case for it

- **Maximum simplicity** — anyone reading it knows exactly what it does
- **Zero dependencies** — doesn't import anything from jsgui3-html
- **Easy to test** — no setup, no teardown, no event system to mock
- **Familiar** — looks like any plain JavaScript class

### The case against it

- **Inconsistent with the ecosystem** — nearly every non-trivial object in jsgui3 extends `Evented_Class`. Controls do. The server does. Resources, publishers, routers — all evented. A plain `Webpage` would be the odd one out.
- **Can't add events later without breaking** — if you later want `Webpage` to emit events (e.g. `'ready'`), changing the base class is a breaking change for any subclasses.
- **No `.on()` / `.raise()` pattern** — these are the fundamental building blocks of jsgui3's event system, widely used for lifecycle coordination.

### When it makes sense

When the object is purely a data structure with no lifecycle, no reactivity, and no expectation that it will ever need events. A config object. A DTO.

---

## Option 2: `obext` Properties

```js
const { prop } = require('obext');

class Webpage {
    constructor(spec = {}) {
        prop(this, 'name', spec.name);
        prop(this, 'title', spec.title);
        prop(this, 'path', spec.path);
        prop(this, 'content', spec.content);
    }
}
```

### The case for it

- **Consistent with jsgui3-server** — `server.js` uses `obext` extensively for its own properties (`disk_path_client_js`, `Ctrl`, `name`)
- **Encapsulation** — properties go through getter/setter, so behavior can be added later without changing the public API
- **Already in the dependency tree** — `jsgui3-html` depends on `obext`, so it's available at zero cost

### The case against it

- **Not a base class decision** — `obext` is a property mechanism, not a class hierarchy choice. You can use `obext` properties *and* extend `Evented_Class`. They're orthogonal.
- **Adds a layer of indirection** — every property access goes through a getter/setter. Usually negligible, but it's hidden complexity.
- **Not widely understood** — `obext` is a jsgui3 ecosystem tool, not a standard JS pattern. New contributors need to learn it.

### When it makes sense

When you want encapsulated properties but don't need (or aren't sure about) full event support. Good for a "grow into it" strategy.

---

## Option 3: Extend `Evented_Class`

```js
const { Evented_Class } = require('jsgui3-html');

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();
        this.name = spec.name;
        this.title = spec.title;
        this.path = spec.path;
        this.content = spec.content;
    }
}
```

### The case for it

- **It's the ecosystem standard** — nearly everything in jsgui3 extends `Evented_Class`. Using it here means `Webpage` and `Website` participate in the same patterns as controls, resources, and the server itself.
- **The capability is free** — extending `Evented_Class` doesn't force you to fire events on every property. You get `.on()` and `.raise()` as available tools. If nobody listens, the cost is a few extra bytes of prototype chain.
- **Future-proof** — once you ship without `Evented_Class`, adding it later is a breaking change. Starting with it costs almost nothing.
- **Real use cases exist** — a Website could raise `'page-added'`, `'ready'`, or `'error'`. A Webpage could raise `'content-changed'` for live reload. The admin UI already watches resources via events.
- **Doesn't require per-property events** — this is a crucial distinction. Extending `Evented_Class` does NOT mean wrapping every property in a change-event-firing setter. You can have simple `this.name = spec.name` assignments and only raise events for meaningful lifecycle moments.

### The case against it

- **Couples to jsgui3-html** — `Evented_Class` comes from `jsgui3-html`. If someone wanted to use `Webpage` without `jsgui3-html`, they couldn't.
- **Perceived complexity** — someone reading the code might think "events? for a webpage?" and assume it's over-engineered, even if no events are actually used.
- **Boilerplate concern** — if you do decide to fire change events on properties, each one needs a manual getter/setter with `this.raise()`.

### When it makes sense

When the object participates in a lifecycle, when other parts of the system might want to observe it, or when you're building within an ecosystem where `Evented_Class` is the norm.

---

## Option 4: Combined — Evented_Class + obext

```js
const { Evented_Class } = require('jsgui3-html');
const { prop } = require('obext');

class Webpage extends Evented_Class {
    constructor(spec = {}) {
        super();
        prop(this, 'name', spec.name);
        prop(this, 'title', spec.title);
        prop(this, 'path', spec.path);
        prop(this, 'content', spec.content);
        prop(this, 'meta', spec.meta || {});
    }
}
```

### The case for it

- **Best of both** — event system for lifecycle, encapsulated properties for cleanliness
- **Matches server.js exactly** — the server itself uses `Evented_Class` as a base and `obext` for properties
- **Maximum future flexibility** — events AND property interception available

### The case against it

- **Most complex option** — two dependency systems in play
- **Is the combination actually needed?** — if nobody is observing property changes on webpages, `obext` adds machinery without a use case

---

## Discussion: Boilerplate vs. Capability

A common concern with `Evented_Class` is the boilerplate needed for per-property change events:

```js
get title() { return this._title; }
set title(v) {
    const old = this._title;
    this._title = v;
    this.raise('change', { field: 'title', old, value: v });
}
```

But this is a **false dilemma**. You don't have to choose between "no events" and "events on every property." The pragmatic approach:

1. **Extend `Evented_Class`** — get the capability for free
2. **Use simple property assignment** — `this.title = spec.title`
3. **Raise events only for meaningful actions** — `this.raise('page-added', page)`, `this.raise('ready')`

This is exactly how the server works. It extends `Evented_Class` and raises `'ready'`, `'listening'`, `'starting'` — not per-property change events.

---

## Comparison Table

| Criterion | Plain | obext | Evented | Combined |
|---|:---:|:---:|:---:|:---:|
| Simplicity | ★★★ | ★★☆ | ★★☆ | ★★☆ |
| Ecosystem consistency | ★☆☆ | ★★☆ | ★★★ | ★★★ |
| Zero jsgui3-html coupling | ★★★ | ★★☆ | ☆☆☆ | ☆☆☆ |
| Future event support | ☆☆☆ | ★☆☆ | ★★★ | ★★★ |
| Property encapsulation | ☆☆☆ | ★★★ | ★☆☆ | ★★★ |
| Matches server.js pattern | ☆☆☆ | ★★☆ | ★★☆ | ★★★ |

---

## The Author's View

Both modules will depend on `jsgui3-html` (this is a stated requirement). Given that, the coupling argument against `Evented_Class` disappears — you're already importing `jsgui3-html`.

In an ecosystem where `Evented_Class` is the norm, not using it requires justification. The justification would need to be "this object will never participate in lifecycle events" — but a Website with pages, API endpoints, and a publishing pipeline absolutely will.

The recommended starting point is **Option 3** (Evented_Class with simple properties), with the option to add `obext` for specific properties if encapsulation needs arise.
