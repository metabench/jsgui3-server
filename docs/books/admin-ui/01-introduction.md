# Chapter 1: Introduction

## Vision

The Admin UI is the **go-to interface** for developers and operators to administer `jsgui3-server` instances. It should be:

- **Instantaneous**: Zero setup required; just navigate to `/admin`
- **Insightful**: Surface the internal state of the server in real-time
- **Actionable**: Allow common admin tasks directly from the UI

## Goals

1. **Visibility into Observables**: If a server publishes an observable (e.g., for crawl progress, metrics), the Admin UI should display it automatically with an appropriate control.
2. **Resource Browser**: List all registered resources (routes, publishers, static paths) with introspection.
3. **Configuration Panel**: View and modify server configuration (where safe).
4. **Performance Metrics**: Display throughput, active connections, memory usage.

## Inspiration

The design is inspired by:
- Database admin tools (pgAdmin, phpMyAdmin)
- Monitoring dashboards (Grafana, Kibana)
- The jsgui3 Window control aesthetic

## Target Experience

A developer starts a jsgui3-server, then navigates to `http://localhost:PORT/admin`. They immediately see:
- A sidebar listing all resources
- A main panel showing the selected resource's details
- Real-time updates for any observables

No extra code required—the Admin UI is built into jsgui3-server and activates automatically.
