# Example screenshot harness

Runs every runnable example under `examples/` in a real child process (`node server.js`,
just like a user would), waits for the HTTP server to come up, loads the page in headless
puppeteer, and captures a PNG screenshot plus diagnostics.

## Usage

```bash
node tools/example-screenshots/run.js                 # run all examples
node tools/example-screenshots/run.js --only grid     # only examples whose path contains "grid"
node tools/example-screenshots/run.js --timeout 120   # per-example readiness timeout (seconds)
```

Or via npm:

```bash
npm run screenshot:examples
```

## How discovery works

An example is considered runnable when it is either:

- a `server.js` file anywhere under `examples/` (excluding `__old/`), or
- any other `.js` file that contains a `require.main === module` gate **and** requires
  the repo's `server` module via a relative path (e.g. `examples/color_palette.js`,
  `examples/grids/grid_1.js`).

`client.js` / `*_client.js` files are never treated as entries.

## How it runs

Almost every example hardcodes port 52000, so examples run **sequentially**: spawn the
entry script, poll `http://127.0.0.1:<port>/` until it responds, screenshot, then kill
the whole child process tree (`taskkill /T /F` on Windows — the esbuild service is a
grandchild) and wait for the port to free before the next example.

The port is determined from the example source, in priority order: `.start(<port>)`,
`process.env.PORT ... || <port>`, `port: <port>` / `port = <port>`, else 52000 — and
corrected live from server stdout (`http://127.0.0.1:<port>`, `localhost:<port>`,
`port <port>`), which covers examples that pick nonstandard ports like 52021 or 8090.

Filtered (`--only`) re-runs merge into the existing `report.json` by example name, so a
partial re-run updates the full report in place rather than overwriting it.

Any HTTP response counts as "ready" — including 404s from API-only examples — so those
still get screenshotted and can be judged from the report.

## Output

Everything lands in `tools/example-screenshots/output/` (gitignored):

- `<example-name>.png` — 1280×800 viewport screenshot, taken 2.5s after `networkidle2`
  so client-side activation and canvas rendering have settled
- `report.json` — full per-example diagnostics: status, HTTP status, page title, body
  text length/sample, console errors, page errors, failed requests, server stdout/stderr
  tails, timing
- `report.md` — one-line-per-example summary table (✅ clean / ⚠️ captured with errors /
  ❌ failed to capture)

The report is rewritten after each example, so a partial/interrupted run still leaves a
usable report.

## Statuses

- `screenshot_captured` — page loaded and PNG saved (check error counts for quality)
- `server_exited` — the child process died before ever answering HTTP (crash on startup)
- `timeout_waiting_for_server` — never became reachable within the timeout
- `skipped_port_busy` — the target port was already occupied before launch
- `error` — harness/puppeteer error while loading or screenshotting
