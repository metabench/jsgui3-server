# Designing jsgui3-website & jsgui3-webpage

A design book covering the full lifecycle from design exploration through implementation of abstract website and webpage representations for the jsgui3 ecosystem.

> **Status**: Core implementation complete (see Ch.17) — packages not yet published to npm  
> **Date**: February 2026

## Chapters

| # | Chapter | Focus |
|---|---------|-------|
| 01 | [Introduction & Vision](01-introduction.md) | What we're building, why, and the core design tension |
| 02 | [Current State](02-current-state.md) | Exact code in both repos today, and how jsgui3-server uses them |
| 03 | [The Base Class Question](03-base-class.md) | Plain class vs obext vs Evented_Class — the foundational choice |
| 04 | [Designing the Webpage](04-webpage.md) | Three proposals for jsgui3-webpage, with tradeoffs |
| 05 | [Designing the Website](05-website.md) | Three proposals for jsgui3-website, with tradeoffs |
| 06 | [Pages Storage](06-pages-storage.md) | Array vs Collection vs Map — how a website holds its pages |
| 07 | [The API Layer](07-api-layer.md) | How websites describe their API endpoints |
| 08 | [Server Integration](08-server-integration.md) | How jsgui3-server would consume these abstractions |
| 09 | [Cross-Agent Review](09-cross-agent-review.md) | An OpenAI agent's review, and responses to it |
| 10 | [Open Questions](10-open-questions.md) | Unresolved design decisions for future discussion |
| 11 | [Converged Recommendation](11-converged-recommendation.md) | A concrete baseline proposal and phased delivery plan |
| 12 | [The Content Model](12-content-model.md) | Webpage as content container — strings, i18n, locale fallback |
| 13 | [jsgui3-webpage Module Spec](13-webpage-module-spec.md) | Complete implementation blueprint for the Webpage package |
| 14 | [jsgui3-website Module Spec](14-website-module-spec.md) | Complete implementation blueprint for the Website package |
| 15 | [Multi-Repo Plan](15-multi-repo-plan.md) | Cross-repo coordination, versioning, testing, publish workflow |
| 16 | [Minimal First Implementation](16-minimal-first.md) | Pragmatic v0.1 (~45 lines) + layered growth plan |
| 17 | [Implementation Report](17-implementation-report-codex.md) | What Codex built, validation results, known gaps |

## Suggested Reading Paths

- **Quick strategic summary**: 01 → 09 → 11
- **Implementation-oriented**: 02 → 04 → 05 → 08 → 11
- **Deep design debate**: 03 → 06 → 07 → 09 → 10
- **Module specs (full design)**: 12 → 13 → 14 → 15
- **What was built**: 16 → 17 (minimal-first rationale, then implementation report)

## Related Documents

- [Original proposals](../../proposals/jsgui3-website-and-webpage-design.md)
- [OpenAI review](../../proposals/jsgui3-website-and-webpage-design-review.md)
- [Server support proposal](../../proposals/jsgui3-website-and-webpage-design-jsgui3-server-support.md)
- [Lab experiments](../../labs/website-design/README.md) — empirical validation of design decisions (179 checks passing)
