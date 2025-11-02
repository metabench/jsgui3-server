// Basic JSON API Example - Todo List API
// This example demonstrates a complete JSON API server with no HTML UI

const Server = require('../../../server');

// In-memory data store (in production, use a database)
let todos = [
  { id: 1, title: 'Learn JSGUI3 Server', completed: false, createdAt: new Date() },
  { id: 2, title: 'Build JSON API', completed: true, createdAt: new Date() }
];

let nextId = 3;

Server.serve({
  // No UI control - pure API server
  // ctrl: undefined,

  api: {
    // GET /api/todos - Get all todos
    'todos': () => {
      return {
        todos: todos,
        total: todos.length,
        completed: todos.filter(t => t.completed).length
      };
    },

    // GET /api/todo?id=1 - Get specific todo
    'todo': (data) => {
      const id = parseInt(data.id);
      if (!id) {
        throw new Error('Todo ID is required');
      }

      const todo = todos.find(t => t.id === id);
      if (!todo) {
        throw new Error('Todo not found');
      }

      return todo;
    },

    // POST /api/create-todo - Create new todo
    'create-todo': (data) => {
      if (!data.title || typeof data.title !== 'string') {
        throw new Error('Title is required and must be a string');
      }

      if (data.title.length > 200) {
        throw new Error('Title must be 200 characters or less');
      }

      const newTodo = {
        id: nextId++,
        title: data.title.trim(),
        completed: Boolean(data.completed),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      todos.push(newTodo);

      return {
        success: true,
        todo: newTodo,
        message: 'Todo created successfully'
      };
    },

    // POST /api/update-todo - Update existing todo
    'update-todo': (data) => {
      const id = parseInt(data.id);
      if (!id) {
        throw new Error('Todo ID is required');
      }

      const todoIndex = todos.findIndex(t => t.id === id);
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }

      const todo = todos[todoIndex];

      // Update allowed fields
      if (data.title !== undefined) {
        if (typeof data.title !== 'string' || data.title.length > 200) {
          throw new Error('Title must be a string of 200 characters or less');
        }
        todo.title = data.title.trim();
      }

      if (data.completed !== undefined) {
        todo.completed = Boolean(data.completed);
      }

      todo.updatedAt = new Date();

      return {
        success: true,
        todo: todo,
        message: 'Todo updated successfully'
      };
    },

    // POST /api/delete-todo - Delete todo
    'delete-todo': (data) => {
      const id = parseInt(data.id);
      if (!id) {
        throw new Error('Todo ID is required');
      }

      const todoIndex = todos.findIndex(t => t.id === id);
      if (todoIndex === -1) {
        throw new Error('Todo not found');
      }

      const deletedTodo = todos.splice(todoIndex, 1)[0];

      return {
        success: true,
        deletedTodo: deletedTodo,
        message: 'Todo deleted successfully'
      };
    },

    // POST /api/toggle-todo - Toggle completion status
    'toggle-todo': (data) => {
      const id = parseInt(data.id);
      if (!id) {
        throw new Error('Todo ID is required');
      }

      const todo = todos.find(t => t.id === id);
      if (!todo) {
        throw new Error('Todo not found');
      }

      todo.completed = !todo.completed;
      todo.updatedAt = new Date();

      return {
        success: true,
        todo: todo,
        message: `Todo ${todo.completed ? 'completed' : 'marked incomplete'}`
      };
    },

    // GET /api/stats - Get todo statistics
    'stats': () => {
      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      const pending = total - completed;

      return {
        total: total,
        completed: completed,
        pending: pending,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) + '%' : '0%'
      };
    },

    // POST /api/clear-completed - Remove all completed todos
    'clear-completed': () => {
      const initialCount = todos.length;
      todos = todos.filter(t => !t.completed);
      const deletedCount = initialCount - todos.length;

      return {
        success: true,
        deletedCount: deletedCount,
        remainingCount: todos.length,
        message: `Deleted ${deletedCount} completed todos`
      };
    }
  },

  port: 3000
}).then(server => {
  console.log('🚀 JSON API Server started successfully!');
  console.log(`📡 Server running at: http://localhost:${server.port}`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /api/todos           - Get all todos');
  console.log('  GET  /api/todo?id=1       - Get specific todo');
  console.log('  POST /api/create-todo     - Create new todo');
  console.log('  POST /api/update-todo     - Update existing todo');
  console.log('  POST /api/delete-todo     - Delete todo');
  console.log('  POST /api/toggle-todo     - Toggle completion status');
  console.log('  GET  /api/stats           - Get statistics');
  console.log('  POST /api/clear-completed - Remove completed todos');
  console.log('\n🧪 Test with:');
  console.log('  curl http://localhost:3000/api/todos');
  console.log('  curl -X POST http://localhost:3000/api/create-todo \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"title":"Test todo","completed":false}\'');

}).catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});