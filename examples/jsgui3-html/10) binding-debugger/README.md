# Binding Debugger

This example combines a small reactive counter with a diagnostics workbench for
inspecting binders, computed values, watchers, activity, and model snapshots.

## Run it

From the `jsgui3-server` repository root:

```bash
node "examples/jsgui3-html/10) binding-debugger/server.js"
```

Open <http://127.0.0.1:52000/>. The example server is restricted to the local
loopback address.

## What to try

- Increase or decrease the counter, then change its step size or signal label
  and observe the bound and computed output.
- Enable diagnostics and inspect the binder/computed/watcher summary plus the
  most recent model-change activity.
- Capture a model snapshot, change some state, and compare the current model
  with the captured snapshot.
- Refresh the summary or pause diagnostics independently of the counter.

The control is composed on the server with its initial diagnostics. Browser
activation reconnects the existing DOM to the reactive models and debugger
actions. When the installed `jsgui3-html` exposes `BindingDebugTools`, the
example uses it; otherwise the example's bounded fallback provides the same
demonstration surface.

## Source map

- `client.js` defines `Binding_Debugger_Control`, debugger selection/fallback,
  bindings, computed state, watchers, snapshots, composition, activation, and
  the `Demo_UI` document wrapper.
- `server.js` bundles `client.js`, serves `Demo_UI`, and limits access to
  `127.0.0.1` on port 52000.
- `../../../tests/jsgui3-html-examples.puppeteer.test.js` checks the initial
  binding summary, model-change log, and debugger enable flow using
  `../../../tests/fixtures/jsgui3-html/binding_debugger_expectations.json`.

To run the focused browser test when Puppeteer/Chromium is available:

```bash
npx mocha tests/jsgui3-html-examples.puppeteer.test.js --grep "binding-debugger"
```
