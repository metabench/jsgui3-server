# Website Design Lab Experiments

**Purpose**: Empirically test design decisions from `docs/books/website-design/` before implementation.

> **Rule**: Lab code is for learning and decision-making. Production code goes in the main packages.

---

## Experiment Index

| # | Name | Book Chapter | Status | Decision |
|---|------|-------------|--------|----------|
| 001 | [Base Class Overhead](001-base-class-overhead/) | Ch.3 | proposed | Plain vs. Evented_Class |
| 002 | [Pages Storage](002-pages-storage/) | Ch.6 | proposed | Array vs. Map |
| 003 | [Type Detection](003-type-detection/) | Ch.8 | proposed | instanceof vs. duck typing |
| 004 | [Two-Stage Validation](004-two-stage-validation/) | Ch.11 | proposed | Construction + finalize |
| 005 | [Input Normalization](005-normalize-input/) | Ch.8+11 | proposed | Unified manifest shape |
| 006 | [Server Integration Spike](006-serve-website-spike/) | Ch.8+11 | proposed | End-to-end proof |

## Lifecycle

```
proposed → active → validated → decision-made
```

## Running

```bash
# Single experiment
node labs/website-design/001-base-class-overhead/check.js

# All experiments
node labs/website-design/run-all.js
```
