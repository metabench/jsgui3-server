// Written in the style of the older examples (examples/box, examples/controls):
// everything is reached through the jsgui3-client re-export surface — the
// package alias, destructured mixins, and stock controls. Guards the serving
// bundler against stripping re-exports that only jsgui3-client consumers use.
const jsgui = require('jsgui3-client');
const { controls, Control, mixins } = jsgui;
const { dragable } = mixins;
const { Window } = controls;

class Legacy_Client_Surface_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'legacy_client_surface_app';
        super(spec);

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;

        const main_window = new Window({
            context,
            title: 'Legacy Surface Window',
            pos: [24, 24],
            size: [420, 260]
        });
        main_window.add_class('legacy-surface-window');

        const message = new controls.div({ context });
        message.add_class('legacy-surface-window-content');
        message.add('legacy-ui-ready');
        main_window.inner.add(message);

        this.body.add(main_window);
        this.main_window = main_window;
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Runtime canary: the dragable mixin must survive bundling as a
            // callable export. A shim that stripped (or emptied) the mixins
            // module makes this throw, which the page probe reports.
            if (typeof dragable !== 'function') {
                throw new Error('Expected mixins.dragable to be a function in the client bundle');
            }
            if (this.main_window) {
                dragable(this.main_window);
            }

            this.add_class('legacy-surface-activated');
        }
    }
}

controls.Legacy_Client_Surface_App = Legacy_Client_Surface_App;
controls.legacy_client_surface_app = Legacy_Client_Surface_App;
module.exports = jsgui;
