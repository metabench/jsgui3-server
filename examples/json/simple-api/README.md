# Simple JSON API Example

This is the simplest possible JSON API server using JSGUI3 Server. It demonstrates basic CRUD operations with minimal code.

## Features

- ✅ **Minimal code**: ~70 lines total
- ✅ **4 API endpoints**: GET status, GET messages, POST add message, POST clear messages
- ✅ **Data validation**: Input checking with error handling
- ✅ **In-memory storage**: Simple data persistence
- ✅ **No UI components**: Pure JSON API server

## API Endpoints

### `GET /api/status`
Returns server status information.

**Response:**
```json
{
  "status": "running",
  "timestamp": "2025-11-02T01:48:00.000Z",
  "version": "1.0.0",
  "uptime": 123.456
}
```

### `GET /api/messages`
Returns all messages with count.

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "text": "Hello, World!",
      "author": "System",
      "timestamp": "2025-11-02T01:48:00.000Z"
    }
  ],
  "count": 1
}
```

### `POST /api/add-message`
Adds a new message.

**Request Body:**
```json
{
  "text": "Your message here",
  "author": "Your Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 3,
    "text": "Your message here",
    "author": "Your Name",
    "timestamp": "2025-11-02T01:48:00.000Z"
  }
}
```

### `POST /api/clear-messages`
Clears all messages.

**Response:**
```json
{
  "success": true,
  "clearedCount": 2,
  "message": "Cleared 2 messages"
}
```

## Running

```bash
cd examples/json/simple-api
node server.js
```

## Testing

```bash
# Get server status
curl http://localhost:3002/api/status

# Get messages
curl http://localhost:3002/api/messages

# Add a message
curl -X POST http://localhost:3002/api/add-message \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from curl!","author":"Tester"}'

# Clear all messages
curl -X POST http://localhost:3002/api/clear-messages \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Code Structure

The entire server is in `server.js`:

```javascript
Server.serve({
  api: {
    'status': () => ({ /* status data */ }),
    'messages': () => ({ /* messages data */ }),
    'add-message': (data) => ({ /* add logic */ }),
    'clear-messages': () => ({ /* clear logic */ })
  },
  port: 3002
});
```

This demonstrates the absolute minimum code needed for a working JSON API server.