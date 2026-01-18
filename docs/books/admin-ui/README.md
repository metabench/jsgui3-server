# Admin UI Book

This folder contains documentation for the `jsgui3-server` Admin UI system.

## Chapters

1. [Introduction](./01-introduction.md) - Vision and goals
2. [Architecture](./02-architecture.md) - High-level design
3. [Controls](./03-controls.md) - UI components
4. [Implementation Plan](./04-implementation-plan.md) - Phases and tasks

## Purpose

The Admin UI provides a web-based interface to administer and monitor `jsgui3-server` instances. Key features include:

- **Resource Viewer**: Browse server-side resources (publishers, routes, etc.)
- **Observable Monitor**: Real-time visibility into observable server processes
- **Configuration Editor**: Modify server settings
- **Performance Dashboard**: View metrics and health

## Design Principles

1. **Dogfooding**: Built entirely with jsgui3 controls
2. **Real-time**: Uses `Remote_Observable` for live updates
3. **Extensible**: Plugin architecture for custom panels
4. **Polished UX**: Modern dark theme, smooth transitions
