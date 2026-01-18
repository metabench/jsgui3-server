# Agent Playbooks

These playbooks are optimized for low thinking time execution.

## Playbook: Add a MVVM Binding
**Goal**: Wire model values to inputs and derived UI.
1. Confirm `this.data.model` and `this.view.data.model` exist.
2. Add `watch` handlers for input controls.
3. Add `computed` fields for derived labels.
4. Verify with a server render probe.

## Playbook: Build a New Control Example
**Goal**: Add a new example with end-to-end delivery.
1. Create `examples/.../client.js`.
2. Extend `Active_HTML_Document` and compose under `!spec.el`.
3. Export control in `jsgui.controls`.
4. Add to `tests/examples-controls.e2e.test.js`.
5. Run the targeted test.

## Playbook: Fix a Bundler Failure
**Goal**: Ensure bundler completes and static routes are available.
1. Inspect `resources/processors/bundlers/...` for early exits.
2. Ensure errors call `complete(...)` with a bundle object.
3. Run `tests/bundlers.test.js`.

## Playbook: Improve Full-Stack Control Usage
**Goal**: Ensure controls render and activate correctly.
1. Validate `Active_HTML_Document` composition and CSS.
2. Confirm JS/CSS routes exist via `HTTP_Webpage_Publisher`.
3. Run the e2e and puppeteer tests.
