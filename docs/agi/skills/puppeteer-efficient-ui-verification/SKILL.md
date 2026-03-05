---
name: puppeteer-efficient-ui-verification
description: Fast, repeatable UI verification using Puppeteer without paying browser startup per test. Use scenario suites + deterministic fixtures before jumping to full E2E tests.
---

# Puppeteer Efficient UI Verification

## Scope

- Choose the fastest *correct* browser-level verification method
- Run multiple UI scenarios per browser session (scenario suites)
- Capture evidence (artifacts + console/network logs) so failures are actionable

## Inputs

- What changed (files / feature)
- Do you need browser semantics (events, CSS/layout, client bundle activation)?
- Do you need a deterministic fixture (DB seed, synthetic page)?

## Procedure (verification ladder)

1. Prefer server-side/SSR checks when possible
   - If the change is server-only or SSR-only, create/run a check script that loads the module and verifies output.
   - If the change touches server startup, start the server and verify it responds:
     ```bash
     node -e "const s = require('./server'); console.log('Server module loaded OK')"
     ```

2. If you need "one URL in a browser", use a simple Puppeteer script
   - Navigate to the page, wait for a key selector, capture screenshot + console logs.
   - Best for quick debugging of console errors and 404s.

3. If you need multiple interactions, use a scenario suite (single browser)
   - Use a runner script that starts one browser and runs multiple scenarios sequentially.
   - Each scenario navigates, waits for readiness, and asserts conditions.
   - Artifacts are written to `tmp/ui-scenarios/` by default.

4. Promote to full E2E test when it's a regression
   - Add a proper test file in `tests/`.

## Suite authoring SOP (deterministic fixtures)

When creating a new scenario suite:

1. Create a runner script under `tests/scenarios/` or `scripts/scenarios/`.
2. Export `start_server()` that:
   - starts the server on port `0` (random port)
   - returns `{ base_url, shutdown() }`
3. Add scenarios with stable ids (`"001"`, `"002"`, …).
4. Add **readiness gates** for client activation (jsgui3):
   - prefer `page.waitForFunction()` on deterministic signals
5. On failures, ensure you have evidence:
   - screenshot + HTML snapshot + captured logs

## Validation

- Scenario suite run exits cleanly (no hanging server/browser)
- At least one scenario validates the user-visible invariant
- Failures produce artifacts that explain the bug (not just "timeout")

## References

- Test directory: `tests/`
- jsgui3 activation flow: `docs/comprehensive-documentation.md`
- Control lifecycle: see `understanding-jsgui3` skill
