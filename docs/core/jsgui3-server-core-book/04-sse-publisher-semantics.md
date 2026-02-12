# 4. SSE Publisher Semantics

## Component

`HTTP_SSE_Publisher` is a general-purpose server-sent events publisher, separate from observable-specific transport.

## Responsibilities

- maintain connection registry (`client_id -> response stream`)
- format protocol-correct SSE frames (`id`, `event`, `data`)
- provide `broadcast(event, data)`
- provide `send(client_id, event, data)`
- issue keepalive comments (`:keepalive`) to prevent idle timeout
- maintain bounded event history for replay
- support `Last-Event-ID` replay on reconnect

## Delivery Semantics

- event IDs are monotonic and server-local
- replay sends events with `id > last_event_id`
- delivery is best-effort per connected client
- failed writes trigger client disconnect cleanup

## Operational Constraints

- max client guard (`maxClients`)
- explicit `stop()` for deterministic shutdown
- keepalive timer lifecycle tied to active client count

## Integration Contract

When `Server.serve({ events: true })` is used, pool events are bridged into SSE broadcasts. Resource state transitions become browser-consumable without client polling loops.

## Verification

`tests/http-sse-publisher.test.js` validates:

- multi-client broadcast
- targeted delivery
- keepalive emission
- replay via `Last-Event-ID`
