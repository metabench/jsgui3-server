# Controls Development Guide

## When to Read

This document explains how to develop custom controls for JSGUI3 Server. Read this when:
- You want to create custom UI components
- You need to understand the control lifecycle and patterns
- You're extending existing controls or creating new ones
- You want to understand data binding and event handling
- You're working on client-side JavaScript for JSGUI3 applications

**Note:** For using existing controls, see [README.md](../README.md). For system architecture, see [docs/system-architecture.md](docs/system-architecture.md).

## Overview

Controls are the fundamental UI building blocks in JSGUI3. They represent reusable components that can be composed together to create complex user interfaces. Controls handle their own rendering, event management, and data binding.

## Control Hierarchy

### Base Classes

#### Active_HTML_Document

**Purpose:** The root class for all UI controls that render as complete HTML documents.

**Key Features:**
- Provides the main HTML document structure
- Manages CSS and JavaScript bundling
- Handles client-server communication
- Provides context for child controls

**Basic Structure:**
```javascript
const jsgui = require('jsgui3-client');
const { controls, Control, Data_Object, field } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class My_Custom_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_custom_control';
        super(spec);
        const { context } = this;

        // Defensive CSS class application
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('my-custom-control');
        }

        // Control composition
        const compose = () => {
            // Create and add child controls here
            const button = new controls.Button({
                context,
                text: 'Click Me'
            });
            this.body.add(button);
        };

        // Conditional composition (only if not attached to existing DOM)
        if (!spec.el) { compose(); }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;

            // Event handlers and activation logic
            context.on('window-resize', e_resize => {
                // Handle resize events
            });
        }
    }
}

// Static CSS definition
My_Custom_Control.css = `
* { margin: 0; padding: 0; }
body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #E0E0E0;
}
.my-custom-control {
    padding: 20px;
    background: #f0f0f0;
}
`;

// Register control globally
controls.My_Custom_Control = My_Custom_Control;
module.exports = jsgui;
```

Note: You can also define `My_Custom_Control.scss` or `My_Custom_Control.sass` using template literals. These are compiled to CSS during bundling and removed from the JS output, just like `.css`. CSS and SCSS blocks can be mixed in a control; the bundler preserves their order during compilation. If you mix indented `.sass` with `.scss`/`.css`, each block is compiled independently to preserve order. Inline CSS sourcemaps are emitted only when a single compilation pass is used; mixed syntax skips inline maps to keep them accurate.

To enable inline CSS sourcemaps for Sass/SCSS outputs, pass a `style` configuration when serving:

```javascript
Server.serve({
    ctrl: My_Custom_Control,
    src_path_client_js: require.resolve('./client.js'),
    debug: true,
    style: {
        sourcemaps: {
            enabled: true,
            inline: true,
            include_sources: true
        }
    }
});
```

E2E coverage for Sass/CSS controls (including sourcemaps) lives in `tests/sass-controls.e2e.test.js`.

#### Control (Base)

**Purpose:** The fundamental building block for all UI components.

**Key Features:**
- Basic control lifecycle management
- Property system
- Event handling
- DOM manipulation

### Specialized Controls

#### Window

**Purpose:** Draggable, resizable container control.

**Features:**
- Title bar with drag functionality
- Resizable borders
- Child control containment
- Positioning and sizing

```javascript
const window = new controls.Window({
    context,
    title: 'My Window',
    pos: [100, 100],  // [x, y] position
    size: [400, 300]  // [width, height]
});

// Add content to window
window.inner.add(childControl);
this.body.add(window);
```

Lab results (from `lab/results/window_examples_dom_audit.md`, generated 2025-12-19):

- Window example renders one window, a title bar, and three control buttons.
- Tabbed panel example renders two tabs with a default checked input.
- Checkbox example renders one checkbox input with the expected label.
- Date picker example renders a native date input on the server.

#### Panel

**Purpose:** Basic container for grouping controls.

**Features:**
- Simple containment
- Background styling
- Border and padding options

#### Button

**Purpose:** Interactive button control.

**Features:**
- Click event handling
- Text and styling customization
- Disabled state support

```javascript
const button = new controls.Button({
    context,
    text: 'Click Me',
    onclick: () => {
        console.log('Button clicked!');
    }
});
```

> **⚠️ Important: Text Content Patterns**
>
> Different controls handle text content differently:
>
> **Composite controls** (Button, Checkbox, etc.) accept `text` in spec:
> ```javascript
> const button = new controls.Button({ context, text: 'Click Me' });  // ✅ Works
> ```
>
> **HTML element controls** (div, span, h2, etc.) require `.add()` method:
> ```javascript
> const title = new controls.h2({ context });
> title.add('My Heading');  // ✅ Correct
> // title.text = 'My Heading';  // ❌ Won't render
> ```
>
> See [Text Content](#text-content-in-controls) section for details.

#### Text_Input

**Purpose:** Text input field control.

**Features:**
- Data binding support
- Validation
- Placeholder text
- Input event handling

```javascript
const input = new controls.Text_Input({
    context,
    placeholder: 'Enter text...',
    data: { model: sharedDataModel, field_name: 'username' }
});
```

## Control Lifecycle

### 1. Construction

```javascript
constructor(spec = {}) {
    // Set type name for debugging
    spec.__type_name = spec.__type_name || 'control_name';

    // Call parent constructor
    super(spec);

    // Extract context (always available)
    const { context } = this;

    // Initialize control properties
    // Compose UI (if not attached to existing DOM)
}
```

### 2. Composition

```javascript
const compose = () => {
    // Create child controls
    const child = new controls.SomeControl({ context });

    // Configure child properties
    child.text = 'Hello';

    // Add to parent
    this.body.add(child);
};

// Only compose if not attached to existing element
if (!spec.el) { compose(); }
```

### 3. Activation

```javascript
activate() {
    // Prevent double activation
    if (!this.__active) {
        // Call parent activation FIRST
        super.activate();

        // Extract context again (convention)
        const { context } = this;

        // Register event handlers
        context.on('event-name', handler);

        // Initialize data bindings
        // Start timers or intervals
        // Establish connections
    }
}
```

### 4. Deactivation/Cleanup

```javascript
deactivate() {
    // Remove event handlers
    // Close connections
    // Clear timers
    // Release resources

    super.deactivate();
}
```

## Data Binding

### Data_Object and Fields

**Purpose:** Reactive data models that automatically update bound controls.

```javascript
// Create data model
this.data = { model: new Data_Object({ context }) };

// Add reactive fields
field(this.data.model, 'name');
field(this.data.model, 'email');
field(this.data.model, 'age');

// Register with context for lifecycle management
context.register_control(this.data.model);

// Changes trigger UI updates automatically
this.data.model.name = 'John Doe';
```

### Control Data Binding

```javascript
const input = new controls.Text_Input({
    context,
    label: { text: 'Name:' },
    data: {
        model: this.data.model,
        field_name: 'name'
    }
});

// Control automatically updates when model changes
// Model automatically updates when control changes
```

### Shared Data Models

```javascript
// Multiple controls can share the same model
const model = new Data_Object({ context });
field(model, 'value');

const picker1 = new Date_Picker({
    context,
    data: { model: model }
});

const picker2 = new Date_Picker({
    context,
    data: { model: model }
});

// Both pickers stay synchronized
```

## Event Handling

### Context Events

```javascript
activate() {
    if (!this.__active) {
        super.activate();
        const { context } = this;

        // Browser events
        context.on('window-resize', e_resize => {
            // Handle window resize
            this.resize_content();
        });

        // Custom application events
        context.on('data-updated', data => {
            // Handle data updates
            this.refresh_display();
        });
    }
}
```

### Control Events

```javascript
const button = new controls.Button({
    context,
    text: 'Save',
    onclick: () => {
        // Handle button click
        this.save_data();
    }
});
```

### Custom Events

```javascript
// Emit custom events
this.raise('custom-event', { data: 'value' });

// Listen for custom events
context.on('custom-event', (data) => {
    console.log('Received:', data);
});
```

## CSS and Styling

### Static CSS Definition

```javascript
MyControl.css = `
/* Global resets (common pattern) */
* {
    margin: 0;
    padding: 0;
}

/* Body styling */
body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #E0E0E0;
}

/* Control-specific styles */
.my-control {
    padding: 20px;
    background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Responsive design */
@media (max-width: 768px) {
    .my-control {
        padding: 10px;
    }
}
`;
```

### Dynamic Styling

```javascript
// Add CSS classes
if (typeof this.body.add_class === 'function') {
    this.body.add_class('my-control');
    this.body.add_class('theme-dark');
}

// Remove classes
this.body.remove_class('theme-dark');

// Check for classes
if (this.body.has_class('active')) {
    // Handle active state
}
```

## Text Content in Controls

### The `.add()` Method (For HTML Elements)

For basic HTML element controls (`div`, `span`, `h2`, `p`, etc.), use the `.add()` method to add text content:

```javascript
// ✅ Correct: Use .add() for HTML elements
const title = new controls.h2({ context });
title.add('My Page Title');
container.add(title);

const paragraph = new controls.div({ context, 'class': 'content' });
paragraph.add('This is the text content.');
container.add(paragraph);

const label = new controls.span({ context });
label.add('Label: ');
container.add(label);
```

### The `text` Property (For Composite Controls)

Some composite controls like `Button`, `Checkbox`, and custom controls explicitly handle the `text` property:

```javascript
// ✅ Correct: Button handles text property
const button = new controls.Button({
    context,
    text: 'Submit Form'
});

// ✅ Checkbox uses label.text
const checkbox = new controls.Checkbox({
    context,
    label: { text: 'Accept terms' }
});
```

### Common Mistake: Text Not Rendering

```javascript
// ❌ WRONG: text property won't render for div/h2/span
const title = new controls.h2({
    context,
    text: 'This will NOT appear'  // Won't render!
});

// ❌ WRONG: .text assignment won't render
const div = new controls.div({ context });
div.text = 'This also won\'t appear';  // Won't render!

// ✅ CORRECT: Use .add() method
const title = new controls.h2({ context });
title.add('This WILL appear');  // ✅ Renders correctly
```

### Why This Pattern Exists

JSGUI3 follows the DOM model where text is a child node, not a property. The `.add()` method creates a `Text_Node` child that renders properly both server-side and client-side.

Composite controls like `Button` have a `compose_button()` method that internally calls `this.add(this.text)`, which is why they work differently.

### Setting Element IDs

To set an element's ID attribute for client-side access:

```javascript
// ✅ Correct: Use dom.attributes.id
const status_div = new controls.div({ context });
status_div.dom.attributes.id = 'status-display';
status_div.add('Ready');
container.add(status_div);

// In activate(), access via getElementById:
activate() {
    if (!this.__active) {
        super.activate();
        const status = document.getElementById('status-display');
        status.textContent = 'Active';  // Update via DOM
    }
}
```

### Control Naming Conventions

JSGUI3 controls follow specific naming patterns:

| Type | Naming | Examples |
|------|--------|----------|
| HTML elements | lowercase | `controls.div`, `controls.span`, `controls.h2`, `controls.button` (native) |
| Composite controls | PascalCase | `controls.Button`, `controls.Window`, `controls.Checkbox`, `controls.Panel` |
| Custom controls | PascalCase | `controls.My_Custom_Control`, `controls.Dashboard` |

```javascript
// HTML elements (lowercase)
const div = new controls.div({ context });
const span = new controls.span({ context });
const h1 = new controls.h1({ context });

// Composite controls (PascalCase)
const button = new controls.Button({ context, text: 'Click' });
const window = new controls.Window({ context, title: 'My Window' });
const checkbox = new controls.Checkbox({ context });
```

> **Note:** `controls.button` (lowercase) creates a native `<button>` element without Button class features.
> `controls.Button` (PascalCase) creates the full Button control with text handling and styling.

### CSS Extraction and Bundling

CSS is automatically extracted from control classes and bundled by the server:

1. Server scans all control classes for `.css` properties
2. CSS is concatenated in dependency order
3. Result is served as a single stylesheet
4. Updates require server restart (no hot reload)

## Control Composition Patterns

### Container Pattern

```javascript
class Dashboard extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('dashboard');
        }

        const compose = () => {
            // Header section
            const header = new controls.Panel({
                context,
                css_class: 'dashboard-header'
            });
            header.add(new controls.Label({
                context,
                text: 'Dashboard'
            }));

            // Content grid
            const grid = new controls.Grid({
                context,
                rows: 2,
                cols: 3
            });

            // Add widgets to grid
            grid.add(new StatsWidget({ context }), 0, 0);
            grid.add(new ChartWidget({ context }), 0, 1);
            grid.add(new ListWidget({ context }), 1, 0);

            this.body.add(header);
            this.body.add(grid);
        };

        if (!spec.el) { compose(); }
    }
}
```

### Mixin Pattern

```javascript
// Using mixins for reusable functionality
const { dragable } = mixins;

class DraggablePanel extends Control {
    constructor(spec = {}) {
        super(spec);

        // Apply draggable mixin
        dragable(this, {
            handle: '.drag-handle'
        });
    }
}
```

### Factory Pattern

```javascript
class ControlFactory {
    static createButton(context, config) {
        return new controls.Button({
            context,
            text: config.text || 'Button',
            onclick: config.onClick,
            css_class: config.className
        });
    }

    static createInput(context, config) {
        return new controls.Text_Input({
            context,
            placeholder: config.placeholder,
            data: config.data,
            validator: config.validator
        });
    }
}

// Usage
const saveButton = ControlFactory.createButton(context, {
    text: 'Save',
    onClick: () => this.save()
});
```

## Error Handling and Validation

### Input Validation

```javascript
class ValidatedInput extends Control {
    constructor(spec = {}) {
        super(spec);
        this.validator = spec.validator;
    }

    set_value(value) {
        if (this.validator && !this.validator(value)) {
            this.show_error('Invalid input');
            return false;
        }

        this.clear_error();
        super.set_value(value);
        return true;
    }

    show_error(message) {
        this.add_class('error');
        // Show error message
    }

    clear_error() {
        this.remove_class('error');
        // Hide error message
    }
}
```

### Exception Handling

```javascript
activate() {
    if (!this.__active) {
        try {
            super.activate();
            const { context } = this;

            // Risky initialization
            this.initialize_complex_feature();

        } catch (error) {
            console.error('Failed to activate control:', error);
            // Fallback behavior
            this.enter_safe_mode();
        }
    }
}
```

## Performance Optimization

### Lazy Loading

```javascript
class LazyControl extends Control {
    constructor(spec = {}) {
        super(spec);
        this._loaded = false;
    }

    ensure_loaded(callback) {
        if (this._loaded) {
            return callback();
        }

        // Load heavy resources
        this.load_resources((err) => {
            if (err) return callback(err);
            this._loaded = true;
            callback();
        });
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Lazy load when first activated
            this.ensure_loaded(() => {
                this.initialize_heavy_components();
            });
        }
    }
}
```

### Memory Management

```javascript
class MemoryManagedControl extends Control {
    constructor(spec = {}) {
        super(spec);
        this._intervals = [];
        this._timeouts = [];
        this._event_handlers = [];
    }

    set_interval(callback, delay) {
        const id = setInterval(callback, delay);
        this._intervals.push(id);
        return id;
    }

    set_timeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this._timeouts.push(id);
        return id;
    }

    add_event_handler(handler_id) {
        this._event_handlers.push(handler_id);
    }

    deactivate() {
        // Clean up all timers
        this._intervals.forEach(clearInterval);
        this._timeouts.forEach(clearTimeout);

        // Remove event handlers
        this._event_handlers.forEach(id => {
            // Remove handler logic
        });

        super.deactivate();
    }
}
```

## Testing Controls

### Unit Testing

```javascript
const jsgui = require('jsgui3-client');

describe('MyControl', () => {
    let control;
    let mock_context;

    beforeEach(() => {
        mock_context = {
            on: jest.fn(),
            register_control: jest.fn()
        };

        control = new MyControl({
            context: mock_context
        });
    });

    it('should initialize correctly', () => {
        expect(control.__type_name).toBe('my_control');
        expect(mock_context.register_control).toHaveBeenCalled();
    });

    it('should activate properly', () => {
        control.activate();
        expect(control.__active).toBe(true);
        expect(mock_context.on).toHaveBeenCalledWith('window-resize', expect.any(Function));
    });
});
```

### Integration Testing

```javascript
describe('Control Integration', () => {
    it('should render in browser', async () => {
        const server = await Server.serve({
            ctrl: MyControl,
            port: 0 // Random port
        });

        // Use puppeteer or similar to test rendering
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`http://localhost:${server.port}`);

        // Test control appears and functions
        const controlExists = await page.$('.my-control');
        expect(controlExists).toBeTruthy();

        await browser.close();
        await server.close();
    });
});
```

## Best Practices

### Code Organization
- Use PascalCase for control class names
- Use snake_case for properties and methods
- Group related functionality together
- Document complex logic with comments

### Performance
- Minimize DOM manipulations
- Use efficient data structures
- Implement lazy loading for heavy components
- Clean up resources properly

### Maintainability
- Follow established patterns
- Write comprehensive tests
- Document configuration options
- Use meaningful names

### User Experience
- Provide visual feedback for interactions
- Handle error states gracefully
- Support keyboard navigation
- Ensure responsive design

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

**Consistent Constructor Pattern:**
```javascript
constructor(spec = {}) {
    spec.__type_name = spec.__type_name || 'control_name';
    super(spec);
    const { context } = this;
    // ... rest of initialization
}
```

**Defensive Programming:**
```javascript
if (typeof this.body.add_class === 'function') {
    this.body.add_class('control-class');
}
```

**Proper Activation:**
```javascript
activate() {
    if (!this.__active) {
        super.activate(); // Always call first
        const { context } = this;
        // ... activation logic
    }
}
```

### ❌ Anti-Patterns

**Direct DOM Manipulation (avoid when possible):**
```javascript
// Bad - bypasses framework
this.dom_element.style.color = 'red';

// Good - uses framework methods
this.add_class('error');
```

**Tight Coupling:**
```javascript
// Bad - assumes specific parent structure
this.parent.parent.update();

// Good - uses events or callbacks
this.raise('child-updated', { data: this.value });
```

**Memory Leaks:**
```javascript
// Bad - no cleanup
setInterval(() => { /* ... */ }, 1000);

// Good - tracked and cleaned up
this.set_interval(() => { /* ... */ }, 1000);
```

## Migration and Compatibility

### Upgrading Controls

When modifying existing controls:

1. **Maintain API Compatibility:** Don't break existing usage
2. **Add Deprecation Warnings:** For changed APIs
3. **Provide Migration Guide:** Document upgrade steps
4. **Test Thoroughly:** Ensure no regressions

### Framework Updates

When JSGUI3 updates:

1. **Check Breaking Changes:** Review changelog
2. **Update Dependencies:** Keep jsgui3-client current
3. **Test Integration:** Verify control still works
4. **Update Patterns:** Adopt new best practices

## Troubleshooting

### Common Issues

**Control Not Rendering:**
- Check if `compose()` is called conditionally
- Verify CSS is properly defined
- Ensure control is added to a parent

**Events Not Firing:**
- Confirm activation is called
- Check event handler registration
- Verify context is available

**Data Binding Issues:**
- Ensure model is registered with context
- Check field names match
- Verify model changes trigger updates

**Performance Problems:**
- Check for unnecessary re-renders
- Profile event handler execution
- Monitor memory usage

### Debug Mode

Enable debug logging:
```javascript
const control = new MyControl({
    context,
    debug: true
});
```

### Development Tools

Use browser developer tools to:
- Inspect generated HTML/CSS
- Monitor JavaScript execution
- Check network requests
- Profile performance

---

This guide provides the foundation for developing controls in JSGUI3. For specific control implementations, refer to the examples in the `examples/` directory and the base classes in `controls/`.
