# Chapter 7 — Delivery Roadmap and Ownership

This chapter turns the playbooks into an executable delivery sequence.

## 7.1 Phase Plan

### Phase 1 — Foundation (Platform Utilities)

Deliver:

1. View environment service
2. Adaptive composition helper
3. Responsive parameter resolution
4. Initial mode-attribute + density token overlays

Exit criteria:

- utility APIs are documented and used in at least one upgraded control
- root mode attributes update correctly in runtime

### Phase 2 — Tier 1 Controls

Deliver in this order:

1. Master_Detail
2. Split_Pane
3. Tabbed_Panel
4. Data_Table

Exit criteria:

- all Tier 1 controls pass required matrix assertions
- no regressions in desktop baseline behavior

### Phase 3 — Tier 2 Controls

Deliver:

1. Sidebar_Nav
2. Toolbar
3. Modal
4. Form_Container

Exit criteria:

- shell navigation and core form workflows are adaptive across matrix

### Phase 4 — Tier 3/4 and polish

Deliver:

- Window/Window_Manager adaptive constraints
- Wizard and secondary control adjustments
- density/touch refinements and final a11y polish

Exit criteria:

- project-level adaptive checklist reaches defined target threshold

## 7.2 Ownership Model

Recommend three streams in parallel:

1. Platform stream:
   - shared utilities, root attributes, token overlays
2. Control stream:
   - Tier 1/Tier 2 upgrades using shared utilities
3. QA stream:
   - viewport-matrix suites, screenshot artifacts, regression checks

This avoids serial bottlenecks and keeps quality moving with implementation.

## 7.3 Milestone Definitions

### Milestone A — “Adaptive Infrastructure Ready”

- foundation utilities merged
- one control successfully migrated using new pattern

### Milestone B — “Shell Controls Ready”

- Tier 1 control set complete except Data_Table
- shell behaviors validated across matrix

### Milestone C — “Data-Dense Ready”

- Data_Table mode family complete
- key data workflows verified on phone/tablet/desktop

### Milestone D — “Catalog Ready (Primary)”

- Tier 2 controls complete
- quality checklist green for prioritized control set

## 7.4 Risk Register

### Risk 1: control-level bespoke implementations diverge

Mitigation:

- enforce shared helper usage in review criteria

### Risk 2: adaptive state leaks into domain model

Mitigation:

- explicit model-layer audit in PR checklist

### Risk 3: desktop regressions during mobile improvements

Mitigation:

- mandatory desktop matrix profiles and before/after screenshots

### Risk 4: test burden slows delivery

Mitigation:

- reusable matrix runner and assertion helper library

## 7.5 Definition of Done for the Program

The adaptive control improvement program is complete when:

1. Tier 1 and Tier 2 controls are upgraded and documented.
2. Shared adaptive utilities are adopted consistently.
3. Mode-attribute and density-token styling policies are in place.
4. Viewport-matrix quality gates are integrated in regular testing.
5. The resulting developer path for adaptive control work is easier than ad-hoc responsive code.

---

This concludes the implementation-focused adaptive control improvement book.

For implementation reviews and pull requests, continue with:

- `08-appendix-tier1-acceptance-and-pr-templates.md`
