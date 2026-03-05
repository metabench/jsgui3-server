---
name: autonomous-ui-inspection
description: Autonomous UI inspection using a dual channel — (1) visual screenshots via browser tools, (2) numeric layout metrics via Puppeteer scripts. Use when you need a reliable, agent-friendly view of what the UI renders.
---

# Autonomous UI Inspection

## Scope

Use this Skill when you need a **reliable, agent-friendly view of what the UI renders**:

- **Visual**: screenshots + accessibility snapshots
- **Numeric**: bounding boxes, computed styles, text overflow, and connection geometry (Puppeteer)

This Skill is about **inspection and evidence collection**. It intentionally avoids styling tweaks unless the inspection workflow itself is broken.

## Inputs

- Which UI surface (server file + URL route)
- Whether the UI is SSR-only or needs client activation
- A stable selector that indicates "ready" (e.g. a control class or `data-role` attribute)
- Desired viewport and whether you need a clipped screenshot

## Procedure

### A) Server start/stop

1. Start the jsgui3-server instance being inspected:
   ```bash
   node examples/<example>/server.js
   ```
   Or for the main server:
   ```bash
   node server.js
   ```

2. Ensure the server is ready before inspection.

### B) Visual inspection (Browser tools)

Goal: get screenshots that an agent can "see", plus a structural snapshot.

1. Start the UI server.
2. Navigate to the URL using browser tools.
3. Capture:
   - Full-page screenshot (baseline)
   - Optional clipped screenshot (if a stable container selector exists)
   - Accessibility snapshot for structure + quick DOM sanity

Notes:
- Use consistent viewport dimensions (example: 1600x1200) to reduce diff noise.
- If the UI is interactive, capture "before" and "after" screenshots for a single canonical interaction.

### C) Numeric inspection (Puppeteer)

Goal: compute layout facts agents can diff and enforce.

Run a dedicated Puppeteer script that:

- Starts the server on a random or fixed dev port
- Waits for a deterministic "ready" selector
- Extracts metrics:
  - `getBoundingClientRect()` for key elements
  - `scrollWidth/Height` vs `clientWidth/Height` for overflow
  - computed styles for typography + spacing

Typical invariants to enforce:
- Text is not overflowing (`isOverflowing === false`)
- Bounding boxes are within expected ranges
- Key interactive elements are visible

### D) WebSocket / live-update verification

When a page uses WebSocket for real-time updates:

1. Verify WebSocket connection:
   ```javascript
   // Puppeteer: check WebSocket is established
   const ws_messages = [];
   page.on('websocket', ws => {
     ws.on('framereceived', frame => ws_messages.push(JSON.parse(frame.payload)));
   });
   await page.goto(url);
   await page.waitForTimeout(2000);
   console.log('WS messages received:', ws_messages.length);
   ```

2. Verify DOM updates happen without reload.
3. Test reconnect behavior if applicable.

## Validation / Evidence Checklist

- Server starts and responds on the expected port
- At least one screenshot captured
- Numeric JSON output captured (stdout or written artifact)
- A "ready selector" exists and is documented for the UI

## References

- Puppeteer efficient verification: `docs/agi/skills/puppeteer-efficient-ui-verification/SKILL.md`
- jsgui3 understanding: `docs/agi/skills/understanding-jsgui3/SKILL.md`
- Server documentation: `docs/comprehensive-documentation.md`
