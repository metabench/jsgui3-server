---
name: jsgui3-activation-debug
description: Debug jsgui3 client-side activation issues. Use when SSR renders but clicks don't work, this.dom.el is null, or you see Missing context.map_Controls / activation failures.
---

# jsgui3 Activation Debug

## Triggers

- "jsgui3", "clicks don't work", "activation", "Missing context.map_Controls"

## Scope

- Diagnose "renders but no interactivity" failures
- Ensure client bundle is current when tests run in a browser
- Add a minimal check script when behavior is unclear

## Inputs

- Which server/route/control is affected
- Whether the issue reproduces in E2E (Puppeteer/Playwright)
- Whether client bundling is involved

## Procedure

1. Confirm this is an activation issue, not just CSS/DOM.
   - View the page source — if the HTML looks correct, it's likely activation.
   - If the HTML is wrong, it's an SSR bug (different skill).

2. Follow the documented activation flow and look for the canonical signatures:
   - `data-jsgui-id` attributes on SSR elements
   - `data-jsgui-type` for constructor mapping
   - Client bundle loading correctly in browser Network tab

3. Check the client bundle is up to date:
   - If using bundled client JS, ensure it was rebuilt after any control changes.
   - The server's bundler in `serve-factory.js` handles this automatically in most cases.

4. Check `activate()` implementation:
   - Is `super.activate()` being called?
   - Is `this.dom.el` available at the time of activation?
   - Are event listeners being attached in `activate()`, not in the constructor?

5. If unclear, create a minimal reproduction check:
   ```javascript
   // Quick check: does the control load and render?
   const Server = require('./server');
   const s = new Server({port: 0});
   // ... mount the control, start, check response
   ```

## Common Error Messages

- **`Missing context.map_Controls for type <X>`**: SSR said the element is type X, but the client doesn't have a constructor registered. Client falls back to generic `Control`.
- **`Missing context.map_Controls for type undefined`**: Often corresponds to tags where `data-jsgui-type` is intentionally not emitted (html/head/body). Usually log noise.
- **`&&& no corresponding control`**: Emitted during pre-activation when DOM contains text nodes that don't correspond to a control entry. Often benign whitespace.

## Validated Patterns

### Pattern: Manual DOM Query in `activate()`
When standard control field linking is insufficient, explicitly querying the DOM in `activate()` is a robust fallback:

```javascript
activate() {
  if (this.__active) return;
  this.__active = true;

  const el = this.dom?.el;
  if (!el) return;

  // 1. Read config from data attributes
  this.initial_width = parseInt(el.dataset.initialWidth, 10);

  // 2. Query explicitly for child elements
  this._expand_handle_el = el.querySelector("[data-expand-handle]");
  
  // 3. Bind events
  if (this._expand_handle_el) {
    this._expand_handle_el.addEventListener("click", this._handle_expand.bind(this));
  }
}
```

## Anti-Patterns to Avoid

- **Blindly Editing CSS**: Assuming a control isn't working because of z-index or pointer-events, when the real issue is that the JS `activate()` method never fired on the client.
- **Skipping Build**: Making changes to control logic and running E2E tests without rebuilding the client bundle first, leading to false negatives.

## References

- jsgui3 understanding: `docs/agi/skills/understanding-jsgui3/SKILL.md`
- Comprehensive documentation: `docs/comprehensive-documentation.md`
- Controls development guide: `docs/controls-development.md`
- Server source: `server.js`, `serve-factory.js`
