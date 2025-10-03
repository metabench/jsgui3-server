// Dummy client file for tests.
const jsgui = require('jsgui3-html');
class Dummy_Control extends jsgui.Control {
    constructor(spec) {
        super(spec);
    }
}
jsgui.controls = jsgui.controls || {};
jsgui.controls.Dummy_Control = Dummy_Control;
module.exports = jsgui;
