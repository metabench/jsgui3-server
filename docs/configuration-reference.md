# Configuration Reference

## When to Read

This document provides comprehensive reference for all JSGUI3 Server configuration options. Read this when:
- You need detailed information about every configuration option
- You're setting up complex server configurations
- You want to understand option precedence and validation
- You're migrating from legacy configuration patterns
- You need to configure advanced features like CORS, SSL, or custom publishers

**Note:** For basic usage, see [README.md](../README.md). For CLI usage, see [docs/cli-reference.md](docs/cli-reference.md).

## Overview

JSGUI3 Server supports multiple configuration methods with different precedence levels. Configuration can be provided programmatically, via environment variables, configuration files, or CLI options.

## Configuration Sources and Precedence

Configuration values are resolved in this order (later sources override earlier ones):

1. **Built-in defaults** - Framework defaults
2. **Environment variables** - `PORT`, `HOST`, `JSGUI_DEBUG`
3. **Configuration files** - `jsgui.config.js` (if present)
4. **CLI options** - `--port`, `--host`, `--root`
5. **Programmatic options** - `Server.serve(options)` parameters

## Server.serve() Options

### Core Options

#### `ctrl` / `Ctrl`
- **Type:** `Function`
- **Description:** Main control class constructor to serve
- **Default:** Auto-discovered from client.js
- **Example:**
  ```javascript
  Server.serve({
      ctrl: MyControl
  });
  ```

#### `src_path_client_js`
- **Type:** `string`
- **Description:** Path to client-side JavaScript file
- **Default:** Auto-discovered (client.js, src/client.js, app/client.js)
- **Example:**
  ```javascript
  Server.serve({
      src_path_client_js: require.resolve('./my-client.js')
  });
  ```

#### `port`
- **Type:** `number`
- **Description:** HTTP server port
- **Default:** `8080` (or `process.env.PORT`)
- **Special values:** `0` = random available port
- **Example:**
  ```javascript
  Server.serve({ port: 3000 });
  ```

#### `on_port_conflict`
- **Type:** `'error' | 'auto-loopback'`
- **Description:** Startup behavior when the requested port is already in use.
- **Default:** `'error'`

```javascript
// If the configured port is busy on all selected interfaces,
// retry on 127.0.0.1 using a free ephemeral port.
Server.serve({
    port: 52000,
    on_port_conflict: 'auto-loopback'
});
```

#### `start`
- **Type:** `object`
- **Description:** Advanced startup options passed to `server.start(...)`.

| Property | Type | Description |
|----------|------|-------------|
| `on_port_conflict` | `'error' \| 'auto-loopback'` | Same as top-level `on_port_conflict` |

```javascript
Server.serve({
    port: 52000,
    start: {
        on_port_conflict: 'auto-loopback'
    }
});
```

#### `host`
- **Type:** `string`
- **Description:** Host interface to bind to
- **Default:** All IPv4 interfaces (or `process.env.HOST`)
- **Example:**
  ```javascript
  Server.serve({
      host: '127.0.0.1'  // localhost only
  });
  ```

#### `debug`
- **Type:** `boolean`
- **Description:** Enable debug mode with verbose logging and source maps
- **Default:** `false` (or `truthy(process.env.JSGUI_DEBUG)`)
- **Example:**
  ```javascript
  Server.serve({ debug: true });
  ```

### Page Configuration

#### `page`
- **Type:** `object`
- **Description:** Single page configuration with metadata
- **Properties:**
  - `content`: Control constructor (required)
  - `title`: HTML page title (optional)
  - `description`: Meta description (optional)
  - `path`: URL path (default: '/')
  - `favicon`: Path to favicon file (optional)
- **Example:**
  ```javascript
  Server.serve({
      page: {
          content: HomeControl,
          title: 'My App - Home',
          description: 'Welcome to my application',
          favicon: './favicon.ico'
      }
  });
  ```

#### `pages`
- **Type:** `object`
- **Description:** Multiple page configuration
- **Keys:** URL paths (strings)
- **Values:** Page configuration objects (same as `page` option)
- **Example:**
  ```javascript
  Server.serve({
      pages: {
          '/': {
              content: HomeControl,
              title: 'Home'
          },
          '/about': {
              content: AboutControl,
              title: 'About Us'
          },
          '/contact': {
              content: ContactControl,
              title: 'Contact'
          }
      }
  });
  ```

### API Configuration

#### `api`
- **Type:** `object`
- **Description:** REST API endpoint definitions
- **Keys:** Route suffixes (automatically prefixed with `/api/`)
- **Values:** Handler functions
- **Handler signatures:**
  - Synchronous: `() => any`
  - Asynchronous: `async () => Promise<any>`
  - With parameters: `({ param1, param2 }) => any`
- **Response types:**
  - Objects/Arrays → `application/json`
  - Strings → `text/plain`
  - Promises → automatically awaited
- **Example:**
  ```javascript
  Server.serve({
      api: {
          'users': async () => await getUsers(),
          'user': ({ id }) => getUserById(id),
          'status': () => ({ uptime: process.uptime() }),
          'echo': (data) => data
      }
  });
  ```

### Resource and Event Options

#### `resources`
- **Type:** `object | array`
- **Description:** Resource definitions to register in the server resource pool and start after server startup.
- **Lifecycle:** Resources are started automatically after the HTTP server is listening and stopped automatically during `server.close()`.
- **Supported forms:**
  - In-process resource instance
  - In-process resource constructor/class config
  - Process resource config (`type: 'process'` or inferred from `command`)
  - Remote process resource config (`type: 'remote'` or inferred from `host`/`endpoints`)
- **Example:**
  ```javascript
  Server.serve({
      resources: {
          // In-process resource instance
          cache: new In_Process_Cache_Resource({ name: 'cache' }),

          // Process_Resource in direct mode (default)
          worker_direct: {
              type: 'process',
              command: process.execPath,
              args: ['worker.js'],
              autoRestart: true
          },

          // Process_Resource in PM2 mode (pm2Path optional)
          worker_pm2: {
              type: 'process',
              processManager: { type: 'pm2' },
              command: process.execPath,
              args: ['worker.js']
          },

          // Remote_Process_Resource
          remote_worker: {
              type: 'remote',
              host: '127.0.0.1',
              port: 3400,
              pollIntervalMs: 30000
          }
      }
  });
  ```

**Process resource notes:**
- `processManager` defaults to `direct`.
- PM2 works without explicitly setting `pm2Path`:
  - `processManager.pm2Path` (if provided)
  - `PM2_PATH` env var (if provided)
  - local `node_modules/.bin/pm2` (if present)
  - `pm2` from `PATH`

#### `events`
- **Type:** `boolean | object`
- **Description:** Enables a built-in SSE endpoint for resource lifecycle events.
- **Default:** `false`
- **When `true`:**
  - Registers `HTTP_SSE_Publisher` at `/events`
  - Forwards resource pool lifecycle events (`resource_state_change`, `crashed`, `unhealthy`, `unreachable`, `recovered`)
- **When object:** Supports publisher options such as `route`, `name`, `keepaliveIntervalMs`, `maxClients`.
- **Example:**
  ```javascript
  Server.serve({
      events: {
          route: '/events',
          keepaliveIntervalMs: 15000,
          maxClients: 200
      }
  });
  ```

### Static File Serving

#### `static`
- **Type:** `object`
- **Description:** Static file directory mappings
- **Keys:** URL prefixes
- **Values:** Local directory paths
- **Example:**
  ```javascript
  Server.serve({
      static: {
          '/images': './public/images',
          '/css': './assets/css',
          '/js': './dist/js'
      }
  });
  ```

### Advanced Options

#### `name`
- **Type:** `string`
- **Description:** Server instance name (for logging)
- **Default:** `'jsgui3-server'`
- **Example:**
  ```javascript
  Server.serve({
      name: 'My Production Server'
  });
  ```

#### `root`
- **Type:** `string`
- **Description:** Project root directory
- **Default:** Current working directory
- **Example:**
  ```javascript
  Server.serve({
      root: '/path/to/project'
  });
  ```

#### `config`
- **Type:** `string`
- **Description:** Path to configuration file
- **Default:** `'jsgui.config.js'` (if exists)
- **Example:**
  ```javascript
  Server.serve({
      config: './my-config.js'
  });
  ```

#### `style`
- **Type:** `object`
- **Description:** Style pipeline options for CSS/SCSS/Sass extraction and compilation.
- **Default:** `{}` (inherits debug behavior for sourcemaps)
- **Example:**
  ```javascript
  Server.serve({
      ctrl: MyControl,
      debug: true,
      style: {
          sourcemaps: {
              enabled: true,
              inline: true,
              include_sources: true
          },
          load_paths: ['styles', 'controls'],
          output_style: 'expanded',
          quiet_dependencies: true,
          compile_css_with_sass: true
      }
  });
  ```

**Style options:**
- `sourcemaps.enabled` (`boolean`): Enable CSS sourcemaps. Defaults to `true` when `debug` is enabled.
- `sourcemaps.inline` (`boolean`): Inline sourcemaps into compiled CSS (default `true`).
- `sourcemaps.include_sources` (`boolean`): Embed sources content in the sourcemap (default `true`).
- `load_paths` (`string[]`): Sass load paths for `@use`/`@import`.
- `output_style` (`string`): Sass output style (e.g., `expanded`, `compressed`).
- `quiet_dependencies` (`boolean`): Suppress dependency warnings during Sass compilation.
- `compile_css_with_sass` (`boolean`): Compile `.css` blocks through Sass when mixing with SCSS (default `true`).
- `scss_sources` / `sass_sources` (`string[]`): Extra Sass/SCSS sources appended during compilation.

Inline CSS sourcemaps are emitted only when a single compilation pass is possible. Mixed `.sass` plus `.scss`/`.css` inputs skip inline maps to avoid inaccurate mappings.

## Environment Variables

### PORT
- **Type:** `number`
- **Description:** HTTP server port
- **Default:** `8080`
- **Example:** `PORT=3000 node server.js`

### HOST
- **Type:** `string`
- **Description:** Host interface to bind to
- **Default:** All IPv4 interfaces
- **Example:** `HOST=127.0.0.1 node server.js`

### JSGUI_DEBUG
- **Type:** `boolean` (truthy)
- **Description:** Enable debug mode
- **Values:** `1`, `true`, `yes` = enabled; `0`, `false`, `no` = disabled
- **Example:** `JSGUI_DEBUG=1 node server.js`

## Configuration Files

### jsgui.config.js

Configuration files can contain any `Server.serve()` options:

```javascript
module.exports = {
    port: 3000,
    host: 'localhost',
    debug: process.env.NODE_ENV === 'development',

    pages: {
        '/': {
            content: require('./controls/home'),
            title: 'Home'
        },
        '/admin': {
            content: require('./controls/admin'),
            title: 'Admin Panel'
        }
    },

    api: {
        'health': () => ({ status: 'ok' }),
        'metrics': () => collectMetrics()
    },

    static: {
        '/assets': './public/assets'
    }
};
```

### Configuration File Resolution

1. **Automatic discovery:** Looks for `jsgui.config.js` in current directory
2. **Explicit path:** Specified via `config` option
3. **Merging:** Configuration file options are merged with programmatic options
4. **Precedence:** Programmatic options override configuration file options

## Advanced Configuration

### CORS Configuration

```javascript
Server.serve({
    cors: {
        origin: ['http://localhost:3000', 'https://myapp.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        maxAge: 86400  // 24 hours
    }
});
```

### SSL/TLS Configuration

```javascript
const fs = require('fs');

Server.serve({
    port: 443,
    https: {
        key: fs.readFileSync('./ssl/private.key'),
        cert: fs.readFileSync('./ssl/certificate.crt'),
        ca: fs.readFileSync('./ssl/ca-bundle.crt')
    }
});
```

### Custom Publishers

```javascript
const CustomPublisher = require('./custom-publisher');

Server.serve({
    publishers: {
        '/api/graphql': new CustomPublisher({
            schema: myGraphQLSchema
        })
    }
});
```

### Resource Pools

```javascript
let server;
server = await Server.serve({
    resources: {
        cache: new In_Process_Cache_Resource({
            name: 'cache'
        }),
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
    events: true,
    api: {
        'resources/summary': () => server.resource_pool.summary,
        'resources/restart': async ({ name }) => {
            const resource = server.resource_pool.get_resource(name);
            if (!resource || typeof resource.restart !== 'function') {
                return { ok: false, error: 'Resource restart not supported' };
            }
            await resource.restart();
            return { ok: true, status: resource.status };
        }
    }
});
```

For strongly typed in-process resources you can also provide constructor-based entries:

```javascript
Server.serve({
    resources: {
        in_process_metrics: {
            type: 'resource',
            class: In_Process_Metrics_Resource,
            spec: {
                sampleIntervalMs: 1000
            }
        },
        in_process_events: {
            constructor_fn: In_Process_Event_Bus_Resource,
            spec: {
                maxHistory: 500
            }
        },
        in_process_cache: {
            resource: new In_Process_Cache_Resource({
                name: 'in_process_cache'
            })
        },
        in_process_singleton: new In_Process_Registry_Resource({
            name: 'in_process_singleton'
        })
    }
});
```

### `middleware`
- **Type:** `Function | Function[]`
- **Description:** One or more Express-style middleware functions `(req, res, next)` to run before every request reaches the router. Middleware is executed in array order.

```javascript
const { compression } = require('jsgui3-server/middleware');

Server.serve({
    middleware: [
        compression({ threshold: 512 }),
        (req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        }
    ]
});
```

### `compression`
- **Type:** `boolean | Object`
- **Description:** Convenience shorthand that enables the built-in response-compression middleware. Pass `true` for defaults or an options object.
- **Default:** Disabled (no compression)

| Sub-option | Type | Default | Description |
|------------|--------|---------------------------|--------------------------------------------|
| `threshold` | number | `1024` | Minimum body size (bytes) to compress |
| `level` | number | `Z_DEFAULT_COMPRESSION` | zlib compression level (1–9, or -1 for default) |

```javascript
// Enable with defaults (1024 byte threshold, gzip preferred)
Server.serve({ compression: true });

// Enable with custom options
Server.serve({ compression: { threshold: 256, level: 6 } });
```

> **Note:** `compression` and `middleware` can be used together. The `middleware` array runs first (in order), then the compression middleware is appended.

See [Middleware Guide](middleware-guide.md) for the full API, response-wrapping patterns, and custom middleware examples.

### Runtime Introspection Helpers

After startup, these server instance methods are useful for runtime endpoint
inspection and diagnostics:

- `server.get_listening_endpoints()`
- `server.get_primary_endpoint()`
- `server.print_endpoints(options)`
- `server.get_startup_diagnostics()`

```javascript
const server = await Server.serve({
    Ctrl: MyControl,
    port: 52000,
    on_port_conflict: 'auto-loopback'
});

console.log('Primary endpoint:', server.get_primary_endpoint());
server.print_endpoints({ include_index: true });
console.log('Startup diagnostics:', server.get_startup_diagnostics());
```

See [API Reference](api-reference.md) for full method signatures.

## Configuration Validation

### Type Checking

The server validates configuration options and provides helpful error messages:

```javascript
// Valid
Server.serve({ port: 3000 });

// Invalid - will throw error
Server.serve({ port: 'not-a-number' });
```

### Required vs Optional

- **Required:** None (auto-discovery provides defaults)
- **Optional:** All options have sensible defaults

### Validation Rules

- `port`: Must be number between 1-65535 or 0 (ephemeral)
- `host`: Must be valid IPv4 address or hostname
- `debug`: Converted to boolean using truthy() function
- `pages`: Each page must have `content` property
- `api`: Values must be functions
- `static`: Values must be strings (directory paths)
- `resources`: Must be an object map or array of supported resource entries
- `resources.<name>.type`: Supported values include `process`, `remote`, `resource`, `in_process`, `in-process`
- `resources.<name>.processManager.type`: Supported values include `direct`, `pm2`
- `events`: Must be boolean or object

## Configuration Patterns

### Development vs Production

```javascript
// Development
const devConfig = {
    port: 3000,
    debug: true,
    cors: { origin: true }
};

// Production
const prodConfig = {
    port: process.env.PORT || 80,
    debug: false,
    cors: {
        origin: ['https://myapp.com']
    }
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
Server.serve(config);
```

### Multi-Environment Configuration

```javascript
const baseConfig = {
    pages: { /* ... */ },
    api: { /* ... */ }
};

const configs = {
    development: {
        ...baseConfig,
        port: 3000,
        debug: true
    },
    staging: {
        ...baseConfig,
        port: 8080,
        debug: false
    },
    production: {
        ...baseConfig,
        port: 80,
        debug: false,
        host: '0.0.0.0'
    }
};

const env = process.env.NODE_ENV || 'development';
Server.serve(configs[env]);
```

### Configuration Factories

```javascript
function createServerConfig(options = {}) {
    const defaults = {
        port: process.env.PORT || 8080,
        debug: truthy(process.env.JSGUI_DEBUG),
        host: process.env.HOST
    };

    return {
        ...defaults,
        ...options,
        pages: {
            '/': {
                content: require('./controls/app'),
                title: options.title || 'My App'
            },
            ...options.pages
        },
        api: {
            health: () => ({ status: 'ok', timestamp: new Date() }),
            ...options.api
        }
    };
}

Server.serve(createServerConfig({
    title: 'Dashboard',
    port: 3000
}));
```

## Migration from Legacy API

### Old Server Constructor

```javascript
// Legacy (still supported)
const server = new Server({
    Ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js')
});

server.on('ready', () => {
    server.start(8080);
});
```

### New Server.serve() API

```javascript
// New (recommended)
Server.serve({
    ctrl: MyControl,
    port: 8080
});
```

### Migration Benefits

- **Simpler:** No event handling required
- **Promise-based:** Better async handling
- **Auto-discovery:** Less boilerplate
- **Environment-aware:** Respects environment variables
- **Consistent:** Same API for all use cases

## Debugging Configuration

### Configuration Logging

Enable debug mode to see resolved configuration:

```bash
JSGUI_DEBUG=1 node cli.js serve
```

This will log:
- Resolved configuration values
- Auto-discovered file paths
- Environment variable usage
- Configuration file loading

### Configuration Inspection

```javascript
// Inspect resolved configuration
const server = await Server.serve({ debug: true });
console.log('Resolved config:', server.config);
```

### Validation Errors

Common validation errors and solutions:

```
Error: Invalid port number: "abc"
Solution: Use a number: port: 3000

Error: Page missing content property
Solution: pages: { '/': { content: MyControl, title: 'Home' } }

Error: API handler must be a function
Solution: api: { 'endpoint': () => 'response' }
```

## Performance Tuning

### Bundling Options

```javascript
Server.serve({
    bundler: {
        minify: !debug,
        sourcemap: debug,
        target: 'es2018',
        external: ['react', 'lodash']
    }
});
```

### Caching Configuration

```javascript
Server.serve({
    cache: {
        static: {
            maxAge: 86400  // 24 hours
        },
        api: {
            maxAge: 300    // 5 minutes
        }
    }
});
```

### Connection Pooling

```javascript
Server.serve({
    pool: {
        maxConnections: 100,
        idleTimeout: 30000,
        acquireTimeout: 60000
    }
});
```

## Security Configuration

### HTTPS Enforcement

```javascript
Server.serve({
    https: {
        force: true,  // Redirect HTTP to HTTPS
        hsts: {
            maxAge: 31536000,  // 1 year
            includeSubDomains: true
        }
    }
});
```

### Rate Limiting

```javascript
Server.serve({
    rateLimit: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        max: 100,  // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    }
});
```

### Input Validation

```javascript
Server.serve({
    validation: {
        api: {
            maxBodySize: '10mb',
            allowedTypes: ['application/json', 'text/plain']
        }
    }
});
```

## Monitoring and Observability

### Logging Configuration

```javascript
Server.serve({
    logging: {
        level: 'info',  // error, warn, info, debug
        format: 'json', // json, simple, detailed
        file: './logs/server.log',
        maxSize: '10m',
        maxFiles: 5
    }
});
```

### Metrics Collection

```javascript
Server.serve({
    metrics: {
        enabled: true,
        endpoint: '/metrics',
        format: 'prometheus', // prometheus, json, statsd
        labels: {
            service: 'jsgui3-server',
            version: '1.0.0'
        }
    }
});
```

### Health Checks

```javascript
Server.serve({
    health: {
        enabled: true,
        endpoint: '/health',
        checks: {
            database: () => checkDatabaseConnection(),
            filesystem: () => checkDiskSpace()
        }
    }
});
```

## Extending Configuration

### Custom Configuration Loaders

```javascript
class YamlConfigLoader {
    static load(path) {
        const yaml = require('js-yaml');
        const fs = require('fs');
        const content = fs.readFileSync(path, 'utf8');
        return yaml.load(content);
    }
}

Server.serve({
    config: './config.yml',
    configLoader: YamlConfigLoader
});
```

### Configuration Plugins

```javascript
class DatabaseConfigPlugin {
    apply(config) {
        if (!config.api) config.api = {};

        config.api.database = {
            status: () => checkDatabaseHealth(),
            backup: () => triggerBackup()
        };

        return config;
    }
}

Server.serve({
    plugins: [new DatabaseConfigPlugin()],
    // ... other config
});
```

### Environment-Specific Overrides

```javascript
Server.serve({
    // Base config
    port: 8080,

    // Environment overrides
    [process.env.NODE_ENV]: {
        port: process.env.NODE_ENV === 'production' ? 80 : 3000,
        debug: process.env.NODE_ENV !== 'production'
    }
});
```

## Best Practices

### Configuration Organization

1. **Separate concerns:** Keep different types of configuration in separate files
2. **Use environment variables:** For secrets and environment-specific values
3. **Validate early:** Use configuration validation to catch errors early
4. **Document overrides:** Comment which values can be overridden where
5. **Version control:** Keep configuration examples in version control

### Security

1. **Never commit secrets:** Use environment variables for sensitive data
2. **Validate inputs:** Always validate configuration values
3. **Principle of least privilege:** Use restrictive defaults
4. **Audit logging:** Log configuration changes in production

### Maintainability

1. **Consistent naming:** Use consistent naming conventions
2. **Documentation:** Document all configuration options
3. **Defaults:** Provide sensible defaults for all options
4. **Migration path:** Plan for configuration changes

### Performance

1. **Lazy loading:** Load configuration only when needed
2. **Caching:** Cache resolved configuration values
3. **Validation:** Validate configuration once at startup
4. **Monitoring:** Monitor configuration-related performance

## Troubleshooting Configuration

### Configuration Not Loading

**Check file existence:**
```bash
ls -la jsgui.config.js
```

**Verify syntax:**
```bash
node -c jsgui.config.js
```

**Check exports:**
```javascript
console.log(require('./jsgui.config.js')); // Should show object
```

### Environment Variables Ignored

**Check variable setting:**
```bash
echo $PORT
env | grep JSGUI
```

**Verify precedence:**
- CLI options override environment variables
- Environment variables override configuration files
- Configuration files override defaults

### Type Errors

**Common type issues:**
- Port as string: `"3000"` → `3000`
- Debug as string: `"true"` → `true`
- Paths as relative: `"./file"` → `require.resolve('./file')`

### Validation Errors

**Read error messages carefully:**
```
Error: Invalid configuration: port must be a number
Solution: port: 3000 instead of port: "3000"
```

---

This configuration reference provides comprehensive coverage of all JSGUI3 Server configuration options. Remember that most options have sensible defaults, so you only need to specify what differs from the defaults for your use case.
