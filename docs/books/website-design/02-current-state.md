# Chapter 2: Current State

Both repos exist on NPM at version 0.0.8. Both are near-empty skeletons. This chapter documents the **exact, complete** code in each, and how `jsgui3-server` uses them today.

---

## 2.1 jsgui3-webpage

**Repository**: `github.com/metabench/jsgui3-webpage`  
**Version**: 0.0.8  
**Total source files**: 3 (Webpage.js, package.json, README.md)

### Webpage.js — the entire module

```js
/*
    Probably does not need to do very much apart from hold info for the moment.
    Could make subclasses do things like generare its specific parts from spec.
*/

class Webpage {
    constructor(spec) {
        Object.assign(this, spec);
    }
}

module.exports = Webpage;
```

That's it. A class that copies spec properties onto itself. No methods, no validation, no dependencies.

### package.json

```json
{
    "name": "jsgui3-webpage",
    "main": "Webpage.js",
    "license": "MIT",
    "comments": [
        "Just depend on jsgui3-html for the moment. This would be a website in the abstract sense.",
        { "jsgui3-html": "^0.0.139" }
    ],
    "dependencies": {},
    "version": "0.0.8"
}
```

`jsgui3-html` is mentioned in `comments` but is NOT an actual dependency. There are zero runtime dependencies.

### README.md

```
# jsgui3-webpage
A class that represents a webpage.
```

---

## 2.2 jsgui3-website

**Repository**: `github.com/metabench/jsgui3-website`  
**Version**: 0.0.8  
**Total source files**: 4 (Website.js, API.js, package.json, README.md)

### Website.js

```js
/*
    Probably does not need to do very much apart from hold info for the moment.
    Could make subclasses do things like generare its specific parts from spec.
*/
const API = require('./API');

class Website {
    constructor(spec) {
        Object.assign(this, spec);
        this.api = new API({ server: this.server });
    }
}

module.exports = Website;
```

Copies spec properties, then creates an API instance. The `this.server` reference comes from whatever was passed in the spec.

### API.js — contains a bug

```js
class API {
    constructor(spec) {
        this.server = spec.server;
    }

    publish(name, fn) {
        // Need to access the appropriate resource publisher.
        const {server} = this;
    }
}

MediaSourceHandle.exports = API
```

**Bug**: The last line says `MediaSourceHandle.exports` instead of `module.exports`. This is a typo (likely an autocomplete error) that will crash at runtime with `ReferenceError: MediaSourceHandle is not defined`. Any code that `require('./API')` will fail.

### package.json

```json
{
    "name": "jsgui3-website",
    "main": "Website.js",
    "license": "MIT",
    "comments": [
        "Just depend on jsgui3-html for the moment. This would be a website in the abstract sense.",
        { "jsgui3-html": "^0.0.139" }
    ],
    "dependencies": {},
    "version": "0.0.8"
}
```

Same pattern — zero actual dependencies.

### README.md

```
# jsgui3-website
A class that represents a website. Also has functionality to deploy the website.
```

---

## 2.3 How jsgui3-server Uses Them Today

`jsgui3-server` declares both as dependencies (`^0.0.8`) and uses them in several places:

### The re-export wrappers

```
jsgui3-server/website/website.js  →  module.exports = require('jsgui3-website')
jsgui3-server/website/webpage.js  →  module.exports = require('jsgui3-webpage')
```

Both files also contain dead code — `Obselete_Style_Website` and `Obselete_Style_Webpage` classes that are defined but never used elsewhere.

### Usage in server.js

**When a control is provided** (line 354):
```js
const wp_app = new Webpage({ content: Ctrl });
```
Creates a Webpage as a thin wrapper around a control constructor. The Webpage is then handed to `HTTP_Webpage_Publisher` for bundling.

**When no control is provided** (line 428):
```js
const ws_app = new Website(opts_website);
```
Creates a Website as a placeholder. Handed to `HTTP_Website_Publisher`.

### Usage in serve-factory.js

When multi-page serving is configured via the `pages` option:
```js
const webpage = new Webpage({ name, title, content, path });
```
Creates a Webpage per route and hands each to `prepare_webpage_route`.

### Usage in publishers

`http-website-publisher.js` type-checks:
```js
spec.website instanceof Website
```

And iterates pages via the internal `website.pages._arr` (Collection internals).

### The Admin UI pattern

The admin UI in `server.js` (lines 108–134, 167–327) shows a real-world pattern for adding a multi-route "app" to the server:

1. Create a `Webpage` with a control as content
2. Create an `HTTP_Webpage_Publisher` with that webpage
3. Listen for the publisher's `'ready'` event
4. Register the bundled output as static routes on the router

This pattern — Webpage → Publisher → Router — is the pipeline that any Website/Webpage design needs to work with.

---

## 2.4 What This Tells Us

1. **The classes are property bags** — `Object.assign(this, spec)` means anything goes in, nothing is validated
2. **The server constructs them internally** — users don't currently create Website/Webpage objects; the server does it behind the scenes
3. **The publisher pipeline is the real work** — the interesting code is in the publishers, not in the domain classes
4. **The API.js bug means Website construction actually crashes** — the `require('./API')` in Website.js will fail due to the export typo, meaning `new Website()` in the server only works because the API module isn't actually loadable (this is masked because the server may catch or not reach that code path)
5. **There's significant dead code** — the `Obselete_Style_*` classes and most of `http-website-publisher.js` (580+ lines of comments/stubs) are inactive
