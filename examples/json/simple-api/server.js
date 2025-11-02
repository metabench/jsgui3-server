// Simple JSON API Example
// Demonstrates basic JSON API functionality with minimal code

const Server = require('../../../server');

// Simple in-memory data store
let messages = [
  { id: 1, text: 'Hello, World!', author: 'System', timestamp: new Date() },
  { id: 2, text: 'Welcome to JSGUI3 Server JSON API', author: 'API', timestamp: new Date() }
];

let nextId = 3;

Server.serve({
  // No UI control - pure JSON API server
  // ctrl: undefined,

  api: {
    // GET /api/messages - Get all messages
    'messages': () => ({
      messages: messages,
      count: messages.length
    }),

    // GET /api/status - Server status
    'status': () => ({
      status: 'running',
      timestamp: new Date(),
      version: '1.0.0',
      uptime: process.uptime()
    }),

    // POST /api/add-message - Add a new message
    'add-message': (data) => {
      if (!data.text || typeof data.text !== 'string') {
        throw new Error('Message text is required');
      }

      if (data.text.length > 500) {
        throw new Error('Message text must be 500 characters or less');
      }

      const newMessage = {
        id: nextId++,
        text: data.text.trim(),
        author: data.author || 'Anonymous',
        timestamp: new Date()
      };

      messages.push(newMessage);

      return {
        success: true,
        message: newMessage
      };
    },

    // POST /api/clear-messages - Clear all messages
    'clear-messages': () => {
      const count = messages.length;
      messages = [];
      nextId = 1;

      return {
        success: true,
        clearedCount: count,
        message: `Cleared ${count} messages`
      };
    }
  },

  port: 3002
}).then(server => {
  console.log('🚀 Simple JSON API Server started!');
  console.log(`📡 Running at: http://localhost:${server.port}`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /api/messages      - Get all messages');
  console.log('  GET  /api/status        - Server status');
  console.log('  POST /api/add-message   - Add new message');
  console.log('  POST /api/clear-messages - Clear all messages');
  console.log('\n🧪 Test with:');
  console.log('  curl http://localhost:3002/api/status');
  console.log('  curl -X POST http://localhost:3002/api/add-message \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"text":"Hello from curl!","author":"Tester"}\'');

}).catch(err => {
  console.error('❌ Failed to start server:', err.message);
  console.error('❌ Full error:', err);
  process.exit(1);
});