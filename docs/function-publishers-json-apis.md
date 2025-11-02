# Function Publishers and JSON APIs

## When to Read

This document explains how to use JSGUI3 Server's function publishers to create JSON APIs. Read this when:
- You want to create RESTful JSON APIs with JSGUI3 Server
- You need to understand how function publishers work
- You're building backend services that return JSON data
- You want to integrate with frontend applications via HTTP APIs
- You need to handle different content types and HTTP methods

**Note:** For basic usage with `Server.serve()`, see [README.md](../README.md). For advanced examples, see [docs/advanced-usage-examples.md](docs/advanced-usage-examples.md).

## Overview

JSGUI3 Server provides a powerful function publishing system that automatically creates HTTP endpoints from JavaScript functions. These publishers handle:

- **Automatic JSON serialization/deserialization**
- **Content-type negotiation** (JSON, text, promises)
- **HTTP method routing** (GET, POST, etc.)
- **Error handling and propagation**
- **Async/await support**

## Function Publisher Architecture

### Core Components

```
HTTP Request → Function Publisher → Your Function → JSON Response
       ↓              ↓                    ↓           ↓
   Content-Type → Parse Input → Execute → Serialize Output
   application/json    JSON       Function    JSON/text
```

### Publisher Types

1. **Function Publisher** (`http-function-publisher.js`): Direct function-to-HTTP mapping
2. **Resource Publisher** (`http-resource-publisher.js`): RESTful resource operations
3. **API Integration**: Built into `Server.serve()` via the `api` option

## Basic Function Publishing

### Simple API Endpoint

```javascript
const Server = require('jsgui3-server');

Server.serve({
  ctrl: require('./client').controls.MyApp,

  // Function publishers automatically create /api/* routes
  api: {
    // GET/POST /api/hello
    'hello': (name) => `Hello ${name || 'World'}!`,

    // GET/POST /api/time
    'time': () => new Date().toISOString(),

    // GET/POST /api/random
    'random': () => Math.random()
  },

  port: 3000
});
```

**What happens:**
- Routes are automatically prefixed with `/api/`
- Functions receive parsed request body as first parameter
- Return values are automatically JSON-serialized
- HTTP status codes are set appropriately

### Testing the API

```bash
# Test the endpoints
curl http://localhost:3000/api/hello
# {"result":"Hello World!"}

curl -X POST http://localhost:3000/api/hello \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
# {"result":"Hello Alice!"}

curl http://localhost:3000/api/time
# {"result":"2025-11-02T01:00:00.000Z"}
```

## Input Handling

### Content Type Support

The function publisher automatically handles different content types:

#### JSON Input (`application/json`)
```javascript
api: {
  'calculate': (data) => {
    // data is already parsed JSON object
    return {
      sum: data.a + data.b,
      product: data.a * data.b
    };
  }
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3}'
```

**Response:**
```json
{
  "sum": 8,
  "product": 15
}
```

#### Text Input (`text/plain`)
```javascript
api: {
  'echo': (text) => `Echo: ${text}`
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: text/plain" \
  -d "Hello World"
```

**Response:**
```json
{
  "result": "Echo: Hello World"
}
```

#### No Body (GET requests)
```javascript
api: {
  'status': () => ({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  })
}
```

**Request:**
```bash
curl http://localhost:3000/api/status
```

## Output Handling

### Return Type Detection

Functions can return different types, automatically handled by content-type detection:

#### Objects/Arrays → JSON
```javascript
api: {
  'user': () => ({
    id: 123,
    name: "John Doe",
    email: "john@example.com"
  }),

  'users': () => [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]
}
```

#### Strings → Text
```javascript
api: {
  'greeting': (name) => `Hello, ${name}!`
}
```

#### Promises → Async Resolution
```javascript
api: {
  'async-data': async () => {
    const data = await fetchExternalAPI();
    return data;
  },

  'delayed': () => new Promise(resolve => {
    setTimeout(() => resolve({ message: 'Done!' }), 1000);
  })
}
```

## Advanced Patterns

### Database Integration

```javascript
// Simulated database
const db = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
};

Server.serve({
  ctrl: require('./client').controls.App,

  api: {
    // GET /api/users - List all users
    'users': () => db.users,

    // GET /api/user?id=1 - Get specific user
    'user': ({ id }) => {
      const user = db.users.find(u => u.id === parseInt(id));
      if (!user) throw new Error('User not found');
      return user;
    },

    // POST /api/user - Create new user
    'create-user': ({ name, email }) => {
      const newUser = {
        id: db.users.length + 1,
        name,
        email
      };
      db.users.push(newUser);
      return { success: true, user: newUser };
    },

    // POST /api/update-user - Update existing user
    'update-user': ({ id, ...updates }) => {
      const user = db.users.find(u => u.id === parseInt(id));
      if (!user) throw new Error('User not found');

      Object.assign(user, updates);
      return { success: true, user };
    }
  },

  port: 3000
});
```

### File Upload Handling

```javascript
const fs = require('fs');
const path = require('path');

Server.serve({
  ctrl: require('./client').controls.App,

  api: {
    // POST /api/upload - Handle file uploads
    'upload': async (files) => {
      const uploadedFiles = [];

      for (const file of files) {
        const filename = `${Date.now()}-${file.filename}`;
        const filepath = path.join(__dirname, 'uploads', filename);

        // Ensure uploads directory exists
        fs.mkdirSync(path.dirname(filepath), { recursive: true });

        // Write file
        fs.writeFileSync(filepath, file.buffer);

        uploadedFiles.push({
          originalName: file.filename,
          savedName: filename,
          size: file.buffer.length,
          url: `/uploads/${filename}`
        });
      }

      return {
        success: true,
        files: uploadedFiles
      };
    }
  },

  port: 3000
});
```

### Authentication and Authorization

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const users = [
  { id: 1, username: 'admin', passwordHash: '$2b$10$...' }
];

Server.serve({
  ctrl: require('./client').controls.App,

  api: {
    // POST /api/login
    'login': async ({ username, password }) => {
      const user = users.find(u => u.username === username);
      if (!user) throw new Error('Invalid credentials');

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) throw new Error('Invalid credentials');

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return { token, user: { id: user.id, username: user.username } };
    },

    // POST /api/protected - Requires authentication
    'protected': (data, req) => {
      // Extract token from request (implementation depends on auth middleware)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { message: 'Protected data', user: decoded };
      } catch (error) {
        throw new Error('Invalid token');
      }
    }
  },

  port: 3000
});
```

## Error Handling

### Automatic Error Propagation

```javascript
api: {
  'risky-operation': (params) => {
    if (!params.requiredField) {
      throw new Error('requiredField is required');
    }

    if (params.value < 0) {
      throw new Error('Value must be positive');
    }

    return { result: params.value * 2 };
  }
}
```

**Error Response:**
```json
{
  "error": "requiredField is required"
}
```

### Custom Error Types

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

api: {
  'validate': (data) => {
    if (!data.email || !data.email.includes('@')) {
      throw new ValidationError('Invalid email format', 'email');
    }

    return { valid: true, email: data.email };
  }
}
```

## Resource Publishers

### RESTful Resource Operations

Resource publishers provide CRUD operations for data resources:

```javascript
const { Resource } = require('jsgui3-html');

class UserResource extends Resource {
  constructor(spec) {
    super(spec);
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];
  }

  // GET /api/users
  async get(pathParts) {
    if (pathParts.length === 0) {
      return this.users; // List all users
    }

    const id = parseInt(pathParts[0]);
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user; // Get specific user
  }

  // POST /api/users
  async post(data) {
    const newUser = {
      id: this.users.length + 1,
      name: data.name,
      email: data.email
    };
    this.users.push(newUser);
    return newUser;
  }

  // DELETE /api/users/1
  async delete(pathParts) {
    const id = parseInt(pathParts[0]);
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const deletedUser = this.users.splice(index, 1)[0];
    return { deleted: true, user: deletedUser };
  }
}

// In server setup
const userResource = new UserResource();
const resourcePublisher = new (require('./publishers/http-resource-publisher'))({
  resource: userResource,
  name: 'users'
});

// Routes: /api/users/* handled by resourcePublisher
```

## Integration with Frontend

### Fetch API Integration

```javascript
// Frontend JavaScript
class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Convenience methods
  get(endpoint, params) {
    const query = params ? '?' + new URLSearchParams(params) : '';
    return this.request(endpoint + query);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Usage
const api = new ApiClient();

// GET requests
const users = await api.get('users');
const user = await api.get('user', { id: 1 });

// POST requests
const newUser = await api.post('create-user', {
  name: 'Charlie',
  email: 'charlie@example.com'
});

// Error handling
try {
  const result = await api.post('validate', { email: 'invalid' });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

## Performance Considerations

### Caching Strategies

```javascript
api: {
  // Cacheable data
  'static-config': () => ({
    version: '1.0.0',
    features: ['auth', 'api', 'files'],
    limits: { maxUploadSize: '10MB' }
  }),

  // Dynamic data with cache headers
  'stats': () => {
    // Set cache headers in response
    const stats = {
      users: getUserCount(),
      uptime: process.uptime(),
      timestamp: new Date()
    };

    // Note: Cache headers would be set by middleware
    return stats;
  }
}
```

### Rate Limiting

```javascript
// Basic rate limiting (implement proper middleware for production)
let requestCounts = new Map();

api: {
  'rate-limited-endpoint': (data, req) => {
    const clientIP = req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Clean old entries
    for (const [ip, timestamps] of requestCounts) {
      requestCounts.set(ip, timestamps.filter(t => t > windowStart));
    }

    // Check rate limit
    const timestamps = requestCounts.get(clientIP) || [];
    if (timestamps.length >= 10) { // 10 requests per minute
      throw new Error('Rate limit exceeded');
    }

    // Record request
    timestamps.push(now);
    requestCounts.set(clientIP, timestamps);

    return { success: true, data: 'Processed' };
  }
}
```

## Testing Function Publishers

### Unit Testing

```javascript
const assert = require('assert');

// Test function directly
const helloFunction = (name) => `Hello ${name || 'World'}!`;

assert.equal(helloFunction(), 'Hello World!');
assert.equal(helloFunction('Alice'), 'Hello Alice!');

// Test with simulated HTTP
const Function_Publisher = require('./publishers/http-function-publisher');

function testFunctionPublisher() {
  const publisher = new Function_Publisher(helloFunction);

  // Mock request/response
  const mockReq = {
    headers: { 'content-type': 'application/json' },
    on: function(event, callback) {
      if (event === 'data') callback(Buffer.from('{"name":"Test"}'));
      if (event === 'end') callback();
    }
  };

  let responseData = '';
  const mockRes = {
    writeHead: () => {},
    end: (data) => { responseData = data; }
  };

  publisher.handle_http(mockReq, mockRes);

  // Verify response
  const response = JSON.parse(responseData);
  assert.equal(response.result, 'Hello Test!');
}
```

### Integration Testing

```javascript
const http = require('http');

function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/hello',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.write(JSON.stringify({ name: 'Integration Test' }));
    req.end();
  });
}

// Usage
testAPIEndpoint().then(result => {
  console.log('Integration test passed:', result);
}).catch(err => {
  console.error('Integration test failed:', err);
});
```

## Best Practices

### API Design

1. **Consistent Naming**: Use lowercase, hyphen-separated endpoint names
2. **RESTful Patterns**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
3. **Versioning**: Consider API versioning for breaking changes
4. **Documentation**: Document all endpoints with expected inputs/outputs
5. **Error Handling**: Provide meaningful error messages

### Security

1. **Input Validation**: Always validate and sanitize inputs
2. **Authentication**: Implement proper auth for sensitive endpoints
3. **Rate Limiting**: Prevent abuse with rate limiting
4. **CORS**: Configure appropriate CORS policies
5. **HTTPS**: Use HTTPS in production

### Performance

1. **Caching**: Implement appropriate caching strategies
2. **Compression**: Enable gzip compression for responses
3. **Async Operations**: Use async/await for I/O operations
4. **Connection Pooling**: Use connection pools for databases
5. **Monitoring**: Monitor response times and error rates

## Troubleshooting

### Common Issues

#### Content-Type Mismatch
```
Error: Unexpected token in JSON
```
**Cause:** Sending wrong content-type header
**Fix:** Ensure `Content-Type: application/json` for JSON data

#### Function Not Found
```
Error: Route not found
```
**Cause:** API endpoint not properly registered
**Fix:** Check that function is in the `api` object and server restarted

#### Async Function Issues
```
Error: Function did not return a value
```
**Cause:** Async function not properly awaited
**Fix:** Ensure async functions use `async/await` pattern

#### CORS Issues
```
Error: CORS policy blocked
```
**Cause:** Missing CORS headers
**Fix:** Add CORS middleware or headers

## Migration from Other Frameworks

### From Express.js

```javascript
// Express.js
app.get('/api/users', (req, res) => {
  res.json(getUsers());
});

// JSGUI3 Server
Server.serve({
  api: {
    'users': () => getUsers()
  }
});
```

### From RESTify

```javascript
// RESTify
server.get('/api/users/:id', (req, res) => {
  res.send(getUser(req.params.id));
});

// JSGUI3 Server
Server.serve({
  api: {
    'user': ({ id }) => getUser(id)
  }
});
```

## Advanced Topics

### Custom Publishers

```javascript
const HTTP_Publisher = require('./publishers/http-publisher');

class CustomPublisher extends HTTP_Publisher {
  constructor(spec) {
    super(spec);
    this.customLogic = spec.customLogic;
  }

  handle_http(req, res) {
    // Custom request handling logic
    if (this.customLogic(req)) {
      // Handle custom case
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ custom: true }));
    } else {
      // Fall back to default
      super.handle_http(req, res);
    }
  }
}
```

### Middleware Integration

```javascript
// Custom middleware
function loggingMiddleware(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }
  // Validate token...
  next();
}

Server.serve({
  ctrl: MyControl,
  middleware: [loggingMiddleware, authMiddleware],
  api: { /* ... */ }
});
```

## Conclusion

Function publishers provide a powerful, easy-to-use way to create JSON APIs with JSGUI3 Server. The automatic content-type handling, promise support, and flexible input/output processing make it simple to build robust backend services.

Key benefits:
- **Automatic JSON handling** - No manual serialization
- **Promise/async support** - Modern JavaScript patterns
- **Flexible inputs** - JSON, text, or no body
- **Error propagation** - Automatic error handling
- **RESTful routing** - Automatic `/api/` prefixing

For complex applications, consider combining function publishers with resource publishers for full CRUD operations and more sophisticated API patterns.