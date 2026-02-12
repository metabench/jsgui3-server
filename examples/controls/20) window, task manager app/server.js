/**
 * Task Manager Application Server
 * 
 * Demonstrates:
 * - Server.serve() with a control
 * - API endpoints for CRUD operations
 * - In-memory data store (could be replaced with database)
 */

const jsgui = require('./client');
const Server = require('../../../server');
const { Task_Manager_App } = jsgui.controls;

// In-memory task store
let tasks = [
    { id: 1, text: 'Welcome to Task Manager!', project: 'Personal', completed: false, created: new Date() },
    { id: 2, text: 'Try adding a new task', project: 'Personal', completed: false, created: new Date() },
    { id: 3, text: 'Click checkbox to complete', project: 'Work', completed: true, created: new Date() },
    { id: 4, text: 'Use the filter to sort by project', project: 'Work', completed: false, created: new Date() },
    { id: 5, text: 'Check the Stats tab', project: 'Personal', completed: false, created: new Date() }
];

let next_id = 6;

// Helper to get tasks array (ensures we return a copy)
const get_tasks = () => [...tasks];

if (require.main === module) {
    const server = new Server({
        Ctrl: Task_Manager_App,
        src_path_client_js: require.resolve('./client.js')
    });

    server.on('ready', () => {
        console.log('Server ready, setting up API endpoints...');

        // GET /api/tasks/list - Get all tasks
        server.publish('tasks/list', () => {
            return {
                success: true,
                tasks: get_tasks(),
                count: tasks.length
            };
        });

        // POST /api/tasks/add - Add a new task
        server.publish('tasks/add', (data) => {
            if (!data || !data.text || typeof data.text !== 'string') {
                return { success: false, error: 'Task text is required' };
            }

            const new_task = {
                id: next_id++,
                text: data.text.trim(),
                project: data.project || 'Personal',
                completed: false,
                created: new Date()
            };

            tasks.push(new_task);

            return {
                success: true,
                task: new_task,
                tasks: get_tasks()
            };
        });

        // POST /api/tasks/toggle - Toggle task completion
        server.publish('tasks/toggle', (data) => {
            if (!data || typeof data.id !== 'number') {
                return { success: false, error: 'Task ID is required' };
            }

            const task = tasks.find(t => t.id === data.id);
            if (!task) {
                return { success: false, error: 'Task not found' };
            }

            task.completed = !task.completed;

            return {
                success: true,
                task,
                tasks: get_tasks()
            };
        });

        // POST /api/tasks/delete - Delete a task
        server.publish('tasks/delete', (data) => {
            if (!data || typeof data.id !== 'number') {
                return { success: false, error: 'Task ID is required' };
            }

            const index = tasks.findIndex(t => t.id === data.id);
            if (index === -1) {
                return { success: false, error: 'Task not found' };
            }

            const deleted = tasks.splice(index, 1)[0];

            return {
                success: true,
                deleted,
                tasks: get_tasks()
            };
        });

        // POST /api/tasks/clear-completed - Remove all completed tasks
        server.publish('tasks/clear-completed', () => {
            const before_count = tasks.length;
            tasks = tasks.filter(t => !t.completed);
            const removed = before_count - tasks.length;

            return {
                success: true,
                removed,
                tasks: get_tasks()
            };
        });

        // GET /api/stats - Get task statistics
        server.publish('stats', () => {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Group by project
            const by_project = {};
            for (const task of tasks) {
                if (!by_project[task.project]) {
                    by_project[task.project] = { total: 0, completed: 0 };
                }
                by_project[task.project].total++;
                if (task.completed) {
                    by_project[task.project].completed++;
                }
            }

            return {
                total,
                completed,
                pending,
                completion_rate: rate,
                by_project
            };
        });

        console.log('API endpoints registered:');
        console.log('  GET  /api/tasks/list');
        console.log('  POST /api/tasks/add');
        console.log('  POST /api/tasks/toggle');
        console.log('  POST /api/tasks/delete');
        console.log('  POST /api/tasks/clear-completed');
        console.log('  GET  /api/stats');

        // Start server
        const port = parseInt(process.env.PORT, 10) || 52021;
        server.start(port, (err) => {
            if (err) throw err;
            console.log('');
            console.log('='.repeat(50));
            console.log('Task Manager Application');
            console.log('='.repeat(50));
            console.log(`Open http://localhost:${port} in your browser`);
            console.log('');
            console.log('Features:');
            console.log('  - Add, complete, and delete tasks');
            console.log('  - Filter tasks by project');
            console.log('  - View statistics and completion rate');
            console.log('  - Quick add floating window');
            console.log('='.repeat(50));
        });
    });
}

module.exports = { tasks, get_tasks };
