# Jsgui3 Server

JSGUI3 Server is a comprehensive Node.js-based application server designed to serve modern JavaScript GUI applications to web clients. It provides a complete runtime environment for delivering dynamic, component-based user interfaces with integrated data binding, event handling, and real-time synchronization.

## Architecture Overview

The server operates as a bridge between server-side JavaScript applications and browser clients, offering:

- **Component Serving:** Bundles and serves JSGUI3 controls (Windows, Date_Pickers, Checkboxes, etc.) to browsers
- **Data Model Management:** Handles shared data objects and real-time synchronization between multiple UI controls
- **CSS Bundling:** Dynamically compiles and serves CSS from component definitions
- **Event Coordination:** Manages client-server event communication and state synchronization

## Core Components

### Active_HTML_Document
Base class for all server-rendered applications. Provides:
- Automatic activation lifecycle management
- CSS injection and bundling
- Context-aware control composition
- Event handling infrastructure

### Control System
JSGUI3 uses a hierarchical control system where:
- **Controls** are UI components (buttons, text fields, windows, etc.)
- **Containers** hold other controls (windows, panels, grids)
- **Data Models** provide shared state using `Data_Object` instances
- **Context** manages the runtime environment and event coordination

### Data Binding Architecture
The framework implements a sophisticated data binding system:
- `Data_Object` instances serve as observable data models
- `field()` function from 'obext' creates reactive properties
- Controls automatically update when their bound data changes
- Multiple controls can share the same data model for real-time synchronization

## Example Applications

The `/examples/controls/` directory contains numerous demonstrations:

- **Window + Checkbox:** Basic control composition and event handling
- **Window + Tabbed Panel:** Container controls with multiple child components
- **Window + Month View:** Calendar/date selection interfaces
- **Shared Data Model Date Pickers:** Advanced data binding with synchronized controls

Each example follows the pattern:
1. `client.js` - Defines the UI components and their composition
2. `server.js` - Configures and starts the application server
3. `README.md` - Documentation specific to that example

2022 Note: The server architecture is designed to be extensible with compilers and data transformers, allowing it to serve as a development and testing platform for various content processing pipelines.

## Server Resources and Resource Pools

Jsgui3 Server manages various runtime resources through configurable pools to ensure high performance and scalability:

- **Connection Pool:** Reuses client sockets and HTTP connections to minimize overhead.
- **Thread/Worker Pool:** Allocates and recycles background workers for tasks like compilation and data transformation.
- **Cache Pool:** Stores compiled templates, transformed data, and static assets in memory for quick retrieval.
- **Data Model Pool:** Pre-allocates shared data models (e.g., `Data_Object`) to reduce allocation costs and speed up UI control instantiation.

Each pool can be tuned via server configuration (e.g., `server.config.js`), allowing you to adjust sizes and timeouts to match your application's workload.

## Technical Architecture Deep Dive

### Server Initialization and Lifecycle

The JSGUI3 server follows a structured initialization pattern:

1. **Server Construction:** 
   - Takes a `Ctrl` parameter (the main UI control class)
   - Accepts `src_path_client_js` pointing to the client-side entry point
   - Bundles client code and prepares serving infrastructure

2. **Event-Driven Startup:**
   - Emits 'ready' event when bundling and preparation is complete
   - `server.start(port, callback)` begins HTTP listening
   - Multiple console.log statements track startup progress

3. **Request Handling:**
   - Serves bundled JavaScript to browsers
   - Injects CSS from control definitions
   - Manages WebSocket connections for real-time updates

### Control Hierarchy and Composition

Controls in JSGUI3 follow a strict composition pattern:

```javascript
// Basic control creation pattern
const control = new controls.ControlType({
    context: context,          // Required runtime context
    // ... other properties
});

// Container pattern
container.inner.add(childControl);  // Adding to containers
this.body.add(topLevelControl);     // Adding to document body
```

**Key Control Types:**
- **Window:** Top-level container with title bar, positioning, and dragging capabilities
- **Tabbed_Panel:** Container organizing content into tabs, supports both string labels and [label, control] pairs
- **Date_Picker:** Input control for date selection with data model binding
- **Checkbox:** Boolean input with label support
- **Month_View:** Calendar display widget

### Data Model System Details

The data binding system is built on observable patterns:

1. **Data_Object Creation:**
   ```javascript
   const model = new Data_Object({ context });
   field(model, 'fieldName');  // Creates reactive property
   context.register_control(model);  // Registers for lifecycle management
   ```

2. **Control Binding:**
   ```javascript
   const control = new SomeControl({
       context,
       data: { model: sharedDataModel }
   });
   ```

3. **Change Handler Management:**
   - Controls automatically register change handlers on their data models
   - `assign_data_model_value_change_handler()` method reestablishes bindings
   - Multiple controls can share the same model for synchronized updates

### File Structure and Conventions

```
jsgui3-server/
├── examples/
│   └── controls/
│       ├── 4) window, tabbed panel/
│       │   ├── client.js      # UI definition
│       │   └── server.js      # Server setup
│       ├── 7) window, month_view/
│       ├── 8) window, checkbox/
│       └── 9b) window, shared data.model mirrored date pickers/
├── controls/
│   └── Active_HTML_Document.js  # Base class for all UIs
└── server/                      # Core server implementation
```

**Naming Conventions:**
- Example directories use numbered prefixes for ordering
- `client.js` always contains UI control definitions
- `server.js` follows standard server startup pattern
- Control classes use PascalCase (e.g., `Demo_UI`, `Date_Picker`)

### Context and Runtime Environment

The `context` object is central to JSGUI3 operation:

- **Control Registration:** Tracks all controls for lifecycle management
- **Event Coordination:** Routes events between controls and server
- **Resource Management:** Handles cleanup and memory management
- **State Synchronization:** Maintains consistency across client-server boundary

### CSS Integration Patterns

CSS is defined as template literals within control classes:

```javascript
Demo_UI.css = `
* { margin: 0; padding: 0; }
body { 
    overflow-x: hidden; 
    overflow-y: hidden; 
    background-color: #E0E0E0; 
}
.demo-ui { 
    /* commented styles provide optional layouts */ 
}`;
```

- Global resets are common across examples
- Body styling typically prevents scrollbars for desktop app feel
- Comments within CSS preserve alternative styling options
- Multi-line formatting is preserved for readability

### Error Handling and Consistency Checks

The framework includes several consistency verification patterns:

1. **Model Consistency:** Activation methods verify shared data models remain synchronized
2. **Type Checking:** `typeof this.body.add_class === 'function'` guards against missing methods
3. **Conditional Composition:** `if (!spec.el) { compose(); }` prevents double-initialization
4. **Error Propagation:** Server startup includes error handling: `if (err) throw err;`

### Development and Debugging Features

- **Console Logging:** Extensive logging during server startup and events
- **Port Configuration:** Standardized on port 52000 for examples
- **Activation Lifecycle:** `activate()` method provides hook for post-initialization logic

## Dependencies and Integration

### Core Dependencies

- **jsgui3-client:** Client-side framework providing controls and data binding
- **obext:** Object extension library providing the `field()` function for reactive properties
- **Node.js:** Server runtime environment

### Integration Patterns

- **Require Resolution:** Uses `require.resolve('./client.js')` for reliable path resolution
- **Module Exports:** Each client.js exports the jsgui object with added controls
- **Control Registration:** `controls.Demo_UI = Demo_UI;` makes controls available globally

## Programming Patterns and Code Structure for AI Understanding

### Constructor Patterns

All JSGUI3 controls follow a consistent constructor pattern:

```javascript
class Demo_UI extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = spec.__type_name || 'demo_ui';  // Type identification
    super(spec);                                       // Call parent constructor
    const { context } = this;                          // Extract context reference
    
    // Optional CSS class application
    if (typeof this.body.add_class === 'function') { 
      this.body.add_class('demo-ui'); 
    }
    
    // Define composition function
    const compose = () => {
      // UI creation logic here
    };
    
    // Conditional composition (only if no external DOM element provided)
    if (!spec.el) { compose(); }
  }
}
```

**Key Pattern Elements:**
- `spec` parameter is configuration object, always defaulted to `{}`
- `__type_name` provides runtime type identification
- `context` extraction is standard pattern for accessing framework services
- Defensive programming with `typeof` checks prevents runtime errors
- Conditional composition prevents double-initialization when control is attached to existing DOM

### Activation Lifecycle Pattern

The activation pattern provides post-construction initialization:

```javascript
activate() {
  if (!this.__active) {                    // Prevent double-activation
    super.activate();                      // Call parent activation
    const { context } = this;              // Re-extract context reference
    
    // Control-specific activation logic
    context.on('window-resize', e_resize => { 
      // Event handler logic
    });
  }
}
```

**Activation Principles:**
- `__active` flag prevents multiple activation
- Parent `activate()` must be called first
- Event listeners are typically registered during activation
- Context is re-extracted for consistency

### Data Model Binding Patterns

JSGUI3 implements reactive data binding through several patterns:

#### 1. Shared Model Creation
```javascript
// Create observable data model
this.data = { model: new Data_Object({ context }) };
field(this.data.model, 'value');          // Add reactive property
context.register_control(this.data.model); // Register for lifecycle management
```

#### 2. Control Data Binding
```javascript
const control = new Date_Picker({
  context,
  data: { model: this.data.model }        // Bind to shared model
});
```

#### 3. Model Consistency Verification
```javascript
// In activate() method - verify model synchronization
if (date_picker_1.data.model !== date_picker_2.data.model) {
  const dm = new Data_Object({ context });
  field(dm, 'value');
  date_picker_1.data.model = dm;
  date_picker_2.data.model = dm;
  date_picker_1.assign_data_model_value_change_handler();
  date_picker_2.assign_data_model_value_change_handler();
}
```

### Server Startup Pattern

Every example follows identical server startup:

```javascript
const jsgui = require('./client');        // Import client-side definition
const { Demo_UI } = jsgui.controls;       // Extract main control class
const Server = require('../../../server'); // Import server framework

if (require.main === module) {             // Only run if directly executed
  const server = new Server({
    Ctrl: Demo_UI,                         // Main UI control class
    src_path_client_js: require.resolve('./client.js') // Client bundle path
  });
  
  console.log('waiting for server ready event');
  server.on('ready', () => {               // Wait for bundling completion
    console.log('server ready');
    server.start(52000, (err) => {         // Start HTTP server
      if (err) throw err;                  // Propagate startup errors
      console.log('server started');
    });
  });
}
```

## Memory Management and Lifecycle

### Control Reference Management

JSGUI3 maintains careful control references:

```javascript
// Store control references for later access
this._ctrl_fields = { date_picker_1, date_picker_2 };

// Access during activation
const { _ctrl_fields } = this;
const { date_picker_1, date_picker_2 } = _ctrl_fields;
```

### Context Registration

The context system manages control lifecycles:

- `context.register_control(model)` - Registers data models for cleanup
- Controls automatically register with context during construction
- Context handles cleanup when UI is destroyed
- Event listeners are automatically removed during cleanup

### CSS Memory Management

CSS is defined as static properties to prevent memory leaks:

```javascript
Demo_UI.css = `...`;  // Static property, not instance property
```

This pattern ensures CSS definitions are shared across all instances rather than duplicated.

## Event System Architecture

### Event Registration Patterns

```javascript
// Standard event listener registration
context.on('window-resize', e_resize => {
  // Handler logic - note arrow function preserves 'this' context
});

// Event handler with empty body (placeholder for future functionality)
context.on('window-resize', e_resize => { });
```

### Event Naming Conventions

- `window-resize` - Browser window size changes
- Control-specific events follow framework patterns

## Control Composition Hierarchy

### Container Control Pattern

```javascript
// Create container
const window = new controls.Window({
  context: context,                        // Required context
  title: 'Window Title',                   // Window title bar text
  pos: [10, 10]                           // Initial position [x, y]
});

// Add child controls to container's inner area
window.inner.add(childControl);

// Add top-level container to document body
this.body.add(window);
```

### Tabbed Panel Composition

```javascript
const tabbed_panel = new controls.Tabbed_Panel({
  context,
  tabs: [
    // Simple string tabs
    'tab 1', 'tab 2'
    
    // OR complex tab definitions with controls
    ['tab 1', new Control({context, size: [250, 250], background: {color: '#553311'}})],
    ['tab 2', new Control({context, size: [250, 250], background: {color: '#1177AA'}})]
  ]
});
```

## Debugging and Development Aids

### Console Logging Strategy

JSGUI3 uses extensive console logging for development:

```javascript
console.log('waiting for server ready event');  // Server initialization
console.log('server ready');                     // Bundling complete
console.log('server started');                   // HTTP server listening
```

**Logging Conventions:**
- Present tense for ongoing states ("waiting", "starting")
- Past tense for completed actions ("ready", "started")
- No timestamps (rely on console timestamps)
- Lowercase, descriptive messages

### Error Handling Patterns

```javascript
// Standard error propagation
server.start(52000, (err) => {
  if (err) throw err;                      // Re-throw errors for visibility
  console.log('server started');          // Only log success if no error
});
```

### Type Safety Patterns

```javascript
// Defensive method checking
if (typeof this.body.add_class === 'function') { 
  this.body.add_class('demo-ui'); 
}

// Property existence checking before use
if (!spec.el) { compose(); }

// Model existence verification
if (date_picker_1.data.model !== date_picker_2.data.model) {
  // Recovery logic
}
```

## Framework Integration Points

### jsgui3-client Integration

```javascript
const jsgui = require('jsgui3-client');
const { controls, Control, mixins, Data_Object } = jsgui;  // Destructure imports
```

**Key Exports:**
- `controls` - Collection of UI control constructors
- `Control` - Base control class
- `mixins` - Behavioral mixins (e.g., `dragable`)
- `Data_Object` - Observable data model constructor

### obext Integration

```javascript
const { field } = require('obext');        // Object extension utilities
field(dataModel, 'propertyName');          // Creates reactive property
```

The `field()` function creates observable properties that trigger change events when modified.

### Module Export Pattern

```javascript
// At end of client.js files
controls.Demo_UI = Demo_UI;                // Register control globally
module.exports = jsgui;                    // Export entire framework
```

This pattern extends the jsgui framework with custom controls while maintaining the complete API.

## Performance Considerations

### Lazy Composition

```javascript
if (!spec.el) { compose(); }               // Only compose if no external DOM
```

This pattern allows controls to be created without immediately building their UI, enabling faster initialization and memory savings.

### Shared Data Models

```javascript
// Single model shared by multiple controls
const sharedModel = new Data_Object({ context });
// Multiple controls reference same model - no data duplication
```

### CSS Bundling

CSS is collected from all control classes and bundled once during server startup, rather than injected per-instance.

## AI Development Guidelines

When working with JSGUI3:

1. **Always follow the constructor pattern** - spec parameter, __type_name, super() call, context extraction
2. **Use defensive programming** - typeof checks, property existence verification
3. **Maintain activation lifecycle** - check __active flag, call super.activate()
4. **Follow naming conventions** - PascalCase for classes, snake_case for properties
5. **Preserve CSS formatting** - multi-line CSS with comments
6. **Use consistent error handling** - throw errors, don't swallow them
7. **Register controls properly** - context.register_control() for data models
8. **Store control references** - use _ctrl_fields pattern for later access

## Detailed Component Architecture

### Active_HTML_Document Inheritance Chain

The base class hierarchy is crucial for understanding the framework:

```javascript
class Demo_UI extends Active_HTML_Document {
  // All UI classes extend this base class
}
```

**Active_HTML_Document Responsibilities:**
- Provides `this.body` property for DOM manipulation
- Implements activation lifecycle (`activate()` method)
- Handles CSS injection and bundling
- Manages context assignment and control registration
- Provides event coordination infrastructure

### Control Specification System

The `spec` parameter is a configuration object with standardized properties:

```javascript
const control = new SomeControl({
  context: context,          // REQUIRED - Runtime environment
  size: [width, height],     // Optional dimensions
  pos: [x, y],              // Optional position
  title: 'String',          // Optional title (for Windows)
  background: {             // Optional styling
    color: '#RRGGBB'
  },
  data: {                   // Optional data binding
    model: dataObject
  },
  label: {                  // Optional label configuration
    text: 'Label Text'
  }
});
```

**Common Spec Properties:**
- `context` - Always required, provides runtime services
- `size` - Array [width, height] for dimensioned controls
- `pos` - Array [x, y] for positioned controls (Windows)
- `data` - Object containing `model` property for data binding
- `background` - Styling object with color, image, etc.
- `label` - Label configuration for input controls

### Window Control Deep Dive

Windows are the primary container control:

```javascript
const window = new controls.Window({
  context: context,
  title: 'Window Title',     // Appears in title bar
  pos: [10, 10]             // Initial position [x, y]
});

// Key Window properties:
window.inner                 // Container for child controls
window.title                 // Title bar text
window.pos                   // Current position
```

**Window Features:**
- Draggable by title bar
- Window positioning and management
- Child control containment via `inner` property

### Data_Object Reactive System

The observable data system is fundamental to JSGUI3:

```javascript
// 1. Create Data_Object
const model = new Data_Object({ context });

// 2. Add reactive fields
field(model, 'value');       // Creates getter/setter with change events
field(model, 'name');        // Multiple fields supported
field(model, 'selected');

// 3. Register with context
context.register_control(model);

// 4. Bind to controls
const picker = new Date_Picker({
  context,
  data: { model: model }     // Control automatically subscribes to changes
});

// 5. Model changes trigger UI updates
model.value = new Date();    // All bound controls update automatically
```

**Reactive Properties:**
- Getter/setter pairs created by `field()` function
- Change events emitted when properties modified
- Controls automatically subscribe to their bound models
- Multiple controls can share single model for synchronization

### Control Registration and Lifecycle

```javascript
// Registration patterns
context.register_control(dataModel);     // Register data models
// Controls auto-register during construction

// Lifecycle events
constructor() -> activate() -> use -> cleanup()

// Activation requirements
if (!this.__active) {
  super.activate();          // MUST call parent first
  // ... control-specific activation
}
```

### Event System Details

```javascript
// Event registration
context.on('event-name', handler);

// Common event types:
'window-resize'              // Browser window size changes

// Event handler patterns
context.on('window-resize', e_resize => {
  // e_resize contains resize event data
  // 'this' context preserved with arrow functions
});
```

## Advanced Data Binding Scenarios

### Model Synchronization Recovery

When shared models become desynchronized, JSGUI3 provides recovery patterns:

```javascript
activate() {
  if (!this.__active) {
    super.activate();
    const { _ctrl_fields } = this;
    const { picker1, picker2 } = _ctrl_fields;
    
    // Detect model desynchronization
    if (picker1.data.model !== picker2.data.model) {
      // Create new shared model
      const dm = new Data_Object({ context });
      field(dm, 'value');
      
      // Reassign to both controls
      picker1.data.model = dm;
      picker2.data.model = dm;
      
      // Re-establish change handlers
      picker1.assign_data_model_value_change_handler();
      picker2.assign_data_model_value_change_handler();
    }
  }
}
```

### Multi-Control Data Flows

```javascript
// One-to-many data binding
const sharedModel = new Data_Object({ context });
field(sharedModel, 'value');

const date_picker_1 = new Date_Picker({ context, data: { model: sharedModel } });
const date_picker_2 = new Date_Picker({ context, data: { model: sharedModel } });

// Any control's changes propagate to all others
```

### Data Model Field Types

```javascript
// Different field types and their behaviors
field(model, 'stringField');    // String values
field(model, 'numberField');    // Numeric values  
field(model, 'dateField');      // Date objects
field(model, 'booleanField');   // Boolean values
field(model, 'objectField');    // Complex objects
field(model, 'arrayField');     // Array collections

// Fields support any JavaScript type
model.stringField = "text";
model.numberField = 42;
model.dateField = new Date();
model.booleanField = true;
model.objectField = { nested: "data" };
model.arrayField = [1, 2, 3];
```

## Server-Side Architecture Details

### Bundling and Serving Process

```javascript
// Server construction phase
const server = new Server({
  Ctrl: Demo_UI,                           // Main UI control class
  src_path_client_js: require.resolve('./client.js')  // Client bundle path
});

// Bundling process (happens during 'ready' event):
// 1. Parse client.js and dependencies
// 2. Collect CSS from all control classes  
// 3. Bundle JavaScript for browser delivery
// 4. Prepare HTTP routes for serving
// 5. Emit 'ready' event when complete
```

### Request/Response Cycle

```javascript
// HTTP request handling:
// 1. Browser requests application
// 2. Server serves bundled JavaScript
// 3. Client executes and creates UI
// 4. Real-time updates handled through framework
// 5. UI events processed by client-side framework
// 6. Data model changes handled by shared state system
```

### Multi-Client Synchronization

Data models can be shared within a single client instance, enabling synchronized UI controls.

## CSS Architecture and Styling

### CSS Definition Patterns

```javascript
// Static CSS property on control class
ControlClass.css = `
  /* Global resets - common across all examples */
  * {
    margin: 0;
    padding: 0;
  }
  
  /* Body styling - prevents scrollbars, sets background */
  body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #E0E0E0;
  }
  
  /* Control-specific styling */
  .control-class-name {
    /* Active styles */
    
    /* Commented alternative styles for future use */
    /* display: flex; */
    /* justify-content: center; */
  }
`;
```

### CSS Bundling Process

```javascript
// CSS collection during server startup:
// 1. Scan all control classes for .css properties
// 2. Concatenate CSS in dependency order
// 3. Minify and optimize
// 4. Serve as single stylesheet to clients
// 5. Cache for subsequent requests
```

### Responsive Design Patterns

```javascript
// Window resize handling
context.on('window-resize', e_resize => {
  // Update control dimensions
  // Reflow layouts
  // Adjust positioning
});

// CSS supports responsive breakpoints
.control-class {
  /* Desktop styles */
}

@media (max-width: 768px) {
  .control-class {
    /* Mobile styles */
  }
}
```

## Control-Specific Implementation Details

### Checkbox Control

```javascript
const checkbox = new Checkbox({
  context,
  label: { text: 'A checkbox' }
});
```

### Tabbed_Panel Control

```javascript
const tabbed_panel = new controls.Tabbed_Panel({
  context,
  tabs: [
    ['tab 1', new Control({context, size: [250, 250], background: {color: '#553311'}})],
    ['tab 2', new Control({context, size: [250, 250], background: {color: '#1177AA'}})]
  ]
});
```

### Date_Picker Control

```javascript
const date_picker = new Date_Picker({
  context,
  data: { model: sharedDataModel }
});
```

### Month_View Control

```javascript
const month_view = new Month_View({
  context
});
```

## Error Handling and Recovery Patterns

### Common Error Scenarios

```javascript
// 1. Missing context
if (!context) {
  throw new Error('Context required for control creation');
}

// 2. Invalid data model
if (spec.data && !spec.data.model) {
  throw new Error('Data specification requires model property');
}

// 3. Missing required methods
if (typeof this.body.add_class !== 'function') {
  console.warn('add_class method not available on body');
  // Graceful degradation
}

// 4. Activation state errors
if (this.__active) {
  console.warn('Control already activated, skipping');
  return;
}
```

### Recovery Strategies

```javascript
// Data model recovery
try {
  model.value = newValue;
} catch (error) {
  console.error('Model update failed:', error);
  // Revert to previous value or default
  model.value = this._previousValue || this._defaultValue;
}

// Control reference recovery
if (!this._ctrl_fields || !this._ctrl_fields.someControl) {
  console.warn('Control references lost, rebuilding');
  this._rebuildControls();
}

// Event handler recovery
try {
  context.on('event-name', handler);
} catch (error) {
  console.error('Event registration failed:', error);
  // Use fallback polling or alternative event mechanism
}
```

## Testing and Development Utilities

### Development Mode Features

```javascript
// Enhanced logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Control created:', this.__type_name);
  console.log('Context:', context);
  console.log('Specification:', spec);
}

// Debug helpers
this._debug = {
  controlType: this.__type_name,
  createdAt: new Date(),
  context: context,
  specification: spec
};
```

### Runtime Inspection

```javascript
// Control hierarchy inspection
function inspectControlTree(control, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${control.__type_name}`);
  
  if (control.children) {
    control.children.forEach(child => {
      inspectControlTree(child, depth + 1);
    });
  }
}

// Data model inspection
function inspectDataModel(model) {
  console.log('Model fields:', Object.keys(model));
  Object.keys(model).forEach(key => {
    console.log(`  ${key}:`, model[key]);
  });
}
```


