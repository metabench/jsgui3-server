# Publishers Guide

## When to Read

This document explains the publisher system in JSGUI3 Server. Read this when:
- You need to understand how different content types are served
- You're creating custom publishers for new content types
- You want to extend the server with new HTTP response capabilities
- You're debugging publishing-related issues
- You need to understand the relationship between controls, resources, and HTTP responses

**Note:** For general server usage, see [README.md](../README.md). For system architecture, see [docs/system-architecture.md](docs/system-architecture.md).

## Overview

Publishers are the bridge between JSGUI3's internal data structures and HTTP responses. They handle the conversion of various content types (controls, functions, images, etc.) into appropriate HTTP responses that browsers can consume.

## Publisher Types

### HTTP_Webpage_Publisher

**Purpose:** Serves JSGUI3 controls as complete HTML web pages with bundled JavaScript and CSS.

**Key Features:**
- Bundles control JavaScript using ESBuild
- Extracts and serves CSS from control definitions
- Creates complete HTML documents with proper structure
- Handles client-side initialization

**Usage:**
```javascript
const webpage = new Webpage({ content: MyControl });
const publisher = new HTTP_Webpage_Publisher({
    webpage,
    src_path_client_js: './client.js'
});
```

**Output:** HTML page at routes like `/`, JavaScript at `/js/js.js`, CSS at `/css/css.css`

### HTTP_Website_Publisher

**Purpose:** Manages multi-page websites with routing and shared assets.

**Key Features:**
- Handles multiple pages within a website
- Shared JavaScript/CSS bundles across pages
- Automatic routing based on URL paths
- Website-level configuration and metadata

**Usage:**
```javascript
const website = new Website({ name: 'My Site' });
const publisher = new HTTP_Website_Publisher({ website });
```

### HTTP_Function_Publisher

**Purpose:** Exposes JavaScript functions as REST API endpoints.

**Key Features:**
- Automatic JSON serialization/deserialization
- Support for async functions and Promises
- Content-type negotiation (JSON for objects, text for strings)
- Error handling and propagation

**Usage:**
```javascript
const publisher = new HTTP_Function_Publisher({
    name: 'myApi',
    fn: (params) => ({ result: params.value * 2 })
});
// Available at /api/myApi
```

### HTTP_CSS_Publisher

**Purpose:** Serves CSS stylesheets with proper MIME types and caching headers.

**Key Features:**
- CSS minification and optimization
- Proper cache headers for performance
- Support for multiple stylesheets

### HTTP_JS_Publisher

**Purpose:** Serves JavaScript files and bundles.

**Key Features:**
- ESBuild integration for bundling
- Source map support for debugging
- Minification in production mode

### HTTP_Image_Publisher

**Purpose:** Serves image files with appropriate MIME types.

**Key Features:**
- Automatic MIME type detection
- Support for common image formats (JPEG, PNG, SVG, etc.)
- Efficient streaming for large files

### HTTP_Observable_Publisher

**Purpose:** Streams observable data to clients using Server-Sent Events (SSE).

**Key Features:**
- Real-time streaming of observable events
- SSE protocol support (`text/event-stream`)
- Chunked transfer encoding for long-running connections
- Integration with `fnl` observables
- Connection cleanup on client disconnect
- Optional `pause()`, `resume()`, `stop()` controls

**Usage:**
```javascript
const { observable } = require('fnl');
const Observable_Publisher = require('jsgui3-server/publishers/http-observable-publisher');

// Create a hot observable that emits continuously
let tick_count = 0;
const tick_stream = observable((next, complete, error) => {
    const interval = setInterval(() => {
        tick_count++;
        next({
            tick: tick_count,
            timestamp: Date.now(),
            message: `Server tick #${tick_count}`
        });
    }, 1000);
    
    // Return cleanup function
    return [() => clearInterval(interval)];
});

// Create the SSE publisher
const publisher = new Observable_Publisher({
    obs: tick_stream
});

// Register with server router
server.server_router.set_route('/api/stream', publisher, publisher.handle_http);

// Optional: control the stream from server-side code
publisher.pause();
publisher.resume();
publisher.stop();
```

**Optional Control (HTTP):**
```javascript
// From browser or any HTTP client:
await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pause' })   // 'resume' | 'stop' | 'status'
});
```

**Client-Side Consumption:**
```javascript
// In browser, use EventSource API
const eventSource = new EventSource('/api/stream');

eventSource.onmessage = (event) => {
    if (event.data === 'OK') {
        console.log('SSE handshake complete');
        return;
    }
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

eventSource.onerror = () => {
    eventSource.close();
};
```

**SSE Protocol:**
The publisher sends events in SSE format:
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Transfer-Encoding: chunked

data: OK

data: {"tick":1,"timestamp":1234567890,"message":"Server tick #1"}

data: {"tick":2,"timestamp":1234567891,"message":"Server tick #2"}
```

**See Also:** [Observable SSE Demo](../examples/controls/15)%20window,%20observable%20SSE/) for a complete working example.

## Publisher Architecture

### Base Publisher Class

All publishers extend a common base class that provides:
- Event handling capabilities
- Configuration management
- Error handling patterns
- Ready state management

### Event System

Publishers use an event-driven architecture:
- `ready`: Fired when publisher has completed initialization and bundling
- `error`: Fired when publisher encounters an error

### Configuration Patterns

Publishers accept configuration objects with common patterns:
- `debug`: Enable debug mode with verbose logging
- `src_path_client_js`: Path to client-side JavaScript
- `name`: Identifier for the publisher instance

## Creating Custom Publishers

### Basic Publisher Structure

```javascript
const Publisher = require('./Publisher');

class Custom_Publisher extends Publisher {
    constructor(spec = {}) {
        super(spec);
        // Custom initialization
    }

    handle_http(request, response) {
        // Custom HTTP handling logic
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('Custom response');
    }
}
```

### Integration with Server

```javascript
// Register custom publisher with server router
server.router.set_route('/custom', customPublisher, customPublisher.handle_http);
```

## Publisher Lifecycle

### Initialization Phase
1. Publisher receives configuration
2. Resources are loaded and processed
3. Bundling/compilation occurs (if needed)
4. Routes are registered with the server router
5. `ready` event is emitted

### Request Handling Phase
1. HTTP request received by server
2. Router matches URL to publisher
3. Publisher processes request
4. Response is generated and sent

### Cleanup Phase
1. Resources are released
2. Cache is cleared (if applicable)
3. Connections are closed

## Performance Considerations

### Caching Strategies
- Static assets are cached aggressively
- Dynamic content uses appropriate cache headers
- Bundle outputs are cached between requests

### Resource Management
- Publishers clean up after themselves
- Large resources are streamed rather than buffered
- Connection pooling for external resources

### Optimization Features
- Minification in production mode
- Compression support (gzip, etc.)
- Lazy loading for large assets

## Error Handling

### Publisher Errors
- Configuration validation errors
- Resource loading failures
- Bundling/compilation errors

### Request Errors
- Invalid request parameters
- Resource not found
- Processing failures

### Recovery Patterns
- Graceful degradation when possible
- Fallback responses for errors
- Comprehensive error logging

## Testing Publishers

### Unit Testing
```javascript
const publisher = new HTTP_Function_Publisher({
    name: 'test',
    fn: () => 'test result'
});

publisher.handle_http(mockRequest, mockResponse);
// Assert response content and headers
```

### Integration Testing
- Test with real server instances
- Verify end-to-end request/response cycles
- Test error conditions and recovery

## Best Practices

### Publisher Design
- Keep publishers focused on single responsibilities
- Use consistent configuration patterns
- Provide clear error messages
- Document custom publishers thoroughly

### Performance
- Minimize synchronous operations
- Use streaming for large content
- Implement appropriate caching
- Monitor resource usage

### Maintainability
- Follow existing code patterns
- Add comprehensive tests
- Document configuration options
- Provide migration guides for changes

## Common Patterns

### Conditional Publishing
```javascript
if (this.debug) {
    // Debug-specific handling
} else {
    // Production handling
}
```

### Resource Integration
```javascript
// Access server resources
const resource = this.server.resource_pool.get_resource('My_Resource');
```

### Event-Driven Processing
```javascript
this.on('ready', () => {
    // Publisher is ready for requests
});

this.on('error', (error) => {
    // Handle initialization errors
});
```

## Troubleshooting

### Common Issues
- Publisher not emitting `ready` event
- Incorrect MIME types in responses
- Bundling failures in production
- Memory leaks in long-running publishers

### Debug Mode
Enable debug mode for detailed logging:
```javascript
const publisher = new Custom_Publisher({
    debug: true
});
```

### Logging
Publishers provide comprehensive logging:
- Initialization progress
- Request handling details
- Error conditions and stack traces
- Performance metrics

## Future Enhancements

### Planned Features
- WebSocket support for real-time publishers
- GraphQL integration
- Advanced caching strategies
- Publisher composition patterns

### Extension Points
- Plugin system for custom publishers
- Middleware support
- Custom response formatters
- Advanced routing capabilities

---

This guide provides the foundation for understanding and extending the publisher system. For specific publisher implementations, refer to their individual source files in the `publishers/` directory.
