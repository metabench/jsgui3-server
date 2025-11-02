# Getting Started with JSON APIs in JSGUI3 Server

**Version 0.0.1 - Provisional Guide**

*This guide is provisional and intended to be helpful, but needs verification. It documents the current understanding of JSON API functionality in JSGUI3 Server based on code analysis. Please verify examples work in your environment and report any discrepancies.*

## When to Read

This guide is for developers who want to create JSON APIs with JSGUI3 Server. Read this when:
- You want to build backend services that serve JSON data
- You're creating REST APIs for frontend applications
- You need to understand how JSGUI3 Server handles HTTP requests and responses
- You're migrating from other web frameworks to JSGUI3 Server

**Important:** This is version 0.0.1 of this guide. It may contain inaccuracies or incomplete information. Please verify all examples and report issues.

## Quick Start: Your First JSON API

### Minimal JSON API Server

```javascript
// server.js
const Server = require('jsgui3-server');

Server.serve({
  // No UI control needed for pure API server
  // ctrl: MyControl, // commented out

  // Define API endpoints
  api: {
    'hello': () => ({ message: 'Hello, World!', timestamp: new Date() }),
    'echo': (data) => ({ received: data, echoed: true })
  },

  port: 3000
});
```

**Start the server:**
```bash
node server.js
```

**Test the API:**
```bash
# GET request (no body)
curl http://localhost:3000/api/hello
# Response: {"message":"Hello, World!","timestamp":"2025-11-02T01:00:00.000Z"}

# POST request with JSON body
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":30}'
# Response: {"received":{"name":"Alice","age":30},"echoed":true}
```

## How JSON APIs Work in JSGUI3 Server

### The `api` Configuration Option

The `api` option in `Server.serve()` automatically creates HTTP endpoints:

```javascript
Server.serve({
  api: {
    // This creates: GET/POST /api/endpoint-name
    'endpoint-name': (requestData) => {
      // Your function logic here
      return responseData;
    }
  }
});
```

### Automatic Features

1. **Route Prefixing**: All API endpoints automatically get `/api/` prefix
2. **HTTP Methods**: Both GET and POST requests are supported
3. **Content-Type Handling**: Automatic JSON parsing and serialization
4. **Promise Support**: Async functions work automatically
5. **Error Handling**: Exceptions become JSON error responses

## API Endpoint Examples

### Simple Data Endpoints

```javascript
Server.serve({
  api: {
    // Static data
    'version': () => ({ version: '1.0.0', api: 'json' }),

    // Dynamic data
    'time': () => ({
      serverTime: new Date().toISOString(),
      uptime: process.uptime()
    }),

    // Random data
    'random': () => ({
      number: Math.random(),
      dice: Math.floor(Math.random() * 6) + 1
    })
  },
  port: 3000
});
```

### Working with Request Data

```javascript
Server.serve({
  api: {
    // Access request body data
    'greet': (data) => {
      const name = data.name || 'Anonymous';
      return { greeting: `Hello, ${name}!` };
    },

    // Process form data
    'calculate': (data) => {
      const { a, b, operation } = data;
      let result;

      switch (operation) {
        case 'add': result = a + b; break;
        case 'subtract': result = a - b; break;
        case 'multiply': result = a * b; break;
        case 'divide': result = a / b; break;
        default: throw new Error('Unknown operation');
      }

      return { a, b, operation, result };
    },

    // Handle arrays
    'process-list': (data) => {
      const numbers = data.numbers || [];
      return {
        original: numbers,
        sum: numbers.reduce((a, b) => a + b, 0),
        average: numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0,
        sorted: [...numbers].sort((a, b) => a - b)
      };
    }
  },
  port: 3000
});
```

### Async Operations and External APIs

```javascript
Server.serve({
  api: {
    // Simulate async operation
    'delayed-response': async (data) => {
      const delay = data.delay || 1000;

      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, delay));

      return {
        message: 'Response after delay',
        delay: delay,
        timestamp: new Date()
      };
    },

    // External API call (simulated)
    'weather': async (data) => {
      const city = data.city || 'London';

      // In real app, call actual weather API
      // const response = await fetch(`https://api.weather.com/${city}`);
      // const weather = await response.json();

      // Simulated response
      const mockWeather = {
        city: city,
        temperature: Math.floor(Math.random() * 30) + 5,
        condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 100)
      };

      return mockWeather;
    }
  },
  port: 3000
});
```

## Error Handling

### Automatic Error Responses

```javascript
Server.serve({
  api: {
    'safe-divide': (data) => {
      const { a, b } = data;

      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both a and b must be numbers');
      }

      if (b === 0) {
        throw new Error('Division by zero');
      }

      return { result: a / b };
    },

    'validate-user': (data) => {
      const { name, email, age } = data;

      if (!name || name.length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      if (!email || !email.includes('@')) {
        throw new Error('Valid email required');
      }

      if (!age || age < 0 || age > 150) {
        throw new Error('Age must be between 0 and 150');
      }

      return { valid: true, user: { name, email, age } };
    }
  },
  port: 3000
});
```

**Error response format:**
```json
{
  "error": "Division by zero"
}
```

## Database Integration Example

```javascript
// In-memory "database" for demonstration
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 30 }
];

let nextId = 3;

Server.serve({
  api: {
    // GET /api/users - List all users
    'users': () => users,

    // GET /api/user?id=1 - Get specific user
    'user': (data) => {
      const id = parseInt(data.id);
      const user = users.find(u => u.id === id);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    },

    // POST /api/create-user - Create new user
    'create-user': (data) => {
      const { name, email, age } = data;

      if (!name || !email) {
        throw new Error('Name and email are required');
      }

      const newUser = {
        id: nextId++,
        name,
        email,
        age: age || null
      };

      users.push(newUser);
      return { success: true, user: newUser };
    },

    // POST /api/update-user - Update user
    'update-user': (data) => {
      const { id, ...updates } = data;
      const userIndex = users.findIndex(u => u.id === parseInt(id));

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update user
      Object.assign(users[userIndex], updates);

      return { success: true, user: users[userIndex] };
    },

    // POST /api/delete-user - Delete user
    'delete-user': (data) => {
      const id = parseInt(data.id);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const deletedUser = users.splice(userIndex, 1)[0];
      return { success: true, deletedUser };
    }
  },
  port: 3000
});
```

## Testing Your JSON APIs

### Using curl

```bash
# Test GET endpoint
curl http://localhost:3000/api/users

# Test POST with JSON data
curl -X POST http://localhost:3000/api/create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com","age":35}'

# Test error handling
curl -X POST http://localhost:3000/api/safe-divide \
  -H "Content-Type: application/json" \
  -d '{"a":10,"b":0}'
```

### Using JavaScript (Browser or Node.js)

```javascript
// Test from browser console or Node.js
async function testAPI() {
  try {
    // GET request
    const users = await fetch('http://localhost:3000/api/users')
      .then(r => r.json());
    console.log('Users:', users);

    // POST request
    const newUser = await fetch('http://localhost:3000/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Diana',
        email: 'diana@example.com',
        age: 28
      })
    }).then(r => r.json());
    console.log('New user:', newUser);

  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();
```

## Advanced Patterns

### Combining APIs with UI Controls

```javascript
// server.js - API + UI
const Server = require('jsgui3-server');
const { controls } = require('./client');

Server.serve({
  // Serve UI control
  ctrl: controls.UserDashboard,

  // Provide API for the UI
  api: {
    'users': () => users,
    'create-user': (data) => {
      // ... create user logic
    },
    'analytics': () => ({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.active).length
    })
  },

  port: 3000
});
```

### Middleware and Authentication

```javascript
// Basic authentication middleware concept
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No token provided' }));
    return;
  }

  // In real app, verify JWT token
  const token = auth.substring(7);
  if (token !== 'valid-token') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid token' }));
    return;
  }

  // Token valid, proceed
  next();
}

Server.serve({
  api: {
    'protected-data': (data) => ({ secret: 'This requires authentication' }),
    'public-data': () => ({ message: 'This is public' })
  },

  // Note: Middleware integration may need verification
  middleware: [authMiddleware],

  port: 3000
});
```

## Common Issues and Solutions

### Issue: "Route not found" Error

**Problem:** API endpoint returns 404
**Possible causes:**
- Server not restarted after adding API
- Typo in endpoint name
- API object not properly defined

**Solution:**
```bash
# Restart server
Ctrl+C then node server.js

# Check endpoint name matches
curl http://localhost:3000/api/your-endpoint
```

### Issue: "Unexpected token" Error

**Problem:** JSON parsing fails
**Possible causes:**
- Wrong Content-Type header
- Malformed JSON in request body
- Server expects JSON but receives text

**Solution:**
```bash
# Ensure correct Content-Type
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Issue: Function returns undefined

**Problem:** API returns empty response
**Possible causes:**
- Function doesn't return anything
- Async function not awaited properly
- Error thrown but not caught

**Solution:**
```javascript
api: {
  'working-endpoint': (data) => {
    // Always return something
    return { result: 'success', data: data };
  }
}
```

## Current Limitations (v0.0.1)

This guide is provisional. Based on code analysis, the following may need verification:

1. **Middleware Support**: Authentication and custom middleware may not be fully implemented
2. **HTTP Methods**: Only GET/POST may be supported (PUT/DELETE unverified)
3. **File Uploads**: Multipart form data handling may be limited
4. **CORS**: Cross-origin request handling may need configuration
5. **Rate Limiting**: No built-in rate limiting (would need custom middleware)
6. **Request Size Limits**: No apparent request body size limits implemented

## Next Steps

1. **Verify Examples**: Test all examples in this guide
2. **Report Issues**: Document any discrepancies found
3. **Extend Functionality**: Add missing features like authentication, CORS, etc.
4. **Update Guide**: Incorporate verified information and remove provisional status

## Resources

- [Function Publishers and JSON APIs](docs/function-publishers-json-apis.md) - Detailed technical documentation
- [Advanced Usage Examples](docs/advanced-usage-examples.md) - Complex API patterns
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

---

**Please verify these examples work in your environment and report any issues. This guide will be updated based on community feedback.**