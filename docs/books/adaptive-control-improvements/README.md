# Adaptive Control Improvements for jsgui3-html

This book is a companion to the existing device-adaptive composition book.

- Foundation principles: `docs/books/device-adaptive-composition/`
- This book: concrete control and platform improvements to implement those principles across the current control catalog.

## Why This Book

The existing adaptive book defines architecture, model boundaries, styling strategy, and rollout phases.
What it intentionally does not do in depth is provide a control-by-control implementation playbook.

This book fills that gap by answering:

1. Which controls should be upgraded first and why
2. What specific changes each control needs in composition, state placement, styling, and interaction
3. Which cross-cutting platform functions should be added to reduce repeated code
4. What test matrix and quality gates are required before rollout

## Scope

Primary focus:

- Large layout and shell controls
- Navigation controls with mobile/orientation impacts
- Data-dense controls that need structural adaptation
- Cross-cutting adaptive utilities and token updates

Secondary focus:

- Utility controls with strong phone/tablet behavior implications

Out of scope:

- Rewriting stable atomic controls that already adapt via tokens
- Visual redesigns unrelated to adaptive behavior

## Core Alignment (from Device-Adaptive Composition Book)

This book explicitly applies:

- Chapter 2: Four-layer model (A/B/C/D)
- Chapter 3: adaptive state in view models, not domain model
- Chapter 4: mode attributes and token overrides
- Chapter 6: environment service + adaptive composition helper patterns
- Chapter 7: viewport-matrix quality gates
- Chapter 8: phased rollout

## Reading Order

1. `01-control-candidate-matrix.md`
2. `02-tier-1-layout-playbooks.md`
3. `03-tier-2-navigation-form-overlay.md`
4. `04-cross-cutting-platform-functionality.md`
5. `05-styling-theming-density-upgrades.md`
6. `06-testing-quality-gates.md`
7. `07-delivery-roadmap-and-ownership.md`
8. `08-appendix-tier1-acceptance-and-pr-templates.md`

## Quick Start (Implementers)

1. Build cross-cutting infrastructure from Chapter 4 first.
2. Upgrade Tier 1 controls from Chapter 2 in priority order.
3. Add/extend responsive tests from Chapter 6 as each control ships.
4. Move through Tier 2 playbooks from Chapter 3.
5. Track delivery against Chapter 7 ownership and milestones.
