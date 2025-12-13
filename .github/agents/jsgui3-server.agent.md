# jsgui3-server Agent Instructions

**Purpose**: Agent guidance for working on the jsgui3-server codebase - the ES6 JSGUI server that delivers controls to the browser.

**Core Principle**: jsgui3-server bundles and serves jsgui3 controls, handling JavaScript bundling (ESBuild), CSS extraction, and HTTP publishing. All UI controls inherit from `Active_HTML_Document` and run isomorphically (server-rendered, client-activated).

---

## ⚠️ CRITICAL: Understand the Full Stack

**You cannot effectively work on jsgui3-server without understanding the JSGUI3 ecosystem.** This server is the delivery mechanism for a multi-package framework. Changes here often involve understanding behavior defined in dependent packages.

### The JSGUI3 Package Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                           │
│         (client.js with your Custom_Control class)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    jsgui3-server (THIS REPO)                    │
│   • HTTP server, routing, publishers                            │
│   • ESBuild bundling of client JS                               │
│   • CSS extraction from control classes                         │
│   • Server-side rendering → client activation                   │
└─────────────────────────────────────────────────────────────────┘
        │                │                │               │
        ▼                ▼                ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│jsgui3-client│  │ jsgui3-html │  │jsgui3-webpage│ │jsgui3-website│
│             │  │             │  │             │  │             │
│ Browser DOM │  │HTML element │  │ Single page │  │ Multi-page  │
│ abstraction │  │ classes     │  │ abstraction │  │ site model  │
│ & controls  │  │ (div, span) │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
        │                │
        ▼                ▼
┌─────────────────────────────────┐
│            obext                │
│  Observable data objects with   │
│  field() reactive properties    │
│  (Data_Object, Data_Value)      │
└─────────────────────────────────┘
```

### Package Responsibilities

| Package | Version | Role | Key Classes/Exports |
|---------|---------|------|---------------------|
| **jsgui3-server** | 0.0.140 | HTTP delivery, bundling | `Server`, `serve()`, Publishers |
| **jsgui3-client** | 0.0.120 | Browser-side control system | `Control`, DOM abstractions |
| **jsgui3-html** | 0.0.170 | HTML element hierarchy | `div`, `span`, `button`, `input`, etc. |
| **jsgui3-webpage** | 0.0.8 | Single page model | `Webpage` |
| **jsgui3-website** | 0.0.8 | Multi-page site model | `Website` |
| **obext** | 0.0.31 | Reactive data binding | `Data_Object`, `Data_Value`, `field()` |
| **lang-tools** | 0.0.41 | Type checking utilities | `tof()`, `get()`, `set()` |
| **fnl/fnlfs** | 0.0.37/34 | Functional utilities, async FS | Functional patterns |

### Why This Matters

1. **Control classes** (`Active_HTML_Document`) inherit from `jsgui3-client`, not this repo
2. **HTML elements** (`this.body.add.div()`) come from `jsgui3-html`
3. **Data binding** (`field()`, `Data_Object`) comes from `obext`
4. **The `context` object** is created by `jsgui3-client` and flows through everything
5. **CSS extraction** looks for static `.css` properties defined by `jsgui3-client` patterns

### Isomorphic Lifecycle (The Key Concept)

```
SERVER SIDE                              CLIENT SIDE
───────────                              ───────────
1. new My_Control(spec)                  
   └─ compose() builds virtual DOM       
                                         
2. control.render_html()                 
   └─ Serializes to HTML string          
                                         
3. HTTP Response ────────────────────►   Browser receives HTML
                                         
                                         4. new My_Control({ el: dom_element })
                                            └─ spec.el present = HYDRATION
                                            └─ compose() SKIPPED (if (!spec.el))
                                         
                                         5. control.activate()
                                            └─ Binds events to real DOM
                                            └─ Runs client-only code
```

**This is why `if (!spec.el) { compose(); }` is mandatory** — without it, content duplicates on activation.

---

## ⚡ Quick Start (30 seconds)

```bash
# Run any example:
cd "examples/controls/1) window"
node server.js
# → Open http://localhost:52000

# Run tests:
npm test                    # All tests
npm run test:mocha          # Mocha tests
npm run test:bundlers       # Bundler tests only
npm run test:publishers     # Publisher tests

# CLI (defaults to port 8080):
node cli.js serve --port 8080
```

### Auto-Port Selection

The server supports automatic free port selection to avoid conflicts:

```javascript
// Using Server.serve() with auto port
Server.serve({ 
    Ctrl: My_Control, 
    src_path_client_js,
    port: 'auto'  // Auto-select a free port
});

// Or port: 0 for OS-assigned port
Server.serve({ Ctrl, port: 0 });

// Port utilities available directly
const { get_free_port, is_port_available } = require('jsgui3-server');
const port = await get_free_port();
```

---

## 🏗️ Architecture at a Glance

```
Server.serve({ Ctrl, src_path_client_js })
     │
     ▼
┌─────────────────────────────────────────┐
│           JSGUI_Single_Process_Server   │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Bundler  │  │ Router   │  │ Pool  │ │
│  │ (ESBuild)│  │ (Routes) │  │(Rsrcs)│ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       │             │            │      │
│       ▼             ▼            ▼      │
│  ┌──────────────────────────────────┐  │
│  │          Publishers              │  │
│  │  • http-webpage-publisher        │  │
│  │  • http-function-publisher       │  │
│  │  • http-website-publisher        │  │
│  │  • http-css-publisher            │  │
│  │  • http-js-publisher             │  │
│  │  • http-html-publisher           │  │
│  │  • http-image (png/jpeg/svg)     │  │
│  │  • + 7 more specialized types    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Key Files:**
- `server.js` — `JSGUI_Single_Process_Server` class
- `serve-factory.js` — `Server.serve()` simplified API
- `cli.js` — Command-line interface (default port 8080)
- `publishers/` — HTTP content type handlers (14+ types)
- `controls/Active_HTML_Document.js` — Base control class
- `resources/` — Data resource abstractions

---

## 📐 Conventions (MANDATORY)

### Naming
```javascript
// Variables, functions, utilities → snake_case
const my_variable = 'value';
function process_data(input) { ... }

// Classes and constructors → PascalCase  
class My_Custom_Control extends Active_HTML_Document { ... }
class HTTP_Function_Publisher extends HTTP_Publisher { ... }
```

### Control Pattern (The Canonical Form)
```javascript
class My_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        // 1. Set __type_name BEFORE super()
        spec.__type_name = spec.__type_name || 'my_control';
        super(spec);
        
        // 2. Extract context
        const { context } = this;
        
        // 3. Define compose() for UI building
        const compose = () => {
            // Build UI here
            const btn = this.body.add.button('Click Me');
            btn.on('click', () => console.log('clicked'));
        };
        
        // 4. Conditional compose - only if not hydrating from DOM
        if (!spec.el) { compose(); }
    }
    
    activate() {
        // 5. Guard against double activation
        if (!this.__active) {
            super.activate();
            // Event binding, DOM measurements, etc.
        }
    }
}

// 6. CSS as static property
My_Control.css = `
    .my_control { padding: 16px; }
    .my_control button { cursor: pointer; }
`;
```

### Server Startup Pattern
```javascript
const Server = require('jsgui3-server');
const My_Control = require('./client.js');
const src_path_client_js = __dirname + '/client.js';

// Simple API (recommended)
Server.serve({ 
    Ctrl: My_Control, 
    src_path_client_js,
    port: 8080
}).then(server => {
    console.log(`Server running on port ${server.port}`);
});

// Or with manual control:
const server = new Server({ 
    Ctrl: My_Control, 
    src_path_client_js 
});
server.on('ready', () => {
    server.start(8080);
});
```

### Data Binding Pattern
```javascript
const { Data_Object, field } = require('obext');

class Counter_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'counter_control';
        super(spec);
        
        // Observable data model
        const model = new Data_Object({
            count: field(0)
        });
        
        const compose = () => {
            const display = this.body.add.span();
            const btn = this.body.add.button('+');
            
            // Reactive binding - updates automatically when count changes
            model.on('change.count', (e) => {
                display.text = `Count: ${e.value}`;
            });
            
            btn.on('click', () => {
                model.count++;
            });
            
            // Initial render
            display.text = `Count: ${model.count}`;
        };
        
        if (!spec.el) { compose(); }
    }
}
```

---

## 🔧 API Endpoints

```javascript
// In server.js (after server created)
server.on('ready', () => {
    // Simple function endpoint
    server.publish('/api/status', () => {
        return { status: 'ok', uptime: process.uptime() };
    });
    
    // Async endpoint
    server.publish('/api/data', async (req) => {
        const data = await fetch_data();
        return data;
    });
    
    server.start(8080);
});
```

---

## ⚠️ Known Issues (Check Before Working)

| Issue | Location | Impact |
|-------|----------|--------|
| Website publisher incomplete | `publishers/http-website-publisher.js` | Multi-page sites may fail |
| Multiple "ready" events | `server.js` start() | Race conditions |
| No default holding page | Server startup | Error on misconfiguration |
| `/admin` route not wired | Server startup | No admin interface |
| Inconsistent path naming | Various | `src_path_client_js` vs `disk_path_client_js` |

**Always check** `docs/agent-development-guide.md` for the current broken functionality tracker.

---

## 📁 Directory Structure

```
jsgui3-server/
├── server.js                 # Main server class
├── serve-factory.js          # Server.serve() API
├── cli.js                    # CLI interface
├── module.js                 # Package entry point
├── page-context.js           # Server-side page context
├── static-page-context.js    # Static rendering context
│
├── controls/                 # Built-in controls
│   ├── Active_HTML_Document.js  # Base control class
│   ├── page/                    # Page-specific controls
│   └── panel/                   # Panel controls
│
├── publishers/               # HTTP content handlers (14+ types)
│   ├── http-publisher.js           # Base class
│   ├── http-webpage-publisher.js   # Single-page apps
│   ├── http-website-publisher.js   # Multi-page sites
│   ├── http-function-publisher.js  # API endpoints
│   ├── http-css-publisher.js       # CSS serving
│   ├── http-js-publisher.js        # JavaScript serving
│   ├── http-html-publisher.js      # HTML serving
│   ├── http-png-publisher.js       # PNG images
│   ├── http-jpeg-publisher.js      # JPEG images
│   ├── http-svg-publisher.js       # SVG images
│   └── ...                         # + more specialized types
│
├── resources/                # Data abstractions
│   └── server-resource-pool.js
│
├── website/                  # Website/webpage abstractions
├── examples/controls/        # Example applications (numbered)
├── tests/                    # Test suite
└── docs/                     # Documentation
```

---

## 🧪 Testing

```bash
# All tests
npm test

# Specific test suites
npm run test:bundlers      # Bundling system
npm run test:publishers    # Publisher system  
npm run test:config        # Configuration validation
npm run test:e2e           # End-to-end tests
npm run test:errors        # Error handling
npm run test:content       # Content analysis
npm run test:performance   # Performance tests
npm run test:assigners     # Assigner tests

# Debug mode
npm run test:debug
npm run test:verbose
```

**Test patterns:**
- Test files: `tests/*.test.js`
- Use `tests/test-runner.js` as the runner
- Integration tests should start/stop server cleanly

---

## 📚 Documentation Index

| Need | Read |
|------|------|
| Quick start, architecture | `README.md` |
| Comprehensive API reference | `docs/comprehensive-documentation.md` |
| Server API design | `docs/simple-server-api-design.md` |
| System architecture | `docs/system-architecture.md` |
| Control development | `docs/controls-development.md` |
| Publisher system | `docs/publishers-guide.md` |
| Resources system | `docs/resources-guide.md` |
| Agent workflow patterns | `docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md` |
| **Broken functionality** | `docs/agent-development-guide.md` |
| CLI reference | `docs/cli-reference.md` |
| Troubleshooting | `docs/troubleshooting.md` |

---

## ❌ Anti-Patterns

### ❌ Don't bypass the context system
```javascript
// WRONG - Direct document access
document.getElementById('my-element');

// RIGHT - Use control's DOM abstraction
this.body.add.div({ id: 'my-element' });
```

### ❌ Don't forget conditional compose
```javascript
// WRONG - Always composes (breaks hydration)
constructor(spec = {}) {
    super(spec);
    compose();  // ← Will duplicate content when activating
}

// RIGHT - Conditional compose
constructor(spec = {}) {
    super(spec);
    const compose = () => { ... };
    if (!spec.el) { compose(); }  // ← Only compose if not hydrating
}
```

### ❌ Don't activate twice
```javascript
// WRONG - No guard
activate() {
    super.activate();
    // Bindings happen every time activate() is called
}

// RIGHT - Guard against double activation
activate() {
    if (!this.__active) {
        super.activate();
        // Bindings happen once
    }
}
```

### ❌ Don't serve without waiting for 'ready'
```javascript
// WRONG - May start before bundling complete
const server = new Server({ Ctrl, src_path_client_js });
server.start(8080);

// RIGHT - Wait for ready event
server.on('ready', () => {
    server.start(8080);
});

// OR use Server.serve() which handles this
Server.serve({ Ctrl, src_path_client_js, port: 8080 });
```

---

## 🔄 Development Workflow

1. **Check existing patterns** in `examples/controls/` before creating new features (naming: `N) description`)
2. **Follow the numbered example convention** (`1) window`, `2) two windows`, etc.) for new examples
3. **Update `docs/agent-development-guide.md`** when finding broken functionality
4. **Run relevant tests** before and after changes
5. **CSS goes on the control class** as a static `.css` property, not in separate files

---

## 🚀 Quick Recipes

### Add a new control
```bash
# Create in examples/controls/ using the naming convention:
# "N) descriptive name" where N is the next number
mkdir "examples/controls/15) window, my_feature"
# Add client.js (the control) and server.js (bootstrap)
```

### Debug bundling issues
```bash
JSGUI_DEBUG=1 node server.js
```

### Find CSS extraction issues
Check `bundler.extract_css_from_ctrl()` in bundler code - CSS must be a static property.

### Test a single publisher
```bash
npm run test:publishers
```

---

## 📝 Session Protocol

When working on this codebase:

1. **Check known issues first** — Read `docs/agent-development-guide.md` "Known Issues" section
2. **Document what you find** — Update the broken functionality tracker immediately
3. **Follow patterns** — Use examples in `examples/controls/` as reference
4. **Test your changes** — Run relevant test suites
5. **Update docs** — Keep implementation status current

---

## 🎯 Strategic Direction: Making jsgui3-server Well-Rounded

**Philosophy**: jsgui3-server is designed to be a *complete GUI delivery system*, not a general-purpose HTTP framework. Focus improvements on what makes it uniquely valuable: delivering interactive controls from server to browser with minimal boilerplate.

### 🔮 Observable-First Architecture (Key Differentiator)

jsgui3-server uses `fnl` observables throughout. This is not just an implementation detail — it's a **strategic advantage** that should be exposed at the API level.

#### Current Observable Infrastructure

**The `obs()` factory** from `fnl` creates observables with `next`, `complete`, `error` callbacks:

```javascript
const {obs} = require('fnl');

// Observable pattern used throughout jsgui3-server
const my_operation = obs((next, complete, error) => {
    // Emit intermediate results
    next({ progress: 50 });
    next({ progress: 100 });
    
    // Signal completion with final value
    complete({ result: 'done' });
    
    // Or signal error
    // error(new Error('something failed'));
    
    return []; // cleanup functions
});

// Consuming observables
my_operation.on('next', data => console.log('Progress:', data));
my_operation.on('complete', result => console.log('Done:', result));
my_operation.on('error', err => console.error('Failed:', err));
```

#### Where Observables Are Currently Used

| Location | Purpose |
|----------|---------|
| `publishers/http-observable-publisher.js` | **SSE streaming** — already implements Server-Sent Events! |
| `resources/processors/bundlers/webpage-bundler.js` | Multi-stage bundling with progress |
| `resources/processors/bundlers/js-bundler.js` | JS compilation progress |
| `resources/processors/bundlers/css-bundler.js` | CSS extraction progress |
| `publishers/http-website-publisher.js` | Website build pipeline |
| ESBuild bundlers | Async compilation with status updates |

#### Observable Publisher (Already Exists!)

`HTTP_Observable_Publisher` already implements SSE:

```javascript
// Server-side (existing code in http-observable-publisher.js)
const Observable_Publisher = require('./publishers/http-observable-publisher');

// Creates SSE endpoint that streams observable events
// Response format: text/event-stream with chunked transfer
// event: message\ndata: {"key": "value"}\n\n
```

#### Strategic Opportunity: Unified Observable API

**Current gap**: No easy way to publish an observable from `Server.serve()`. The infrastructure exists but isn't wired to the simple API.

**Proposed enhancement**:
```javascript
// Goal: Make this work seamlessly
server.publish('/api/progress', () => {
    return obs((next, complete, error) => {
        // Long-running operation with progress updates
        for (let i = 0; i <= 100; i += 10) {
            setTimeout(() => next({ progress: i }), i * 100);
        }
        setTimeout(() => complete({ status: 'done' }), 1100);
    });
});

// Function publisher should detect observable return type
// and automatically use SSE/WebSocket transport
```

**Client-side consumption** (future direction):
```javascript
// In browser, jsgui3-client could provide:
const stream = context.subscribe('/api/progress');
stream.on('next', data => update_progress_bar(data.progress));
stream.on('complete', result => show_complete(result));
```

#### Observable vs Promise vs Callback

| Return Type | Detection | Transport | Use Case |
|-------------|-----------|-----------|----------|
| **Observable** | Has `.on('next')` | SSE or WebSocket | Streaming, progress, real-time |
| **Promise** | `tf(result) === 'p'` | Single HTTP response | Async one-shot |
| **Plain value** | Object/string/array | Single HTTP response | Sync one-shot |

The `HTTP_Function_Publisher` already detects promises (`tfr === 'p'`). Extend to detect observables.

### What's Working Well (Don't Break These)

| Feature | Status | Why It Works |
|---------|--------|--------------|
| `Server.serve({ Ctrl })` | ✅ Solid | One-liner to serve a control — the core value proposition |
| HTTP_Webpage_Publisher | ✅ Solid | Bundles JS/CSS/HTML automatically |
| ESBuild bundling | ✅ Solid | Fast, reliable JS compilation |
| Function publishers | ✅ Solid | `server.publish('name', fn)` for JSON APIs |
| Control lifecycle | ✅ Solid | Isomorphic render → activate pattern |

### What Needs Completion (Highest Impact)

These are incomplete implementations that block real use cases:

#### 1. **HTTP_Website_Publisher** — Currently Broken
```
Location: publishers/http-website-publisher.js
Problem: Contains "Possibly missing website publishing code" — multi-page sites don't work
Impact: Users can't build multi-page apps without workarounds
```
**The fix**: Complete the bundling loop for `website.pages._arr.length > 1`. The code structure exists but throws `'NYI'`.

#### 2. **Default Holding Page** — Missing
```
Location: server.js constructor (when no Ctrl provided)
Problem: Server fails or serves nothing when started without content
Impact: Confusing first-run experience
```
**The fix**: Serve a minimal HTML page with "jsgui3-server running" + links to docs. This is a ~20 line addition.

#### 3. **Single "Ready" Signal** — Fragmented
```
Location: server.js start() method
Problem: Multiple places emit 'ready', unclear when truly ready
Impact: Race conditions, startup timing issues
```
**The fix**: Consolidate to one `this.raise('ready')` after all listeners bound. Remove redundant emissions.

### What Would Be Genuinely Useful (Medium Priority)

These align with jsgui3-server's purpose of delivering GUIs:

| Feature | Why It Fits | Approach |
|---------|-------------|----------|
| **Admin panel at `/admin`** | Server should be self-documenting | Wire up existing `Web_Admin_Panel_Control` |
| **Graceful shutdown** | Production readiness | Handle SIGINT, close HTTP servers, print confirmation |
| **Watch mode** | Development ergonomics | `cli.js dev` with file watching + auto-restart |

### What NOT to Add (Framework Bloat)

Resist adding features just because other frameworks have them:

| Avoid | Reason |
|-------|--------|
| Complex middleware chains | Express already exists; jsgui3 is for GUI delivery, not generic HTTP |
| Database integrations | Out of scope; users can add their own |
| Authentication systems | Too opinionated; provide hooks instead |
| Template engines (EJS/Pug) | jsgui3 controls ARE the templating system |
| REST scaffolding | Function publishers already handle this simply |

### The Litmus Test for New Features

Before adding anything, ask:

1. **Does it make serving a JSGUI3 control easier?** If not, probably don't add it.
2. **Can it be done in userland with existing APIs?** If yes, document the pattern instead.
3. **Does it work with the isomorphic lifecycle?** Server-render → client-activate must remain seamless.

### Recommended Next Steps (In Order)

1. **Fix HTTP_Website_Publisher** — unblocks multi-page apps
2. **Add default holding page** — improves first-run experience  
3. **Consolidate ready signal** — eliminates race conditions
4. **Wire up `/admin` route** — makes server self-documenting
5. **Add graceful shutdown** — production readiness
6. **Integrate Observable_Publisher into function publisher** — auto-detect observable returns and use SSE
7. **Client-side observable consumption** — `context.subscribe()` API in jsgui3-client

Each of these is a focused fix, not a large refactor. The codebase structure is sound; it just needs completion of existing patterns.

---

*Last updated: November 2025 - Added full stack documentation, strategic direction, and observable-first architecture*
