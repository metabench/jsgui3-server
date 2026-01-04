# Vision and goals

This chapter frames the goals for Sass in JSGUI3 and the tradeoffs that shape the patterns in later chapters.

## Goals

- Co-locate styles with controls so behavior and styling evolve together.
- Allow controls to be extended with additional Sass or CSS without editing upstream repos.
- Support project-wide theming that can override defaults across multiple workspaces.
- Keep the style pipeline deterministic, with predictable ordering and output.
- Enable server-specific styling for examples, demos, or host apps.

## Non-goals

- No single theming system must be enforced for all projects.
- No requirement to use Sass for every control; plain CSS should remain first-class.
- No requirement to change the client runtime to parse Sass at runtime.

## Suggested outcomes

- A shared pattern for control-local Sass, with explicit layering rules.
- A theme token vocabulary for controls, backed by CSS variables.
- Workspace-level overrides that can be injected ahead of or after control styles.
- A consistent way to configure Sass load paths and shared sources.

## Where to implement

- Control-local styles: `jsgui3-html` control classes.
- Theme tokens: `jsgui3-html` theme mixins, plus server-provided defaults.
- Workspace overrides: `jsgui3-server` style configuration and bundlers.
- Docs and examples: `jsgui3-server/examples` and `jsgui3-html/docs`.
