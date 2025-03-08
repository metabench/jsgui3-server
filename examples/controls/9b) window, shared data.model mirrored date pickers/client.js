const jsgui = require('jsgui3-client');
const { controls, Control, mixins, Data_Object } = jsgui;
const { dragable } = mixins;
const { field } = require('obext');
const { Date_Picker } = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
class Demo_UI extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = spec.__type_name || 'demo_ui';
    super(spec); 
    const { context } = this;
    if (typeof this.body.add_class === 'function') { 
      this.body.add_class('demo-ui'); 
    }
    // Setup shared data model
    this.data = { model: new Data_Object({ context }) };
    field(this.data.model, 'value');
    context.register_control(this.data.model);
    // Compose window with shared Date_Picker controls
    const compose = () => {
      const window = new controls.Window({
        context,
        title: 'jsgui3-html Shared Data Model Date_Picker Controls',
        pos: [10,10]
      });
      const date_picker_1 = new Date_Picker({
        context,
        data: { model: this.data.model }
      });
      window.inner.add(date_picker_1);
      const date_picker_2 = new Date_Picker({
        context,
        data: { model: this.data.model }
      });
      window.inner.add(date_picker_2);
      this.body.add(window);
      this._ctrl_fields = { date_picker_1, date_picker_2 };
    };
    if (!spec.el) { compose(); }
  }
  activate() {
    if (!this.__active) {
      super.activate(); 
      const { context, _ctrl_fields } = this;
      const { date_picker_1, date_picker_2 } = _ctrl_fields;
      // Verify shared model consistency
      if (date_picker_1.data.model !== date_picker_2.data.model) {
        const dm = new Data_Object({ context });
        field(dm, 'value');
        date_picker_1.data.model = dm; 
        date_picker_2.data.model = dm;
        date_picker_1.assign_data_model_value_change_handler();
        date_picker_2.assign_data_model_value_change_handler();
      }
      context.on('window-resize', e_resize => { });
    }
  }
}
Demo_UI.css = `
* {
  margin: 0;
  padding: 0;
}

body {
  overflow-x: hidden;
  overflow-y: hidden;
  background-color: #E0E0E0;
}

.demo-ui {
  /* display: flex;
     flex-wrap: wrap;
     flex-direction: column;
     justify-content: center;
     align-items: center;
     text-align: center;
     min-height: 100vh; */
}
`;
controls.Demo_UI = Demo_UI;
module.exports = jsgui;

