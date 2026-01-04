# JSGUI3 Sass Patterns Book

This book is a set of proposals for how Sass and CSS can be used across the JSGUI3 stack. It focuses on co-locating styles with controls, supporting project-wide theming, and allowing workspace-level overrides without losing default styles.

The intent is to document patterns and where they could be implemented, not to prescribe a single build system. Each chapter includes a short "Where to implement" section that points at the relevant layer.

## Table of contents

1. Vision and goals - `01-vision-and-goals.md`
2. Stack map - `02-stack-map.md`
3. Control-local Sass patterns - `03-control-local-sass.md`
4. Extending controls and variants - `04-extension-and-variants.md`
5. Theme tokens and runtime theming - `05-theming-and-tokens.md`
6. Workspace overrides and shared themes - `06-workspace-overrides.md`
7. Resource pipeline and bundling - `07-resource-and-bundling.md`
8. Small examples - `08-examples.md`
9. Testing and adoption plan - `09-testing-and-adoption.md`

## Scope notes

- These are implementation suggestions that build on existing JSGUI3 behavior.
- The Sass compiler is already in use in the server pipeline, so patterns lean on that capability.
- Examples are minimal and designed to be adapted into other workspaces.
