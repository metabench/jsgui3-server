# Middleware Guide

jsgui3-server includes a lightweight middleware pipeline inspired by Express's `app.use()`. Middleware functions run **before** every request reaches the router, letting you add cross-cutting concerns — compression, CORS, logging, auth — without modifying route handlers.

## Quick Start

```javascript
const Server = require('jsgui3-server');
const { compression } = require('jsgui3-server/middleware');

const server = new Server({ Ctrl: My_Control, src_path_client_js: __dirname + '/client.js' });

// Enable gzip/deflate/brotli compression for JSON, HTML, CSS, JS responses
server.use(compression());

server.on('ready', () => server.start(8080));
```

Or via `Server.serve()`:

```javascript
Server.serve({
    Ctrl: My_Control,
    src_path_client_js: __dirname + '/client.js',
    compression: true,          // shorthand: enables compression with defaults
    port: 8080
});
```

---

## API

### `server.use(fn)`

Register a middleware function. Middleware is executed in registration order before the request reaches the router.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `function(req, res, next)` | Middleware function |

**Returns:** `this` (chainable)

**Middleware signature:**
```javascript
function my_middleware(req, res, next) {
    // Do work before routing
    // ...
    next();      // Continue to next middleware / router
    // -- or --
    next(err);   // Skip remaining middleware, trigger error handler
}
```

**Example — request logger:**
```javascript
server.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
```

**Example — CORS headers:**
```javascript
server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return; // Don't call next() — request is handled
    }
    next();
});
```

### `Server.serve()` Options

| Option | Type | Description |
|--------|------|-------------|
| `middleware` | `function \| function[]` | One or more middleware functions to register |
| `compression` | `boolean \| object` | Enable built-in compression middleware. Pass `true` for defaults or an options object |

```javascript
Server.serve({
    Ctrl: My_Control,
    src_path_client_js: __dirname + '/client.js',
    middleware: [
        (req, res, next) => { console.log(req.url); next(); }
    ],
    compression: { threshold: 512 },
    port: 8080
});
```

---

## Built-in Middleware

### `compression([options])`

Response compression middleware. Transparently compresses response bodies when:

1. The client sends an `Accept-Encoding` header matching a supported algorithm
2. The response `Content-Type` is compressible (JSON, HTML, CSS, JS, XML, SVG, plain text)
3. The body size meets or exceeds the threshold

Streaming responses (SSE, chunked writes via `res.write()`) are passed through uncompressed.

```javascript
const { compression } = require('jsgui3-server/middleware');
server.use(compression());
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `1024` | Minimum body size in bytes to compress |
| `level` | `number` | `Z_DEFAULT_COMPRESSION` | zlib compression level (1–9, or -1 for default) |

**Encoding negotiation priority:** gzip → deflate → brotli

gzip is preferred for dynamic content because it offers the best speed/ratio trade-off. Brotli provides better compression ratios but is significantly slower for on-the-fly compression; it's more appropriate for pre-compressed static assets.

**Compressible content types:**
- `application/json`
- `text/html`, `text/plain`, `text/css`, `text/xml`, `text/csv`
- `application/javascript`, `text/javascript`
- `application/xml`, `application/xhtml+xml`, `application/manifest+json`
- `image/svg+xml`

**What is NOT compressed:**
- Bodies smaller than `threshold`
- Non-text content types (images, video, binary)
- Responses with an existing `Content-Encoding` header
- Streaming responses (where `res.write()` is called before `res.end()`)

---

## How It Works

### Execution Order

```
HTTP Request
  │
  ▼
middleware[0](req, res, next)  ──next()──►
  middleware[1](req, res, next)  ──next()──►
    ...
      middleware[n](req, res, next)  ──next()──►
        server_router.process(req, res)  ◄── routing + publishers
```

### Response Wrapping (Compression Pattern)

The compression middleware intercepts `res.writeHead()` and `res.end()`:

1. **`res.writeHead()`** — Buffers the status code and headers instead of sending them immediately
2. **`res.end(body)`** — Checks the content type and body size; if compressible, compresses the body, updates `Content-Encoding` and `Content-Length` headers, then sends everything
3. **`res.write(chunk)`** — If called (streaming), flushes buffered headers and passes writes through unmodified

This means compression is transparent to publishers and route handlers — they continue to write responses normally.

---

## Writing Custom Middleware

### Basic Pattern

```javascript
function my_middleware(req, res, next) {
    // 1. Pre-processing (before routing)
    //    Modify req, set headers, check auth, etc.

    // 2. Continue the chain
    next();

    // 3. Post-processing is NOT supported in this simple model.
    //    For response wrapping, intercept res.end() like compression does.
}
```

### Response Wrapping Pattern

To modify the response body (like compression does), intercept `res.end()`:

```javascript
function response_timer(req, res, next) {
    const start = Date.now();
    const _end = res.end;

    res.end = function () {
        res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
        _end.apply(res, arguments);
    };

    next();
}

server.use(response_timer);
```

### Error Handling

If a middleware throws or calls `next(err)`, the error handler sends a 500 response and logs the error. Remaining middleware and routing are skipped.

```javascript
server.use((req, res, next) => {
    try {
        validate_request(req);
        next();
    } catch (err) {
        next(err); // → 500 Internal Server Error
    }
});
```

---

## Access via Module Exports

```javascript
// Direct require
const { compression } = require('jsgui3-server/middleware');

// Via Server class
const Server = require('jsgui3-server');
const { compression } = Server.middleware;

// Via jsgui module
const jsgui = require('jsgui3-server');
const { compression } = jsgui.middleware;
```
