# JSON API Examples

This directory contains examples of using JSGUI3 Server to create JSON APIs without HTML UI components.

## Examples

### 1. Basic JSON API (`basic-api/`)
A simple JSON API server that demonstrates basic CRUD operations for a todo list.

**Features:**
- GET/POST endpoints for managing todos
- In-memory data storage
- Error handling
- JSON request/response handling

**Run:**
```bash
cd basic-api
node server.js
```

**Test:**
```bash
# Get all todos
curl http://localhost:3000/api/todos

# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn JSGUI3","completed":false}'

# Get specific todo
curl http://localhost:3000/api/todo?id=1
```

### 2. Weather API (`weather-api/`)
A weather API that simulates external service calls.

**Features:**
- Simulated weather data
- Async operations
- Error handling for invalid requests
- Multiple endpoints for different data types

### 3. User Management API (`user-api/`)
A complete user management system with authentication simulation.

**Features:**
- User registration and login
- JWT-like token simulation
- Protected endpoints
- Data validation

## Architecture Notes

These examples demonstrate how to use JSGUI3 Server for pure API development:

1. **No UI Components**: Unlike other examples, these don't serve HTML/JS/CSS bundles
2. **Function Publishers**: Uses the `api` configuration option for endpoint definition
3. **Data Handling**: Demonstrates various patterns for data processing and storage
4. **Error Handling**: Shows proper error responses and validation

## Common Patterns

### API Structure
```javascript
Server.serve({
  api: {
    // GET/POST /api/endpoint
    'endpoint': (requestData) => {
      // Process request
      return responseData;
    }
  },
  port: 3000
});
```

### Data Validation
```javascript
'create-item': (data) => {
  if (!data.name) {
    throw new Error('Name is required');
  }
  // Process valid data
  return { success: true, item: newItem };
}
```

### Async Operations
```javascript
'async-endpoint': async (data) => {
  const result = await someAsyncOperation(data);
  return result;
}
```

## Running Examples

Each example follows the same pattern:

1. `cd` into the example directory
2. Run `node server.js`
3. Test endpoints with curl or your preferred HTTP client
4. Check the README.md in each directory for specific instructions

## Development Notes

These examples are designed to be:
- **Simple**: Easy to understand and modify
- **Complete**: Working end-to-end implementations
- **Educational**: Demonstrating best practices
- **Extensible**: Easy to add features or modify behavior

For more advanced patterns, see the main documentation in `docs/`.