# Chapter 7: The API Layer

A Website can describe API endpoints — functions that return data rather than HTML pages. This chapter discusses how those endpoints should be represented in the abstract, before the server gets involved.

---

## What the Server Does Today

`jsgui3-server` already supports API endpoints in two ways:

### 1. The `api` option in `Server.serve()`

```js
Server.serve({
    api: {
        'get-users': () => db.get_users(),
        'create-user': (data) => db.create_user(data)
    }
});
```

Each key becomes a route at `/api/<name>`. The value is a handler function. This is simple and effective for basic APIs.

### 2. The `server.publish()` method

```js
server.publish('get-users', () => db.get_users());
```

This creates an `HTTP_Function_Publisher` and registers it at `/api/<name>`. If the name starts with `/`, it's used as a full route.

Both approaches are just `name → function` mappings. There's no metadata — no HTTP method, no description, no authentication spec, no documentation.

---

## What Should a Website's API Know?

### Minimal: name + handler

```js
site.api = {
    'get-users': () => db.get_users()
};
```

This mirrors `Server.serve({ api: {...} })` exactly. The server already knows how to consume this format.

### With method

```js
site.api = {
    'get-users':    { handler: () => db.get_users(), method: 'GET' },
    'create-user':  { handler: (data) => db.create_user(data), method: 'POST' }
};
```

HTTP method matters for RESTful APIs. Today's server publishes everything as `GET` by default. Adding method information lets the server set up more correct routing.

### With metadata

```js
site.api = {
    'get-users': {
        handler: () => db.get_users(),
        method: 'GET',
        description: 'Returns all users',
        auth: 'required',
        tags: ['users', 'read']
    }
};
```

Full metadata enables admin dashboards to show API documentation, access control to be enforced at the server level, and potentially OpenAPI/Swagger spec generation.

---

## Option 1: Plain Object (Status Quo)

```js
class Website extends Evented_Class {
    constructor(spec = {}) {
        super();
        this.api = {};
        if (spec.api) Object.assign(this.api, spec.api);
    }
}

// Usage
site.api['get-users'] = () => db.get_users();
```

### Discussion

**Pro**: 
- Perfectly mirrors what `Server.serve()` already accepts
- Zero learning curve — it's a plain JavaScript object
- Easy to iterate: `Object.entries(site.api)`
- Can hold functions directly OR objects with metadata — flexible

**Con**:
- No validation — you can put anything in
- No way to distinguish "handler function" from "endpoint config object" without inspecting each value
- No `.add()` or `.get()` convenience methods
- No introspection API — admin UI would need to understand the mixed format

---

## Option 2: Dedicated API Object with `add_endpoint()`

```js
class Website extends Evented_Class {
    constructor(spec = {}) {
        super();
        this._api = new Map();

        if (spec.api) {
            for (const [name, value] of Object.entries(spec.api)) {
                if (typeof value === 'function') {
                    this.add_endpoint(name, value);
                } else {
                    this.add_endpoint(name, value.handler, value);
                }
            }
        }
    }

    add_endpoint(name, handler, options = {}) {
        this._api.set(name, {
            handler,
            method: options.method || 'GET',
            description: options.description || undefined,
            auth: options.auth || undefined
        });
        return this;
    }

    get_endpoint(name) {
        return this._api.get(name);
    }

    get api_endpoints() {
        return [...this._api.entries()].map(([name, cfg]) => ({
            name, ...cfg
        }));
    }
}
```

### Discussion

**Pro**:
- Consistent, structured storage — every endpoint has the same shape
- Auto-normalizes bare functions: `add_endpoint('x', fn)` becomes `{ handler: fn, method: 'GET' }`
- Accepts the plain object format from spec for backward compatibility
- `api_endpoints` getter provides a stable introspection surface for admin/tooling
- Easy to add validation (handler must be function, method must be valid HTTP verb)

**Con**:
- More code than Option 1
- The constructor does normalization work — functions vs. config objects need to be detected
- `api_endpoints` returns a new array each time (same minor issue as `pages`)

---

## Option 3: Separate API Class

Move API concerns into a dedicated class, keeping Website focused.

```js
class Website_API extends Evented_Class {
    constructor() {
        super();
        this._endpoints = new Map();
    }

    publish(name, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new TypeError(`API handler for "${name}" must be a function`);
        }
        this._endpoints.set(name, {
            handler,
            method: options.method || 'GET',
            path: options.path || undefined,
            description: options.description || undefined,
            auth: options.auth || undefined
        });
        this.raise('endpoint-added', { name, ...options });
        return this;
    }

    get(name)     { return this._endpoints.get(name); }
    has(name)     { return this._endpoints.has(name); }
    remove(name)  { return this._endpoints.delete(name); }

    get endpoints() {
        return [...this._endpoints.entries()].map(([name, cfg]) => ({
            name, ...cfg
        }));
    }

    get count() {
        return this._endpoints.size;
    }

    toJSON() {
        return this.endpoints.map(({ name, method, path, description }) => ({
            name, method, path, description
        }));
    }

    [Symbol.iterator]() {
        return this._endpoints[Symbol.iterator]();
    }
}
```

### Discussion

**Pro**:
- **Single Responsibility** — API concerns are encapsulated, not mixed into Website
- **Own event system** — `'endpoint-added'` events without polluting Website's event namespace
- **`.publish()` method** — matches the existing `API.js` stub's method name, so it's a natural evolution
- **`toJSON()`** — stable serialization for admin/docs
- **Iterable** — `for (const [name, endpoint] of site.api)` works
- **Validation** — handler type-checking at registration time
- The existing `jsgui3-website/API.js` already establishes this class's existence — it just needs to be fleshed out

**Con**:
- Another class to maintain and understand
- More indirection: `site.api.publish(name, fn)` vs. `site.api[name] = fn`
- Extends `Evented_Class` — do API endpoint registrations need events?
- The current server's `server.publish()` method has the same name, which might be confusing. "Is this the website's publish or the server's publish?"

---

## The `publish()` Name Question

Both the existing `API.js` stub and `server.js` use a method called `publish()`. This creates potential confusion:

```js
// Website API — declares an endpoint exists
site.api.publish('get-users', handler);

// Server — actually makes it available over HTTP
server.publish('get-users', handler);
```

Should the Website API use a different name to distinguish declaration from activation?

| Name | Meaning | Example |
|------|---------|---------|
| `publish()` | Matches existing stub, familiar | `site.api.publish('x', fn)` |
| `add()` | Explicit about what it does | `site.api.add('x', fn)` |
| `define()` | Emphasizes declaration over action | `site.api.define('x', fn)` |
| `register()` | Common in routing frameworks | `site.api.register('x', fn)` |
| `endpoint()` | Noun-verb clarity | `site.api.endpoint('x', fn)` |

`define()` or `register()` make the clearest distinction: the Website *defines* endpoints, the Server *publishes* them.

---

## Comparison

| Criterion | Plain Object | On Website Map | Separate API Class |
|---|:---:|:---:|:---:|
| Simplicity | ★★★ | ★★☆ | ★☆☆ |
| Server compat | ★★★ | ★★★ | ★★☆ |
| Validation | ☆ | ★★ | ★★★ |
| Introspection | ★☆☆ | ★★☆ | ★★★ |
| Metadata support | ★☆☆ | ★★★ | ★★★ |
| Event support | ☆ | ★★ | ★★★ |
| Continuation of API.js | ☆ | ☆ | ★★★ |

---

## What About the Existing API.js?

The current `jsgui3-website/API.js` has:
- A constructor that takes `spec.server`
- An empty `publish(name, fn)` stub
- A fatal export-statement bug

If we go with Option 3 (separate API class), the natural path is to fix and evolve `API.js` into `Website_API`. The server reference would be removed (the API class shouldn't know about the server — that's a deployment concern, not a definition concern), and `publish()` might be renamed to `define()` or `register()`.

If we go with Option 1 or 2, `API.js` becomes dead code and should be removed.
