---
name: understanding-jsgui3
description: Standard Operating Procedure for interacting with the jsgui3 ecosystem. Use this skill when asked to build or debug UI components, or when you are confused about how the server-side rendering and client-side activation pipeline works.
---

# Understanding the jsgui3 Ecosystem

## Scope

This Skill provides the fundamental mental model for `jsgui3`, a custom, isomorphic (server and client) UI framework. This is the **home repository** for jsgui3-server. Agents must understand this framework deeply to work effectively here. It is *not* React, Vue, or Svelte, and agents must not attempt to apply paradigms from those frameworks.

## Triggers

- "Create a new jsgui3 control"
- "Fix the UI"
- "Why isn't my click event firing?"
- "How does server-side rendering work?"

## Core Mental Model

`jsgui3` is an **Object-Oriented, Isomorphic DOM Wrapper**. 
Every HTML element is represented as a JavaScript class instance (a `Control`).

1.  **Server-Side Rendering (SSR):** The server instantiates `Control` classes, sets their properties (text, CSS classes), and calls `.all_html_render()`. The resulting HTML string is sent to the client.
2.  **Activation (Hydration):** The server also sends a JSON payload representing the control hierarchy. The client reads this JSON, re-instantiates the `Control` classes in the browser, finds the existing DOM nodes, and attaches the JavaScript objects to them (this is called "activation").
3.  **Event-Driven:** Once activated, interaction is handled via events (`this.on('click', ...)`), not via declarative template bindings (like `onClick={...}`).

## Key Ecosystem Packages

- **`jsgui3-html`**: The core package. Contains the base `Control` class and all standard HTML elements (e.g., `div`, `span`, `button`) wrapped as classes. Also contains advanced composite controls (like `Data_Grid` or `Color_Picker`). Located in `node_modules/jsgui3-html/`.
- **`jsgui3-server`** (this repo): Handles serving the HTML, packaging the client-side JavaScript bundle, and routing endpoints. Core files: `server.js`, `serve-factory.js`.
- **`jsgui3-client`**: The engine that runs in the browser, handling the activation phase to re-hydrate the SSR'd HTML. Located in `node_modules/jsgui3-client/` (or `client/`).

## Key Files in This Repository

- **`server.js`**: Main server class — HTTP server, WebSocket support, bundling, routing.
- **`serve-factory.js`**: Factory for creating server instances with configure-and-go patterns.
- **`publishers/`**: Publisher system for serving pages, resources, and APIs.
- **`controls/`**: Custom control definitions.
- **`resources/`**: Resource abstractions for data access.
- **`middleware/`**: Middleware pipeline (compression, etc.).
- **`admin-ui/`**: Built-in admin interface.
- **`examples/`**: Working examples of jsgui3-server usage.
- **`labs/`**: Experimental features and testing.

## Methodology for Building & Debugging

### 1. Identify the Phase (SSR vs. Active)
When debugging a UI issue, you must first determine if the problem is in the Server-Side Rendering phase or the Client-Side Activation phase.
- If the HTML is wrong or missing when you View Source, it is an **SSR bug**. Look at the `render()` or constructor logic on the server.
- If the HTML looks right, but buttons don't click or data doesn't update, it is an **Activation bug**. (See the `jsgui3-activation-debug` skill). 

### 2. Follow the Control Lifecycle
When creating a new control, always follow this pattern:
1. Extend `Control` (or a specific element like `div`).
2. Implement the `constructor(spec)`. Call `super(spec)` first.
3. Define the DOM structure (add child controls).
4. Implement `activate()`. This is where you bind browser events (`this.on('click')`). Remember to call `super.activate()`!

### 3. Use the Built-in Abstractions
Instead of raw DOM manipulation (`document.getElementById`), use `jsgui3`'s abstractions:
- Adding classes: `this.add_class('my-class')`
- Setting attributes: `this.dom.attributes.set('data-id', id)`
- Finding children: `this.find(':div')` (Note the idiosyncratic selector syntax).

## Anti-Patterns to Avoid

- **The React Paradigm**: Trying to use state hooks, JSX, or declarative template rendering. `jsgui3` is imperative and object-oriented.
- **Raw DOM Manipulation on the Server**: Attempting to use `document.querySelector` inside a component's constructor on the server side (the `document` object does not exist in Node.js).
- **Forgetting `super.activate()`**: Writing an `activate()` method and failing to call `super.activate()`, which breaks the downward activation chain for all child controls.
- **Modifying Node Modules**: Blindly editing inside the `node_modules/jsgui3-html` folder instead of making changes to the actual package source repo and reinstalling.

## Validation

- Do you explicitly understand whether you are writing code that will run on the Server, the Client, or both?
- Are your UI components extending the base `Control` class?
- Have you checked the comprehensive documentation at `docs/comprehensive-documentation.md`?

## References

- Comprehensive docs: `docs/comprehensive-documentation.md`
- System architecture: `docs/system-architecture.md`
- Controls development: `docs/controls-development.md`
- API design: `docs/simple-server-api-design.md`
- Related skills: `jsgui3-activation-debug`, `jsgui3-context-menu-patterns`
