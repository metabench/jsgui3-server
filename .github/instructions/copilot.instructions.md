---
description: "GitHub Copilot instructions for jsgui3-server development"
applyTo: "**"
---

# GitHub Copilot — jsgui3-server Playbook

## Primary References

- **`AGENTS.md`** — Root agent guidance with documentation index
- **`.github/agents/jsgui3-server.agent.md`** — Detailed patterns and anti-patterns
- **`docs/agent-development-guide.md`** — Broken functionality tracker (CHECK FIRST)

## Core Conventions

### Naming (Non-Negotiable)
```javascript
// Variables, functions → snake_case
const my_variable = 'value';
function process_data() {}

// Classes → PascalCase
class My_Control extends Active_HTML_Document {}
```

### Control Lifecycle (The Canonical Pattern)
```javascript
class My_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_control';
        super(spec);
        const { context } = this;
        
        const compose = () => {
            // Build UI here
        };
        
        if (!spec.el) { compose(); }  // Conditional compose!
    }
    
    activate() {
        if (!this.__active) {        // Guard against double activation!
            super.activate();
            // Event bindings here
        }
    }
}

My_Control.css = `/* styles */`;     // CSS as static property!
```

## Quick Commands

```bash
# Run example
cd examples/controls/001_demo_page && node server.js

# Tests
npm test                  # All
npm run test:bundlers     # Bundler tests
npm run test:publishers   # Publisher tests

# Debug mode
JSGUI_DEBUG=1 node server.js
```

## Before You Code

1. **Check known issues**: `docs/agent-development-guide.md` has the broken functionality tracker
2. **Find patterns**: Look at `examples/controls/` for reference implementations
3. **Update docs**: If you find something broken, document it immediately

## Anti-Patterns to Avoid

| ❌ Wrong | ✅ Right |
|----------|----------|
| `document.getElementById()` | `this.body.add.div({ id: 'x' })` |
| Always compose in constructor | `if (!spec.el) { compose(); }` |
| `activate()` without guard | `if (!this.__active) { super.activate(); }` |
| `server.start()` immediately | `server.on('ready', () => server.start())` |
| `new controls.h2({ text: 'Hi' })` | `h2.add('Hi')` — Use `.add()` for text! |
| `controls.button` (lowercase) | `controls.Button` (PascalCase for composites) |

## ⚠️ Critical: Text Content in Controls

**HTML elements** (div, span, h2) use `.add()` for text:
```javascript
const title = new controls.h2({ context });
title.add('My Title');  // ✅ Correct

// ❌ WRONG: text property won't render for HTML elements
const title = new controls.h2({ context, text: 'My Title' });  // Empty!
```

**Composite controls** (Button, Checkbox) DO support `text` property:
```javascript
const button = new controls.Button({ context, text: 'Click' });  // ✅ Works
```

**Control naming:**
- HTML elements: lowercase (`controls.div`, `controls.h2`)
- Composites: PascalCase (`controls.Button`, `controls.Window`)

**Set IDs via:** `control.dom.attributes.id = 'my-id'`

## Key Architectural Facts

- **Isomorphic**: Controls render server-side, activate client-side
- **ESBuild**: JavaScript bundling handled by ESBuild
- **CSS extraction**: CSS comes from static `.css` property on control classes
- **Publishers**: Different content types (webpage, function, css) have dedicated publishers
- **Context**: Central runtime object - extract with `const { context } = this;`

## When Creating Controls

1. Set `__type_name` before `super()`
2. Extract `context` after `super()`
3. Define `compose()` function for UI building
4. Use `if (!spec.el) { compose(); }` for conditional composition
5. Guard `activate()` with `if (!this.__active)`
6. Put CSS on static `.css` property

## Server Startup

```javascript
// Recommended: Server.serve() API
const Server = require('jsgui3-server');
Server.serve({ 
    Ctrl: My_Control, 
    src_path_client_js: __dirname + '/client.js',
    port: 8080 
});

// Auto-port selection (avoids conflicts)
Server.serve({ 
    Ctrl: My_Control, 
    src_path_client_js,
    port: 'auto'  // or port: 0
});

// Manual: Wait for 'ready' event
const server = new Server({ Ctrl, src_path_client_js });
server.on('ready', () => server.start(8080));
```

## Port Utilities

```javascript
const { get_free_port, is_port_available } = require('jsgui3-server');

const port = await get_free_port();  // Find any free port
const available = await is_port_available(8080);  // Check specific port
```

## Data Binding

```javascript
const { Data_Object, field } = require('obext');

const model = new Data_Object({
    count: field(0)
});

model.on('change.count', (e) => {
    // React to changes
});

model.count++;  // Triggers change event
```

## Documentation When Stuck

| Topic | File |
|-------|------|
| Architecture overview | `README.md` |
| Comprehensive API | `docs/comprehensive-documentation.md` |
| Control development | `docs/controls-development.md` |
| Publisher system | `docs/publishers-guide.md` |
| Middleware & compression | `docs/middleware-guide.md` |
| Troubleshooting | `docs/troubleshooting.md` |
| **Broken stuff** | `docs/agent-development-guide.md` |
