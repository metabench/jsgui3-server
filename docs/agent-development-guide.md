# Agent Development Guide for JSGUI3 Server

## When to Read

This document is specifically for AI agents working on the JSGUI3 Server codebase. Read this when:
- You're an AI agent tasked with maintaining or extending JSGUI3 Server
- You need to understand the codebase structure and development patterns
- You want to know what still needs to be implemented
- You discover broken functionality that needs documentation
- You need guidance on how to contribute to this project

**Note:** This is the central place to document broken functionality and implementation gaps. If you find something broken or incomplete, document it here immediately.

## Agent Responsibilities

### Documentation Maintenance
- **Document broken functionality** in the "Known Issues" section below
- **Update implementation status** as you complete tasks
- **Add new findings** from code analysis to relevant sections
- **Keep this guide current** with the evolving codebase

### Code Quality Standards
- Use `snake_case` for variables, functions, and utilities
- Use `PascalCase` for classes and constructors
- Follow existing patterns for control creation and lifecycle
- Include comprehensive error handling and logging
- Add JSDoc comments for public APIs

### Development Workflow
1. **Analyze the task** and understand requirements
2. **Check existing code** for patterns and conventions
3. **Implement changes** following established patterns
4. **Test thoroughly** and document any issues found
5. **Update documentation** including this guide

## Codebase Structure Overview

### Core Architecture

```
jsgui3-server/
├── server.js                    # Main server class (JSGUI_Single_Process_Server)
├── serve-factory.js             # Server.serve() API factory
├── cli.js                       # Command-line interface
├── page-context.js              # Server-side page context
├── static-page-context.js       # Static rendering context
├── controls/                    # UI control classes
├── publishers/                  # HTTP content publishers
├── resources/                   # Data resource abstractions
├── website/                     # Website and webpage abstractions
└── docs/                        # Documentation
```

### Key Components

#### Server Core (`server.js`)
- **JSGUI_Single_Process_Server**: Main server class extending Evented_Class
- **Resource Pool**: Manages server resources (Local_Server_Info, Router)
- **Router**: Routes HTTP requests to appropriate handlers
- **Publisher System**: Handles different content types (HTML, JS, CSS, API)

#### Serve Factory (`serve-factory.js`)
- **Server.serve() API**: Simplified server startup interface
- **Auto-discovery**: Finds client.js and control constructors automatically
- **Configuration merging**: Combines programmatic and environment config
- **Promise-based**: Modern async/await compatible

#### Publishers
- **HTTP_Webpage_Publisher**: Serves bundled controls as complete web pages
- **HTTP_Website_Publisher**: Serves multi-page websites
- **HTTP_Function_Publisher**: Handles API endpoints
- **HTTP_Webpageorsite_Publisher**: Base class for webpage/website publishers

#### Resources
- **Server_Resource_Pool**: Container for all server resources
- **Local_Server_Info**: Provides network interface and system information
- **Website_Resource**: Wraps website objects for serving

## Implementation Status

### ✅ Completed Features

#### Server API
- [x] `Server.serve()` simplified API with auto-discovery
- [x] Environment variable support (PORT, HOST, JSGUI_DEBUG)
- [x] Promise-based server startup
- [x] Multi-page application support
- [x] API endpoint publishing
- [x] Static file serving

#### CLI Interface
- [x] Basic CLI in `cli.js` with serve command
- [x] Port and host options
- [x] Environment variable integration
- [x] Help and version commands

#### Bundling System
- [x] ESBuild integration for JavaScript bundling
- [x] CSS extraction from control classes
- [x] Debug vs production bundling modes
- [x] Source map generation

#### Control System
- [x] Active_HTML_Document base class
- [x] Control lifecycle (constructor → activate)
- [x] Data binding with observable models
- [x] CSS as static properties

### 🚧 In Progress / Partially Complete

#### Website Publisher
- [x] Basic HTTP_Website_Publisher class exists
- [ ] Website publishing code may be incomplete (see "Possibly missing website publishing code" comment)
- [ ] Multi-page website serving needs verification

#### Admin Interface
- [x] Basic admin controls exist (Web_Admin_Page_Control, Web_Admin_Panel_Control)
- [ ] Default admin interface at `/admin` not fully implemented
- [ ] Admin routes not automatically configured

#### File Manager
- [ ] File manager interface planned but not implemented
- [ ] File system resource exists but no UI

### ❌ Known Issues and Broken Functionality

#### Critical Issues
1. **Website Publisher Incomplete**
   - **Location**: `publishers/http-website-publisher.js`
   - **Issue**: Contains comment "Possibly missing website publishing code"
   - **Impact**: Multi-page websites may not work correctly
   - **Status**: Needs investigation and completion

2. **Server Ready Signal**
   - **Location**: `server.js` start() method
   - **Issue**: Multiple "ready" events emitted, unclear when server is truly ready
   - **Impact**: Race conditions in startup, unclear status reporting
   - **Status**: Needs consolidation to single clear ready signal

3. **Default Holding Page**
   - **Location**: Server startup logic
   - **Issue**: No default page served when no content configured
   - **Impact**: Server fails to start or serves errors when misconfigured
   - **Status**: TODO item exists but not implemented

#### Moderate Issues
4. **Admin Route Not Available**
   - **Location**: Server startup and routing
   - **Issue**: `/admin` route not automatically configured
   - **Impact**: No default admin interface accessible
   - **Status**: Admin controls exist but not wired up

5. **Bundle Path Issues**
   - **Location**: Various bundling code
   - **Issue**: Legacy bundle paths and dead code (NYI markers)
   - **Impact**: CSS bundling may be unreliable
   - **Status**: Needs cleanup and consolidation

6. **Error Handling Inconsistent**
   - **Location**: Throughout codebase
   - **Issue**: Mix of callback and promise patterns, some errors not properly propagated
   - **Impact**: Unclear error reporting and debugging difficulties
   - **Status**: Needs standardization

#### Minor Issues
7. **Obsolete Code**
   - **Location**: `website/website.js` contains `Obselete_Style_Website` class
   - **Issue**: Dead code not removed
   - **Impact**: Codebase confusion
   - **Status**: Should be cleaned up

8. **Inconsistent Naming**
   - **Location**: Various files
   - **Issue**: Mix of `src_path_client_js`, `disk_path_client_js`, `source_path_client_js`
   - **Impact**: API confusion
   - **Status**: Should standardize on single naming convention

## Implementation Gaps (TODO Items)

### High Priority
1. **Complete Website Publisher**
   - Investigate and fix website publishing code
   - Ensure multi-page websites work correctly
   - Add comprehensive tests

2. **Default Admin Interface**
   - Wire up `/admin` route by default
   - Create basic status panel showing server info
   - Add resource pool summary

3. **Server Ready Signal Consolidation**
   - Emit single clear "Server ready" message
   - Ensure all publishers are ready before signaling
   - Update CLI to wait for proper ready signal

4. **Default Holding Page**
   - Serve simple HTML when no content configured
   - Include helpful getting started information
   - Allow configuration override

### Medium Priority
5. **File Manager Interface**
   - Create admin UI for browsing/serving directories
   - Integrate with file system resource
   - Add upload/download capabilities

6. **CSS Bundling Cleanup**
   - Remove legacy bundle paths
   - Consolidate CSS extraction logic
   - Ensure reliable CSS bundling

7. **Configuration File Support**
   - Add `jsgui.config.js` support
   - Implement `--config` CLI option
   - Document configuration patterns

8. **Graceful Shutdown**
   - Handle SIGINT/SIGTERM signals
   - Clean up resources properly
   - Print shutdown confirmation

### Low Priority
9. **Watch/Dev Mode**
   - Add file watching for automatic restarts
   - Implement `node cli.js dev` command
   - Add hot reload for development

10. **Enhanced Logging**
    - Add configurable log levels
    - Implement `--verbose` and `--quiet` options
    - Add structured logging output

## Development Patterns

### Control Creation Pattern
```javascript
class MyControl extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_control';
        super(spec);
        const { context } = this;

        // Defensive programming
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('my-control');
        }

        const compose = () => {
            // UI composition logic here
        };

        if (!spec.el) { compose(); }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
            // Activation logic here
        }
    }
}

MyControl.css = `/* CSS styles */`;
```

### Publisher Creation Pattern
```javascript
class CustomPublisher extends HTTP_Publisher {
    constructor(spec = {}) {
        super(spec);
        // Publisher-specific initialization
    }

    async serve(request, response) {
        // Custom serving logic
        // Return appropriate response
    }
}
```

### Resource Creation Pattern
```javascript
class CustomResource extends Resource {
    constructor(spec = {}) {
        super(spec);
        // Resource-specific initialization
    }

    async get(path) {
        // Implement data retrieval
    }

    async put(path, data) {
        // Implement data storage
    }
}
```

## Testing Guidelines

### Unit Tests
- Test control logic without DOM
- Test resource operations
- Test publisher responses
- Use minimal dependencies

### Integration Tests
- Test server startup and shutdown
- Test API endpoints
- Test static file serving
- Test multi-page applications

### CLI Tests
- Test command-line options
- Test environment variable handling
- Test error conditions
- Use child_process for testing

## Code Analysis Findings

### Architecture Insights
- **Event-Driven Design**: Heavy use of Evented_Class and observable patterns
- **Resource Pool Pattern**: Centralized resource management
- **Publisher Abstraction**: Clean separation of content types
- **Context System**: Runtime environment management

### Complexity Areas
- **Bundling System**: Multi-stage CSS/JS processing
- **Routing Logic**: Complex route resolution and publisher selection
- **Lifecycle Management**: Control activation and resource cleanup
- **Configuration Resolution**: Multiple source merging with precedence

### Quality Issues Found
- **Inconsistent Error Handling**: Mix of callbacks, promises, and events
- **Dead Code**: Obsolete classes and unused imports
- **Naming Inconsistencies**: Multiple ways to specify same concept
- **Documentation Gaps**: Many internal APIs undocumented

## Contribution Guidelines

### Before Starting Work
1. Check this guide for known issues
2. Review TODO.md for current priorities
3. Understand existing patterns and conventions
4. Check if feature already exists partially

### During Development
1. Follow established naming conventions
2. Add comprehensive error handling
3. Include logging for debugging
4. Test thoroughly before committing

### After Completion
1. Update this guide with any new findings
2. Document broken functionality discovered
3. Update implementation status
4. Add examples and usage patterns

### Code Review Checklist
- [ ] Follows naming conventions (snake_case vs PascalCase)
- [ ] Includes proper error handling
- [ ] Has comprehensive logging
- [ ] Follows existing patterns
- [ ] Includes tests
- [ ] Updates documentation
- [ ] No dead code or unused imports

## Emergency Contacts

If you discover critical issues:
1. Document them immediately in "Known Issues" section above
2. Mark with appropriate severity level
3. Note impact and potential workarounds
4. Flag for immediate attention

## Version History

- **v0.0.138**: Server.serve() API, enhanced CLI
- **v0.0.137**: Publisher system improvements
- **v0.0.136**: API endpoint enhancements
- **Current**: Multiple known issues documented, implementation gaps identified

---

**Remember**: This guide is the central place for agents to document broken functionality and implementation gaps. If you find something broken or incomplete, document it here immediately with details about location, impact, and status.