# Serve Helpers Reference

## When to Read

This document explains the internal helper utilities used by the Server.serve() API. Read this when:
- You need to understand how JSGUI3 Server automatically discovers and loads client files
- You're extending the server with custom client discovery logic
- You want to understand the configuration resolution process
- You're debugging issues with automatic client file detection
- You need to implement similar auto-discovery patterns in your own code

**Note:** This is an internal API reference. For end-user documentation, see [README.md](../README.md). For CLI usage, see [docs/cli-reference.md](docs/cli-reference.md).

## Overview

The serve helpers provide automatic client file discovery, configuration resolution, and utility functions that make the `Server.serve()` API work seamlessly. These utilities handle the complex logic of finding client files, resolving configuration, and preparing server options.

## Core Functions

### truthy(value)

Converts various value types to boolean with flexible truthiness rules.

```javascript
truthy(true)        // true
truthy(false)       // false
truthy(1)          // true
truthy(0)          // false
truthy("yes")      // true
truthy("false")    // false (string "false")
truthy("")         // false (empty string)
truthy("0")        // false (string "0")
truthy(null)       // false
truthy({})         // true (truthy object)
```

**Used for:** Environment variable parsing, configuration option validation.

### guess_caller_file()

Attempts to determine the file that called the current function by walking the call stack.

```javascript
// In a file called /app/server.js
const caller = guess_caller_file();
// Returns: "/app/server.js"
```

**Algorithm:**
1. Captures current stack trace
2. Filters out internal Node.js and library files
3. Returns the first non-internal file path
4. Returns null if no suitable file found

**Used for:** Automatic project root detection, relative path resolution.

### resolve_from_base(base_dir, relative_path)

Resolves a path relative to a base directory, or returns absolute paths as-is.

```javascript
resolve_from_base("/app", "client.js")     // "/app/client.js"
resolve_from_base("/app", "./src/main.js") // "/app/src/main.js"
resolve_from_base("/app", "/tmp/file.js")  // "/tmp/file.js" (absolute)
```

**Used for:** Configuration path resolution, client file path handling.

### find_default_client_path(preferred, caller_dir)

Automatically discovers client files using a prioritized search strategy.

```javascript
// Search order:
find_default_client_path(null, "/app")
// 1. /app/client.js
// 2. /app/src/client.js
// 3. /app/app/client.js
// 4. /app/../client.js (process.cwd())
```

**Search Priority:**
1. **Preferred path**: If explicitly provided and exists
2. **Caller directory**: `client.js`, `src/client.js`, `app/client.js`
3. **Working directory**: Same patterns in `process.cwd()`

**Returns:** Absolute path to found client file, or null if none found.

**Used for:** Automatic client file discovery in `Server.serve()`.

### load_default_control_from_client(client_path)

Loads and extracts control constructors from client files.

```javascript
// client.js exports jsgui object with controls
const control = load_default_control_from_client("/app/client.js");
// Returns: Function (control constructor) or null
```

**Loading Strategy:**
1. **Direct function export**: `module.exports = MyControl`
2. **Default export**: `module.exports.default`
3. **Controls object**: `module.exports.controls.MyControl`
4. **Named exports**: `module.exports.control`, `module.exports.Ctrl`

**Returns:** First valid control constructor found, or null.

**Used for:** Automatic control loading when no explicit control provided.

### ensure_route_leading_slash(route)

Ensures route strings start with a forward slash.

```javascript
ensure_route_leading_slash("api/users")  // "/api/users"
ensure_route_leading_slash("/dashboard") // "/dashboard"
ensure_route_leading_slash("")           // "/"
ensure_route_leading_slash(null)         // "/"
```

**Used for:** Route normalization in multi-page configurations.

## Usage Patterns

### Automatic Client Discovery

```javascript
// Server.serve() uses these helpers internally:

// 1. Determine caller file
const caller_file = guess_caller_file();

// 2. Get caller directory
const caller_dir = caller_file ? path.dirname(caller_file) : process.cwd();

// 3. Find client file
const client_path = find_default_client_path(explicit_path, caller_dir);

// 4. Load control
const control = load_default_control_from_client(client_path);
```

### Configuration Resolution

```javascript
// Environment variable parsing
const debug_enabled = truthy(process.env.JSGUI_DEBUG);
const port = Number.isFinite(+process.env.PORT) ? +process.env.PORT : 8080;
const host = process.env.HOST || null;
```

### Path Resolution

```javascript
// Relative path handling
const config_path = resolve_from_base(project_root, "./config/app.js");
const static_path = resolve_from_base(caller_dir, "./public");
```

## Error Handling

### File Not Found

```javascript
const client_path = find_default_client_path(null, "/app");
if (!client_path) {
    throw new Error(
        `No client file found. Searched in:\n` +
        `  /app/client.js\n` +
        `  /app/src/client.js\n` +
        `  /app/app/client.js\n` +
        `  ${process.cwd()}/client.js\n` +
        `  ${process.cwd()}/src/client.js\n` +
        `  ${process.cwd()}/app/client.js`
    );
}
```

### Invalid Control

```javascript
const control = load_default_control_from_client(client_path);
if (!control) {
    throw new Error(
        `No control found in ${client_path}. Ensure your client file exports a control constructor.`
    );
}
```

## Integration Examples

### Custom Client Discovery

```javascript
const { find_default_client_path, load_default_control_from_client } = require('./serve-helpers');

function findAndLoadClient(base_dir) {
    const client_path = find_default_client_path(null, base_dir);
    if (!client_path) return null;

    const control = load_default_control_from_client(client_path);
    return { path: client_path, control };
}
```

### Configuration Builder

```javascript
const { truthy, resolve_from_base } = require('./serve-helpers');

function buildServerConfig(options) {
    return {
        port: options.port || +process.env.PORT || 8080,
        host: options.host || process.env.HOST || null,
        debug: truthy(options.debug || process.env.JSGUI_DEBUG),
        root: resolve_from_base(process.cwd(), options.root || '.')
    };
}
```

## Testing Helpers

### Mocking File System

```javascript
// For testing client discovery
const mock_fs = {
    existsSync: (path) => mock_files.has(path)
};

// Override in tests
const original_existsSync = require('fs').existsSync;
require('fs').existsSync = mock_fs.existsSync;
```

### Testing Control Loading

```javascript
// Mock require for testing
const mock_client_module = {
    controls: { MyControl: class MyControl {} }
};

const original_require = require;
require = (path) => {
    if (path === '/mock/client.js') return mock_client_module;
    return original_require(path);
};
```

## Performance Considerations

### Caching

```javascript
// Cache resolved paths
const path_cache = new Map();

function cached_resolve_from_base(base_dir, relative_path) {
    const key = `${base_dir}:${relative_path}`;
    if (path_cache.has(key)) return path_cache.get(key);

    const resolved = resolve_from_base(base_dir, relative_path);
    path_cache.set(key, resolved);
    return resolved;
}
```

### Lazy Loading

```javascript
// Only load when needed
let _client_cache = null;

function get_client_info() {
    if (_client_cache) return _client_cache;

    const caller_file = guess_caller_file();
    const caller_dir = caller_file ? path.dirname(caller_file) : process.cwd();
    const client_path = find_default_client_path(null, caller_dir);

    _client_cache = { caller_dir, client_path };
    return _client_cache;
}
```

## Debugging

### Verbose Logging

```javascript
function debug_client_discovery(caller_dir) {
    console.log('Client discovery:');
    console.log('  Caller directory:', caller_dir);

    const candidates = [
        path.join(caller_dir, 'client.js'),
        path.join(caller_dir, 'src', 'client.js'),
        path.join(caller_dir, 'app', 'client.js')
    ];

    candidates.forEach(candidate => {
        const exists = fs.existsSync(candidate);
        console.log(`  ${exists ? '✓' : '✗'} ${candidate}`);
    });
}
```

### Stack Trace Analysis

```javascript
function debug_caller_detection() {
    const orig = Error.prepareStackTrace;
    try {
        Error.prepareStackTrace = (_, stack) => stack;
        const err = new Error();
        const stack = err.stack;

        console.log('Call stack:');
        stack.forEach((frame, i) => {
            console.log(`  ${i}: ${frame.getFileName()}:${frame.getLineNumber()}`);
        });
    } finally {
        Error.prepareStackTrace = orig;
    }
}
```

## Extension Points

### Custom Client Discovery

```javascript
function custom_find_client_path(caller_dir) {
    // Custom search logic
    const custom_candidates = [
        'lib/client.js',
        'dist/client.js',
        'build/client.js'
    ];

    for (const candidate of custom_candidates) {
        const full_path = path.join(caller_dir, candidate);
        if (fs.existsSync(full_path)) return full_path;
    }

    // Fall back to default
    return find_default_client_path(null, caller_dir);
}
```

### Custom Control Loading

```javascript
function custom_load_control(client_path) {
    const mod = require(client_path);

    // Custom loading logic
    if (mod.MyApp) return mod.MyApp;
    if (mod.default && mod.default.MainControl) return mod.default.MainControl;

    // Fall back to default
    return load_default_control_from_client(client_path);
}
```

## Common Issues and Solutions

### Stack Trace Issues

**Problem:** `guess_caller_file()` returns wrong file
**Solution:** Ensure function is called directly from target file, not through multiple layers of abstraction

### Path Resolution Issues

**Problem:** Relative paths resolve incorrectly
**Solution:** Always use absolute paths when possible, or ensure base directory is correct

### Module Loading Issues

**Problem:** Control not found in client file
**Solution:** Check export structure matches expected patterns (controls object, default export, etc.)

### Caching Issues

**Problem:** Changes to client files not detected
**Solution:** Clear require cache in development: `delete require.cache[client_path]`

## Future Enhancements

### Planned Features

- **TypeScript Support**: Automatic `.ts` file discovery
- **Multiple Client Files**: Support for multiple entry points
- **Plugin System**: Extensible discovery and loading
- **Configuration Files**: JSON/YAML config file support
- **Hot Reloading**: Automatic file watching and reloading

### API Stability

These helpers are internal utilities but follow semantic versioning. Breaking changes will be clearly documented and migration guides provided.

---

This reference documents the internal utilities that power JSGUI3 Server's automatic discovery and configuration features. Understanding these helpers is essential for extending or debugging the server framework.