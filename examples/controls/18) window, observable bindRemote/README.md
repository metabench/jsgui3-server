# Observable BindRemote Demo

Demonstrates the "magic" reactive data flow from Server to Client.

## Features

1.  **Server Publishing (One-liner)**
    ```javascript
    server.publish_observable('/api/tick-stream', tick_observable);
    ```

2.  **Client Binding (Magical)**
    ```javascript
    // Connects to SSE stream and auto-updates UI
    const obs = new jsgui.Remote_Observable({ url: '/api/tick-stream' });
    obs.connect();
    
    // Manual handling example (or use bindRemote)
    obs.on('next', data => updateUI(data));
    ```

## How to run

```bash
node server.js
```

Open http://localhost:52018 (or port specified in console)
