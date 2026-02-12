# API Reference

## When to Read

This document provides comprehensive API reference for JSGUI3 Server classes, methods, and utilities. Read this when:
- You need detailed method signatures and parameters
- You're implementing custom controls or publishers
- You want to understand internal APIs for extension
- You're debugging and need to know available methods
- You need to integrate with server internals

**Note:** This is a technical reference. For usage examples, see [README.md](../README.md) and [docs/comprehensive-documentation.md](docs/comprehensive-documentation.md).

## Server API

### Server.serve(options)

Main entry point for starting the server.

**Signature:**
```javascript
Server.serve(options?: ServerOptions): Promise<Server>
```

**Parameters:**
- `options` (ServerOptions, optional): Server configuration object

**Returns:** Promise that resolves to the Server instance

**Throws:**
- `ConfigurationError`: Invalid configuration options
- `DiscoveryError`: Cannot find client files or controls
- `BindingError`: Cannot bind to specified host/port

**Example:**
```javascript
const server = await Server.serve({
    port: 3000,
    ctrl: MyControl,
    resources: {
        worker_direct: {
            type: 'process',
            command: process.execPath,
            args: ['worker.js']
        },
        remote_worker: {
            type: 'remote',
            host: '127.0.0.1',
            port: 3400
        }
    },
    events: true
});
```

**Serve-specific options:**
- `resources`: Registers managed resources (in-process resource objects, local process resources, remote HTTP process resources).
- `events`: Enables built-in SSE publisher for resource lifecycle events (`/events` by default).

### Server Constructor

Legacy server constructor (still supported).

**Signature:**
```javascript
new Server(options?: ServerOptions)
```

**Parameters:**
- `options` (ServerOptions, optional): Server configuration object

**Returns:** Server instance

**Events:**
- `'ready'`: Emitted when bundling is complete
- `'started'`: Emitted when HTTP server is listening
- `'error'`: Emitted on server errors

### Module Exports

```javascript
const jsgui = require('jsgui3-server');

// Top-level exports
jsgui.Process_Resource;
jsgui.Remote_Process_Resource;
jsgui.HTTP_SSE_Publisher;

// Resource namespace aliases
jsgui.Resource.Process;
jsgui.Resource.Remote_Process;
```

## Server Instance Methods

### server.start(port, callback)

Starts the HTTP server (legacy API).

**Signature:**
```javascript
server.start(port?: number, callback?: (err?: Error) => void): void
```

**Parameters:**
- `port` (number, optional): Port to listen on (default: 8080)
- `callback` (function, optional): Called when server starts or fails

### server.publish(route, handler)

Adds an API endpoint (legacy API).

**Signature:**
```javascript
server.publish(route: string, handler: Function): void
```

**Parameters:**
- `route` (string): Route path (automatically prefixed with `/api/`)
- `handler` (Function): Request handler function

### server.publish_observable(route, observable, options)

Adds an observable-backed SSE endpoint.

**Signature:**
```javascript
server.publish_observable(route: string, observable: Observable, options?: object): HTTP_Observable_Publisher
```

**Parameters:**
- `route` (string): Route path. If it does not start with `/`, it is prefixed with `/api/`.
- `observable` (Observable): Source observable stream.
- `options` (object, optional): Publisher options.

**Returns:** `HTTP_Observable_Publisher` instance.

**Alias:** `server.publishObservable(route, observable, options)`

### server.close(callback)

Stops managed resources and closes all bound HTTP servers.

**Signature:**
```javascript
server.close(callback?: (err?: Error | null) => void): void
```

**Behavior:**
- Calls `resource_pool.stop()` when available
- Stops `sse_publisher` when present
- Closes all HTTP listeners

### server.use(middleware)

Adds middleware to the server.

**Signature:**
```javascript
server.use(middleware: Function): void
```

**Parameters:**
- `middleware` (Function): Express-style middleware function

## Port Utilities

The `port-utils` module provides automatic port selection to avoid conflicts.

### get_free_port(options)

Find a free port on the system.

**Signature:**
```javascript
get_free_port(options?: PortOptions): Promise<number>
```

**Parameters:**
- `options.host` (string, optional): Host to check (default: '127.0.0.1')
- `options.startPort` (number, optional): Starting port to try (default: 0 = OS chooses)
- `options.endPort` (number, optional): Maximum port to try (default: 65535)

**Returns:** Promise resolving to an available port number

**Example:**
```javascript
const { get_free_port } = require('jsgui3-server');

const port = await get_free_port();
console.log(`Using port: ${port}`);

// Or with options
const port = await get_free_port({ startPort: 8080 });
```

### is_port_available(port, host)

Check if a specific port is available.

**Signature:**
```javascript
is_port_available(port: number, host?: string): Promise<boolean>
```

**Parameters:**
- `port` (number): Port to check
- `host` (string, optional): Host to check (default: '127.0.0.1')

**Returns:** Promise resolving to `true` if available, `false` if in use

**Example:**
```javascript
const { is_port_available } = require('jsgui3-server');

if (await is_port_available(8080)) {
    console.log('Port 8080 is free');
}
```

### get_free_ports(count, options)

Find multiple free ports.

**Signature:**
```javascript
get_free_ports(count: number, options?: PortOptions): Promise<number[]>
```

**Parameters:**
- `count` (number): Number of ports to find
- `options` (PortOptions, optional): Same as `get_free_port`

**Returns:** Promise resolving to array of available port numbers

### get_port_or_free(preferred_port, host)

Get a specific port if available, otherwise find a free one.

**Signature:**
```javascript
get_port_or_free(preferred_port: number, host?: string): Promise<number>
```

**Parameters:**
- `preferred_port` (number): Preferred port (0 = auto-select)
- `host` (string, optional): Host to check (default: '127.0.0.1')

**Returns:** Promise resolving to the preferred port if available, or a free port

**Example:**
```javascript
const { get_port_or_free } = require('jsgui3-server');

// Try 8080, fall back to any free port
const port = await get_port_or_free(8080);
```

### Auto-Port in Server.serve()

The `Server.serve()` API supports automatic port selection:

```javascript
const Server = require('jsgui3-server');

// Auto-select a free port
Server.serve({
    Ctrl: MyControl,
    port: 'auto'  // or port: 0
}).then(server => {
    console.log(`Running on port ${server.port}`);
});

// Or use autoPort option
Server.serve({
    Ctrl: MyControl,
    autoPort: true,
    port: 8080  // Will fall back to free port if 8080 is in use
});
```

## Control Classes

### Active_HTML_Document

Base class for all UI controls that render HTML documents.

**Extends:** Blank_HTML_Document (from jsgui3-html)

**Constructor:**
```javascript
new Active_HTML_Document(spec?: ControlSpec)
```

**Properties:**
- `context` (Context): Runtime context object
- `body` (HTMLElement): Document body element
- `head` (HTMLElement): Document head element
- `__active` (boolean): Activation state flag

**Methods:**

#### activate()

Activates the control and sets up event handlers.

**Signature:**
```javascript
activate(): void
```

**Throws:** None

**Notes:** Must call `super.activate()` first in subclasses

#### include_js(url)

Adds a JavaScript script tag to the document body.

**Signature:**
```javascript
include_js(url: string): void
```

**Parameters:**
- `url` (string): JavaScript file URL

#### include_css(url)

Adds a CSS link tag to the document head.

**Signature:**
```javascript
include_css(url: string): void
```

**Parameters:**
- `url` (string): CSS file URL

#### include_jsgui_client(js_file_require_data_main)

Adds RequireJS script tag for JSGUI3 client loading.

**Signature:**
```javascript
include_jsgui_client(js_file_require_data_main?: string): void
```

**Parameters:**
- `js_file_require_data_main` (string, optional): Main JS file path

#### include_client_css()

Adds basic client CSS link.

**Signature:**
```javascript
include_client_css(): void
```

### Control (Base)

Fundamental UI component base class.

**Extends:** Evented_Class (from lang-tools)

**Constructor:**
```javascript
new Control(spec?: ControlSpec)
```

**Properties:**
- `context` (Context): Runtime context
- `dom` (DOM_Object): DOM representation
- `spec` (ControlSpec): Original specification object

**Methods:**

#### add(child)

Adds a child control.

**Signature:**
```javascript
add(child: Control): void
```

#### remove(child)

Removes a child control.

**Signature:**
```javascript
remove(child: Control): void
```

#### add_class(className)

Adds CSS class to the control.

**Signature:**
```javascript
add_class(className: string): void
```

#### remove_class(className)

Removes CSS class from the control.

**Signature:**
```javascript
remove_class(className: string): void
```

#### has_class(className)

Checks if control has CSS class.

**Signature:**
```javascript
has_class(className: string): boolean
```

#### get(attr)

Gets attribute value.

**Signature:**
```javascript
get(attr: string): any
```

#### set(attr, value)

Sets attribute value.

**Signature:**
```javascript
set(attr: string | object, value?: any): void
```

## Publisher Classes

### HTTP_Webpage_Publisher

Serves HTML pages with embedded controls.

**Extends:** Publisher

**Constructor:**
```javascript
new HTTP_Webpage_Publisher(spec?: PublisherSpec)
```

**Methods:**

#### serve(request, response)

Handles HTTP requests for web pages.

**Signature:**
```javascript
serve(request: IncomingMessage, response: ServerResponse): Promise<void>
```

### HTTP_JS_Publisher

Serves JavaScript bundles.

**Extends:** Publisher

**Constructor:**
```javascript
new HTTP_JS_Publisher(spec?: PublisherSpec)
```

**Methods:**

#### serve(request, response)

Serves JavaScript files.

**Signature:**
```javascript
serve(request: IncomingMessage, response: ServerResponse): Promise<void>
```

### HTTP_CSS_Publisher

Serves CSS stylesheets.

**Extends:** Publisher

**Constructor:**
```javascript
new HTTP_CSS_Publisher(spec?: PublisherSpec)
```

**Methods:**

#### serve(request, response)

Serves CSS files.

**Signature:**
```javascript
serve(request: IncomingMessage, response: ServerResponse): Promise<void>
```

### HTTP_API_Publisher

Handles API endpoints.

**Extends:** Publisher

**Constructor:**
```javascript
new HTTP_API_Publisher(spec?: PublisherSpec)
```

**Methods:**

#### serve(request, response)

Handles API requests.

**Signature:**
```javascript
serve(request: IncomingMessage, response: ServerResponse): Promise<void>
```

### HTTP_SSE_Publisher

General-purpose SSE publisher for explicit event fan-out.

**Extends:** `HTTP_Publisher`

**Constructor:**
```javascript
new HTTP_SSE_Publisher(spec?: {
    name?: string,
    keepaliveIntervalMs?: number,
    maxClients?: number,
    eventHistorySize?: number
})
```

**Methods:**
- `handle_http(req, res)`
- `broadcast(event_name, data_value)`
- `send(client_id, event_name, data_value)`
- `stop(callback?)`

**Properties:**
- `client_count` (number)

## Resource Classes

### Process_Resource

Represents a local process as a resource with a unified lifecycle API.

**Extends:** `Resource`

**Constructor:**
```javascript
new Process_Resource(spec?: {
    name?: string,
    command?: string,
    args?: string[],
    cwd?: string,
    env?: object,
    autoRestart?: boolean,
    maxRestarts?: number,
    processManager?: 'direct' | {
        type: 'direct' | 'pm2',
        pm2Path?: string,
        ecosystem?: string
    },
    healthCheck?: {
        type: 'http' | 'tcp' | 'custom',
        url?: string,
        host?: string,
        port?: number,
        fn?: Function,
        intervalMs?: number,
        timeoutMs?: number,
        failuresBeforeUnhealthy?: number
    }
})
```

**Core Methods:**
- `start(callback?)`
- `stop(callback?)`
- `restart(callback?)`
- `get_abstract()`

**Status:**
```javascript
{
    state: 'stopped' | 'starting' | 'running' | 'stopping' | 'restarting' | 'crashed',
    pid: number | null,
    uptime: number,
    restartCount: number,
    lastHealthCheck: object | null,
    memoryUsage: object | null,
    processManager: { type: 'direct' | 'pm2' }
}
```

**Events:**
- `state_change`
- `stdout`
- `stderr`
- `exit`
- `health_check`
- `unhealthy`
- `crashed`

### Remote_Process_Resource

Represents a remote HTTP-controlled process using the same lifecycle-oriented API style as `Process_Resource`.

**Extends:** `Resource`

**Constructor:**
```javascript
new Remote_Process_Resource(spec?: {
    name?: string,
    host: string,
    port: number,
    protocol?: 'http' | 'https',
    pollIntervalMs?: number,
    httpTimeoutMs?: number,
    historySize?: number,
    unreachableFailuresBeforeEvent?: number,
    endpoints?: {
        status?: string,
        start?: string,
        stop?: string,
        health?: string
    }
})
```

**Core Methods:**
- `start(callback?)`
- `stop(callback?)`
- `restart(callback?)`
- `get_abstract()`

**Status:** Includes `state`, `pid`, `uptime`, `restartCount`, `lastHealthCheck`, `memoryUsage`, and `processManager: { type: 'remote' }`.

**Events:**
- `state_change`
- `unreachable`
- `recovered`

### Server_Resource_Pool

Server-specific resource pool with lifecycle orchestration and event forwarding.

**Extends:** `Resource_Pool`

**Methods:**
- `add(resource)`
- `remove(name, callback?)`
- `start(callback?)`
- `stop(callback?)`
- `get_resources_by_type(type)`

**Properties:**
- `summary`: Aggregated state summary grouped by resource type.

**Forwarded Events:**
- `resource_state_change`
- `crashed`
- `unhealthy`
- `unreachable`
- `recovered`

### File_System_Resource

Provides access to local file system.

**Extends:** Resource

**Constructor:**
```javascript
new File_System_Resource(spec?: ResourceSpec)
```

**Methods:**

#### get(path)

Gets file content.

**Signature:**
```javascript
get(path: string): Promise<Buffer>
```

#### put(path, content)

Writes file content.

**Signature:**
```javascript
put(path: string, content: Buffer | string): Promise<void>
```

#### delete(path)

Deletes a file.

**Signature:**
```javascript
delete(path: string): Promise<void>
```

#### list(dir)

Lists directory contents.

**Signature:**
```javascript
list(dir: string): Promise<string[]>
```

### Database_Resource

Provides database connectivity.

**Extends:** Resource

**Constructor:**
```javascript
new Database_Resource(spec?: DatabaseResourceSpec)
```

**Properties:**
- `connectionString` (string): Database connection string
- `pool` (Pool): Connection pool instance

**Methods:**

#### query(sql, params)

Executes SQL query.

**Signature:**
```javascript
query(sql: string, params?: any[]): Promise<QueryResult>
```

#### connect()

Gets database connection.

**Signature:**
```javascript
connect(): Promise<Connection>
```

## Bundler Classes

### JS_Bundler

Base JavaScript bundler class.

**Extends:** Evented_Class

**Constructor:**
```javascript
new JS_Bundler(spec?: BundlerSpec)
```

**Methods:**

#### bundle(js_file_path)

Bundles JavaScript file.

**Signature:**
```javascript
bundle(js_file_path: string): Promise<Bundle>
```

### Advanced_JS_Bundler_Using_ESBuild

ESBuild-based bundler with CSS extraction.

**Extends:** Bundler_Using_ESBuild

**Constructor:**
```javascript
new Advanced_JS_Bundler_Using_ESBuild(spec?: BundlerSpec)
```

**Properties:**
- `debug` (boolean): Debug mode flag
- `non_minifying_bundler` (Core_JS_Non_Minifying_Bundler_Using_ESBuild)
- `minifying_js_single_file_bundler` (Core_JS_Single_File_Minifying_Bundler_Using_ESBuild)
- `css_and_js_from_js_string_extractor` (CSS_And_JS_From_JS_String_Extractor)

**Methods:**

#### bundle(js_file_path)

Bundles JS file with CSS extraction and optional minification.

**Signature:**
```javascript
bundle(js_file_path: string): Promise<Bundle>
```

**Process:**
1. Non-minifying bundle of input file
2. Extract CSS and JS from bundle
3. Re-bundle JS without CSS
4. Minify JS (if not in debug mode)
5. Return bundle with separate JS and CSS

## Utility Functions

### Serve Helpers

Located in `serve-helpers.js`.

#### truthy(value)

Converts values to boolean with flexible rules.

**Signature:**
```javascript
truthy(value: any): boolean
```

**Rules:**
- `boolean`: Returns as-is
- `number`: `true` if not zero
- `string`: `true` if not empty and not `'false'` or `'0'`
- `other`: Uses Boolean() conversion

#### guess_caller_file()

Determines the file that called the current function.

**Signature:**
```javascript
guess_caller_file(): string | null
```

**Returns:** Absolute path to caller file, or null if not found

#### resolve_from_base(base_dir, relative_path)

Resolves paths relative to base directory.

**Signature:**
```javascript
resolve_from_base(base_dir: string, relative_path: string): string
```

**Returns:** Absolute path

#### find_default_client_path(preferred, caller_dir)

Discovers client.js files automatically.

**Signature:**
```javascript
find_default_client_path(preferred?: string, caller_dir: string): string | null
```

**Search Order:**
1. `preferred` path (if provided)
2. `caller_dir/client.js`
3. `caller_dir/src/client.js`
4. `caller_dir/app/client.js`
5. `process.cwd()` variants

#### load_default_control_from_client(client_path)

Loads control constructor from client file.

**Signature:**
```javascript
load_default_control_from_client(client_path: string): Function | null
```

**Loading Strategy:**
1. Direct function export
2. `module.exports.default`
3. `module.exports.controls[controlName]`
4. `module.exports.control`
5. `module.exports.Ctrl`

#### ensure_route_leading_slash(route)

Ensures route starts with `/`.

**Signature:**
```javascript
ensure_route_leading_slash(route: string): string
```

## Type Definitions

### ServerOptions

```typescript
interface ServerOptions {
  ctrl?: Function;
  Ctrl?: Function;
  src_path_client_js?: string;
  port?: number;
  host?: string;
  debug?: boolean;
  name?: string;
  root?: string;
  config?: string;

  page?: PageConfig;
  pages?: Record<string, PageConfig>;
  api?: Record<string, Function>;
  static?: Record<string, string>;

  // Advanced options
  cors?: CorsConfig;
  https?: HttpsConfig;
  middleware?: Function[];
  publishers?: Record<string, Publisher>;
  resources?: ResourceEntries;
  events?: boolean | EventsOptions;
  bundler?: BundlerConfig;
}
```

```typescript
type ResourceEntries = Record<string, ResourceEntry> | ResourceEntry[];

type ResourceEntry =
  | Resource
  | {
      type?: 'process' | 'local';
      command?: string;
      args?: string[];
      processManager?: 'direct' | {
        type?: 'direct' | 'pm2';
        pm2Path?: string;
        ecosystem?: string;
      };
      [key: string]: any;
    }
  | {
      type?: 'remote' | 'http';
      host?: string;
      port?: number;
      protocol?: 'http' | 'https';
      endpoints?: Record<string, string>;
      [key: string]: any;
    }
  | {
      type?: 'resource' | 'in_process' | 'in-process';
      instance?: Resource;
      resource?: Resource;
      class?: new (spec?: any) => Resource;
      Ctor?: new (spec?: any) => Resource;
      constructor_fn?: new (spec?: any) => Resource;
      spec?: Record<string, any>;
      [key: string]: any;
    };

interface EventsOptions {
  route?: string;
  name?: string;
  keepaliveIntervalMs?: number;
  maxClients?: number;
  eventHistorySize?: number;
}
```

### PageConfig

```typescript
interface PageConfig {
  content: Function;  // Control constructor
  title?: string;
  description?: string;
  path?: string;
  favicon?: string;
}
```

### ControlSpec

```typescript
interface ControlSpec {
  __type_name?: string;
  context?: Context;
  size?: [number, number];  // [width, height]
  pos?: [number, number];   // [x, y]
  title?: string;
  background?: {
    color?: string;
    image?: string;
  };
  data?: {
    model?: Data_Object;
    field_name?: string;
  };
  [key: string]: any;
}
```

### PublisherSpec

```typescript
interface PublisherSpec {
  context?: Context;
  resource_pool?: ResourcePool;
  bundler?: Bundler;
  [key: string]: any;
}
```

### ResourceSpec

```typescript
interface ResourceSpec {
  context?: Context;
  config?: Record<string, any>;
  [key: string]: any;
}
```

### BundlerSpec

```typescript
interface BundlerSpec {
  debug?: boolean;
  minify?: boolean;
  sourcemap?: boolean;
  target?: string;
  external?: string[];
  [key: string]: any;
}
```

### Bundle

Represents a collection of bundled assets.

```typescript
interface BundleItem {
  type: 'JavaScript' | 'CSS' | 'HTML';
  extension: string;
  text: string;
  map?: string;  // Source map
}

interface Bundle extends Array<BundleItem> {
  // Array of bundle items
}
```

## Error Classes

### ConfigurationError

Thrown when configuration is invalid.

**Properties:**
- `message` (string): Error description
- `option` (string): Invalid option name
- `value` (any): Invalid value provided

### DiscoveryError

Thrown when client files or controls cannot be found.

**Properties:**
- `message` (string): Error description
- `searchedPaths` (string[]): Paths that were searched
- `callerFile` (string): File that initiated discovery

### BindingError

Thrown when server cannot bind to host/port.

**Properties:**
- `message` (string): Error description
- `host` (string): Host that failed
- `port` (number): Port that failed
- `cause` (Error): Underlying system error

## Constants

### HTTP Status Codes

```javascript
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;
// ... etc
```

### MIME Types

```javascript
const MIME_HTML = 'text/html';
const MIME_JSON = 'application/json';
const MIME_CSS = 'text/css';
const MIME_JS = 'application/javascript';
// ... etc
```

### Default Values

```javascript
const DEFAULT_PORT = 8080;
const DEFAULT_HOST = null;  // All interfaces
const DEFAULT_DEBUG = false;
const DEFAULT_CLIENT_FILES = ['client.js', 'src/client.js', 'app/client.js'];
```

## Events

### Server Events

- `'ready'`: Bundling completed, server ready to start
- `'started'`: HTTP server listening on port
- `'error'`: Server error occurred
- `'request'`: HTTP request received
- `'response'`: HTTP response sent

### Control Events

- `'activate'`: Control activated
- `'deactivate'`: Control deactivated
- `'render'`: Control rendered to DOM
- `'destroy'`: Control destroyed

### Context Events

- `'window-resize'`: Browser window resized
- `'data-change'`: Data model changed
- `'control-added'`: Control added to context
- `'control-removed'`: Control removed from context

## Extension Points

### Custom Publishers

```javascript
class CustomPublisher extends Publisher {
  constructor(spec) {
    super(spec);
  }

  async serve(request, response) {
    // Custom serving logic
    const data = await this.getData(request.url);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
  }
}
```

### Custom Resources

```javascript
class CustomResource extends Resource {
  constructor(spec) {
    super(spec);
    this.apiKey = spec.apiKey;
  }

  async get(path) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.buffer();
  }
}
```

### Custom Bundlers

```javascript
class CustomBundler extends JS_Bundler {
  constructor(spec) {
    super(spec);
  }

  async bundle(js_file_path) {
    // Custom bundling logic
    const code = fs.readFileSync(js_file_path, 'utf8');
    const transformed = await this.transform(code);
    return new Bundle([{
      type: 'JavaScript',
      extension: 'js',
      text: transformed
    }]);
  }
}
```

## Performance Characteristics

### Server Startup Time

- **Cold start**: 2-5 seconds (bundling + initialization)
- **Warm start**: < 1 second (cached bundles)
- **Debug mode**: 1.5x slower (source maps, no minification)

### Memory Usage

- **Base server**: ~50MB
- **Per control**: ~2-5MB
- **Bundling**: Additional 100-500MB during build

### Request Latency

- **Static files**: < 10ms
- **API endpoints**: 10-100ms
- **Control rendering**: 50-200ms (first request)
- **Cached responses**: < 5ms

## Thread Safety

### Server Instance

Server instances are not thread-safe. Create one instance per process.

### Control Instances

Controls are not thread-safe. Each request should get its own control instances.

### Resources

Resource instances should be thread-safe or use appropriate locking.

## Deprecation Notices

### Legacy APIs

- `new Server()` constructor: Use `Server.serve()` instead
- `server.start()`: Handled automatically by `Server.serve()`
- `server.publish()`: Use `api` configuration option instead

### Deprecated Options

- `Ctrl`: Use `ctrl` instead (lowercase)
- `src_path_client_js`: Auto-discovered, specify only if needed

## Version Compatibility

### Breaking Changes

- **v0.0.138**: `Server.serve()` API introduced
- **v0.0.137**: Enhanced publisher system
- **v0.0.136**: API endpoint improvements

### Migration Guide

```javascript
// Before (v0.0.135 and earlier)
const server = new Server({
  Ctrl: MyControl,
  src_path_client_js: require.resolve('./client.js')
});

server.on('ready', () => {
  server.start(8080);
});

// After (v0.0.138+)
const server = await Server.serve({
  ctrl: MyControl,
  port: 8080
});
```

---

This API reference provides comprehensive technical documentation for JSGUI3 Server internals. For practical usage examples and tutorials, refer to the user-facing documentation.
