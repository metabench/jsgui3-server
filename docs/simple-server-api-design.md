# Simple Server API Design

**Goal:** Make jsgui3-server trivially easy to use for simple cases while preserving full power for complex scenarios.

## Design Philosophy

1. **Progressive Disclosure** – Simple things should be simple; complex things should be possible
2. **Convention Over Configuration** – Smart defaults; minimal required config
3. **Consistent Patterns** – Same API shape at every scale
4. **Zero-to-Hero Path** – Clear upgrade path from simple to advanced
5. **Composable** – Mix and match features (pages, APIs, static files)

---

## Current Pain Points

### Boilerplate Example (Current)
Every example needs ~30 lines of identical code:

```javascript
const jsgui = require('./client');
const {Demo_UI} = jsgui.controls;
const Server = require('../../../server');

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });
    console.log('waiting for server ready event');
    server.on('ready', () => {
        console.log('server ready');
        server.start(52000, (err) => {
            if (err) throw err;
            console.log('server started');
        });
    });
}
```

### Problems:
- Manual path resolution (`require.resolve`)
- Hard-coded ports (no ENV var support)
- Verbose event handling (3 console.logs)
- No convention-based discovery
- Callback nesting
- Repetitive across all 42 examples

---

## Proposed API Layers

### Layer 0: Single Control (Simplest)

**Use Case:** Quick demo, single-page app, learning

```javascript
// Ultra-minimal – just serve a control
const Server = require('jsgui3-server');
const { MyControl } = require('./client').controls;

Server.serve(MyControl);
// Runs on port 8080, auto-discovers client.js in same directory
```

```javascript
// With port override
Server.serve(MyControl, { port: 3000 });
```

```javascript
// Explicit object notation
Server.serve({ 
    ctrl: MyControl, 
    port: 3000,
    host: 'localhost'
});
```

**Defaults:**
- Port: `8080` (or `process.env.PORT`)
- Host: All IPv4 interfaces (or `process.env.HOST`)
- Auto-discovers `client.js` in same directory as `server.js`
- Auto-bundles CSS/JS
- Routes: `/` → control, `/js/js.js` → bundled JS, `/css/css.css` → bundled CSS

---

### Layer 1: Single Page with Metadata

**Use Case:** Add page title, description, favicon, custom path

```javascript
Server.serve({
    page: {
        content: MyControl,
        title: 'My Awesome App',
        description: 'A jsgui3 application',
        path: '/',                    // Default
        favicon: './favicon.ico'      // Optional
    },
    port: 3000
});
```

**Benefits:**
- Proper HTML `<title>` and meta tags
- Explicit page configuration
- Still single-file simplicity

---

### Layer 2: Multiple Pages (Multi-Page App)

**Use Case:** Website with multiple routes, each with different content

```javascript
Server.serve({
    pages: {
        '/': { 
            content: HomeControl, 
            title: 'Home - My Site' 
        },
        '/about': { 
            content: AboutControl, 
            title: 'About Us' 
        },
        '/contact': { 
            content: ContactControl, 
            title: 'Contact' 
        }
    },
    port: 3000
});
```

**Auto-routing:**
- Each key becomes a route
- Shared JS/CSS bundle automatically included on all pages
- Pages can reference different client files if needed

---

### Layer 3: Pages + API Endpoints

**Use Case:** Frontend controls + backend API functions

```javascript
Server.serve({
    pages: {
        '/': { content: DashboardControl, title: 'Dashboard' }
    },
    api: {
        // GET/POST /api/hello
        'hello': (name) => `Hello ${name || 'World'}!`,
        
        // GET/POST /api/calculate
        'calculate': ({ a, b }) => ({ sum: a + b, product: a * b }),
        
        // Async function support
        'users': async () => {
            const users = await db.getUsers();
            return users;
        }
    },
    port: 3000
});
```

**API Conventions:**
- Routes prefixed with `/api/` automatically
- JSON input/output auto-parsed/serialized
- String returns sent as `text/plain`
- Object/Array returns sent as `application/json`
- Promises automatically awaited

---

### Layer 4: Pages + API + Static Files

**Use Case:** Full web application with assets

```javascript
Server.serve({
    pages: {
        '/': { content: HomeControl, title: 'Home' },
        '/gallery': { content: GalleryControl, title: 'Gallery' }
    },
    api: {
        'images': () => fs.readdirSync('./images').map(f => `/images/${f}`)
    },
    static: {
        '/images': './public/images',
        '/assets': './public/assets'
    },
    port: 3000
});
```

**Static file handling:**
- Automatic MIME type detection
- Efficient streaming for large files
- Optional caching headers
- Directory listing (configurable)

---

### Layer 5: Shorthand Routes (Mixed Types)

**Use Case:** Mix controls, functions, and static content flexibly

```javascript
Server.serve({
    routes: {
        '/': HomeControl,                    // Control at root
        '/dashboard': DashboardControl,      // Control at path
        '/api/time': () => new Date(),       // Function endpoint
        '/docs': './documentation'           // Static directory
    },
    port: 3000
});
```

**Auto-detection:**
- Control constructor → webpage
- Function → API endpoint
- String path → static directory
- Object with `content` → full page config

---

### Layer 6: Full Website Object

**Use Case:** Complex multi-page sites, existing `Website` instances

```javascript
const { Website, Webpage } = require('jsgui3-website');

const myWebsite = new Website({
    name: 'My Corporate Site'
});

myWebsite.pages.push(new Webpage({
    name: 'Home',
    title: 'Welcome',
    content: HomeControl,
    path: '/'
}));

myWebsite.pages.push(new Webpage({
    name: 'Products',
    title: 'Our Products',
    content: ProductsControl,
    path: '/products'
}));

Server.serve({
    website: myWebsite,
    api: { /* ... */ },
    static: { /* ... */ },
    port: 3000
});
```

**Benefits:**
- Full `Website` API available
- Compose complex structures programmatically
- Mix with API and static files
- Reuse website objects

---

### Layer 7: Legacy/Advanced (Current API)

**Still fully supported for maximum control:**

```javascript
const server = new Server({
    Ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    debug: true,
    https_options: { /* ... */ }
});

server.on('ready', () => {
    server.publish('endpoint', handler);
    server.start(port, callback);
});
```

---

## Convention-Based Defaults

### Auto-Discovery Rules

1. **Client JS:**
   - Look for `client.js` in same directory as `server.js`
   - Look for `index.js` with exported controls
   - Can be overridden with `clientPath` option

2. **Control Detection:**
   - If `client.js` exports single control → use it
   - If exports `controls.Demo_UI` → use Demo_UI
   - If exports multiple → use first in `controls` object
   - Can be overridden with `ctrl` option

3. **Port:**
   - Use `process.env.PORT` if set
   - Default to `8080`
   - Override with `port` option

4. **Host:**
   - Use `process.env.HOST` if set (single interface)
   - Default to all IPv4 interfaces
   - Override with `host` option

5. **Debug Mode:**
   - Use `process.env.JSGUI_DEBUG` if set
   - Default to `false`
   - Override with `debug` option

---

## Environment Variable Support

```bash
# Port
PORT=3000 node server.js

# Specific host/interface
HOST=127.0.0.1 node server.js

# Debug mode (verbose logging, no minification)
JSGUI_DEBUG=1 node server.js

# Combine
PORT=3000 HOST=localhost JSGUI_DEBUG=1 node server.js
```

---

## Async/Promise Support

### Callback Style (Legacy)
```javascript
Server.serve({ ctrl: MyControl, port: 3000 }, (err, server) => {
    if (err) throw err;
    console.log('Server running');
});
```

### Promise Style (Modern)
```javascript
const server = await Server.serve({ ctrl: MyControl, port: 3000 });
console.log('Server running on port', server.port);
```

### Event Style (Current)
```javascript
const server = Server.serve({ ctrl: MyControl, port: 3000 });
server.on('ready', () => console.log('Ready!'));
server.on('started', () => console.log('Started!'));
```

---

## Configuration File Support

### `jsgui.config.js` (Optional)

```javascript
module.exports = {
    port: 3000,
    host: 'localhost',
    debug: true,
    pages: {
        '/': { content: require('./controls/home'), title: 'Home' },
        '/about': { content: require('./controls/about'), title: 'About' }
    },
    api: {
        'hello': name => `Hello ${name}`
    },
    static: {
        '/assets': './public'
    }
};
```

**Usage:**
```javascript
// Reads jsgui.config.js automatically
Server.serve();

// Or specify config file
Server.serve({ config: './my-config.js' });

// Config file + overrides
Server.serve({ config: './my-config.js', port: 4000 });
```

---

## Special Modes

### Preview Mode
**Opens browser automatically, uses ephemeral port:**
```javascript
await Server.serve.preview({ ctrl: MyControl });
// Opens http://localhost:58392/ automatically
```

### Development Mode
**Auto-restart on file changes:**
```javascript
Server.serve.dev({
    ctrl: MyControl,
    watch: ['./client.js', './controls/*.js']
});
// Restarts when files change
```

### Build Mode
**Pre-bundle for production (no server start):**
```javascript
await Server.serve.build({
    ctrl: MyControl,
    output: './dist'
});
// Creates ./dist with bundled HTML/CSS/JS
```

---

## CLI Integration

### Serve Examples Directly
```powershell
# Serve a specific example
node cli.js serve-example "7) window, month_view" --port 3000

# Serve by client.js path
node cli.js serve-client ./examples/controls/7*/client.js --port 3000

# Serve current directory (auto-discover)
node cli.js serve --port 3000

# Preview mode (ephemeral port, auto-open browser)
node cli.js preview ./examples/controls/7*/client.js
```

---

## Error Messages

### Clear, Actionable Errors

**Before:**
```
TypeError: Cannot read property 'content' of undefined
```

**After:**
```
jsgui3-server: Control not found

Looking for a control to serve but none was specified.

Did you mean to:
  - Pass a control: Server.serve(MyControl)
  - Specify ctrl option: Server.serve({ ctrl: MyControl })
  - Create a client.js with exported controls?

Current directory: C:\Users\james\project
Searched for: client.js, index.js

See docs: https://github.com/metabench/jsgui3-server#quick-start
```

---

## Migration Path

### Current Example (30 lines)
```javascript
const jsgui = require('./client');
const {Demo_UI} = jsgui.controls;
const Server = require('../../../server');

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });
    console.log('waiting for server ready event');
    server.on('ready', () => {
        console.log('server ready');
        server.start(52000, (err) => {
            if (err) throw err;
            console.log('server started');
        });
    });
}
```

### New Example (3 lines)
```javascript
const Server = require('../../../server');
const { Demo_UI } = require('./client').controls;

Server.serve({ ctrl: Demo_UI, port: 52000 });
```

### Even Simpler (1 line)
```javascript
require('../../../server').serve(require('./client').controls.Demo_UI);
```

---

## Implementation Checklist

### Phase 1: Core `serve()` Method (Complete)
- [x] Add `Server.serve()` static method
- [x] Detect input type (Control, object)
- [x] Support `ctrl`, `page`, `pages` options
- [x] Handle port/host/debug options
- [x] Auto-discover client.js convention
- [x] Return a Promise that resolves with the server instance
- [x] Support Promise/async and callback patterns

### Phase 2: API & Static (Partially Complete)
- [x] `api` option for function publishing
- [x] Auto-prefix `/api/` routes
- [x] JSON/text content-type detection
- [ ] `static` option for directory serving
- [ ] MIME type detection for static files

### Phase 3: Enhanced Features (Partially Complete)
- [x] ENV var support (PORT, HOST, JSGUI_DEBUG)
- [ ] Config file support (`jsgui.config.js`)
- [ ] Improved error messages
- [x] Consolidated console output (reduce noise)

### Phase 4: Special Modes
- [ ] `Server.serve.preview()` – ephemeral port + browser open
- [ ] `Server.serve.dev()` – file watching + auto-restart
- [ ] `Server.serve.build()` – pre-bundle for production

### Phase 5: CLI Integration
- [ ] `node cli.js serve-example <name>`
- [ ] `node cli.js serve-client <path>`
- [ ] `node cli.js preview <path>`
- [ ] Auto-discovery in current directory

### Phase 6: Documentation
- [ ] Update README with new API
- [ ] Create migration guide
- [ ] Add API reference docs
- [ ] Update 2-3 examples as demos
- [ ] Keep legacy examples as-is (still valid)

---

## Example Conversions

### Example 1: Simple Window + Checkbox
**Before:**
```javascript
const jsgui = require('./client');
const {Demo_UI} = jsgui.controls;
const Server = require('../../../server');

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });
    console.log('waiting for server ready event');
    server.on('ready', () => {
        console.log('server ready');
        server.start(52000, (err) => {
            if (err) throw err;
            console.log('server started');
        });
    });
}
```

**After:**
```javascript
require('../../../server').serve({
    ctrl: require('./client').controls.Demo_UI,
    port: 52000
});
```

### Example 2: Month View with Title
**After (with page metadata):**
```javascript
require('../../../server').serve({
    page: {
        content: require('./client').controls.Demo_UI,
        title: 'JSGUI3 Month View Demo',
        description: 'Interactive calendar control example'
    },
    port: 52000
});
```

### Example 3: Multi-Control Dashboard
**After (multiple pages):**
```javascript
const { HomeControl, SettingsControl, ReportsControl } = require('./client').controls;

require('../../../server').serve({
    pages: {
        '/': { content: HomeControl, title: 'Dashboard' },
        '/settings': { content: SettingsControl, title: 'Settings' },
        '/reports': { content: ReportsControl, title: 'Reports' }
    },
    port: 52000
});
```

### Example 4: Dashboard with API
**After (pages + API):**
```javascript
const { DashboardControl } = require('./client').controls;

require('../../../server').serve({
    page: {
        content: DashboardControl,
        title: 'Analytics Dashboard'
    },
    api: {
        'metrics': () => ({
            users: 1234,
            revenue: 56789,
            growth: 0.23
        }),
        'data': async ({ range }) => {
            return await fetchAnalytics(range);
        }
    },
    port: 52000
});
```

---

## Backwards Compatibility

**All existing code continues to work unchanged:**

```javascript
// Current API - still fully supported
const server = new Server({
    Ctrl: Demo_UI,
    src_path_client_js: require.resolve('./client.js'),
    debug: true
});

server.on('ready', () => {
    server.publish('api', handler);
    server.start(52000, (err) => {
        if (err) throw err;
        console.log('server started');
    });
});
```

**Zero breaking changes. New API is purely additive.**

---

## Summary

### Before (Current)
- 30 lines of boilerplate per example
- Manual path resolution
- Hard-coded ports
- Verbose console output
- No conventions
- Callback nesting

### After (New)
- 1-5 lines for simple cases
- Auto-discovery of client.js
- ENV var support
- Clean, minimal output
- Progressive disclosure
- Promise/async support
- Still 100% backwards compatible

### Key Benefits
1. **Faster prototyping** – from idea to running in seconds
2. **Less boilerplate** – 90% reduction for simple cases
3. **Better defaults** – works out of the box
4. **Clearer intent** – code reads like configuration
5. **Easy scaling** – simple projects grow naturally
6. **Zero breaking changes** – all existing code still works
