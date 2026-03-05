# JSGUI3 Minification, Compression & Sourcemaps Test Suite

This comprehensive test suite validates the minification, compression, and sourcemap features implemented in JSGUI3 Server.

## Overview

The test suite covers all aspects of the Phase 1 implementation:

- **Component Isolation Tests**: Test each bundler, assigner, and publisher in isolation
- **Configuration Validation Tests**: Test all configuration options and validation
- **End-to-End Integration Tests**: Run full server and test HTML/CSS/JS serving
- **Content Analysis Tests**: Examine served content for proper minification, compression, and sourcemaps
- **Performance Tests**: Test compression ratios and response sizes
- **Error Handling Tests**: Test invalid configurations and edge cases

## Test Structure

```
tests/
├── bundlers.test.js              # Component isolation tests for bundlers
├── assigners.test.js             # Component isolation tests for assigners
├── publishers.test.js            # Component isolation tests for publishers
├── configuration-validation.test.js  # Configuration validation tests
├── admin-ui-render.test.js       # Admin page render regression test
├── admin-ui-jsgui-controls.test.js # Admin shell interaction + control-first regression test
├── serve.test.js                 # Server.serve core behavior tests
├── serve-resources.test.js       # Server.serve + resource integration tests
├── process-resource.test.js      # Process_Resource lifecycle and restart tests
├── remote-process-resource.test.js # Remote_Process_Resource polling/recovery tests
├── server-resource-pool.test.js  # Resource pool lifecycle and event forwarding tests
├── http-sse-publisher.test.js    # HTTP_SSE_Publisher protocol/lifecycle tests
├── end-to-end.test.js            # Full integration tests
├── content-analysis.test.js      # Content analysis and verification
├── performance.test.js           # Performance benchmarks
├── error-handling.test.js        # Error handling and edge cases
├── small-controls-bundle-size.test.js # Bundle-size and window-marker elimination checks
├── control-elimination-static-bracket-access.test.js # Static-vs-dynamic bracket access elimination regression (including bracket-derived controls aliases)
├── control-elimination-root-feature-pruning.test.js # Optional jsgui root-feature pruning + Resource alias auto-selection regression
├── control-optimizer-cache-behavior.test.js # Optimizer cache enable/disable behavior
├── control-scan-manifest-regression.test.js # Manifest snapshot regression for control scan details
├── examples-controls.e2e.test.js # Example apps regression (controls)
├── sass-controls.e2e.test.js     # Sass/CSS controls E2E coverage
├── playwright-smoke.test.js       # Playwright browser smoke test for local page serving
├── jsgui3-html-examples.puppeteer.test.js # Puppeteer interaction tests (jsgui3-html examples)
├── bundling-default-control-elimination.puppeteer.test.js # Puppeteer: default control elimination bundle checks
├── project-local-controls-bundling.puppeteer.test.js # Puppeteer: project-local control bundling + elimination safety
├── window-examples.puppeteer.test.js # Puppeteer interaction tests (window examples)
├── window-resource-integration.puppeteer.test.js # Browser E2E: controls + resource APIs + SSE
├── helpers/puppeteer-e2e-harness.js # Shared Puppeteer story runner + probes
├── helpers/playwright-e2e-harness.js # Shared Playwright story runner + probes
├── test-runner.js                # Custom test runner with reporting
└── README.md                     # This file
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Using the custom test runner
node tests/test-runner.js --test=bundlers.test.js

# Optimizer cache behavior
node tests/test-runner.js --test=control-optimizer-cache-behavior.test.js

# Static-vs-dynamic bracket access elimination
node tests/test-runner.js --test=control-elimination-static-bracket-access.test.js

# Optional jsgui root-feature pruning
node tests/test-runner.js --test=control-elimination-root-feature-pruning.test.js

# Admin UI shell interaction regression
node tests/test-runner.js --test=admin-ui-jsgui-controls.test.js

# Using mocha directly
npx mocha tests/bundlers.test.js
```

NPM shortcuts:

```bash
npm run test:bundler:elimination:static-brackets
npm run test:bundler:elimination:root-features
```

### Run Example Apps Regression Suite
```bash
npm run test:examples:controls
```

### Run Puppeteer Window Example Tests
```bash
npm run test:puppeteer:windows
```

### Run Puppeteer Bundling Elimination Tests
```bash
npm run test:puppeteer:bundling
```

### Run Puppeteer Project-Local Control Bundling Tests
```bash
npm run test:puppeteer:project-local-controls
```

### Run Puppeteer Resource Integration Tests
```bash
npm run test:puppeteer:resources
```

### Install Playwright Browser Runtime
```bash
npm run test:playwright:install
```

### Run Playwright Smoke Test
```bash
npm run test:playwright:smoke
```

### Run Tests with Options
```bash
# Debug mode (enables sourcemaps)
node tests/test-runner.js --debug

# Verbose output
node tests/test-runner.js --verbose

# Specific test with debug
node tests/test-runner.js --test=end-to-end.test.js --debug
```

## Recommended Testing Workflow

1. Run a focused suite first (fast feedback).
2. Run the example regression suite next (HTML/CSS/JS smoke checks).
3. Run Puppeteer interaction tests last (heavier, requires a browser).
4. Run the resource integration Puppeteer suite when changing resources/SSE APIs.
5. Run the Playwright smoke test to validate alternate browser automation coverage.
6. Run the full suite only when changes are broad or before release.

Suggested sequence:
```bash
node tests/test-runner.js --test=bundlers.test.js
npm run test:examples:controls
npm run test:puppeteer:bundling
npm run test:puppeteer:project-local-controls
npm run test:puppeteer:windows
npm run test:puppeteer:resources
npm run test:playwright:smoke
npm test
```

## Bundle Size Metric Semantics

- Tests that report `js_bytes` or `css_bytes` are reporting **raw uncompressed UTF-8 byte lengths** from emitted bundle text (`Buffer.byteLength(...)`).
- These are **not** gzip/brotli transfer sizes.
- Compression sizes are validated separately through response buffer assigners and content-negotiation tests (`gzip`, `br`, `identity`).

## Control Scan Manifest Fields

`bundle.bundle_analysis.jsgui3_html_control_scan` exposes scan diagnostics used by elimination tests, including:

- `selected_controls`
- `selected_root_features`
- `dynamic_control_access_detected`
- `dynamic_resource_access_detected`

`dynamic_resource_access_detected` indicates conservative fallback for unresolved `Resource` alias dynamic access (for example `resource_api[name]`), where control elimination remains enabled but full `Resource` sub-features are retained for safety.

`bundle.bundle_analysis.esbuild_warnings` contains normalized warning records from esbuild (`id`, `text`, `location`) used by Puppeteer bundling warning-policy checks.

## Esbuild Warning Policy (Bundling E2E)

Bundling Puppeteer E2E suites enforce a warning policy over esbuild output:

- Warning records are read from `server_instance.latest_wp_bundle.bundle_analysis.esbuild_warnings`.
- Any warning header not in the allowlist fails the test.
- Current allowlist intentionally permits only known case-path warnings (`[different-path-case]`) in elimination-disabled or explicit Window scenarios.
- Controls-only default elimination scenarios are expected to emit zero esbuild warnings.

## Advanced Puppeteer E2E Methodology

For high-value interaction and integration coverage, use the shared harness:

- `tests/helpers/puppeteer-e2e-harness.js`

Key patterns:

- Write deterministic interaction stories with `run_interaction_story(...)` and named steps.
- Add browser probes (`console`, `pageerror`, `requestfailed`) and assert they stay clean.
- Assert both UI state and server truth for integration cases.
- For resource flows, validate both:
  - API actions (`/api/resource/*`) and
  - SSE propagation (`/events`) reflected in client UI/debug state.
- Keep selectors stable (`id` or `data-test`) so interaction tests remain robust.

## Playwright Support

Playwright support follows the same server-first test model as Puppeteer:

- `tests/playwright-smoke.test.js` validates that Playwright can open a served page and load JS/CSS bundles.
- `tests/helpers/playwright-e2e-harness.js` mirrors probe/story helpers so new Playwright interaction tests can be added with minimal boilerplate.
- Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if you need to force a specific Chromium binary.

## Patterns That Work

- Use per-test temporary client files and delete them in `finally`.
- Always close servers in `finally` to avoid port leaks.
- Prefer `get_free_port` over hard-coded ports.
- Keep style config explicit in tests that validate sourcemaps.
- Inject Sass overrides via `style.scss_sources` when testing themes.

## Antipatterns To Avoid

- Copying `node_modules` between Windows and WSL or across OSes.
- Leaving servers running after a failed test (leaks ports and state).
- Tests that rely on global bundler state or implicit ordering.
- Hard-coded ports or shared temp file names across tests.

## Common Failure Signatures

- `waiting for wp_publisher ready` + test timeout usually means the JS/CSS bundler failed before the server emitted `ready`. Check for esbuild or Sass errors earlier in the log.
- `You installed esbuild for another platform` indicates a native esbuild binary mismatch (see troubleshooting docs).

## Test Coverage

### 1. Component Isolation Tests (`bundlers.test.js`, `assigners.test.js`, `publishers.test.js`)

Test each component independently:

- **Bundlers**: ESBuild integration, minification levels, sourcemap generation
- **Assigners**: Compression algorithms, statistics tracking, threshold handling
- **Publishers**: Configuration validation, component integration

### 2. Configuration Validation Tests (`configuration-validation.test.js`)

Validate all configuration options:

- Minification levels (`conservative`, `normal`, `aggressive`)
- Compression algorithms (`gzip`, `br`) and settings
- Sourcemap formats (`inline`, `external`) and conditions
- Threshold and exclusion rules
- Type validation and error messages

### 3. End-to-End Integration Tests (`end-to-end.test.js`)

Full server integration testing:

- HTTP server startup with various configurations
- Content negotiation (gzip/br/identity)
- Minification and compression pipeline
- Concurrent request handling
- Error scenarios (port conflicts, invalid configs)

### 4. Content Analysis Tests (`content-analysis.test.js`)

Verify content integrity and correctness:

- Minification effectiveness and ratios
- Compression integrity (decompression verification)
- Sourcemap generation and validation
- CSS extraction and preservation
- Bundle content structure

### 5. Performance Tests (`performance.test.js`)

Benchmark and analyze performance:

- Bundling speed across different file sizes
- Compression performance (gzip vs brotli)
- Memory usage analysis
- Server response times
- Concurrent operation handling

### 6. Error Handling Tests (`error-handling.test.js`)

Comprehensive error scenario testing:

- Invalid JavaScript syntax
- File system errors (permissions, missing files)
- Configuration validation errors
- Network and HTTP errors
- Memory and performance limits
- Encoding issues

### 7. Examples/Controls E2E Tests (`examples-controls.e2e.test.js`)

Regression coverage for a representative set of `examples/controls/*` apps:

- Boots a server per example control
- Verifies `/`, `/js/js.js`, and `/css/css.css` routes
- Ensures HTML rendering works without `Accept-Encoding`

### 8. Puppeteer Window Example Tests (`window-examples.puppeteer.test.js`)

Browser-level interaction checks for selected window examples:

- Minimize/restore window state (class toggling)
- Tabbed panel tab switching visibility
- Checkbox label toggling checked state
- Date picker month header rendering

### 9. Sass/CSS Controls E2E Tests (`sass-controls.e2e.test.js`)

Server-level integration tests for controls that define `.scss` or `.sass` styles:

- Verifies CSS + SCSS mixing order in bundled CSS output
- Confirms indented Sass compiles and is removed from JS bundles
- Checks inline CSS sourcemaps include original Sass/SCSS sources
- Ensures mixed CSS + Sass output preserves order without emitting inaccurate sourcemaps
- Confirms server `scss_sources` overrides are applied during compilation

Note: These tests are skipped if the `sass` dependency is not installed.

### 10. JSGUI3-HTML Example Puppeteer Tests (`jsgui3-html-examples.puppeteer.test.js`)

Browser-level interaction checks for jsgui3-html examples:

- MVVM counter interactions, bindings, and validation state

### 11. Window Resource Integration Puppeteer Tests (`window-resource-integration.puppeteer.test.js`)

Browser-level interaction checks that combine controls and server resources:

- Step-driven control interactions (date + datetime controls)
- Client actions invoking resource lifecycle APIs (`start`, `stop`, `restart`)
- SSE resource state events reflected in client UI
- Cross-checking client-observed state with server resource pool state

### 12. Project-Local Controls Bundling Puppeteer Tests (`project-local-controls-bundling.puppeteer.test.js`)

Browser-level and bundle-content coverage for app-specific controls defined in project files:

- Bundles project-local custom controls and transitive local helpers
- Verifies project-local DOM markers render from the bundled app
- Verifies project-local CSS classes are extracted into `/css/css.css`
- Verifies default elimination removes unused Window markers for the same app
- Confirms default elimination produces a smaller JS bundle than elimination-disabled mode for the same app

### 13. Core Resource and Serve Reliability Tests

- `admin-ui-render.test.js` validates the admin page control renders without clobbering control internals
- `admin-ui-jsgui-controls.test.js` validates admin shell interactions, custom section nav refresh, retry/logout control behavior, and SSE open/error/heartbeat handling
- `serve.test.js` validates `Server.serve` startup/route readiness behavior
- `serve-resources.test.js` validates in-process and process resource wiring in serve mode
- `process-resource.test.js` validates direct process lifecycle + crash restart handling
- `remote-process-resource.test.js` validates polling, unreachable, and recovered transitions
- `server-resource-pool.test.js` validates pool forwarding, remove/stop, and summaries
- `http-sse-publisher.test.js` validates SSE broadcast/send/replay/keepalive semantics

## Configuration Examples

### Basic Minification
```javascript
Server.serve({
    ctrl: MyControl,
    debug: false,  // Enables minification
    bundler: {
        minify: {
            enabled: true,
            level: 'normal'
        }
    }
});
```

### Full Optimization Pipeline
```javascript
Server.serve({
    ctrl: MyControl,
    debug: false,
    bundler: {
        minify: {
            enabled: true,
            level: 'aggressive',
            options: {
                drop_console: true
            }
        },
        sourcemaps: {
            enabled: true,
            format: 'inline'
        },
        compression: {
            enabled: true,
            algorithms: ['gzip', 'br'],
            threshold: 1024
        }
    }
});
```

## Test Results and Reporting

The test runner generates:

- **Console Output**: Real-time test progress and results
- **JSON Report**: Detailed results saved to `test-report.json`
- **Summary Statistics**: Pass/fail counts, success rates, timing

### Sample Output
```
🚀 Starting JSGUI3 Minification, Compression & Sourcemaps Test Suite

================================================================================
📋 Running bundlers.test.js...
✅ bundlers.test.js passed
📋 Running assigners.test.js...
✅ assigners.test.js passed
...
================================================================================
📊 TEST SUMMARY
================================================================================
Total Test Suites: 8
✅ Passed: 8
❌ Failed: 0
⚠️  Skipped: 0
⏱️  Duration: 45.23s
📈 Success Rate: 100.0%

🎉 All tests passed! The minification, compression, and sourcemap features are working correctly.
```

## Environment Requirements

- Node.js >= 15.0.0
- Mocha test framework (included in package.json)
- ESBuild (included in package.json)
- zlib (built-in Node.js module)
- Puppeteer (dev dependency; set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Chromium if downloads are disabled)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Tests use specific ports (3001-3005). Ensure these are available.

2. **Memory issues**: Large content tests may require increased Node.js memory:
   ```bash
   node --max-old-space-size=4096 tests/test-runner.js
   ```

3. **File permissions**: Tests create temporary files. Ensure write permissions in the tests directory.

4. **Slow tests**: Performance tests may take longer on resource-constrained systems.

### Debug Mode

Enable debug mode for additional logging:
```bash
export JSGUI_DEBUG=1
node tests/test-runner.js
```

## Contributing

When adding new tests:

1. Follow the existing naming convention: `*.test.js`
2. Add the new test file to `test-runner.js`
3. Update this README with new test descriptions
4. Ensure tests are isolated and don't interfere with each other
5. Include both positive and negative test cases

## Integration with CI/CD

The test suite is designed to work with continuous integration:

```yaml
# Example GitHub Actions
- name: Run Test Suite
  run: npm test

- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: test-report.json
```

This ensures the minification, compression, and sourcemap features maintain their functionality across code changes.
