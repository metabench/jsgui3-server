# 5. Serve Factory Resource Wiring

## Objective

`Server.serve(...)` must be a single-entry composition API that can instantiate and wire:

- pages / controls
- API handlers
- resources (process or remote)
- SSE endpoint for resource events

without requiring the caller to manually compose internals.

## Resource Configuration Forms

Accepted `resources` forms include:

- direct resource instance
- constructor function / class
- `{ class | Ctor | constructor_fn, ...spec }`
- `{ type: 'process' | 'remote', ...spec }`

Type inference fallbacks:

- `command` or `processManager` -> `Process_Resource`
- `host` or `endpoints` -> `Remote_Process_Resource`

## Event Bridge

With `events: true`:

- `HTTP_SSE_Publisher` mounted on `/events` (or configured route)
- pool events broadcast onto SSE stream

This creates a default telemetry channel with zero extra server code.

## Startup Ordering

1. configure APIs, events, and resource specs
2. wait for ready
3. start listening
4. start configured resources

## Shutdown Ordering

`server.close()` triggers resource pool stop and SSE stop before closing HTTP servers. This prevents orphan resources and dangling SSE clients.
