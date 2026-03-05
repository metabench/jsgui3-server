---
name: jsgui3-context-menu-patterns
description: Standard pattern for implementing context menus in jsgui3 applications (Web & Electron), ensuring consistent behavior for activation, positioning, and dismissal. Triggers — context menu, right-click menu, popup menu, overlay positioning, click-outside dismissal.
---

# Skill: jsgui3 Context Menu Patterns

## Description
Standard pattern for implementing context menus in jsgui3 applications, ensuring consistent behavior for activation, positioning, and dismissal.

## The Pattern

1.  **Activation**: Listen for `contextmenu` event on the target element (or delegated container).
2.  **Prevention**: Call `e.preventDefault()` to stop the native browser context menu.
3.  **Creation**: Create or show the menu DOM element.
    *   Append to `document.body` (or a dedicated overlay layer) to avoid z-index/clipping issues.
    *   Position using `fixed` or `absolute` coordinates based on `e.clientX` / `e.clientY`.
    *   **Clamp** coordinates to viewport bounds to prevent overflow.
4.  **Dismissal**:
    *   Add **global** `click` listener to `document` (use `capture: true` or check `e.target` to allow clicks inside the menu).
    *   Add **global** `keydown` listener for `Escape` key.
    *   Remove these listeners immediately upon menu closure to prevent leaks.
5.  **Cleanup**: Always remove the menu element and listeners when closed.

## Implementation Example (jsgui3)

```javascript
// In your control's activate() method:
this.dom.el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    this.show_context_menu(e.clientX, e.clientY);
});

show_context_menu(x, y) {
    // 1. Close existing
    if (this._active_menu) this._active_menu.remove();

    // 2. Create Menu (using jsgui or raw DOM)
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    // 3. Position & Clamp
    const width = 150; // Estimated or measured
    const height = 100;
    
    // Clamp X
    if (x + width > window.innerWidth) x -= width;
    // Clamp Y
    if (y + height > window.innerHeight) y -= height;
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // 4. Add Items
    // ... append items ...

    document.body.appendChild(menu);
    this._active_menu = menu;

    // 5. Setup Dismissal
    const close_handler = (ev) => {
        // Don't close if clicking inside menu
        if (ev.type === 'click' && menu.contains(ev.target)) return;
        
        // Close on click outside or Escape
        if (ev.type === 'click' || (ev.type === 'keydown' && ev.key === 'Escape')) {
            menu.remove();
            this._active_menu = null;
            document.removeEventListener('click', close_handler);
            document.removeEventListener('keydown', close_handler);
        }
    };

    // Defer listener to avoid immediate trigger
    setTimeout(() => {
        document.addEventListener('click', close_handler);
        document.addEventListener('keydown', close_handler);
    }, 0);
}
```

## Validation

Verify context menu behavior:
- Right-click shows menu at cursor position
- Menu is clamped within viewport
- Click outside dismisses menu
- Escape key dismisses menu
- No event listener leaks after menu closure

## References

- Understanding jsgui3: `docs/agi/skills/understanding-jsgui3/SKILL.md`
- Controls development: `docs/controls-development.md`
