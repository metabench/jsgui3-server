# Basic JSON API Example

This example demonstrates a complete JSON API server using JSGUI3 Server for managing a todo list. Unlike other examples, this serves **only JSON APIs** with no HTML UI components.

## Features

- ✅ **Pure JSON API**: No HTML, CSS, or JavaScript UI bundles
- ✅ **Complete CRUD**: Create, Read, Update, Delete operations
- ✅ **Data Validation**: Input validation with meaningful error messages
- ✅ **Statistics**: Analytics endpoints for todo data
- ✅ **Error Handling**: Proper HTTP error responses
- ✅ **In-Memory Storage**: Simple data persistence (replace with database for production)

## API Endpoints

### Todos Management

#### `GET /api/todos`
Get all todos with summary statistics.

**Response:**
```json
{
  "todos": [
    {
      "id": 1,
      "title": "Learn JSGUI3 Server",
      "completed": false,
      "createdAt": "2025-11-02T01:00:00.000Z"
    }
  ],
  "total": 1,
  "completed": 0
}
```

#### `GET /api/todo?id={id}`
Get a specific todo by ID.

**Parameters:**
- `id` (required): Todo ID number

**Response:**
```json
{
  "id": 1,
  "title": "Learn JSGUI3 Server",
  "completed": false,
  "createdAt": "2025-11-02T01:00:00.000Z"
}
```

#### `POST /api/create-todo`
Create a new todo item.

**Request Body:**
```json
{
  "title": "New todo item",
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "todo": {
    "id": 3,
    "title": "New todo item",
    "completed": false,
    "createdAt": "2025-11-02T01:00:00.000Z",
    "updatedAt": "2025-11-02T01:00:00.000Z"
  },
  "message": "Todo created successfully"
}
```

#### `POST /api/update-todo`
Update an existing todo.

**Request Body:**
```json
{
  "id": 1,
  "title": "Updated title",
  "completed": true
}
```

#### `POST /api/delete-todo`
Delete a todo item.

**Request Body:**
```json
{
  "id": 1
}
```

#### `POST /api/toggle-todo`
Toggle the completion status of a todo.

**Request Body:**
```json
{
  "id": 1
}
```

### Analytics

#### `GET /api/stats`
Get todo statistics.

**Response:**
```json
{
  "total": 2,
  "completed": 1,
  "pending": 1,
  "completionRate": "50.0%"
}
```

#### `POST /api/clear-completed`
Remove all completed todos.

**Response:**
```json
{
  "success": true,
  "deletedCount": 1,
  "remainingCount": 1,
  "message": "Deleted 1 completed todos"
}
```

## Running the Example

1. **Start the server:**
   ```bash
   cd examples/json/basic-api
   node server.js
   ```

2. **Test the API:**
   ```bash
   # Get all todos
   curl http://localhost:3000/api/todos

   # Create a new todo
   curl -X POST http://localhost:3000/api/create-todo \
     -H "Content-Type: application/json" \
     -d '{"title":"Test todo","completed":false}'

   # Get statistics
   curl http://localhost:3000/api/stats

   # Update a todo
   curl -X POST http://localhost:3000/api/update-todo \
     -H "Content-Type: application/json" \
     -d '{"id":1,"completed":true}'

   # Delete a todo
   curl -X POST http://localhost:3000/api/delete-todo \
     -H "Content-Type: application/json" \
     -d '{"id":1}'
   ```

## Code Structure

### Server Configuration

```javascript
Server.serve({
  // No UI control - pure API server
  // ctrl: undefined,

  api: {
    // Define your endpoints here
    'todos': () => { /* ... */ },
    'create-todo': (data) => { /* ... */ },
    // ...
  },

  port: 3000
});
```

### Data Validation

```javascript
'create-todo': (data) => {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Title is required and must be a string');
  }

  if (data.title.length > 200) {
    throw new Error('Title must be 200 characters or less');
  }

  // Process valid data...
}
```

### Error Handling

All thrown errors are automatically converted to JSON error responses:

```json
{
  "error": "Title is required and must be a string"
}
```

## Key Differences from UI Examples

1. **No Control**: Unlike other examples, this doesn't specify a `ctrl` property
2. **No Bundling**: No JavaScript/CSS bundling occurs since there's no UI
3. **Pure API**: Only serves JSON responses to API endpoints
4. **No HTML**: No web pages are served - only API endpoints

## Production Considerations

This example uses in-memory storage. For production, consider:

- **Database Integration**: Replace the in-memory `todos` array with a database
- **Authentication**: Add user authentication and authorization
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Sanitization**: Add more comprehensive input validation
- **Logging**: Add request logging and monitoring
- **CORS**: Configure CORS policies for web clients

## Extending the Example

### Adding a Database

```javascript
// Replace in-memory storage with database
const db = require('some-database-library');

const api = {
  'todos': async () => {
    const todos = await db.query('SELECT * FROM todos');
    return { todos, total: todos.length };
  },

  'create-todo': async (data) => {
    const result = await db.query('INSERT INTO todos (title, completed) VALUES (?, ?)',
                                  [data.title, data.completed]);
    return { success: true, id: result.insertId };
  }
  // ...
};
```

### Adding Authentication

```javascript
// Add authentication middleware (conceptual)
const authenticate = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  // Verify token and return user info
  return verifyToken(token);
};

const api = {
  'protected-endpoint': (data, req) => {
    const user = authenticate(req);
    // Only authenticated users can access this
    return { user, data };
  }
};
```

## Testing

### Manual Testing

Use curl or Postman to test all endpoints:

```bash
# Create test data
curl -X POST http://localhost:3000/api/create-todo \
  -H "Content-Type: application/json" \
  -d '{"title":"Test API","completed":false}'

# Verify creation
curl http://localhost:3000/api/todos

# Test error handling
curl -X POST http://localhost:3000/api/create-todo \
  -H "Content-Type: application/json" \
  -d '{"title":"","completed":false}'
```

### Automated Testing

```javascript
// test-api.js
const assert = require('assert');

async function testAPI() {
  const baseUrl = 'http://localhost:3000/api';

  // Test GET todos
  const todosResponse = await fetch(`${baseUrl}/todos`);
  const todosData = await todosResponse.json();
  assert(Array.isArray(todosData.todos), 'Todos should be an array');

  // Test POST create todo
  const createResponse = await fetch(`${baseUrl}/create-todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Todo', completed: false })
  });
  const createData = await createResponse.json();
  assert(createData.success, 'Create should succeed');

  console.log('✅ All API tests passed!');
}

testAPI().catch(console.error);
```

## Troubleshooting

### Common Issues

1. **"Route not found"**: Make sure the server is running and endpoints are correctly defined
2. **"Unexpected token"**: Check that Content-Type header is set to `application/json`
3. **"Title is required"**: Ensure request body includes required fields
4. **Server won't start**: Check that port 3000 is not already in use

### Debug Mode

Run with debug logging:

```bash
DEBUG=* node server.js
```

This will show detailed request/response logging.