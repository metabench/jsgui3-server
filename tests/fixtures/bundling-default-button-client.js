const jsgui = require('jsgui3-html');
const { controls } = jsgui;

class Bundling_Default_Button_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;

        const root = new controls.div({ context });
        root.add_class('bundle-test-root');

        const label = new controls.div({ context });
        label.add_class('bundle-test-label');
        label.add('button-only-ui');
        root.add(label);

        const action_button = new controls.Button({
            context,
            text: 'Run'
        });
        action_button.add_class('bundle-test-button');
        action_button.dom.attributes['data-test'] = 'bundle-test-button';
        root.add(action_button);

        this.body.add(root);
    }
}

controls.Bundling_Default_Button_App = Bundling_Default_Button_App;
module.exports = jsgui;
