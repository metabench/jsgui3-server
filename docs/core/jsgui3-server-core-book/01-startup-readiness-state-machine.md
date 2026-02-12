# 1. Startup Readiness State Machine

## Core Problem

A server that binds a socket before its route graph is installed can return transient `404` responses during cold start. This is a correctness defect, not a cosmetic delay.

## Current Model

`Server.serve(...)` now enforces a strict ordering:

1. construct `Server` instance
2. install API publishers and optional SSE publisher
3. wait for server `ready` event (emitted after webpage/website publisher route installation)
4. resolve additional page route preparations
5. bind sockets with `server.start(...)`
6. start configured resources
7. resolve `serve(...)` promise

## Removed Failure Pattern

Previous behavior had a fallback timer that could start listening before `ready`. This allowed requests to arrive before `/` and bundle routes were present.

That path is removed. Startup now rejects on readiness timeout instead of entering a half-ready listening state.

## Startup Timeout

`readyTimeoutMs` (default `120000`) bounds waiting for readiness. Timeout behavior:

- if readiness is not reached in time, `serve(...)` rejects
- no forced early listen occurs

This makes startup failure explicit and testable.

## Verification

`tests/serve.test.js` includes a delayed fake webpage publisher and asserts that:

- `serve(...)` does not resolve until delayed readiness arrives
- post-resolution `/` is immediately routable

This test prevents regression to pre-ready listening.
