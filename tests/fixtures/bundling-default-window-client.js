const jsgui = require('jsgui3-html');
const { controls } = jsgui;

class Bundling_Default_Window_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;

        const main_window = new controls.Window({
            context,
            title: 'Bundling Window',
            pos: [24, 24],
            size: [420, 260]
        });
        main_window.add_class('bundle-test-window');

        const message = new controls.div({ context });
        message.add_class('bundle-test-window-content');
        message.add('window-ui-ready');
        main_window.inner.add(message);

        this.body.add(main_window);
    }
}

controls.Bundling_Default_Window_App = Bundling_Default_Window_App;
module.exports = jsgui;
