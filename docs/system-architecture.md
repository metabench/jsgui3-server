# JSGUI3 Server System Architecture

## When to Read

This document provides a comprehensive overview of the JSGUI3 Server system architecture. Read this when:
- You need to understand how all the major components fit together
- You're planning to extend or modify the system architecture
- You want to understand the data flow and integration points
- You're debugging complex system-level issues
- You're contributing to the core framework development

**Note:** For API usage, see [README.md](../README.md). For detailed component documentation, see [docs/comprehensive-documentation.md](docs/comprehensive-documentation.md).

## System Overview

JSGUI3 Server is a Node.js-based web framework that serves modern JavaScript GUI applications. The system follows a modular architecture with clear separation of concerns, built around the core principle of **component-based web serving**.

## Core Architecture Layers

### 1. Entry Point Layer
**Files:** `server.js`, `serve-factory.js`, `cli.js`

**Purpose:** Provides the main server interfaces and command-line tools.

**Key Components:**
- `JSGUI_Single_Process_Server`: Main server class handling HTTP requests
- `Server.serve()`: Simplified API for quick application setup
- CLI tools for development and deployment

### 2. Publishing Layer
**Directory:** `publishers/`

**Purpose:** Handles conversion of various content types to HTTP responses.

**Key Publishers:**
- `HTTP_Webpage_Publisher`: Serves bundled JSGUI3 controls as complete web pages
- `HTTP_Website_Publisher`: Manages multi-page websites
- `HTTP_Function_Publisher`: Exposes JavaScript functions as REST API endpoints
- `HTTP_Observable_Publisher`: Streams observable-backed SSE
- `HTTP_SSE_Publisher`: General-purpose SSE fan-out publisher
- `HTTP_CSS_Publisher`: Serves CSS stylesheets
- `HTTP_JS_Publisher`: Serves JavaScript bundles
- `HTTP_Image_Publisher`: Handles image file serving

### 3. Resource Management Layer
**Directory:** `resources/`

**Purpose:** Provides abstractions for accessing different types of data and functionality.

**Key Resources:**
- `Server_Resource_Pool`: Manages collections of resources with lifecycle management
- `Process_Resource`: Local process resource (`direct` default, optional `pm2`)
- `Remote_Process_Resource`: HTTP-controlled remote process resource
- `Website_Resource`: Wraps website objects for server integration
- `File_System_Resource`: Provides file system access
- `Data_Resource`: Handles data storage and retrieval
- `Local_Server_Info_Resource`: Provides server environment information

### 4. Processing Layer
**Directory:** `resources/processors/`

**Purpose:** Handles transformation and optimization of client-side assets.

**Key Processors:**
- **Bundlers** (`bundlers/`): Combine and optimize JavaScript, CSS, and other assets
  - `JS_Bundler`: JavaScript bundling with ESBuild integration
  - `CSS_Bundler`: CSS processing and optimization
  - `Webpage_Bundler`: Complete webpage assembly
- **Extractors** (`extractors/`): Extract metadata and assets from components

### 5. Control Layer
**Directory:** `controls/`

**Purpose:** Defines reusable UI components that can be served to browsers.

**Key Components:**
- `Active_HTML_Document`: Base class for all UI controls
- Page controls (`page/`): Full-page layouts
- Panel controls (`panel/`): Container components

### 6. HTTP Handling Layer
**Directory:** `http/`

**Purpose:** Manages low-level HTTP request/response handling.

**Key Components:**
- `HTTP_Responder`: Base class for HTTP response handling
- `Static_Route_HTTP_Responder`: Serves pre-generated static content

### 7. Website Abstraction Layer
**Directory:** `website/`

**Purpose:** Provides high-level abstractions for website structure and content.

**Key Components:**
- `Website`: Represents a complete website with multiple pages
- `Webpage`: Represents individual pages within a website

## Data Flow Architecture

### Request Processing Flow

```
Client Request
    ↓
HTTP Server (Node.js http/https)
    ↓
Middleware Pipeline (server.use)     ← gzip/deflate/brotli, CORS, logging, etc.
    ↓
Server Router
    ↓
Resource Pool
    ↓
Appropriate Publisher
    ↓
Resource Access
    ↓
Content Processing/Bundling
    ↓
HTTP Response
```

Middleware functions registered via `server.use(fn)` execute in order before
the router. If no middleware is registered, the router is called directly
with zero overhead. See [Middleware Guide](middleware-guide.md) for details.

### Component Serving Flow

```
Control Class (e.g., MyCustomControl)
    ↓
HTTP_Webpage_Publisher
    ↓
JS/CSS Extraction & Bundling
    ↓
Static_Route_HTTP_Responder
    ↓
Client Browser
```

### API Serving Flow

```
Function Definition
    ↓
HTTP_Function_Publisher
    ↓
Server Router (/api/functionName)
    ↓
HTTP Response (JSON/Text)
```

## Integration Points

### External Dependencies

**Core Dependencies:**
- `jsgui3-html`: Base framework providing core classes
- `obext`: Object extension utilities for reactive properties
- `Node.js`: Runtime environment and HTTP server

**Optional Dependencies:**
- ESBuild: JavaScript bundling and minification
- Various resource-specific libraries

### Internal Module Integration

**Router ↔ Publishers:**
- Router receives HTTP requests and routes to appropriate publishers
- Publishers handle content-type specific processing

**Publishers ↔ Resources:**
- Publishers access data through resource abstractions
- Resources provide unified interface to different data sources

**Resources ↔ Processors:**
- Processors transform raw resources into optimized output
- Resources manage processor lifecycle and configuration

## Configuration and Environment

### Environment Variables
- `PORT`: Server port (default: 8080)
- `HOST`: Server host binding
- `JSGUI_DEBUG`: Enable debug mode

### Configuration Files
- `jsgui.config.js`: Optional configuration file
- Inline configuration through `Server.serve()` options

## Performance and Scalability

### Resource Pooling
- Connection pooling for database and external service access
- Thread/worker pools for background processing
- Cache pools for compiled assets and frequently accessed data

### Bundling Optimization
- ESBuild integration for fast JavaScript processing
- CSS extraction and deduplication
- Asset caching and compression

### Memory Management
- Control lifecycle management through context registration
- Resource cleanup and garbage collection
- Shared data models to reduce memory duplication

## Error Handling and Resilience

### Error Propagation
- Structured error handling throughout the pipeline
- Graceful degradation when components fail
- Comprehensive logging for debugging

### Recovery Mechanisms
- Automatic restart capabilities
- Fallback resource access patterns
- Error boundary components for UI stability

## Development and Testing

### Development Mode Features
- Hot reloading for control changes
- Enhanced debugging output
- Source map generation

### Testing Infrastructure
- Unit tests for individual components
- Integration tests for system interactions
- End-to-end tests for complete workflows

## Deployment Patterns

### Single Process Deployment
- Simple single-server deployment
- Resource pooling for efficiency
- Built-in load balancing across network interfaces

### Development vs Production
- Debug mode for development
- Optimized bundling for production
- Environment-specific configuration

## Extension Points

### Custom Publishers
Extend the `Publisher` base class to handle new content types.

### Custom Resources
Implement the `Resource` interface for new data sources.

### Custom Controls
Extend `Active_HTML_Document` for new UI components.

### Custom Processors
Add new processing pipelines for assets and data.

## Security Considerations

### Access Control
- Resource-level access control through resource pools
- Publisher-level security through HTTP handling
- Environment-based security configurations

### Data Protection
- Secure handling of sensitive configuration
- Safe external resource access patterns
- Input validation and sanitization

## Future Evolution

### Planned Enhancements
- Multi-process server architecture
- Advanced caching strategies
- Enhanced real-time capabilities
- Improved development tooling

### Backward Compatibility
- API stability commitments
- Migration paths for breaking changes
- Deprecation warnings and timelines

---

This architecture document provides the foundation for understanding how JSGUI3 Server components work together. For detailed implementation of specific components, refer to their individual documentation files.
