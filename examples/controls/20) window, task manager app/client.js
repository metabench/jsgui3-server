const jsgui = require('jsgui3-client');
const { controls, Control, mixins } = jsgui;
const { Select_Options, Button, Text_Field } = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

/**
 * Task Manager Application
 * 
 * A multi-window application demonstrating:
 * - Multiple windows with different purposes
 * - Tabbed panels for organization
 * - Interactive controls (text inputs, buttons, selects)
 * - API integration for data persistence
 * - Real-time UI updates
 */
class Task_Manager_App extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'task_manager_app';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('task-manager-app');
        }

        // Task data stored directly on the instance
        this._tasks = [];
        this._projects = ['Personal', 'Work', 'Shopping', 'Fitness'];

        const compose = () => {
            // Main Task Manager Window
            const main_window = new controls.Window({
                context,
                title: 'Task Manager',
                pos: [20, 20]
            });
            main_window.size = [500, 450];

            // Create tabbed panel for main window - using simple Control for each tab
            const tasks_panel = new Control({ context, size: [480, 350], background: { color: '#f8f9fa' } });
            const projects_panel = new Control({ context, size: [480, 350], background: { color: '#e8f5e9' } });
            const stats_panel = new Control({ context, size: [480, 350], background: { color: '#fff3e0' } });

            // Build tasks panel content
            this._build_tasks_panel(context, tasks_panel);
            
            // Build projects panel content  
            this._build_projects_panel(context, projects_panel);
            
            // Build stats panel content
            this._build_stats_panel(context, stats_panel);

            const main_tabs = new controls.Tabbed_Panel({
                context,
                tabs: [
                    ['Tasks', tasks_panel],
                    ['Projects', projects_panel],
                    ['Stats', stats_panel]
                ]
            });

            main_window.inner.add(main_tabs);
            this.body.add(main_window);

            // Quick Add Window (smaller floating window)
            const quick_add_window = new controls.Window({
                context,
                title: 'Quick Add Task',
                pos: [540, 20]
            });
            quick_add_window.size = [280, 180];

            this._build_quick_add_panel(context, quick_add_window.inner);
            this.body.add(quick_add_window);

            // Store references
            this._ctrl_fields = {
                main_window,
                main_tabs,
                quick_add_window
            };
        };

        if (!spec.el) {
            compose();
        }
    }

    _build_tasks_panel(context, panel) {
        // Filter bar
        const filter_bar = new controls.div({ context });
        filter_bar.dom.attributes['class'] = 'filter-bar';
        
        const filter_label = new controls.span({ context });
        filter_label.add('Filter by project:');
        filter_bar.add(filter_label);

        const project_filter = new Select_Options({
            context,
            options: ['All', ...this._projects]
        });
        filter_bar.add(project_filter);
        this._project_filter = project_filter;

        panel.add(filter_bar);

        // Action buttons
        const action_bar = new controls.div({ context });
        action_bar.dom.attributes['class'] = 'action-bar';
        
        const refresh_btn = new Button({ context, text: 'Refresh' });
        refresh_btn.dom.attributes['id'] = 'refresh-btn';
        action_bar.add(refresh_btn);
        this._refresh_btn = refresh_btn;

        const clear_completed_btn = new Button({ context, text: 'Clear Completed' });
        clear_completed_btn.dom.attributes['id'] = 'clear-completed-btn';
        action_bar.add(clear_completed_btn);
        this._clear_completed_btn = clear_completed_btn;

        panel.add(action_bar);

        // Task list container - will be populated dynamically
        const task_list = new controls.div({ context });
        task_list.dom.attributes['class'] = 'task-list';
        task_list.dom.attributes['id'] = 'task-list';
        this._task_list = task_list;
        panel.add(task_list);
    }

    _build_projects_panel(context, panel) {
        const title = new controls.h3({ context });
        title.add('Manage Projects');
        panel.add(title);

        // Project list
        const project_list = new controls.div({ context });
        project_list.dom.attributes['class'] = 'project-list';
        
        for (const project of this._projects) {
            const project_item = new controls.div({ context });
            project_item.dom.attributes['class'] = 'project-item';
            
            const project_name = new controls.span({ context });
            project_name.add(project);
            project_item.add(project_name);

            const task_count = new controls.span({ context });
            task_count.dom.attributes['class'] = 'task-count';
            task_count.add('0 tasks');
            project_item.add(task_count);

            project_list.add(project_item);
        }
        
        panel.add(project_list);
    }

    _build_stats_panel(context, panel) {
        const title = new controls.h3({ context });
        title.add('Statistics');
        panel.add(title);

        // Stats grid
        const stats_grid = new controls.div({ context });
        stats_grid.dom.attributes['class'] = 'stats-grid';

        // Total tasks card
        const total_card = new controls.div({ context });
        total_card.dom.attributes['class'] = 'stat-card';
        const total_value = new controls.div({ context });
        total_value.dom.attributes['id'] = 'total-value';
        total_value.add('0');
        total_card.add(total_value);
        const total_label = new controls.div({ context });
        total_label.add('Total Tasks');
        total_card.add(total_label);
        stats_grid.add(total_card);

        // Completed tasks card
        const completed_card = new controls.div({ context });
        completed_card.dom.attributes['class'] = 'stat-card completed';
        const completed_value = new controls.div({ context });
        completed_value.dom.attributes['id'] = 'completed-value';
        completed_value.add('0');
        completed_card.add(completed_value);
        const completed_label = new controls.div({ context });
        completed_label.add('Completed');
        completed_card.add(completed_label);
        stats_grid.add(completed_card);

        // Pending tasks card
        const pending_card = new controls.div({ context });
        pending_card.dom.attributes['class'] = 'stat-card pending';
        const pending_value = new controls.div({ context });
        pending_value.dom.attributes['id'] = 'pending-value';
        pending_value.add('0');
        pending_card.add(pending_value);
        const pending_label = new controls.div({ context });
        pending_label.add('Pending');
        pending_card.add(pending_label);
        stats_grid.add(pending_card);

        // Rate card
        const rate_card = new controls.div({ context });
        rate_card.dom.attributes['class'] = 'stat-card rate';
        const rate_value = new controls.div({ context });
        rate_value.dom.attributes['id'] = 'rate-value';
        rate_value.add('0%');
        rate_card.add(rate_value);
        const rate_label = new controls.div({ context });
        rate_label.add('Completion Rate');
        rate_card.add(rate_label);
        stats_grid.add(rate_card);

        panel.add(stats_grid);

        // Progress bar
        const progress_section = new controls.div({ context });
        progress_section.dom.attributes['class'] = 'progress-section';
        const progress_bar = new controls.div({ context });
        progress_bar.dom.attributes['class'] = 'progress-bar';
        const progress_fill = new controls.div({ context });
        progress_fill.dom.attributes['class'] = 'progress-fill';
        progress_fill.dom.attributes['id'] = 'progress-fill';
        progress_bar.add(progress_fill);
        progress_section.add(progress_bar);
        panel.add(progress_section);
    }

    _build_quick_add_panel(context, panel) {
        // Task text input
        const task_input = new Text_Field({
            context,
            placeholder: 'Enter task description...'
        });
        panel.add(task_input);
        this._task_input = task_input;

        // Project selector label
        const project_label = new controls.div({ context });
        project_label.add('Project:');
        panel.add(project_label);

        const project_select = new Select_Options({
            context,
            options: this._projects
        });
        panel.add(project_select);
        this._project_select = project_select;

        // Add button
        const add_btn = new Button({ context, text: 'Add Task' });
        add_btn.dom.attributes['id'] = 'add-task-btn';
        panel.add(add_btn);
        this._add_task_btn = add_btn;
    }

    _render_task_list() {
        // Use getElementById since we set the id in compose
        const task_list_el = document.getElementById('task-list');
        if (!task_list_el) return;

        // Clear existing tasks
        task_list_el.innerHTML = '';

        const tasks = this._tasks || [];
        const filter = this._current_filter || 'All';

        const filtered_tasks = filter === 'All' 
            ? tasks 
            : tasks.filter(t => t.project === filter);

        if (filtered_tasks.length === 0) {
            const empty_msg = document.createElement('div');
            empty_msg.className = 'empty-message';
            empty_msg.textContent = 'No tasks found. Add one!';
            task_list_el.appendChild(empty_msg);
            return;
        }

        for (const task of filtered_tasks) {
            const task_el = document.createElement('div');
            task_el.className = 'task-item' + (task.completed ? ' completed' : '');
            task_el.dataset.taskId = task.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.className = 'task-checkbox';
            checkbox.addEventListener('change', () => this._toggle_task(task.id));
            task_el.appendChild(checkbox);

            const text = document.createElement('span');
            text.className = 'task-text';
            text.textContent = task.text;
            task_el.appendChild(text);

            const project_badge = document.createElement('span');
            project_badge.className = 'project-badge';
            project_badge.textContent = task.project;
            task_el.appendChild(project_badge);

            const delete_btn = document.createElement('button');
            delete_btn.className = 'delete-btn';
            delete_btn.textContent = '×';
            delete_btn.addEventListener('click', () => this._delete_task(task.id));
            task_el.appendChild(delete_btn);

            task_list_el.appendChild(task_el);
        }
    }

    _update_stats() {
        const tasks = this._tasks || [];
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Update UI using getElementById
        const total_el = document.getElementById('total-value');
        const completed_el = document.getElementById('completed-value');
        const pending_el = document.getElementById('pending-value');
        const rate_el = document.getElementById('rate-value');
        const progress_el = document.getElementById('progress-fill');

        if (total_el) total_el.textContent = total;
        if (completed_el) completed_el.textContent = completed;
        if (pending_el) pending_el.textContent = pending;
        if (rate_el) rate_el.textContent = rate + '%';
        if (progress_el) progress_el.style.width = rate + '%';
    }

    async _add_task() {
        // Get text from DOM since control references don't persist through hydration
        // The text input is in the "Quick Add Task" window (second window with class 'inner')
        const input_el = document.querySelector('input[type="text"]');
        // The project select is the second select on the page (first is the filter)
        const selects = document.querySelectorAll('select');
        const select_el = selects.length > 1 ? selects[1] : null;
        
        const text = input_el ? input_el.value : '';
        if (!text.trim()) {
            return;
        }

        const project = select_el ? select_el.value : this._projects[0];

        try {
            const response = await fetch('/api/tasks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text.trim(), project })
            });
            const result = await response.json();
            
            if (result.success) {
                this._tasks = result.tasks;
                this._render_task_list();
                this._update_stats();
                
                // Clear input using DOM
                if (input_el) {
                    input_el.value = '';
                }
            }
        } catch (err) {
            console.error('Failed to add task:', err);
        }
    }

    async _toggle_task(id) {
        try {
            const response = await fetch('/api/tasks/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            
            if (result.success) {
                this._tasks = result.tasks;
                this._render_task_list();
                this._update_stats();
            }
        } catch (err) {
            console.error('Failed to toggle task:', err);
        }
    }

    async _delete_task(id) {
        try {
            const response = await fetch('/api/tasks/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            
            if (result.success) {
                this._tasks = result.tasks;
                this._render_task_list();
                this._update_stats();
            }
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    }

    async _load_tasks() {
        try {
            const response = await fetch('/api/tasks/list');
            const result = await response.json();
            this._tasks = result.tasks || [];
            this._render_task_list();
            this._update_stats();
        } catch (err) {
            console.error('Failed to load tasks:', err);
        }
    }

    async _clear_completed() {
        try {
            const response = await fetch('/api/tasks/clear-completed', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this._tasks = result.tasks;
                this._render_task_list();
                this._update_stats();
            }
        } catch (err) {
            console.error('Failed to clear completed:', err);
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;

            // Load initial tasks
            this._load_tasks();

            // Add task button handler - use getElementById for hydration support
            const add_task_btn = document.getElementById('add-task-btn');
            if (add_task_btn) {
                add_task_btn.addEventListener('click', () => this._add_task());
            }

            // Refresh button handler
            const refresh_btn = document.getElementById('refresh-btn');
            if (refresh_btn) {
                refresh_btn.addEventListener('click', () => this._load_tasks());
            }

            // Clear completed button handler
            const clear_completed_btn = document.getElementById('clear-completed-btn');
            if (clear_completed_btn) {
                clear_completed_btn.addEventListener('click', () => this._clear_completed());
            }

            // Filter change handler
            if (this._project_filter?.data?.model) {
                this._project_filter.data.model.on('change', e => {
                    this._current_filter = this._project_filter.data.model.value || 'All';
                    this._render_task_list();
                });
            }

            // Enter key to add task
            if (this._task_input?.dom?.el) {
                const input = this._task_input.dom.el.querySelector('input') || this._task_input.dom.el;
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this._add_task();
                });
            }

            // Handle window resize
            context.on('window-resize', e_resize => {});
        }
    }
}

Task_Manager_App.css = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow-x: hidden;
    overflow-y: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.task-manager-app {
    min-height: 100vh;
}

/* Panel styles */
.tasks-panel,
.projects-panel,
.stats-panel,
.quick-add-panel {
    padding: 15px;
    height: 100%;
}

/* Filter bar */
.filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
}

.filter-label {
    font-weight: 500;
    color: #555;
}

/* Task list */
.task-list {
    max-height: 250px;
    overflow-y: auto;
    margin-bottom: 15px;
}

.task-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
}

.task-item:hover {
    background: #e9ecef;
}

.task-item.completed {
    opacity: 0.6;
}

.task-item.completed .task-text {
    text-decoration: line-through;
    color: #888;
}

.task-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.task-text {
    flex: 1;
    font-size: 14px;
}

.project-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: #667eea;
    color: white;
    border-radius: 12px;
}

.delete-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.2s;
}

.task-item:hover .delete-btn {
    opacity: 1;
}

.empty-message {
    text-align: center;
    color: #888;
    padding: 30px;
    font-style: italic;
}

/* Action bar */
.action-bar {
    display: flex;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
}

/* Buttons */
.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5a6fd6;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
}

.btn-warning {
    background: #ffc107;
    color: #212529;
}

.btn-warning:hover {
    background: #e0a800;
}

/* Projects panel */
.projects-panel h3 {
    margin-bottom: 15px;
    color: #333;
}

.project-list {
    margin-bottom: 20px;
}

.project-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
}

.project-name {
    font-weight: 500;
}

.task-count {
    font-size: 12px;
    color: #888;
}

.add-project-section {
    display: flex;
    gap: 10px;
}

.new-project-input {
    flex: 1;
}

/* Stats panel */
.stats-panel h3 {
    margin-bottom: 20px;
    color: #333;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.stat-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.stat-card.completed {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
}

.stat-card.pending {
    background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
    color: white;
}

.stat-card.rate {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.8;
}

.progress-section {
    margin-top: 10px;
}

.progress-bar {
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
    width: 0%;
    transition: width 0.5s ease;
    border-radius: 10px;
}

/* Quick add panel */
.quick-add-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.task-input {
    width: 100%;
}

.input-label {
    font-size: 12px;
    color: #666;
    margin-bottom: -8px;
}

.add-task-btn {
    width: 100%;
    padding: 12px;
    font-size: 14px;
}

/* Custom scrollbar */
.task-list::-webkit-scrollbar {
    width: 6px;
}

.task-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
`;

controls.Task_Manager_App = Task_Manager_App;
module.exports = jsgui;
