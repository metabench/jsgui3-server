# Chapter 1: Introduction & Vision

## The Problem

`jsgui3-server` can serve web pages. You give it a control, it bundles it, wraps it in HTML, and serves it. That works well for single-page apps:

```js
Server.serve(My_Control);
```

But what about a website with multiple pages, API endpoints, static assets, metadata, and navigation? Today you pass a flat options object:

```js
Server.serve({
    pages: {
        '/': { content: Home },
        '/about': { content: About }
    },
    api: {
        'get-users': () => db.get_users()
    }
});
```

This works, but it's just configuration — a bag of options that the server interprets. There's no object you can hold, inspect, pass around, or ask questions of. You can't say "how many pages does this site have?" or "what are its API endpoints?" without knowing the internal structure of the options object.

## The Vision

Two sibling NPM packages — `jsgui3-website` and `jsgui3-webpage` — should provide **abstract representations** of websites and webpages. They describe *what* a site is, independent of *how* it gets served.

```
jsgui3-webpage    →   "a page has a path, title, content, and metadata"
jsgui3-website    →   "a website has pages, API endpoints, assets, and metadata"
jsgui3-server     →   "I know how to serve those"
```

## The Core Design Tension

There's a fundamental tension in this design:

### Simplicity vs. Capability

A Webpage could be as simple as:
```js
{ path: '/about', content: About_Control, title: 'About' }
```

Or as rich as an evented, observable, lifecycle-managed object with change tracking, validation, and introspection. The question is: how much machinery earns its keep?

### Abstraction vs. Coupling

These modules should be useful *without* jsgui3-server — maybe for a static site generator, a build tool, or just as a way to describe a site structure. But they also need to work well *with* jsgui3-server. More features means more coupling.

### Convention vs. Configuration

Should a Webpage default its path to `'/'`? Should it assume static rendering? Every default is convenient for the common case but can mask errors in complex cases.

## The Constraint

**These abstractions must remain optional.** `jsgui3-server` works today without them and must continue to do so. A developer who just wants `Server.serve(MyCtrl)` should never need to know about `Website` or `Webpage`. They are a useful layer for developers who want richer website definitions.

## How This Book is Organized

Each chapter explores a specific design dimension with multiple approaches. The goal is not to pick a winner but to lay out the tradeoffs clearly, so the best combination can emerge from informed discussion.

- **Chapter 2** documents what exists today
- **Chapters 3–7** explore specific design choices (base class, webpage, website, pages, API)
- **Chapter 8** covers server-side integration
- **Chapter 9** presents a cross-agent review
- **Chapter 10** lists open questions
- **Chapter 11** converges the discussion into a concrete recommended baseline

No code will be implemented until the design discussion converges.
