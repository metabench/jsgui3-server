'use strict';
const assert = require('assert');
const ArcballDragBehaviour = require('./arcball-drag-behaviour');

describe('Arcball Core Math', function() {
  const EPS = 1e-9;
  const approx = (a, b, e=EPS) => Math.abs(a - b) < e;
  const approx_arr = (a, b, e=EPS) => a.length === b.length && a.every((v, i) => approx(v, b[i], e));
  const apply_mat = (m, v) => [m[0]*v[0]+m[3]*v[1]+m[6]*v[2], m[1]*v[0]+m[4]*v[1]+m[7]*v[2], m[2]*v[0]+m[5]*v[1]+m[8]*v[2]];
  const vec_len = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
  const q_len = (q) => Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);

  describe('screen_to_arcball', function() {
    let b;
    beforeEach(() => b = new ArcballDragBehaviour());

    it('center to front [0,0,1]', () => {
      assert(approx_arr(b.screen_to_arcball(0, 0), [0, 0, 1]));
    });

    it('all points on unit sphere', () => {
      [[0,0], [0.5,0], [0,0.5], [0.7,0.7], [1,0], [2,0], [5,5]].forEach(([x,y]) => {
        assert(approx(vec_len(b.screen_to_arcball(x, y)), 1.0));
      });
    });

    it('inside point satisfies sphere equation', () => {
      const p = b.screen_to_arcball(0.5, 0.5);
      assert(approx(p[0], 0.5) && approx(p[1], 0.5) && approx(p[2], Math.sqrt(0.5)));
    });

    it('outside points have z0', () => {
      const p = b.screen_to_arcball(3, 4);
      assert(approx(p[2], 0, 1e-6));
    });
  });

  describe('drag rotation', function() {
    let b;
    beforeEach(() => b = new ArcballDragBehaviour());

    it('horizontal drag preserves Y', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0.5, y:0});
      const rot = apply_mat(b.get_rotation_matrix(), [1,0,0]);
      assert(approx(rot[1], 0, 1e-6));
    });

    it('vertical drag preserves X', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0, y:0.5});
      const rot = apply_mat(b.get_rotation_matrix(), [0,1,0]);
      assert(approx(rot[0], 0, 1e-6));
    });

    it('preserves vector lengths', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0.6, y:0.4});
      const R = b.get_rotation_matrix();
      [[1,0,0], [0,1,0], [0,0,1]].forEach(v => {
        assert(approx(vec_len(v), vec_len(apply_mat(R, v))));
      });
    });

    it('maintains unit quaternion after multiple drags', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0.2, y:0});
      assert(approx(q_len(b.get_quaternion()), 1.0), 'After 1st drag');
      b.on_drag_move({x:0.4, y:0.1});
      assert(approx(q_len(b.get_quaternion()), 1.0), 'After 2nd drag');
      b.on_drag_move({x:0.6, y:0.2});
      assert(approx(q_len(b.get_quaternion()), 1.0), 'After 3rd drag');
    });

    it('produces orthogonal matrices', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0.7, y:0.5});
      const R = b.get_rotation_matrix();
      const Rt = b.get_rotation_matrix_transpose();
      const I = [];
      for (let i=0; i<3; i++) for (let j=0; j<3; j++) {
        let sum = 0;
        for (let k=0; k<3; k++) sum += R[k*3+i] * Rt[j*3+k];
        I.push(sum);
      }
      assert(approx_arr(I, [1,0,0,0,1,0,0,0,1]));
    });
  });

  describe('edge cases', function() {
    let b;
    beforeEach(() => b = new ArcballDragBehaviour());

    it('zero drag no rotation', () => {
      b.on_drag_start({x:0.3, y:0.3});
      b.on_drag_move({x:0.3, y:0.3});
      assert(approx_arr(b.get_quaternion(), [0,0,0,1], 1e-6));
    });

    it('tiny drag no NaN', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:1e-8, y:0});
      const q = b.get_quaternion();
      assert(!q.some(isNaN), 'No NaN values');
      assert(approx(q_len(q), 1.0), 'Unit quaternion');
    });

    it('large drag stable', () => {
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:10, y:10});
      const q = b.get_quaternion();
      assert(!q.some(isNaN), 'No NaN values');
      assert(approx(q_len(q), 1.0), 'Unit quaternion');
    });

    it('rapid direction changes', () => {
      b.on_drag_start({x:0, y:0});
      [{ x:0.5, y:0}, {x:0, y:0.5}, {x:-0.5, y:0}, {x:0, y:-0.5}].forEach(pos => {
        b.on_drag_move(pos);
        const q = b.get_quaternion();
        assert(!q.some(isNaN) && approx(q_len(q), 1.0));
      });
    });
  });

  describe('angular velocity', () => {
    it('drag produces omega', () => {
      const b = new ArcballDragBehaviour();
      b.on_drag_start({x:0, y:0});
      b.on_drag_move({x:0.5, y:0});
      assert(b.omega > 0 && b.axis.length === 3);
    });

    it('exponential decay math', () => {
      let omega = 2.0;
      const dt = 0.016, friction = 1.7;
      for (let i=0; i<10; i++) omega *= Math.exp(-friction * dt);
      assert(omega < 2.0 && omega > 0 && approx(omega, 2.0 * Math.exp(-friction * dt * 10)));
    });
  });
});
