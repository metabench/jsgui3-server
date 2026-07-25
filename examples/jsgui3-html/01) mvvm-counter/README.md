# MVVM Counter

This example is a small server-rendered counter that demonstrates the jsgui3
model/view-model binding helpers in an activated browser control.

## Run it

From the `jsgui3-server` repository root:

```bash
node "examples/jsgui3-html/01) mvvm-counter/server.js"
```

Open <http://127.0.0.1:52000/>. The example server is restricted to the local
loopback address.

## What to try

- Increment, decrement, and reset the count.
- Change the step to a value from 1 through 10 and observe the transformed
  display plus the computed sign and parity status.
- Enter an invalid step, such as `0`, and observe the validation message and
  disabled increment/decrement state.

The initial server-rendered page shows `Count: 0`. After browser activation,
the existing DOM is wired to the control's event handlers and model watchers;
the page is not rebuilt as a separate client-only application.

## Source map

- `client.js` defines `Counter_Control`, its data and view-data models,
  bindings, computed values, validation watcher, composition, activation, and
  the `Demo_UI` document wrapper.
- `server.js` bundles `client.js`, serves `Demo_UI`, and limits access to
  `127.0.0.1` on port 52000.
- `../../../tests/jsgui3-html-examples.puppeteer.test.js` exercises the browser
  interaction flow using
  `../../../tests/fixtures/jsgui3-html/counter_expectations.json`.

To run the focused browser test when Puppeteer/Chromium is available:

```bash
npx mocha tests/jsgui3-html-examples.puppeteer.test.js --grep "mvvm-counter"
```
