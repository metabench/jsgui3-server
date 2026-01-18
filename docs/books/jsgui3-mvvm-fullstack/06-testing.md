# Testing

Use the smallest test that validates your change.

## Focused Commands
```bash
node tests/test-runner.js --test=examples-controls.e2e.test.js
node tests/test-runner.js --test=window-examples.puppeteer.test.js
node tests/test-runner.js --test=sass-controls.e2e.test.js
```

## Server Render Probe
```javascript
const Server_Static_Page_Context = require('jsgui3-server/static-page-context');
const jsgui = require('./client');
const Demo_UI = jsgui.controls.Demo_UI;
const demo_ui = new Demo_UI({ context: new Server_Static_Page_Context() });
const html = demo_ui.all_html_render();
```

## When To Expand Coverage
- Add an e2e test if the change affects bundling or HTML delivery.
- Add a puppeteer story if the change impacts window interactions.
