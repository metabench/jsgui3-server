# Chapter 6: Pages Storage

How should a Website store its pages? This is a focused discussion of the data structure choice — separate from the overall Website design because it's a decision that applies regardless of other choices.

---

## The Requirements

A pages collection needs to support:

1. **Add a page** — with duplicate detection (or not)
2. **Get a page by path** — the most common operation
3. **List all pages** — for iteration, admin display, and site maps
4. **Count pages** — for diagnostics and admin UI
5. **Possibly remove a page** — for dynamic site composition
6. **Possibly maintain order** — for navigation menus, sitemaps

---

## Option 1: Plain Array

```js
this.pages = [];

// Add
this.pages.push(page);

// Find
this.pages.find(p => p.path === '/about');

// List
this.pages.forEach(p => console.log(p.path));

// Count
this.pages.length;
```

### Discussion

**Pro**: Everyone knows arrays. No learning curve, no surprises, excellent tooling support, easy to debug in console.

**Con**: O(n) lookup by path. No built-in duplicate detection. If you have 100 pages, `find` scans all of them each time. In practice, few websites have enough pages for this to matter — but it's architecturally sloppy.

**The duplicate problem**: Two `add_page({ path: '/' })` calls silently create two pages at `/`. The server would use the first (or last, depending on implementation) with no warning.

---

## Option 2: JavaScript Map

```js
this._pages = new Map();

// Add (with duplicate check)
if (this._pages.has(path)) throw new Error(`Duplicate: ${path}`);
this._pages.set(page.path, page);

// Find
this._pages.get('/about');

// List
[...this._pages.values()].forEach(p => console.log(p.path));

// Count
this._pages.size;
```

### Discussion

**Pro**: O(1) lookup and duplicate detection. Preserves insertion order (guaranteed in ES2015+). `.has()`, `.get()`, `.set()`, `.delete()` are clean, well-known APIs. `Map` is a standard JavaScript structure — no framework dependency.

**Con**: Iteration requires `[...map.values()]` which allocates a new array. No built-in `.find()` or `.filter()` — you spread to an array first. The `_pages` prefix convention is needed because `pages` as a getter returns the array view.

**The mutation question**: Map supports `.delete()` which implies pages can be removed at runtime. If publishers bundle pages at startup, removing a page after publish wouldn't take effect. This could either be documented as expected behavior, or guarded against with a `finalized` flag.

---

## Option 3: jsgui Collection

```js
const { Collection } = require('jsgui3-html');
this.pages = new Collection();

// Add
this.pages.push(page);

// Find (requires internal access)
this.pages._arr.find(p => p.path === '/about');

// List
this.pages.each(p => console.log(p.path));

// Count
this.pages.length();  // Note: method, not property
```

### Discussion

**Pro**: Ecosystem-consistent. The existing `website-group.js` uses `Collection`. The existing `http-website-publisher.js` iterates `website.pages._arr`. Using Collection means existing server code works without changes.

**Con**: `Collection` has API quirks:
- `.length()` is a method, not a property — easy to confuse with `Array.length`
- Getting the underlying array requires `._arr` — a private implementation detail
- No `.get(key)` — you must iterate to find by property
- The API is mostly undocumented

The OpenAI reviewer specifically called out `_arr` access as "baking internal details into public behavior, increasing fragility."

**Backward compatibility note**: The current `http-website-publisher.js` accesses `website.pages._arr`. If we use a different storage mechanism, that publisher code would need to change. However, that publisher is mostly NYI comments anyway and would need rewriting regardless.

---

## Option 4: Plain Array + Path Index

A hybrid that keeps the simplicity of arrays but adds an index for fast lookup.

```js
this.pages = [];
this._path_index = {};

add_page(page) {
    if (this._path_index[page.path]) {
        throw new Error(`Duplicate path: ${page.path}`);
    }
    this.pages.push(page);
    this._path_index[page.path] = page;
    return this;
}

get_page(path) {
    return this._path_index[path];
}
```

### Discussion

**Pro**: Array for iteration (familiar, no spread needed), object for O(1) lookup. Best of both worlds performance-wise.

**Con**: Two data structures to keep in sync. If someone modifies `this.pages` directly (push, splice), the index gets out of sync. More code, more surface for bugs.

**Mitigation**: Could make `this.pages` a read-only view (getter that returns a frozen copy), forcing all mutations through `add_page()`. But that adds complexity.

---

## Comparison

| Criterion | Array | Map | Collection | Array + Index |
|---|:---:|:---:|:---:|:---:|
| Lookup speed | O(n) | O(1) | O(n) | O(1) |
| Duplicate detection | ☆ | ★★★ | ☆ | ★★★ |
| Familiarity | ★★★ | ★★★ | ★☆☆ | ★★☆ |
| Ecosystem consistency | ★☆☆ | ★☆☆ | ★★★ | ★☆☆ |
| API cleanliness | ★★★ | ★★☆ | ★☆☆ | ★★☆ |
| Iteration ease | ★★★ | ★★☆ | ★★☆ | ★★★ |
| Existing server compat | ★☆☆ | ★☆☆ | ★★★ | ★☆☆ |

---

## The Practical Reality

Most websites have 3–20 pages. At that scale, every option performs identically. The real differentiators are:

1. **Duplicate detection** — catching path collisions early prevents confusing bugs. Map and Array+Index provide this; plain Array and Collection don't.

2. **API cleanliness** — the methods available on the storage should make sense to consumers. Map's `.get()`, `.has()`, `.set()` are clear. Collection's `._arr` is an implementation leak.

3. **Iteration friendliness** — admin UIs and publishers need to iterate all pages. Arrays and the Array+Index hybrid are most natural for this. Map requires spreading.

4. **Existing compatibility** — the current publisher code uses `._arr`, but that code is mostly NYI and will be rewritten anyway. This shouldn't drive the design.

The Map option offers the best balance: fast lookup, built-in duplicate detection, standard JavaScript API, and insertion-order preservation. The `pages` getter that returns `[...this._pages.values()]` is the minor cost, and it's a pattern widely used in JavaScript.
