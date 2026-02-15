# Chapter 7 — Testing Harness and Quality Gates

## Why Responsive Testing Must Be Explicit

A control can pass every interaction test at 1280×900 and still be broken on a phone. Buttons overlap, text overflows, drawers fail to open, keyboard paths become incomplete. These are not edge cases — they affect real users on real devices.

The jsgui3 test suite currently validates rich interactivity across 14+ Playwright suites, all running at a single viewport size. This chapter defines how to extend that coverage to a **viewport matrix** — running key tests across multiple screen dimensions and verifying that adaptive behavior works correctly at each size.

## The Viewport Matrix

### Minimum Required Profiles

Every responsive test suite should exercise these six profiles:

| Profile | Width × Height | Represents |
|---------|---------------|------------|
| Phone portrait | 390 × 844 | iPhone 14, typical Android |
| Phone landscape | 844 × 390 | iPhone 14 rotated |
| Tablet portrait | 768 × 1024 | iPad, Surface Go portrait |
| Tablet landscape | 1024 × 768 | iPad landscape |
| Desktop narrow | 1280 × 720 | Laptop, resized browser |
| Desktop wide | 1920 × 1080 | Full HD monitor |

### Optional Extended Profiles

For thorough coverage, add:

| Profile | Width × Height | Represents |
|---------|---------------|------------|
| Phone small | 320 × 568 | iPhone SE, older Android |
| Tablet large | 1024 × 1366 | iPad Pro 12.9″ portrait |
| Desktop 4K | 2560 × 1440 | High-resolution desktop |
| Embedded narrow | 400 × 600 | Widget in a sidebar |

## Assertion Categories

For each viewport profile, tests should cover these categories, ordered by priority:

### P0: Layout Integrity

The most fundamental check — does the layout work at this size?

```js
// No horizontal overflow
const body_width = await page.evaluate(() => document.body.scrollWidth);
const viewport_width = page.viewportSize().width;
assert(body_width <= viewport_width + 1, 'No horizontal overflow');

// Key containers are visible
const content = await page.$('.content-area');
const box = await content.boundingBox();
assert(box.width > 100, 'Content area has reasonable width');
assert(box.height > 50, 'Content area has reasonable height');
```

### P0: Interaction Integrity

Controls remain usable — clickable, focusable, and responsive:

```js
// Buttons are clickable (not obscured, not zero-size)
const buttons = await page.$$('button');
for (const btn of buttons) {
    const box = await btn.boundingBox();
    if (box) {
        assert(box.width >= 20, `Button width >= 20px`);
        assert(box.height >= 20, `Button height >= 20px`);
    }
}

// Interactive elements respond to clicks
await page.click('.tab-label:first-child');
await delay(200);
const active = await page.$eval('.tab-label:first-child input', el => el.checked);
assert(active, 'Tab responds to click at this viewport');
```

### P1: Adaptive Morphing

If the app uses compose_adaptive or region morphing, verify the correct structure appears:

```js
// At phone width: navigation should be a drawer, not inline
if (profile.name === 'phone_portrait') {
    const drawer = await page.$('.drawer');
    assert(drawer, 'Navigation renders as drawer on phone');
    const sidebar = await page.$('.nav-sidebar');
    assert(!sidebar, 'No inline sidebar on phone');
}

// At desktop width: navigation should be inline sidebar
if (profile.name === 'desktop_wide') {
    const sidebar = await page.$('.nav-sidebar');
    assert(sidebar, 'Navigation renders as sidebar on desktop');
}
```

### P1: Accessibility Integrity

Keyboard navigation and ARIA attributes remain correct across sizes:

```js
// Focus is reachable for all interactive elements
const focusable = await page.$$('button, a[href], input, select, textarea, [tabindex="0"]');
assert(focusable.length > 0, 'Has focusable elements');

// ARIA roles are present (not removed by adaptive composition)
const tabs = await page.$$('[role="tab"]');
if (tabs.length > 0) {
    const aria = await tabs[0].getAttribute('aria-selected');
    assert(aria !== null, 'Tab has aria-selected attribute');
}
```

### P2: Visual Integrity

Token-driven styling applies correctly:

```js
// Theme tokens are applied (not broken by mode switch)
const bg = await page.$eval('body', el => getComputedStyle(el).backgroundColor);
assert(bg !== '', 'Body has background color');

// Touch targets meet minimum size on touch profiles
if (profile.interaction_mode === 'touch') {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const box = await btn.boundingBox();
        if (box) {
            assert(box.height >= 44, `Touch target >= 44px`);
        }
    }
}
```

## Practical Harness Pattern

### Viewport Matrix Runner

The existing Playwright test pattern uses self-contained test files with HTTP servers. Extend this with a viewport loop:

```js
const VIEWPORTS = [
    { name: 'phone_portrait',   width: 390,  height: 844  },
    { name: 'phone_landscape',  width: 844,  height: 390  },
    { name: 'tablet_portrait',  width: 768,  height: 1024 },
    { name: 'tablet_landscape', width: 1024, height: 768  },
    { name: 'desktop_narrow',   width: 1280, height: 720  },
    { name: 'desktop_wide',     width: 1920, height: 1080 }
];

async function run_viewport_matrix(page, assertions_fn) {
    const results = [];

    for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await delay(300); // Allow layout reflow and adaptive recomposition

        console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`);

        const vp_results = await assertions_fn(page, vp);
        results.push({ viewport: vp.name, ...vp_results });

        // Capture screenshot for visual spot-check
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `${test_name}-${vp.name}.png`),
            fullPage: true
        });
    }

    return results;
}
```

### Integration with Existing Test Runner

The aggregate runner at `test/e2e/playwright/run_all_playwright.js` can include viewport-matrix tests as additional suites. Each adaptive control gets its own matrix test file:

```
test/e2e/playwright/
  showcase_app.e2e.playwright.js          ← existing (single viewport)
  showcase_app_responsive.e2e.playwright.js ← NEW (viewport matrix)
  drawer_responsive.e2e.playwright.js     ← NEW (Drawer adaptation)
```

### Screenshot Artifacts

Each viewport capture goes to a `screenshots/` directory next to the test file, named with the viewport profile:

```
screenshots/
  showcase-phone_portrait.png
  showcase-phone_landscape.png
  showcase-tablet_portrait.png
  showcase-tablet_landscape.png
  showcase-desktop_narrow.png
  showcase-desktop_wide.png
```

These serve as visual regression baselines. They're not pixel-compared automatically (brittle), but they provide quick human review for unexpected layout changes.

## Quality Gates

### Gate Levels

| Gate | Scope | When |
|------|-------|------|
| P0 Gate | Layout + interaction integrity at all 6 viewports | Every PR that touches layout or composition |
| P1 Gate | Adaptive morphing + accessibility at all 6 viewports | Every PR that touches adaptive controls |
| P2 Gate | Visual integrity + touch targets at all 6 viewports | Before releases |

### Definition of "Responsive Green"

A control suite is "responsive green" when:

1. Zero horizontal overflow at any viewport
2. All interactive elements remain clickable/focusable
3. Adaptive morphing produces the correct structure per mode
4. No uncaught errors in any viewport profile
5. Screenshots captured successfully for visual review

### Incremental Adoption

Not every test suite needs viewport-matrix coverage immediately. The priority order:

1. **Showcase app** — the reference implementation, highest priority
2. **Shell/navigation controls** — Drawer, Tabbed_Panel, Accordion
3. **Data-dense controls** — tables, forms, editors
4. **Utility controls** — modals, tooltips, popovers
5. **Atomic controls** — buttons, inputs, chips (usually correct by token inheritance)

## Testing the Environment Service Itself

The View Environment Service (Pattern 1 from Chapter 6) should have its own unit tests:

```js
// Test: mode resolution from viewport width
const env = new View_Environment({ defaults: { layout_mode: 'desktop' } });
env._resolve_from_viewport(390, 844);
assert(env.state.layout_mode === 'phone');
assert(env.state.viewport.orientation === 'portrait');

env._resolve_from_viewport(1024, 768);
assert(env.state.layout_mode === 'desktop');
assert(env.state.viewport.orientation === 'landscape');

// Test: change events fire correctly
let change_count = 0;
env.on('change:layout_mode', () => change_count++);
env._resolve_from_viewport(390, 844);
env._resolve_from_viewport(1920, 1080);
assert(change_count === 2);
```

## Summary

Responsive testing is not optional — it's a quality gate. The existing Playwright infrastructure is well-suited for viewport-matrix extension. The key additions are:

1. A standard set of viewport profiles
2. A `run_viewport_matrix()` utility for looping tests across sizes
3. Prioritized assertion categories (P0/P1/P2)
4. Screenshot artifacts for visual review
5. Incremental adoption from showcase → shells → data controls → utilities

**Next:** [Chapter 8](08-roadmap-and-adoption-plan.md) puts everything together into a phased adoption plan.
