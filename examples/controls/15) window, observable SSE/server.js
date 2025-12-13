const jsgui = require('./client');
const Server = require('../../../server');
const {Observable_Demo_UI} = jsgui.controls;
const {obs, observable} = require('fnl');

// Import the Observable Publisher
const Observable_Publisher = require('../../../publishers/http-observable-publisher');

/**
 * Server demonstrating HTTP_Observable_Publisher with Server-Sent Events (SSE).
 * 
 * This example shows:
 * 1. Creating an observable that emits progress events over time
 * 2. Publishing it via HTTP_Observable_Publisher (uses SSE transport)
 * 3. Client consuming the stream with EventSource API
 * 
 * The fnl observable pattern:
 * - obs((next, complete, error) => {...}) creates an observable
 * - next(data) emits intermediate values (progress updates)
 * - complete(result) signals successful completion
 * - error(err) signals failure
 * 
 * IMPORTANT: This example uses a "hot" observable that emits a continuous
 * tick stream. The HTTP_Observable_Publisher creates an SSE connection
 * and forwards all 'next' events to the client.
 */

if (require.main === module) {

    const server = new Server({
        Ctrl: Observable_Demo_UI,
        'src_path_client_js': require.resolve('./client.js'),
    });

    server.on('ready', () => {
        console.log('Server ready, setting up observable endpoints...');

        // ========================================
        // Create a "hot" observable for tick stream
        // This emits continuously, clients join the stream
        // ========================================
        let tick_count = 0;
        const tick_observable = observable((next, complete, error) => {
            // Start a tick interval that all subscribers share
            const interval = setInterval(() => {
                tick_count++;
                next({
                    tick: tick_count,
                    timestamp: Date.now(),
                    message: `Server tick #${tick_count}`
                });
            }, 1000); // Tick every second
            
            // Return cleanup (called when observable is disposed)
            return [() => {
                clearInterval(interval);
                console.log('Tick observable cleanup');
            }];
        });

        // Create the observable publisher for the tick stream
        const tick_publisher = new Observable_Publisher({
            obs: tick_observable
        });

        // Register the SSE endpoint with the server's router
        server.server_router.set_route('/api/tick-stream', tick_publisher, tick_publisher.handle_http);
        console.log('  ✓ /api/tick-stream - Hot tick stream (SSE)');

        // ========================================
        // Also publish a simple JSON API endpoint for comparison
        // ========================================
        server.publish('/api/status', () => {
            return {
                status: 'ok',
                tick_count: tick_count,
                uptime: process.uptime(),
                note: 'This is a regular JSON endpoint (one-shot). Use /api/tick-stream for SSE.'
            };
        });
        console.log('  ✓ /api/status - Regular JSON API (comparison)');

        // Start the server (allow PORT env variable for testing)
        const port = parseInt(process.env.PORT, 10) || 52015;
        server.start(port, function (err, cb_start) {
            if (err) {
                throw err;
            } else {
                console.log('');
                console.log('='.repeat(60));
                console.log('Observable SSE Demo Server Started');
                console.log('='.repeat(60));
                console.log('');
                console.log(`Open http://localhost:${port} in your browser`);
                console.log('');
                console.log('This demo shows:');
                console.log('  • Server-side observable emitting tick events');
                console.log('  • HTTP_Observable_Publisher serving as SSE endpoint');
                console.log('  • Client consuming stream with EventSource API');
                console.log('  • Real-time UI updates from server events');
                console.log('');
                console.log('Endpoints:');
                console.log('  GET /api/tick-stream - SSE stream (text/event-stream)');
                console.log('  GET /api/status      - JSON status (application/json)');
                console.log('');
                console.log('Click "Connect to SSE" to see real-time streaming!');
                console.log('='.repeat(60));
            }
        });
    });
}
