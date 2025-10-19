'use strict';

const DragBehaviourBase = require('./drag-behaviour-base');
const {
  qIdentity,
  qNormalize,
  qMul,
  qFromAxisAngle,
  qFromVectors,
  mat3FromQuat,
  mat3Transpose
} = require('./math');

/**
 * ArcballDragBehaviour - Implements virtual trackball/arcball rotation
 * 
 * This class handles the sophisticated math for arcball-style rotation:
 * - Converting 2D screen coordinates to 3D arcball surface positions
 * - Computing quaternion rotations from drag movements
 * - Managing inertia with axis and angular velocity
 * 
 * The arcball technique allows intuitive 3D rotation by mapping 2D mouse
 * movements to rotations on a virtual sphere.
 */
class ArcballDragBehaviour extends DragBehaviourBase {
  constructor(options = {}) {
    super();
    
    // Quaternion representing current rotation
    this.q = qIdentity();
    
    // Rotation matrices (derived from quaternion)
    this.R = mat3FromQuat(this.q);
    this.Rt = mat3Transpose(this.R);
    
    // Previous arcball position (3D vector on unit sphere)
    this.v0 = [0, 0, 1];
    
    // Inertia state
    this.omega = 0;           // Angular velocity (rad/s)
    this.axis = [0, 1, 0];    // Rotation axis
    this.inertia_raf = 0;     // RequestAnimationFrame handle
    
    // Options
    this.inertia_friction = options.inertia_friction || 1.7;
    this.inertia_min_speed = options.inertia_min_speed || 0.25;
    
    // Callbacks
    this.on_rotation_change = options.on_rotation_change || null;
  }

  /**
   * Convert 2D screen position to 3D point on arcball sphere
   * 
   * Maps (x, y) in normalized coordinates [-1, 1] to a point on or inside
   * a unit sphere. Points outside the sphere are projected onto it.
   * 
   * @param {number} x - Normalized X coordinate [-1, 1]
   * @param {number} y - Normalized Y coordinate [-1, 1]
   * @returns {Array<number>} [x, y, z] point on unit sphere
   */
  screen_to_arcball(x, y) {
    const d2 = x * x + y * y;
    
    if (d2 <= 1) {
      // Inside sphere: compute Z using sphere equation x² + y² + z² = 1
      return [x, y, Math.sqrt(1 - d2)];
    }
    
    // Outside sphere: normalize to edge
    const inv = 1 / Math.sqrt(d2);
    return [x * inv, y * inv, 0];
  }

  /**
   * Start drag operation
   * @param {Object} position - {x, y} normalized coordinates
   */
  on_drag_start(position) {
    super.on_drag_start(position);
    this.v0 = this.screen_to_arcball(position.x, position.y);
    this.omega = 0;
    this.stop_inertia();
  }

  /**
   * Update rotation during drag
   * @param {Object} position - {x, y} normalized coordinates
   */
  on_drag_move(position) {
    const delta_time = super.on_drag_move(position);
    if (!this.is_dragging) return;
    
    // Current arcball position
    const v1 = this.screen_to_arcball(position.x, position.y);
    
    // Compute rotation quaternion from v0 to v1
    const dq = qFromVectors(this.v0, v1);
    
    // Compose with existing rotation: q = dq * q
    this.q = qNormalize(qMul(dq, this.q));
    
    // Update for next frame
    this.v0 = v1;
    
    // Calculate angular velocity for inertia
    let angle = 2 * Math.acos(Math.max(-1, Math.min(1, dq[3])));
    if (angle > Math.PI) angle = 2 * Math.PI - angle;
    
    // Extract rotation axis from quaternion
    const s = Math.sqrt(1 - dq[3] * dq[3]);
    if (s < 1e-6) {
      this.axis[0] = 0;
      this.axis[1] = 1;
      this.axis[2] = 0;
    } else {
      this.axis[0] = dq[0] / s;
      this.axis[1] = dq[1] / s;
      this.axis[2] = dq[2] / s;
    }
    
    this.omega = angle / delta_time;
    
    // Update rotation matrices
    this._update_rotation_matrices();
    
    // Notify callback
    if (this.on_rotation_change) {
      this.on_rotation_change(this.q, this.R, this.Rt);
    }
  }

  /**
   * End drag operation and potentially start inertia
   */
  on_drag_end() {
    super.on_drag_end();
    this.start_inertia();
  }

  /**
   * Start inertia animation with exponential decay
   * @returns {boolean} True if inertia was started
   */
  start_inertia() {
    if (this.omega <= this.inertia_min_speed) {
      return false;
    }
    
    // Check if requestAnimationFrame is available (not in Node.js)
    if (typeof requestAnimationFrame === 'undefined') {
      return false;
    }
    
    const friction = this.inertia_friction;
    let last = performance.now();
    
    const step = (now) => {
      const dt = Math.max(1, now - last) / 1000;
      last = now;
      
      // Exponential decay
      this.omega *= Math.exp(-friction * dt);
      
      if (this.omega <= this.inertia_min_speed) {
        this.omega = 0;
        this.inertia_raf = 0;
        return;
      }
      
      // Apply incremental rotation
      const dq = qFromAxisAngle(
        this.axis[0],
        this.axis[1],
        this.axis[2],
        this.omega * dt
      );
      
      this.q = qNormalize(qMul(dq, this.q));
      this._update_rotation_matrices();
      
      // Notify callback
      if (this.on_rotation_change) {
        this.on_rotation_change(this.q, this.R, this.Rt);
      }
      
      this.inertia_raf = requestAnimationFrame(step);
    };
    
    if (this.inertia_raf) cancelAnimationFrame(this.inertia_raf);
    this.inertia_raf = requestAnimationFrame(step);
    
    return true;
  }

  /**
   * Stop inertia animation
   */
  stop_inertia() {
    if (this.inertia_raf) {
      cancelAnimationFrame(this.inertia_raf);
      this.inertia_raf = 0;
    }
    this.omega = 0;
  }

  /**
   * Update rotation matrices from quaternion
   * @private
   */
  _update_rotation_matrices() {
    this.R = mat3FromQuat(this.q);
    this.Rt = mat3Transpose(this.R);
  }

  /**
   * Set quaternion directly (useful for initialization)
   * @param {Array<number>} q - Quaternion [x, y, z, w]
   */
  set_quaternion(q) {
    this.q = q.slice(); // Copy
    this._update_rotation_matrices();
  }

  /**
   * Get current quaternion
   * @returns {Array<number>} Quaternion [x, y, z, w]
   */
  get_quaternion() {
    return this.q.slice();
  }

  /**
   * Get rotation matrix
   * @returns {Array<number>} 3x3 matrix (column-major)
   */
  get_rotation_matrix() {
    return this.R.slice();
  }

  /**
   * Get transposed rotation matrix
   * @returns {Array<number>} 3x3 matrix (column-major)
   */
  get_rotation_matrix_transpose() {
    return this.Rt.slice();
  }
}

module.exports = ArcballDragBehaviour;
