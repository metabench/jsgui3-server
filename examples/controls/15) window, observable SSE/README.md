# Observable SSE Demo

This example demonstrates the **HTTP_Observable_Publisher** with Server-Sent Events (SSE), showing how jsgui3-server's observable-first architecture enables real-time streaming from server to client.

![Demo showing real-time tick counter updating via SSE](../../.playwright-mcp/page-2025-11-29T23-39-31-903Z.png)

## Quick Start

```bash
cd "examples/controls/15) window, observable SSE"
node server.js
# Open http://localhost:52015
```

## What This Demonstrates

### Server Side (`server.js`)

1. **Observable Creation** with `fnl`:
   ```javascript
   const {obs} = require('fnl');
   
   const progress_observable = obs((next, complete, error) => {
       // next(data) - emit intermediate values
       // complete(result) - signal completion
       // error(err) - signal failure
       return [cleanup_fn]; // cleanup functions
   });
   ```

2. **HTTP_Observable_Publisher** setup:
   ```javascript
   const Observable_Publisher = require('jsgui3-server/publishers/http-observable-publisher');
   
   const publisher = new Observable_Publisher({ obs: progress_observable });
   server.server_router.set_route('/api/progress-stream', publisher, publisher.handle_http);
   ```

3. **SSE Transport**: The publisher automatically serves `text/event-stream` content type with chunked transfer encoding.

### Client Side (`client.js`)

1. **EventSource API** for consuming SSE:
   ```javascript
   const event_source = new EventSource('/api/progress-stream');
   
   event_source.onmessage = (event) => {
       const data = JSON.parse(event.data);
       update_ui(data);
   };
   ```

2. **Reactive UI Updates**: The `Observable_Demo_UI` control updates progress bars, status text, and log entries in real-time as events arrive.

## The SSE Protocol

Server-Sent Events use HTTP chunked transfer encoding:

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Transfer-Encoding: chunked

data: OK

data: {"progress": 10, "stage": "Loading..."}

data: {"progress": 20, "stage": "Processing..."}

...
```

## Optional Pause/Resume/Stop Control

`HTTP_Observable_Publisher` also supports controlling the published observable:

```javascript
await fetch('/api/tick-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'pause' })   // 'resume' | 'stop' | 'status'
});
```

## Observable Pattern Benefits

| Approach | When to Use |
|----------|-------------|
| **Observable + SSE** | Long-running operations, real-time progress, streaming data |
| **Promise** | Single async result (most API calls) |
| **Sync return** | Immediate data, no I/O |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Server                                                      │
│  ┌──────────────────┐    ┌────────────────────────────────┐ │
│  │ Observable       │───►│ HTTP_Observable_Publisher      │ │
│  │ obs((next,...)=>{│    │ • Sets text/event-stream       │ │
│  │   next(progress) │    │ • Writes SSE format            │ │
│  │ })               │    │ • Keeps connection open        │ │
│  └──────────────────┘    └───────────────┬────────────────┘ │
└──────────────────────────────────────────┼──────────────────┘
                                           │ HTTP
                                           ▼
┌──────────────────────────────────────────┴──────────────────┐
│  Browser                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ EventSource('/api/progress-stream')                    │ │
│  │   .onmessage = (event) => {                            │ │
│  │       update_ui(JSON.parse(event.data));               │ │
│  │   }                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Files

- `client.js` - Control with SSE consumer and reactive UI
- `server.js` - Server with observable publisher setup
- `README.md` - This documentation

## Future Direction

The strategic goal is to auto-detect observable returns in function publishers:

```javascript
// Future: This should "just work" with SSE transport
server.publish('/api/progress', () => {
    return obs((next, complete, error) => {
        // Long-running operation...
    });
});
```

See `.github/agents/jsgui3-server.agent.md` for the full observable-first strategy.
