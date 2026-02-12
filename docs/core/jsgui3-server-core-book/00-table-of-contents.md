# jsgui3-server Core Book

## Purpose

This book specifies the currently critical execution path: `Server.serve(...)` startup, resource lifecycle control, resource event publication, and browser-level verification of those behaviors.

## Chapter Map

1. `01-startup-readiness-state-machine.md`
2. `02-resource-abstraction-and-lifecycle.md`
3. `03-resource-pool-and-event-topology.md`
4. `04-sse-publisher-semantics.md`
5. `05-serve-factory-resource-wiring.md`
6. `06-e2e-testing-methodology.md`
7. `07-defect-detection-and-hardening-loop.md`

## Reader Contract

- This text is dense by design.
- It assumes familiarity with Node.js HTTP servers, async control flow, and event-driven architecture.
- It prioritizes invariants, failure modes, and testability over introductory narrative.
