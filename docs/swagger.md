# Swagger / OpenAPI Documentation

jsgui3-server includes **built-in, zero-dependency** Swagger / OpenAPI 3.0.3 support.  Every API you define — whether through `Server.serve()` or `server.publish()` — is automatically documented and browsable via an interactive Swagger UI.

## Quick Start

```js
const Server = require('jsgui3-server/server');

Server.serve({
    port: 8080,
    api: {
        'users/list': {
            handler: listUsers,
            method: 'POST',
            summary: 'List all users',
            tags: ['Users']
        }
    }
});
```

Open your browser:

| URL | Purpose |
|-----|---------|
| `http://localhost:8080/api/docs` | Interactive Swagger UI |
| `http://localhost:8080/api/openapi.json` | Raw OpenAPI 3.0 spec (JSON) |

---

## Configuration

The `swagger` option controls whether the routes are registered:

```js
Server.serve({
    swagger: true,   // Always enable  (default in dev)
    swagger: false,  // Always disable (default in production)
    // swagger omitted → auto (enabled when NODE_ENV !== 'production')
});
```

You can also pass an object for fine-grained control:

```js
Server.serve({
    swagger: {
        title: 'My Service API',
        version: '2.0.0',
        description: 'Custom description for the spec info block'
    }
});
```

### Environment-Based Defaults

| `NODE_ENV`   | `swagger` omitted | `swagger: true` | `swagger: false` |
|--------------|-------------------|-----------------|------------------|
| development  | ✅ enabled        | ✅ enabled      | ❌ disabled      |
| production   | ❌ disabled       | ✅ enabled      | ❌ disabled      |
| *(unset)*    | ✅ enabled        | ✅ enabled      | ❌ disabled      |

---

## Defining API Metadata

### Declarative API (recommended)

Pass metadata directly in the `api` option of `Server.serve()`:

```js
Server.serve({
    port: 8080,
    api: {
        'products/search': {
            handler: searchProducts,
            method: 'POST',
            summary: 'Search products',
            description: 'Full-text search across the product catalog.',
            tags: ['Products', 'Search'],
            params: {
                query:     { type: 'string',  description: 'Search query',     required: true },
                page:      { type: 'integer', description: 'Page number',      default: 1 },
                page_size: { type: 'integer', description: 'Results per page', default: 25 },
                sort:      { type: 'string',  description: 'Sort field',       enum: ['name', 'price', 'date'] }
            },
            returns: {
                rows:        { type: 'array',   items: { type: 'object' } },
                total_count: { type: 'integer', description: 'Total matching results' },
                page:        { type: 'integer' }
            }
        }
    }
});
```

### Imperative API

Use `server.publish()` with a `meta` object:

```js
const server = new Server({ website: false });

server.publish('users/create', createUser, {
    method: 'POST',
    summary: 'Create a new user',
    description: 'Creates a user account and returns the user object.',
    tags: ['Users'],
    params: {
        name:  { type: 'string', required: true, description: 'Full name' },
        email: { type: 'string', required: true, description: 'Email address' }
    },
    returns: {
        id:    { type: 'integer', description: 'New user ID' },
        name:  { type: 'string' },
        email: { type: 'string' }
    }
});

// Register swagger routes after all publish() calls:
server._register_swagger_routes({ title: 'User Service' });
```

---

## Metadata Reference

All metadata fields are **optional**.  Endpoints without metadata still produce a valid (minimal) Swagger entry.

### Endpoint Metadata Fields

| Field                | Type     | Default         | Purpose |
|----------------------|----------|-----------------|---------|
| `method`             | string   | `'POST'`        | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) |
| `summary`            | string   | —               | One-line summary shown in Swagger UI operation list |
| `description`        | string   | —               | Multi-line Markdown description for expanded view |
| `tags`               | string[] | auto-detected   | Grouping tags (auto-detected from route if omitted) |
| `params`             | Object   | —               | Request body schema (see schema format below) |
| `returns`            | Object   | —               | Response body schema (see schema format below) |
| `deprecated`         | boolean  | `false`         | Strike-through in Swagger UI |
| `operationId`        | string   | auto-generated  | Unique operation identifier |
| `response_description`| string  | `'Successful response'` | Custom 200 response description |
| `schema`             | Object   | —               | Alternative to `params` (from Function_Publisher) |

### Schema Format

The `params` and `returns` objects use a simple `{key: definition}` format:

```js
{
    field_name: {
        type: 'string',       // 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'
        description: '...',   // Human-readable description
        default: 'value',     // Default value
        required: true,       // Whether the field is required
        enum: ['a', 'b'],     // Allowed values
        items: { type: '...' } // For type: 'array' — describes each item
    }
}
```

This simple format is automatically converted to OpenAPI Schema Objects by the spec generator.

You can also pass raw OpenAPI schemas if you need more control:

```js
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'integer' }
    },
    required: ['name']
}
```

### Tag Auto-Detection

When an endpoint has no explicit `tags`, a tag is automatically derived from the route path:

| Route | Auto-Tag |
|-------|----------|
| `/api/users/list` | `users` |
| `/api/data/products` | `data` |
| `/api/admin/v1/status` | `admin` |
| `/health` | `health` |

---

## Architecture

```
Server.serve({ api: {...} })
        │
        ├── serve-factory.js          ─── normalises endpoints
        │       │                          preserves summary, tags, params, returns
        │       ▼
        ├── server.publish(name, fn, meta)
        │       │
        │       ├── Function_Publisher  ─── stores api_meta
        │       └── _api_registry[]    ─── indexed for OpenAPI
        │
        └── _register_swagger_routes()
                │
                └── Swagger_Publisher (extends HTTP_Publisher)
                        │
                        ├── /api/openapi.json  ─── openapi.js generates spec
                        │                           walks _api_registry + function_publishers
                        │                           converts params/returns → OpenAPI schemas
                        │
                        └── /api/docs          ─── swagger-ui.js generates HTML
                                                    loads Swagger UI from CDN
                                                    dark theme matching jsgui3
```

### Source Files

| File | Purpose |
|------|---------|
| `publishers/swagger-publisher.js` | `Swagger_Publisher` class (extends `HTTP_Publisher`) |
| `openapi.js` | OpenAPI 3.0.3 spec generator (zero dependencies) |
| `publishers/swagger-ui.js` | HTML page generator (CDN-based Swagger UI) |
| `publishers/http-function-publisher.js` | Stores `api_meta` on publisher instances |
| `publishers/Publishers.js` | Registry — includes `'swagger'` entry |
| `server.js` | `publish()` + `_register_swagger_routes()` |
| `serve-factory.js` | Metadata flow + auto-registration |
| `tests/openapi.test.js` | 14 tests across 5 suites |

---

## Customisation

### Title and Version

```js
Server.serve({
    swagger: { title: 'My API', version: '2.0.0' }
});
```

### Manual Registration

For servers created with `new Server(...)` directly:

```js
const server = new Server({ website: false });
// ... server.publish() calls ...
server._register_swagger_routes({
    title: 'My API',
    version: '3.0.0',
    description: 'API for my service'
});
```

### Standalone Publisher

You can also create a `Swagger_Publisher` independently and attach it
to any server with access to the router:

```js
const Swagger_Publisher = require('jsgui3-server/publishers/swagger-publisher');

const swagger = new Swagger_Publisher({
    server: my_server,
    title: 'My API',
    version: '3.0.0'
});

my_server.server_router.set_route('/api/openapi.json', swagger, swagger.handle_http.bind(swagger));
my_server.server_router.set_route('/api/docs', swagger, swagger.handle_http.bind(swagger));
```

The publisher is also available in the `Publishers` registry:

```js
const Publishers = require('jsgui3-server/publishers/Publishers');
const Swagger_Publisher = Publishers.swagger;
```

### Disabling in Production

Swagger is automatically disabled when `NODE_ENV=production`.  To force it on:

```js
Server.serve({ swagger: true });
```

---

## How It Works Internally

1. **Endpoint registration** — `server.publish()` creates a `Function_Publisher` and adds an entry to `server._api_registry` with the full metadata.

2. **Metadata normalisation** — `serve-factory.js` preserves `summary`, `tags`, `params`, `returns`, and `schema` from the declarative API definition and passes them through to `publish()`.

3. **Spec generation** — When `/api/openapi.json` is requested, `openapi.js` walks the `_api_registry` and `function_publishers` arrays, converts the simple schema format to OpenAPI Schema Objects, and assembles a complete OpenAPI 3.0.3 document.

4. **Swagger UI** — When `/api/docs` is requested, a pre-generated HTML page is served that loads Swagger UI from the unpkg CDN and points it at `/api/openapi.json`.

---

## Testing

Run the test suite:

```bash
node --test tests/openapi.test.js
```

This runs 14 tests across 5 suites:
- **simple_schema_to_openapi** — schema conversion edge cases
- **generate_openapi_spec** — spec structure, minimal metadata, route filtering
- **collect_api_entries** — deduplication across data sources
- **generate_swagger_html** — HTML output and CDN links
- **Swagger routes integration** — end-to-end HTTP tests with a real server
