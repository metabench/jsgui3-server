# JSGUI3 MVVM and Full-Stack Controls Book

This book is a fast, focused guide to MVVM binding and end-to-end control delivery in the JSGUI3 stack.

## Who This Is For
- AI agents that need low thinking time workflows.
- Developers wiring controls across server and client.
- Anyone troubleshooting binding, rendering, or bundling issues.

## How To Read
- Start with the overview and lifecycle chapters.
- Use the playbooks for task execution.
- Jump to testing and troubleshooting as soon as you hit a blocker.

## Chapter Index
1. [Overview](00-overview.md)
2. [Stack Map](01-stack-map.md)
3. [Control Lifecycle](02-control-lifecycle.md)
4. [MVVM Basics](03-mvvm-basics.md)
5. [Bindings and Validation](04-bindings-and-validation.md)
6. [Full-Stack Example](05-full-stack-example.md)
7. [Testing](06-testing.md)
8. [Troubleshooting](07-troubleshooting.md)
9. [Agent Playbooks](08-agent-playbooks.md)

## Fast Lane Summary
- Controls live in `client.js` and export to `jsgui.controls`.
- Compose UI in `constructor` only when `!spec.el`.
- Use `Server_Static_Page_Context` to validate server-side render quickly.
- Use `Server.serve` for end-to-end delivery.
