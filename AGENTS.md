# Agent Guidelines

- Use `snake_case` for variables, functions, and helper utilities introduced by agents.
- Use `Snake_Case` (PascalCase) for classes and constructors.
- Update existing agent-authored code to match these conventions when you make changes.
- If you must diverge from this convention, document the reason directly in the relevant file.

## Documentation Index

### Core Documentation
- **[README.md](../README.md)** - Main project overview, quick start guide, and architecture overview
- **[docs/comprehensive-documentation.md](docs/comprehensive-documentation.md)** - Detailed technical documentation with API reference and examples
- **[docs/simple-server-api-design.md](docs/simple-server-api-design.md)** - Server API design principles and implementation guide

### System Architecture & Integration
- **[docs/system-architecture.md](docs/system-architecture.md)** - Complete system architecture overview and component integration

### Component Development Guides
- **[docs/controls-development.md](docs/controls-development.md)** - Guide for developing custom JSGUI3 controls
- **[docs/publishers-guide.md](docs/publishers-guide.md)** - Guide for publishers and content serving
- **[docs/resources-guide.md](docs/resources-guide.md)** - Guide for resources and data abstraction

### Specialized Documentation
- **[docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md](docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md)** - Comprehensive guide to agentic workflows and autonomous task execution

### Technical References
- **[docs/api-reference.md](docs/api-reference.md)** - Complete API reference for classes, methods, and utilities
- **[docs/configuration-reference.md](docs/configuration-reference.md)** - Detailed configuration options and examples
- **[docs/cli-reference.md](docs/cli-reference.md)** - Command-line interface reference
- **[docs/serve-helpers.md](docs/serve-helpers.md)** - Internal helper utilities reference
- **[docs/troubleshooting.md](docs/troubleshooting.md)** - Troubleshooting guide with solutions
- **[docs/bundling-system-deep-dive.md](docs/bundling-system-deep-dive.md)** - Deep technical dive into the bundling system
- **[docs/advanced-usage-examples.md](docs/advanced-usage-examples.md)** - Advanced usage patterns and examples

### Agent Development
- **[docs/agent-development-guide.md](docs/agent-development-guide.md)** - Guide for AI agents working on this codebase
- **[docs/broken-functionality-tracker.md](docs/broken-functionality-tracker.md)** - Tracker for broken/incomplete functionality

### Review and Maintenance
- **[docs/documentation-review/CURRENT_REVIEW.md](docs/documentation-review/CURRENT_REVIEW.md)** - Current documentation review status and known issues

## Task → Doc Quick Map

### Getting Started
- **First-time setup and basic usage** → `README.md` (Quick Start section)
- **Understanding project architecture** → `README.md` (Architecture Overview) or `docs/comprehensive-documentation.md`

### Development Tasks
- **Creating new controls/components** → `docs/comprehensive-documentation.md` (Control System section)
- **Setting up server and API endpoints** → `docs/simple-server-api-design.md` or `docs/comprehensive-documentation.md` (API Reference)
- **Working with data binding** → `docs/comprehensive-documentation.md` (Data Binding Architecture)

### Advanced Development
- **Complex multi-phase projects** → `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md` (Part IX)
- **Error handling and recovery** → `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md` (Part VIII)
- **Performance optimization** → `docs/comprehensive-documentation.md` (Performance Considerations)
- **System architecture** → `docs/system-architecture.md`
- **Custom control development** → `docs/controls-development.md`
- **Publisher system** → `docs/publishers-guide.md`
- **Resource management** → `docs/resources-guide.md`

### Agent Development
- **Agentic workflow patterns** → `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md`
- **Tool integration and usage** → `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md` (Part V)
- **Quality assurance** → `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md` (Part VI)

### Deployment and Production
- **Production deployment** → `docs/comprehensive-documentation.md` (Deployment & Production)
- **Performance tuning** → `docs/comprehensive-documentation.md` (Performance Considerations)
- **Security considerations** → `docs/comprehensive-documentation.md` (Security section)

## Tooling

### Development Tools
- **Package Management**: npm/yarn for dependency management
- **Version Control**: Git for source code management
- **Code Quality**: ESLint for code linting and style enforcement
- **Testing**: Mocha for unit and integration testing

### Build and Bundling
- **JavaScript Bundling**: ESBuild for fast JS bundling and minification
- **CSS Processing**: Built-in CSS extraction and bundling from control definitions
- **Asset Management**: Automatic handling of static assets and resources

### Server Tools
- **HTTP Server**: Built-in Node.js HTTP server with WebSocket support
- **API Framework**: Function-based API endpoints with automatic JSON/text handling
- **Static File Serving**: Efficient serving of CSS, JS, and other assets

### Development Workflow
- **Hot Reloading**: Restart server on code changes (manual restart required)
- **Debug Mode**: Enable with `JSGUI_DEBUG=1` for verbose logging
- **Environment Variables**: Support for `PORT`, `HOST`, `JSGUI_DEBUG` configuration

## Reference Guide

The [GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md](docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md) provides comprehensive principles for autonomous AI task execution. It covers foundational concepts, context gathering, planning strategies, execution patterns, tool integration, quality assurance, communication, error handling, and advanced techniques for complex multi-phase projects. This guide is useful for agents to master agentic workflows, ensuring systematic, goal-directed processes for independent task completion, with emphasis on responsibility, continuous learning, and quality gates.
