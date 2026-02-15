# Device-Adaptive Composition & Styling in jsgui3

A practical guide to building UIs that work well on every screen — from phones in portrait to widescreen desktops — using the jsgui3 platform's compositional architecture.

## Why This Book Exists

Modern web applications are expected to work on a phone held one-handed, a tablet propped on a desk, a laptop with a resized browser window, and a 4K monitor. Most frameworks address this with CSS media queries alone, leaving developers to scatter breakpoint logic across dozens of stylesheets with no architectural guidance.

jsgui3 has a unique advantage: controls are **composed programmatically** on the server and **activated** on the client. That means the platform can make structural composition decisions — not just styling tweaks — based on screen environment. A sidebar can become a drawer. A multi-column layout can collapse to tabs. A data table can transform into a card list. These are composition changes, not CSS hacks.

This book explains how to make those decisions cleanly: where adaptive logic should live, how it interacts with the MVVM model separation that jsgui3 already provides, and what platform infrastructure is needed to make high-level app code stay simple while supporting every device well.

## What You'll Learn

- What responsive infrastructure jsgui3 already has and where the gaps are
- A layered composition model that separates business logic from device adaptation
- How to keep adaptive state in view models without polluting domain data
- A breakpoint and theming strategy built on the existing token system
- Concrete assessment of how the showcase app behaves across devices
- Implementation patterns and APIs for adaptive composition
- How to test responsive behavior systematically with Playwright
- A phased roadmap for adopting these patterns across the control catalog

## Audience

- **Platform maintainers** designing control APIs and infrastructure
- **App developers** building product UIs on jsgui3
- **Contributors** implementing responsive, theme, and accessibility features

## Reading Order

The chapters build on each other. Chapters 1–3 establish concepts. Chapters 4–5 apply them concretely. Chapters 6–8 provide implementation guidance.

1. [Platform Feature Audit](01-platform-feature-audit.md) — what exists today, what's missing
2. [Responsive Composition Model](02-responsive-composition-model.md) — the four-layer architecture
3. [Data Model vs View Model](03-data-model-vs-view-model.md) — where adaptive state belongs
4. [Styling, Themes, and Breakpoints](04-styling-theme-breakpoints.md) — tokens, density, and mode classes
5. [Showcase App Multi-Device Assessment](05-showcase-app-multi-device-assessment.md) — practical analysis
6. [Implementation Patterns and APIs](06-implementation-patterns-and-apis.md) — code-level guidance
7. [Testing Harness and Quality Gates](07-testing-harness-and-quality-gates.md) — viewport-matrix testing
8. [Roadmap and Adoption Plan](08-roadmap-and-adoption-plan.md) — phased rollout

## Core Thesis

jsgui3 already has strong primitives for compositional controls, design tokens, and MVVM-style model separation. The next step is to formalize adaptive layout and styling decisions as **first-class platform concepts** so that app developers can express adaptive intent in a few lines of declarative code, while the platform's mid-level and low-level layers handle the complexity of resolution, rendering, and testing.

Keep high-level code easy. Let mid-level code absorb complexity. Trust the low-level foundations in lang-tools and html-core to handle the heavy lifting.
