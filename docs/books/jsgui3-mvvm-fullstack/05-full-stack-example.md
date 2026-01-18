# Full-Stack Example

This is the minimal end-to-end setup: a control, server entry, and a quick render check.

## client.js
```javascript
const jsgui = require('jsgui3-client');
const { controls } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const { context } = this;
        if (!spec.el) {
            const window_ctrl = new controls.Window({
                context,
                title: 'Full Stack Demo',
                pos: [12, 12]
            });
            this.body.add(window_ctrl);
        }
    }
}

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
```

## server.js
```javascript
const Server = require('jsgui3-server');
const { Demo_UI } = require('./client').controls;

Server.serve({
    ctrl: Demo_UI,
    src_path_client_js: require.resolve('./client.js'),
    port: 3000
});
```

## Render Check
```javascript
const Server_Static_Page_Context = require('jsgui3-server/static-page-context');
const jsgui = require('./client');
const Demo_UI = jsgui.controls.Demo_UI;
const demo_ui = new Demo_UI({ context: new Server_Static_Page_Context() });
const html = demo_ui.all_html_render();
```
