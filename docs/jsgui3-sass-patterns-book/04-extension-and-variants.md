# Extending controls and variants

Extensions should allow new styles without editing upstream controls. The pattern is to subclass the base control, add a new CSS class, and attach Sass to the subclass.

## Pattern: subclass with extra Sass

```javascript
class Window_Tight extends Window {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'window_tight';
        super(spec);
        this.add_class('window-tight');
    }
}

Window_Tight.scss = `
.window-tight .title-bar {
  padding: 4px 8px;
}
`;
```

## Pattern: variants with data attributes

A variant can be toggled by setting a data attribute in the control spec and using a scoped selector:

```javascript
class Panel_Variant extends Panel {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'panel_variant';
        super(spec);
        if (spec.variant) {
            this.dom.attributes['data-variant'] = String(spec.variant);
        }
    }
}

Panel_Variant.scss = `
.panel[data-variant="compact"] {
  gap: 6px;
}
`;
```

## Pattern: compositional wrappers

When subclassing is not practical, wrap the base control and style the wrapper.

```javascript
class Window_Frame extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'window_frame';
        super(spec);
        this.add_class('window-frame');
        const window_ctrl = new Window({ context: this.context });
        this.add(window_ctrl);
    }
}

Window_Frame.scss = `
.window-frame {
  padding: 8px;
}
`;
```

## Suggestions for improvement

- Add a documented override order for base control CSS versus subclass CSS.
- Add a style namespace helper to reduce selector duplication.

## Where to implement

- Subclassing patterns: `jsgui3-html` controls and examples.
- Override ordering: `jsgui3-server` style bundler and extractor.
- Namespace helper: new mixin in `jsgui3-html/control_mixins`.
