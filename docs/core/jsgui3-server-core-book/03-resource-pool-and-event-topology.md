# 3. Resource Pool and Event Topology

## Role

`Server_Resource_Pool` is the system-wide resource coordinator. It extends `Resource_Pool` and adds lifecycle orchestration plus event fan-in.

## Lifecycle Surface

Implemented operations:

- `add(resource)` / `push(resource)`
- `remove(name)` with stop-on-remove semantics
- `start(callback)` start-all
- `stop(callback)` stop-all
- `get_resources_by_type(type)`
- `summary` getter

## Event Fan-In

Pool-level forwarded events:

- `resource_state_change`
- `crashed`
- `unhealthy`
- `unreachable`
- `recovered`

Forwarding payload includes `resourceName` plus original event fields.

This gives a single subscription point for system telemetry.

## Summary as Fleet Snapshot

`summary` aggregates:

- totals by state (`running`, `stopped`, `crashed`, `unreachable`, ...)
- `byType` entries with `get_abstract()` output per resource

`summary` is designed for status APIs and dashboard views.

## Correctness Invariants

1. removing a resource must detach forwarded listeners
2. stop-all must tolerate mixed callback/promise resource implementations
3. no event should lose resource identity when forwarded

`tests/server-resource-pool.test.js` and `tests/serve-resources.test.js` exercise these invariants.
