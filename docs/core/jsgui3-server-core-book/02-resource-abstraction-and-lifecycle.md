# 2. Resource Abstraction and Lifecycle

## Uniform Contract

`Process_Resource` and `Remote_Process_Resource` expose the same operational surface:

- `start()`
- `stop()`
- `restart()`
- `status` getter
- `get_abstract()`

The contract allows client/API code to remain management-backend agnostic.

## Process_Resource Modes

`Process_Resource` supports two process managers:

- `direct` (default): local child process (`spawn`)
- `pm2`: external manager integration (`pm2 start/stop/restart/jlist`)

PM2 path resolution is optional and automatic:

1. `processManager.pm2Path`
2. `PM2_PATH` env
3. local `node_modules/.bin/pm2(.cmd)`
4. `pm2` from `PATH`

Therefore explicit `pm2Path` is not required for default operation.

## State Machine

Nominal states:

- `stopped`
- `starting`
- `running`
- `stopping`
- `restarting`
- `crashed`

`Remote_Process_Resource` additionally uses `unreachable` for transport failure.

Each transition emits `state_change` with `{ from, to, timestamp }`.

## Operational Signals

`Process_Resource` emits:

- `stdout` / `stderr` (line-wise)
- `exit`
- `health_check`
- `unhealthy`
- `crashed`

`Remote_Process_Resource` emits:

- `state_change`
- `unreachable`
- `recovered`

## Failure Handling

### Local process

Unexpected non-zero exit with `autoRestart: true` enters exponential backoff restart.

Backoff progression:

- base `restartBackoffBaseMs` (default 1000)
- doubles per attempt
- capped at 60000ms

Exceeding `maxRestarts` transitions to `crashed` and halts auto-restart.

### Remote process

Transport failures do not map to `crashed`; they map to `unreachable`. Recovery is explicit via `recovered` event when polling succeeds again.

## Observability Payload

`status` normalizes operational metrics:

- state
- pid (if meaningful)
- uptime
- restartCount
- lastHealthCheck
- memoryUsage
- processManager metadata

The normalized shape is essential for stable API and UI projections.
