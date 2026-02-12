# Resources Guide

## When to Read

This document explains the resource system in JSGUI3 Server. Read this when:
- You need to understand how data and functionality are abstracted in the server
- You're creating custom resources for new data sources
- You want to extend the server with new capabilities
- You're working with resource pools and lifecycle management
- You need to understand server-side data access patterns

**Note:** For general server usage, see [README.md](../README.md). For system architecture, see [docs/system-architecture.md](docs/system-architecture.md).

## Overview

Resources are JSGUI3 Server's abstraction layer for accessing data, functionality, and external systems. They provide a unified interface for different types of data sources while handling lifecycle management, error handling, and performance optimization.

## Resource Types

### Server_Resource_Pool

**Purpose:** Manages collections of resources with access control and lifecycle management.

**Key Features:**
- Resource registration and discovery
- Access control through permission systems
- Lifecycle management (`start()`, `stop()`, `remove(name)`)
- Type filtering with `get_resources_by_type(type)`
- Aggregated `summary` view of resource states
- Resource event forwarding:
  - `resource_state_change`
  - `crashed`
  - `unhealthy`
  - `unreachable`
  - `recovered`

**Usage:**
```javascript
const pool = new Server_Resource_Pool({
    access: {
        full: ['admin'],
        read: ['user']
    }
});

pool.add(myResource);
pool.start((err) => {
    // Pool is ready
});

const summary = pool.summary;
const process_resources = pool.get_resources_by_type('Process_Resource');
await pool.remove('legacy_worker');
```

### Process_Resource

**Purpose:** Represents a local long-running process as a resource.

**Key Features:**
- State machine lifecycle:
  - `stopped`
  - `starting`
  - `running`
  - `stopping`
  - `restarting`
  - `crashed`
- Emits:
  - `state_change`
  - `stdout`
  - `stderr`
  - `exit`
  - `health_check`
  - `unhealthy`
  - `crashed`
- Auto-restart with exponential backoff (when `autoRestart: true`)
- Optional health checks (`http`, `tcp`, `custom`)
- Consistent status shape for direct and PM2-backed processes

**Process Manager Modes:**
- `direct` (default): Uses `child_process.spawn()`
- `pm2`: Uses PM2 CLI commands

**PM2 Path Resolution:**
- If `processManager.pm2Path` is set, it is used
- Else `PM2_PATH` env var is used (if set)
- Else local `node_modules/.bin/pm2` is used if present
- Else `pm2` is resolved from system `PATH`

**Usage:**
```javascript
const Process_Resource = require('jsgui3-server/resources/process-resource');

// Direct mode (default)
const worker_direct = new Process_Resource({
    name: 'worker_direct',
    command: process.execPath,
    args: ['worker.js'],
    autoRestart: true
});

// PM2 mode (pm2Path optional)
const worker_pm2 = new Process_Resource({
    name: 'worker_pm2',
    processManager: { type: 'pm2' },
    command: process.execPath,
    args: ['worker.js']
});

await worker_direct.start();
console.log(worker_direct.status);
await worker_direct.stop();
```

### Remote_Process_Resource

**Purpose:** Represents a remote process controlled via HTTP API while keeping a resource-compatible interface.

**Key Features:**
- Same high-level lifecycle API as `Process_Resource`:
  - `start()`
  - `stop()`
  - `restart()`
  - `status`
  - `get_abstract()`
- Periodic polling of remote status endpoint
- Emits:
  - `state_change`
  - `unreachable`
  - `recovered`
- Maintains bounded history snapshots for diagnostics

**Usage:**
```javascript
const Remote_Process_Resource = require('jsgui3-server/resources/remote-process-resource');

const remote_worker = new Remote_Process_Resource({
    name: 'remote_worker',
    host: '192.168.1.100',
    port: 3400,
    pollIntervalMs: 30000,
    httpTimeoutMs: 6000,
    endpoints: {
        status: '/',
        start: '/api/start',
        stop: '/api/stop',
        health: '/api/health'
    }
});

await remote_worker.start();
console.log(remote_worker.status);
```

### Website_Resource

**Purpose:** Wraps website objects for integration with the server's resource system.

**Key Features:**
- Website object encapsulation
- HTTP request processing
- Resource pool integration
- Lifecycle management

### File_System_Resource

**Purpose:** Provides secure, abstracted access to the file system.

**Key Features:**
- Path validation and security
- File reading/writing operations
- Directory traversal protection
- Asynchronous file operations

### Data_Resource

**Purpose:** Generic data storage and retrieval abstraction.

**Key Features:**
- Multiple storage backends support
- Query interfaces
- Data validation and transformation
- Connection pooling

### Local_Server_Info_Resource

**Purpose:** Provides information about the server environment and network interfaces.

**Key Features:**
- Network interface detection
- Server configuration access
- Environment information
- Dynamic updates

## Resource Architecture

### Base Resource Class

All resources extend the base `Resource` class:

```javascript
const jsgui = require('jsgui3-html');
const Resource = jsgui.Resource;

class Custom_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.__type_name = 'custom_resource';
    }

    start(callback) {
        // Resource initialization
        callback(null);
    }

    stop(callback) {
        // Resource cleanup
        callback(null);
    }
}
```

### Lifecycle Management

Resources follow a consistent lifecycle:

1. **Construction**: Resource is instantiated with configuration
2. **Registration**: Added to resource pool
3. **Start**: Resource becomes active and available
4. **Usage**: Resource handles requests and operations
5. **Stop**: Resource is deactivated
6. **Cleanup**: Resources are released

For process resources, consumers can rely on the same lifecycle API regardless of execution mode (`direct`, `pm2`, or `remote`).

### Unified Process Status

Both `Process_Resource` and `Remote_Process_Resource` expose a compatible `status` shape:

```javascript
{
    state: 'running',
    pid: 12345,
    uptime: 61520,
    restartCount: 1,
    lastHealthCheck: null,
    memoryUsage: { rssBytes: 104857600 },
    processManager: { type: 'direct' } // or 'pm2' / 'remote'
}
```

### Configuration Patterns

Resources use specification objects for configuration:

```javascript
const resource = new Custom_Resource({
    name: 'My Resource',
    access: ['read', 'write'],
    config: {
        // Resource-specific configuration
    }
});
```

## Creating Custom Resources

### Basic Resource Structure

```javascript
class Database_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.connection_string = spec.connection_string;
        this.pool_size = spec.pool_size || 10;
    }

    start(callback) {
        // Establish database connection
        this.connect((err) => {
            if (err) return callback(err);
            console.log('Database connected');
            callback(null);
        });
    }

    query(sql, params, callback) {
        // Execute database query
        this.connection.query(sql, params, callback);
    }

    stop(callback) {
        // Close database connection
        this.connection.end(() => {
            console.log('Database disconnected');
            callback(null);
        });
    }
}
```

### Integration with Server

```javascript
// Add to resource pool
server.resource_pool.add(databaseResource);

// Access from other components
const db = server.resource_pool.get_resource('Database_Resource');
db.query('SELECT * FROM users', [], (err, results) => {
    // Handle results
});
```

With `Server.serve()` you can register resources declaratively:

```javascript
const server = await Server.serve({
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
        },
        local_cache: new In_Process_Cache_Resource({ name: 'local_cache' })
    },
    events: true
});
```

## Resource Communication Patterns

### Synchronous Access

```javascript
const resource = pool.get_resource('My_Resource');
const result = resource.get_data();
```

### Asynchronous Access

```javascript
resource.get_data_async((err, data) => {
    if (err) {
        // Handle error
        return;
    }
    // Process data
});
```

### Promise-Based Access

```javascript
resource.get_data_promise()
    .then(data => {
        // Process data
    })
    .catch(err => {
        // Handle error
    });
```

### Event-Driven Access

```javascript
resource.on('data_updated', (new_data) => {
    // Handle data update
});

resource.on('error', (error) => {
    // Handle resource error
});
```

## Error Handling

### Resource Errors

Resources should handle and propagate errors appropriately:

```javascript
class File_Resource extends Resource {
    read_file(path, callback) {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return callback(new Error(`File not found: ${path}`));
                }
                return callback(new Error(`Read error: ${err.message}`));
            }
            callback(null, data);
        });
    }
}
```

### Error Propagation

```javascript
// In publisher or other component
const resource = pool.get_resource('File_Resource');
resource.read_file('/path/to/file', (err, data) => {
    if (err) {
        // Log error
        console.error('Resource error:', err);
        // Send appropriate HTTP response
        response.statusCode = 500;
        response.end('Internal Server Error');
        return;
    }
    // Process data
});
```

## Performance Optimization

### Connection Pooling

```javascript
class Pooled_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.pool = [];
        this.max_connections = spec.max_connections || 10;
    }

    get_connection(callback) {
        if (this.pool.length > 0) {
            return callback(null, this.pool.pop());
        }

        if (this.active_connections < this.max_connections) {
            this.create_connection(callback);
        } else {
            // Queue request or return error
            callback(new Error('Connection pool exhausted'));
        }
    }

    release_connection(connection) {
        if (this.pool.length < this.max_connections) {
            this.pool.push(connection);
        } else {
            connection.close();
        }
    }
}
```

### Caching

```javascript
class Cached_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.cache = new Map();
        this.cache_ttl = spec.cache_ttl || 300000; // 5 minutes
    }

    get_cached(key, fetch_function, callback) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cache_ttl) {
            return callback(null, cached.data);
        }

        fetch_function((err, data) => {
            if (err) return callback(err);

            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });

            callback(null, data);
        });
    }
}
```

### Lazy Loading

```javascript
class Lazy_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this._initialized = false;
        this._initializing = false;
    }

    ensure_initialized(callback) {
        if (this._initialized) {
            return callback(null);
        }

        if (this._initializing) {
            // Wait for ongoing initialization
            this.once('initialized', () => callback(null));
            return;
        }

        this._initializing = true;
        this.initialize((err) => {
            this._initializing = false;
            if (err) return callback(err);

            this._initialized = true;
            this.emit('initialized');
            callback(null);
        });
    }
}
```

## Security Considerations

### Access Control

```javascript
class Secure_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.required_permissions = spec.required_permissions || [];
    }

    check_access(user_permissions, operation) {
        return this.required_permissions.every(perm =>
            user_permissions.includes(perm)
        );
    }

    perform_operation(user, operation, ...args) {
        if (!this.check_access(user.permissions, operation)) {
            throw new Error('Access denied');
        }
        // Perform operation
    }
}
```

### Input Validation

```javascript
class Validated_Resource extends Resource {
    validate_input(input, schema) {
        // Implement validation logic
        if (!input || typeof input !== 'object') {
            throw new Error('Invalid input: must be an object');
        }

        for (const [key, validator] of Object.entries(schema)) {
            if (!validator(input[key])) {
                throw new Error(`Invalid ${key}: ${input[key]}`);
            }
        }
    }

    process_data(input, callback) {
        try {
            this.validate_input(input, this.input_schema);
            // Process validated input
        } catch (err) {
            callback(err);
        }
    }
}
```

## Testing Resources

### Unit Testing

```javascript
const Resource_Test = require('./test_helpers');

describe('Custom_Resource', () => {
    let resource;

    beforeEach(() => {
        resource = new Custom_Resource({
            name: 'Test Resource'
        });
    });

    it('should initialize correctly', (done) => {
        resource.start((err) => {
            expect(err).toBeNull();
            expect(resource.initialized).toBe(true);
            done();
        });
    });

    it('should handle errors gracefully', (done) => {
        resource.invalid_operation((err) => {
            expect(err).toBeDefined();
            expect(err.message).toContain('error');
            done();
        });
    });
});
```

### Integration Testing

```javascript
describe('Resource Integration', () => {
    let server;
    let pool;

    beforeAll((done) => {
        server = new Server();
        pool = server.resource_pool;
        pool.start(done);
    });

    it('should integrate with server', () => {
        const resource = pool.get_resource('My_Resource');
        expect(resource).toBeDefined();
        expect(resource.active).toBe(true);
    });
});
```

## Best Practices

### Resource Design
- Keep resources focused on single responsibilities
- Use consistent configuration patterns
- Provide clear error messages
- Document resource capabilities and limitations

### Performance
- Implement connection pooling for expensive resources
- Use caching for frequently accessed data
- Minimize synchronous operations
- Monitor resource usage and performance

### Maintainability
- Follow existing code patterns and conventions
- Add comprehensive tests for all resources
- Document configuration options and usage
- Provide migration guides for changes

### Security
- Implement proper access controls
- Validate all inputs and outputs
- Handle sensitive data appropriately
- Log security-relevant events

## Common Patterns

### Resource Composition

```javascript
class Composite_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.sub_resources = spec.resources || [];
    }

    start(callback) {
        async.parallel(
            this.sub_resources.map(r => r.start.bind(r)),
            callback
        );
    }

    get_combined_data(callback) {
        async.parallel(
            this.sub_resources.map(r => r.get_data.bind(r)),
            (err, results) => {
                if (err) return callback(err);
                callback(null, this.combine_results(results));
            }
        );
    }
}
```

### Resource Monitoring

```javascript
class Monitored_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.metrics = {
            requests: 0,
            errors: 0,
            avg_response_time: 0
        };
    }

    track_operation(operation, start_time) {
        this.metrics.requests++;
        const duration = Date.now() - start_time;
        this.metrics.avg_response_time =
            (this.metrics.avg_response_time + duration) / 2;
    }

    get_metrics() {
        return { ...this.metrics };
    }
}
```

## Troubleshooting

### Common Issues
- Resource not starting due to configuration errors
- Connection failures in pooled resources
- Memory leaks in long-running resources
- Race conditions in asynchronous operations

### Debug Mode

```javascript
const resource = new Custom_Resource({
    debug: true,
    log_level: 'verbose'
});
```

### Logging

Resources should provide comprehensive logging:

```javascript
class Logged_Resource extends Resource {
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    }

    start(callback) {
        this.log('info', 'Starting resource', { name: this.name });
        // ... initialization logic
        this.log('info', 'Resource started successfully');
        callback(null);
    }
}
```

## Future Enhancements

### Planned Features
- Advanced monitoring and metrics
- Automatic scaling and load balancing
- Enhanced security features
- Resource discovery and service meshes

### Extension Points
- Plugin system for custom resources
- Resource composition frameworks
- Advanced caching strategies
- Distributed resource management

---

This guide provides the foundation for understanding and extending the resource system. For specific resource implementations, refer to their individual source files in the `resources/` directory.
