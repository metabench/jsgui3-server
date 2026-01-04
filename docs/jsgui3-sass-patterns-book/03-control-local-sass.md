# Control-local Sass patterns

Control-local Sass keeps styles next to the control that owns them. The key is to scope selectors and define a predictable ordering that survives bundling.

## Pattern: control-local style blocks

- Use `Control_Name.css` for immediate, small styles.
- Use `Control_Name.scss` for Sass variables, mixins, or nesting.
- Use `Control_Name.sass` when you prefer indented Sass syntax.
- Keep selectors scoped to a class or `data-jsgui-type` to avoid global collisions.

Example pattern (conceptual):

```javascript
class Example_Control extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'example_control';
        super(spec);
        this.add_class('example-control');
    }
}

Example_Control.scss = `
$accent_color: #3355aa;
.example-control {
  border: 1px solid $accent_color;
}
`;
```

## Pattern: explicit ordering

Ordering is preserved by the extraction pipeline when styles appear in source order. This makes it safe to stack `css`, `scss`, and `sass` in the same file as long as the intent is clear.

Suggested ordering inside a control file:

1. `Control_Name.css` for base layout or reset
2. `Control_Name.scss` for token-driven styles
3. `Control_Name.sass` for optional variant overrides

## Pattern: selector scoping

Preferred scoping approaches:

- `.control-class` on the root node
- `[data-jsgui-type="control_name"]` when the class is not reliable
- `.control-class .sub-part` for internal elements

Avoid styling generic tags without a parent scope.

## Suggestions for improvement

- Add a documented style layering convention (base, component, override) and enforce it in examples.
- Add an optional `Control_Name.style_layers = [...]` API so the bundler can order styles even when code files are concatenated.

## Where to implement

- Co-located styles: `jsgui3-html` control classes.
- Layering API: `jsgui3-server` extractor and style bundler.
- Documentation updates: `docs/controls-development.md` plus this book.
