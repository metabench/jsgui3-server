# Chapter 15: Multi-Repo Implementation Plan

This chapter coordinates the implementation across three repositories. The `jsgui3-webpage` and `jsgui3-website` packages are separate npm modules; `jsgui3-server` consumes them.

---

## 15.1 Dependency Graph

```
jsgui3-html (Evented_Class)
    ↑
jsgui3-webpage  (Webpage class)
    ↑
jsgui3-website  (Website class, depends on Webpage for page creation)
    ↑
jsgui3-server   (consumes Website/Webpage, normalization layer, publisher)
```

Each arrow means "depends on". Implementation order follows this graph **bottom-up**.

---

## 15.2 Current State

| Package | Version | Lines | What Exists |
|---------|---------|-------|-------------|
| `jsgui3-html` | (stable) | large | `Evented_Class`, `Control`, `Page_Context` — all stable, no changes needed |
| `jsgui3-webpage` | 0.0.8 (npm) | 14 → ~200 | Skeleton on npm; full implementation in repo (see Ch.17) |
| `jsgui3-website` | 0.0.8 (npm) | 14 → ~200 | Skeleton on npm; full implementation in repo (see Ch.17) |
| `jsgui3-server` | (active) | large | Server integration complete: `normalize_serve_input`, `website_manifest`, `publication_summary` added to `serve-factory.js` |

---

## 15.3 Implementation Phases

This plan uses two aligned tracks:

1. **Minimal-first track** (v0.1.x) from Chapter 16
2. **Full-spec track** (v0.3.x) from Chapters 13 and 14

### Phase 1: jsgui3-webpage → v0.1.0 (minimal-first) ✅ COMPLETE

**Repo**: `jsgui3-webpage`

**Deliverables**:
1. Implement minimal `Webpage.js` per Chapter 16 (`path`, `name`, `title`, `ctrl`, `content`, `meta`, assets)
2. Include migration bridge: accept legacy `content: Function` as renderer alias when `ctrl` is missing
3. Write focused unit tests for constructor behavior + alias normalization
4. Update `README.md` with minimal-first examples
5. Update `package.json`: version 0.1.0, add `main: "index.js"`
6. Publish to npm

**Acceptance criteria**:
1. Minimal constructor behaviors pass
2. Legacy renderer alias (`content: Function`) works for compatibility
3. `require('jsgui3-webpage')` returns the new Webpage class

**No other repo needs to change for this phase to succeed.**

---

### Phase 2: jsgui3-website → v0.1.0 (minimal-first) ✅ COMPLETE

**Repo**: `jsgui3-website`

**Prerequisites**: jsgui3-webpage v0.1.0 published

**Deliverables**:
1. Implement minimal `Website.js` per Chapter 16 (Map-backed pages + core methods)
2. Add `jsgui3-webpage` as dependency
3. Write focused unit tests for page registry and duplicate detection
4. Update `README.md` with minimal-first examples
5. Update `package.json`: version 0.1.0, dependencies, main field
6. Publish to npm

**Acceptance criteria**:
1. Page registry methods (`add_page`, `get_page`, `has_page`) pass
2. Duplicate path detection passes
3. `require('jsgui3-website')` returns the new Website class
4. Lab 002 (pages storage) assumptions hold against real module usage

---

### Phase 3: jsgui3-server integration against v0.1.x primitives ✅ COMPLETE

**Repo**: `jsgui3-server`

**Prerequisites**: jsgui3-webpage v0.1.0 and jsgui3-website v0.1.0 published

**Deliverables**:
1. Update `package.json` to depend on `jsgui3-webpage@^0.1.0` and `jsgui3-website@^0.1.0`
2. Add `normalize_serve_input()` function (per Lab 005 design)
3. Integrate into `serve-factory.js` publisher pipeline
4. Add compatibility bridge for renderer field (`page.ctrl` canonical, legacy `page.content` function still accepted)
5. Add integration tests
6. Ensure all existing server tests still pass (backward compatibility)

**Acceptance criteria**:
- Lab 005 (input normalization) passes against the real modules
- Lab 006 (server integration spike) passes against the real modules
- Legacy `Server.serve(MyCtrl)` and `Server.serve({pages, api})` still work
- A real Website with pages serves correctly on localhost

---

### Phase 4: primitives upgrade to full-spec track (v0.3.0) ⏳ NOT STARTED

**Repos**: `jsgui3-webpage`, `jsgui3-website`

**Prerequisites**: Phase 3 complete and stable in integration

**Deliverables**:
1. Implement full `Webpage` contract from Chapter 13 (Evented_Class, finalize, i18n helpers, type marker, toJSON)
2. Implement full `Website` contract from Chapter 14 (API registry, finalize cascade, richer serialization)
3. Keep migration bridge for legacy renderer shape during upgrade window
4. Publish `jsgui3-webpage@0.3.0` and `jsgui3-website@0.3.0`

**Acceptance criteria**:
1. Chapter 13 and Chapter 14 unit test plans pass
2. Lab 001, 003, and 004 assumptions pass against real modules
3. No regressions in Phase 3 server integration tests

---

### Phase 5: Content integration (stretch) ⏳ NOT STARTED

**All repos**

**Deliverables**:
1. Add content-aware rendering to the server (resolve locale, pass content to Controls)
2. Create an example multi-language Webpage with real i18n content
3. Demonstrate content loading from JSON files
4. Update lab experiments to test content flow end-to-end

**Acceptance criteria**:
- A page with translated content renders correctly in multiple locales
- `get_string()` and `resolve_content()` are exercised in integration tests

---

## 15.4 Version Pinning Strategy

| Consumer | Dependency | Version Constraint |
|----------|-----------|-------------------|
| `jsgui3-website` | `jsgui3-webpage` | `^0.1.0` during minimal-first track |
| `jsgui3-server` | `jsgui3-webpage` | `^0.1.0` initially, move to `^0.3.0` after Phase 4 |
| `jsgui3-server` | `jsgui3-website` | `^0.1.0` initially, move to `^0.3.0` after Phase 4 |

### Semver policy

- **0.x.y**: pre-stable; minor bumps may include breaking changes
- **1.0.0**: stable contract; breaking changes require major bump
- Target stable at 1.0.0 after Phase 4+5 contracts are validated in production

### npm link during development

During development, use `npm link` for cross-repo testing:

```bash
# In jsgui3-webpage directory
npm link

# In jsgui3-website directory
npm link jsgui3-webpage
npm link

# In jsgui3-server directory
npm link jsgui3-webpage
npm link jsgui3-website
```

Lab 003 confirmed that the `Symbol.for()` detection strategy works across linked packages (unlike `instanceof`).

---

## 15.5 Testing Strategy

### Per-repo unit tests

Each repo has its own test suite that runs independently:

| Repo | Test Path | What It Tests |
|------|-----------|---------------|
| `jsgui3-webpage` | `test/webpage.test.js` | Webpage class in isolation |
| `jsgui3-website` | `test/website.test.js` | Website class with Webpage dependency |
| `jsgui3-server` | Existing test suite + new | Server integration with Website/Webpage |

### Cross-repo integration (in jsgui3-server)

The lab experiments in `labs/website-design/` serve as cross-repo integration tests:

```bash
# From jsgui3-server, after npm linking or installing new versions
node labs/website-design/run-all.js
```

All 6 experiments should pass against the real modules — currently they use prototype classes that mirror the spec.

### When to run what

| When | Run |
|------|-----|
| Editing Webpage class | `cd jsgui3-webpage && npm test` |
| Editing Website class | `cd jsgui3-website && npm test` |
| Editing server integration | `cd jsgui3-server && npm test && node labs/website-design/run-all.js` |
| Before publishing any package | All of the above |

---

## 15.6 npm Publish Workflow

### Pre-publish checklist

1. All per-repo tests pass
2. Version in `package.json` updated
3. README reflects current API
4. Cross-repo lab experiments pass in jsgui3-server
5. Git tag created for current phase (`v0.1.0` minimal-first, `v0.3.0` full-spec)

### Publish order

1. `jsgui3-webpage` first (no upstream dependency)
2. `jsgui3-website` second (depends on webpage)
3. `jsgui3-server` — update `package.json` dependencies, commit, no separate publish needed

### Rollback

If a publish reveals issues:
1. `npm unpublish jsgui3-XXX@<version>` (within 72 hours)
2. Or publish a patch release with the fix (`0.1.1`, `0.3.1`, etc.)

---

## 15.7 Agent Assignment Considerations

| Phase | Repos Touched | Best Agent |
|-------|--------------|------------|
| Phase 1: Webpage | `jsgui3-webpage` only | Codex (single repo) or Antigravity |
| Phase 2: Website | `jsgui3-website` (+ webpage as dependency) | Codex or Antigravity |
| Phase 3: Server | `jsgui3-server` (+ webpage/website) | Antigravity (multi-repo context) |
| Phase 4: Full-spec primitives | `jsgui3-webpage`, `jsgui3-website` | Codex or Antigravity |
| Phase 5: Content | All three repos | Antigravity (cross-repo coordination) |

Phases 1 and 2 are independent single-repo tasks. Phase 3 requires multi-repo awareness. Phase 4 should start only after Phase 3 stability is confirmed.

---

## 15.8 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Evented_Class API changes in jsgui3-html | Low | High | Pin jsgui3-html version; test on update |
| Circular dependency between webpage ↔ website | Medium | Medium | Website depends on Webpage, never the reverse |
| Breaking change in Webpage API affects Website | Medium | Medium | Freeze shared contract at each phase boundary (`v0.1.x` then `v0.3.x`) |
| Lab experiments diverge from real implementation | Medium | Low | Re-run labs against real modules in Phase 3 |
| npm link issues during development | Low | Low | Symbol.for() detection handles cross-install (Lab 003) |

---

## 15.9 Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 1: Webpage minimal | 1–2 hours | None | ✅ Complete |
| Phase 2: Website minimal | 1–2 hours | Phase 1 published | ✅ Complete |
| Phase 3: Server integration | 4–6 hours | Phase 2 published | ✅ Complete |
| Phase 4: Full-spec primitives | 4–6 hours | Phase 3 stable | ⏳ Not started |
| Phase 5: Content integration | 2–4 hours | Phase 4 complete | ⏳ Not started |
| **Total** | **12–20 hours** | | **~50% complete** |

Phases 1 and 2 can be parallelized only if the minimal Webpage constructor contract is frozen first.

---

*See [Chapter 17](17-implementation-report-codex.md) for the implementation report. See the [README](README.md) for the full chapter index.*
