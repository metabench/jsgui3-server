# Data Grid

This example is a server-rendered, activated team directory. It demonstrates a
model-backed collection view with filtering, sorting, pagination, and stable
row selection.

## Run it

From the `jsgui3-server` repository root:

```bash
node "examples/jsgui3-html/04) data-grid/server.js"
```

Open <http://127.0.0.1:52000/>. Set `PORT` to choose another port. The server
stays loopback-only unless `HOST_ALL=1` is explicitly set, and its admin module
is disabled.

A public demonstration is currently recorded at
<http://141.144.193.218:52000/>. Its deployment and rollback record is owned by
`jsgui3-ecosystem/docs/deployments/ORACLE_DATA_GRID_DEMO.md`; consult that
record before treating the endpoint as permanent.

## What to try

- Search by a person's name or role.
- Select a row with a click, Enter, or Space and observe the model-backed
  selection status and `aria-selected` state.
- Sort by name, role, score, or joined date; selecting the active sort again
  reverses its direction.
- Move between the four-row pages and observe the result range and page state.

The server composes the initial table and metadata. Browser activation attaches
the interactions and re-renders the rows from the same state model as filters,
sort order, page, or selection changes.

## Source map

- `client.js` defines `Data_Grid_Control`, the sample records, derived page
  state, accessible row interactions, server composition, browser activation,
  and the `Demo_UI` document wrapper.
- `server.js` bundles and serves that document, supports `PORT`/`HOST_ALL`, and
  explicitly configures `admin: false`.
- `../../../tests/jsgui3-html-examples.puppeteer.test.js` exercises filtering,
  sorting, pagination, keyboard selection, labels, and live-region behavior
  using `../../../tests/fixtures/jsgui3-html/data_grid_expectations.json`.

To run the focused browser test when Puppeteer/Chromium is available:

```bash
npx mocha tests/jsgui3-html-examples.puppeteer.test.js --grep "data-grid"
```
