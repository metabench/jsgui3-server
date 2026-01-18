# MVVM Basics

JSGUI3 controls support data and view models. Use `watch` for updates and `computed` for derived values.

## Minimal MVVM Skeleton
```javascript
const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

const set_model_value = (model, name, value) => {
    if (!model) return;
    if (typeof model.set === 'function') {
        model.set(name, value);
    } else {
        model[name] = value;
    }
};

class Profile_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'profile_panel';
        super(spec);
        if (!spec.el) {
            const { context } = this;
            const name_input = new controls.Text_Input({ context });
            this.add(name_input);
            this.name_input = name_input;
        }
        this.setup_bindings();
    }

    setup_bindings() {
        const data_model = this.data && this.data.model;
        if (!data_model || !this.name_input) return;
        this.watch(data_model, 'full_name', value => {
            this.name_input.set_value(value || '');
        });
        this.name_input.on('input', () => {
            set_model_value(data_model, 'full_name', this.name_input.get_value());
        });
    }
}
```

## Computed Fields
```javascript
this.computed(
    view_model,
    ['first_name', 'last_name'],
    (first_name, last_name) => {
        const safe_first = (first_name || '').trim();
        const safe_last = (last_name || '').trim();
        return `${safe_first} ${safe_last}`.trim();
    },
    { propertyName: 'full_name' }
);
```
