# Control Lifecycle

## Compose vs Activate
- **Compose**: build child controls and layout in the constructor.
- **Activate**: bind DOM events and runtime logic after client load.

## Composition Rule
Only compose when `!spec.el`. This avoids double composition during client activation.

## Minimal Pattern
```javascript
class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const { context } = this;
        if (!spec.el) {
            const window_ctrl = new controls.Window({ context, title: 'Demo' });
            this.body.add(window_ctrl);
        }
    }
}
```

## Server Render Quick Check
```javascript
const Server_Static_Page_Context = require('./static-page-context');
const jsgui = require('./examples/controls/1) window/client.js');
const Demo_UI = jsgui.controls.Demo_UI;
const demo_ui = new Demo_UI({ context: new Server_Static_Page_Context() });
const html = demo_ui.all_html_render();
```
