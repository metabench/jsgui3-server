'use strict';

/**
 * DragBehaviourBase - Base class for drag behaviors
 * 
 * Provides common functionality for drag interactions including:
 * - Drag state tracking (is_dragging flag)
 * - Timing for velocity calculations
 * - Lifecycle hooks for subclasses to implement
 * 
 * Subclasses should override:
 * - on_drag_start(position) - called when drag begins
 * - on_drag_move(position, delta_time) - called during drag
 * - on_drag_end() - called when drag ends
 * - start_inertia() - called to initiate inertia animation (optional)
 */
class DragBehaviourBase {
  constructor() {
    this.is_dragging = false;
    this.last_time = 0;
  }

  /**
   * Called when drag operation starts
   * @param {Object} position - Position info (e.g., screen coords, normalized coords)
   */
  on_drag_start(position) {
    this.is_dragging = true;
    this.last_time = performance.now();
  }

  /**
   * Called during drag operation
   * @param {Object} position - Current position
   * @returns {number} Delta time in seconds since last move
   */
  on_drag_move(position) {
    if (!this.is_dragging) return 0;
    
    const now = performance.now();
    const delta_time = Math.max(1, now - this.last_time) / 1000;
    this.last_time = now;
    
    return delta_time;
  }

  /**
   * Called when drag operation ends
   */
  on_drag_end() {
    this.is_dragging = false;
  }

  /**
   * Override to implement inertia/momentum animation
   * @returns {boolean} True if inertia was started
   */
  start_inertia() {
    return false;
  }

  /**
   * Override to stop any ongoing inertia animation
   */
  stop_inertia() {
    // Base implementation does nothing
  }
}

module.exports = DragBehaviourBase;
