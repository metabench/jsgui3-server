# TODO

A living list of near-term work. PRs welcome.

## Now
- CLI wiring (no bin yet):
  - File: `cli.js` at repo root.
  - Commands:
    - `node cli.js serve [--port <n>] [--host <name>] [--root <path>]`
    - `node cli.js --help`
    - `node cli.js --version`
  - Behavior:
    - Starts the HTTP server using `server.js` exports.
    - Reads env overrides: `PORT`, `HOST`, `ROOT`.
  - NPM scripts:
    - "serve": `node cli.js serve`
    - "cli": `node cli.js`
- Add basic CLI tests with Node child_process. Cover `--help`, `--version`, and `serve --port 0` (ephemeral port) smoke.
  - VS Code Task: "Test: CLI" added to enable Always Allow.

- Controls suite (server-admin and general UI):
  - Stabilize and complete core controls for HTML documents:
    - Window (drag, z-order, resize), Panel, Tabbed_Panel
    - Inputs: Text_Input, Checkbox, Select, Date_Picker, Month_View
    - Menus: Menu, Menu_Button, Context_Menu
    - Layout primitives: Grid/Stack/Flex helpers
  - Patterns to standardize:
    - Constructor/activate lifecycle, context registration, data model binding
    - CSS as static property; shared themes; dark/light tokens
    - Accessibility: keyboard focus, ARIA attributes for inputs/menus
  - Documentation and demos:
    - Refresh `/examples/controls/*` to cover each control
    - Add an index demo page linking to all examples
  - Testing:
    - Minimal DOM-less unit tests for control logic (state transitions)
    - Screenshot smoke tests for a few controls (optional later)

- Server startup reliability:
  - Default holding page: serve a simple HTML page when no website content configured
  - Website publisher wiring: resolve "Possibly missing website publishing code." path in `publishers/http-website-publisher.js`
  - Emit clear ready signal from server (single "Server ready") once listeners are bound
  - Bind default host: prefer 127.0.0.1 unless `--host` provided; option to bind all IPv4
  - Ensure `/admin` route available by default with basic status panel

## Next
- Add watch/dev: `node cli.js dev` to run a website in watch mode (if applicable).
- Add config file support: jsgui.config.{js,json} and `--config`.
- Add logging levels: `--verbose`, `--quiet`.
- Add graceful shutdown: handle SIGINT/SIGTERM; print URL.
- Document options in README.

- Tests robustness (Windows):
  - Make CLI serve smoke tolerant to process termination exit codes on Windows (child.kill may yield code 1)
  - Prefer asserting on explicit "Server ready" line once implemented, and remove fallback matches

- Admin app and file manager:
  - Default admin UI available at `/admin` (protected later)
  - Status panel: routes, publishers, website pages, resource pool summary
  - File manager (local FS resource) to browse/serve a selected directory
  - Quick start flow: pick a folder to serve; set index file; hot reload optional

- CSS bundling tidy-up:
  - Ensure CSS is bundled once from all control classes
  - Fix legacy bundle paths; remove dead code (see NYI markers)

## Later
- Package as a real CLI (bin) when UX is stable.
- E2E tests with a sample website directory fixture.
- Optional: Windows service or PM2 integration for production.

- Deployment workflows:
  - `jsgui3-website` deploy function; multi-target hosting options
  - Wizard for first-time deployment

## Implementation notes
- Keep CLI self-contained and dependency-free.
- Parse argv manually to avoid adding libs.
- Respect Windows PowerShell usage; scripts should run on Windows/macOS/Linux.
- Expose a tiny contract from `server.js`:
  - Prefer a function `startServer(opts): { server, url, stop() }`.
  - If absent, require and invoke existing start method.
