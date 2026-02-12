# 20) Task Manager Application

A comprehensive example demonstrating a multi-window task management application built with jsgui3.

## Features

- **Multiple Windows**: Main task manager window + floating quick-add window
- **Tabbed Interface**: Tasks, Projects, and Stats tabs in the main window
- **Data Binding**: Uses `Data_Object` and `field()` for reactive state management
- **API Integration**: Full CRUD operations via `server.publish()` endpoints
- **Interactive Controls**: Checkboxes, text inputs, select dropdowns, buttons
- **Real-time Updates**: UI updates immediately after API responses
- **Statistics Dashboard**: Tracks completion rates with visual progress bar

## Running the Example

```bash
cd examples/controls/20) window, task manager app
node server.js
```

Then open http://localhost:52021 in your browser.

## Architecture

### Client (`client.js`)

The `Task_Manager_App` class extends `Active_HTML_Document` and demonstrates:

1. **Data Model Setup**:
   ```javascript
   this.data = { model: new Data_Object({ context }) };
   field(this.data.model, 'tasks');
   field(this.data.model, 'projects');
   field(this.data.model, 'stats');
   ```

2. **Multiple Windows**:
   ```javascript
   const main_window = new controls.Window({ context, title: 'Task Manager', pos: [20, 20] });
   const quick_add_window = new controls.Window({ context, title: 'Quick Add Task', pos: [540, 20] });
   ```

3. **Tabbed Panel**:
   ```javascript
   const main_tabs = new controls.Tabbed_Panel({
       context,
       tabs: [
           ['Tasks', this._create_tasks_panel(context)],
           ['Projects', this._create_projects_panel(context)],
           ['Stats', this._create_stats_panel(context)]
       ]
   });
   ```

4. **API Calls**:
   ```javascript
   async _add_task() {
       const response = await fetch('/api/tasks/add', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ text, project })
       });
       const result = await response.json();
       // Update UI...
   }
   ```

### Server (`server.js`)

Uses the simple `server.publish()` API for endpoints:

```javascript
// GET /api/tasks/list
server.publish('tasks/list', () => ({ tasks: get_tasks() }));

// POST /api/tasks/add
server.publish('tasks/add', (data) => {
    const new_task = { id: next_id++, text: data.text, ... };
    tasks.push(new_task);
    return { success: true, tasks: get_tasks() };
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/list` | Get all tasks |
| POST | `/api/tasks/add` | Add a new task |
| POST | `/api/tasks/toggle` | Toggle task completion |
| POST | `/api/tasks/delete` | Delete a task |
| POST | `/api/tasks/clear-completed` | Remove completed tasks |
| GET | `/api/stats` | Get statistics by project |

## UI Components Used

- `Window` - Draggable, resizable window containers
- `Tabbed_Panel` - Tab navigation between views
- `Text_Field` - Text input for task descriptions
- `Select_Options` - Dropdown for project selection
- `Button` - Action buttons with click handlers
- `Checkbox` - Task completion (rendered dynamically)

## Key Patterns Demonstrated

1. **Control References**: Storing component references for later access
   ```javascript
   this._ctrl_fields = { main_window, main_tabs, quick_add_window };
   ```

2. **Conditional Composition**: Only compose if not hydrating from DOM
   ```javascript
   if (!spec.el) { compose(); }
   ```

3. **Activation Guard**: Prevent double-activation
   ```javascript
   if (!this.__active) { super.activate(); ... }
   ```

4. **CSS as Static Property**: Scoped styles
   ```javascript
   Task_Manager_App.css = `...`;
   ```

## Customization Ideas

- Add task due dates with `Date_Picker`
- Implement drag-and-drop task reordering
- Add task priority levels
- Connect to a real database instead of in-memory store
- Add real-time updates with `publish_observable` for multi-user sync
