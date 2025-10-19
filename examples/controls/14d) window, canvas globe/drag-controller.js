'use strict';

/**
 * DragController - Handles UI wiring for drag interactions
 * 
 * This class manages:
 * - DOM event attachment (pointerdown, pointermove, pointerup, etc.)
 * - Pointer capture for reliable tracking
 * - Coordinate transformation (screen to normalized)
 * - Delegation to a DragBehaviour instance
 * 
 * Separates UI concerns from the mathematical drag behavior logic.
 */
class DragController {
  /**
   * @param {HTMLElement} element - The element to attach pointer events to
   * @param {DragBehaviourBase} behaviour - The drag behavior instance
   * @param {Object} options - Configuration options
   * @param {number} options.padding - Padding around the arcball area
   * @param {Function} options.on_interactive_frame - Called to request render during interaction
   * @param {Function} options.on_drag_end - Called after drag ends (optional)
   */
  constructor(element, behaviour, options = {}) {
    this.element = element;
    this.behaviour = behaviour;
    this.padding = options.padding || 8;
    this.on_interactive_frame = options.on_interactive_frame || null;
    this.on_drag_end = options.on_drag_end || null;
    
    this.dragging = false;
    this.pending_interactive = false;
    
    // Bind event handlers
    this._on_pointer_down = this._handle_pointer_down.bind(this);
    this._on_pointer_move = this._handle_pointer_move.bind(this);
    this._on_pointer_up = this._handle_pointer_up.bind(this);
    
    this._attach_handlers();
  }

  /**
   * Attach pointer event handlers to the element
   * @private
   */
  _attach_handlers() {
    const el = this.element;
    
    // Ensure touch-action is set for proper touch handling
    if (getComputedStyle(el).touchAction !== 'none') {
      el.style.touchAction = 'none';
    }
    
    el.addEventListener('pointerdown', this._on_pointer_down);
    el.addEventListener('pointermove', this._on_pointer_move);
    
    // Try to use pointerrawupdate for higher frequency updates
    try {
      el.addEventListener('pointerrawupdate', this._on_pointer_move);
    } catch (e) {
      // pointerrawupdate not supported, fall back to pointermove
    }
    
    el.addEventListener('pointerup', this._on_pointer_up);
    el.addEventListener('pointercancel', this._on_pointer_up);
  }

  /**
   * Handle pointer down event
   * @private
   */
  _handle_pointer_down(ev) {
    this.dragging = true;
    
    const pos = this._screen_to_normalized(ev.clientX, ev.clientY);
    this.behaviour.on_drag_start(pos);
    
    // Capture the pointer for reliable tracking
    try {
      this.element.setPointerCapture(ev.pointerId);
    } catch (e) {
      // Pointer capture may fail in some contexts
    }
  }

  /**
   * Handle pointer move event
   * @private
   */
  _handle_pointer_move(ev) {
    if (!this.dragging) return;
    
    const pos = this._screen_to_normalized(ev.clientX, ev.clientY);
    this.behaviour.on_drag_move(pos);
    
    this._request_interactive_frame();
  }

  /**
   * Handle pointer up/cancel event
   * @private
   */
  _handle_pointer_up(ev) {
    if (!this.dragging) return;
    
    this.dragging = false;
    
    // Release pointer capture
    try {
      this.element.releasePointerCapture(ev.pointerId);
    } catch (e) {
      // May fail if capture was not set
    }
    
    this.behaviour.on_drag_end();
    
    // Call optional callback
    if (this.on_drag_end) {
      this.on_drag_end();
    }
  }

  /**
   * Convert screen coordinates to normalized arcball coordinates
   * @param {number} clientX - Screen X coordinate
   * @param {number} clientY - Screen Y coordinate
   * @returns {Object} {x, y} in normalized space [-1, 1]
   * @private
   */
  _screen_to_normalized(clientX, clientY) {
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = Math.max(1, Math.min(rect.width, rect.height) / 2 - this.padding);
    
    const x = (clientX - cx) / r;
    const y = (cy - clientY) / r; // Invert Y for standard 3D coordinates
    
    return { x, y };
  }

  /**
   * Request an interactive frame render
   * @private
   */
  _request_interactive_frame() {
    if (this.pending_interactive) return;
    if (!this.on_interactive_frame) return;
    
    this.pending_interactive = true;
    requestAnimationFrame(() => {
      this.pending_interactive = false;
      if (this.on_interactive_frame) {
        this.on_interactive_frame();
      }
    });
  }

  /**
   * Detach all event handlers
   */
  destroy() {
    const el = this.element;
    el.removeEventListener('pointerdown', this._on_pointer_down);
    el.removeEventListener('pointermove', this._on_pointer_move);
    el.removeEventListener('pointerrawupdate', this._on_pointer_move);
    el.removeEventListener('pointerup', this._on_pointer_up);
    el.removeEventListener('pointercancel', this._on_pointer_up);
    
    this.behaviour.stop_inertia();
  }

  /**
   * Update padding (e.g., when canvas resizes)
   * @param {number} padding - New padding value
   */
  set_padding(padding) {
    this.padding = padding;
  }
}

module.exports = DragController;
