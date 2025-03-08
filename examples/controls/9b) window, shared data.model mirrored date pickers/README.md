# Shared Data Model Mirrored Date Pickers Demo

This example demonstrates how to share a single data model between two Date_Picker controls using JSGUI3. Updates in one control are mirrored in the other.

## Overview

- **Shared Data Model:**  
  A single `Data_Object` is created with a `value` field (using `obext.field`) and registered with the context. This model is passed to both Date_Picker controls so that they share the same state.

- **Control Composition:**  
  A Window control is composed to contain the two Date_Picker controls. Both controls are added to the Window’s inner container, which is then added to the document's body.

- **Activation and Synchronization:**  
  In the `activate()` method, the code verifies that both date pickers reference the same model. If not, it assigns a new model and reassigns the data model change handlers to ensure consistency.

- **CSS Integration:**  
  The included CSS (defined in a multi-line template literal) sets global resets and basic styling for the `.demo-ui` class, ensuring a consistent layout.

## Detailed Breakdown

1. **Initialization:**  
   - The demo extends `Active_HTML_Document` to leverage activation and dynamic UI updates.
   - In the constructor, a shared data model is instantiated:
     - `this.data = { model: new Data_Object({ context }) };`
     - The `value` field is added using `field(this.data.model, 'value');`
     - The model is registered with the current context for proper event handling.

2. **Composition:**  
   - A Window is created with a title and specified position.
   - Two Date_Picker controls are instantiated with the shared data model:
     - Each Date_Picker receives its configuration via `{ context, data: { model: this.data.model } }`.
   - The date pickers are added to the window’s inner container, and references are stored in `this._ctrl_fields`.

3. **Activation:**  
   - The `activate()` method checks if both date pickers still share the same model.
   - If they differ, a new data model is created and reassigned to both controls, and their change handlers are updated.
   - Additionally, a listener for `window-resize` is set up for responsive behavior.

## How to Run the Demo

1. **Preparation:**  
   - Ensure the JSGUI3 framework and dependencies (e.g., `obext`) are installed.
   - Use the provided server script to bundle and serve this client code.

2. **Starting the Server:**  
   - Start the server (typically on port 52000).
   - Navigate to `http://localhost:52000/` in your browser to view the demo.

## Conclusion

This demo illustrates advanced data binding in JSGUI3 by sharing a single data model across multiple controls. It serves as a guide for integrating shared state, dynamic composition, and responsive event handling in complex client interfaces.
