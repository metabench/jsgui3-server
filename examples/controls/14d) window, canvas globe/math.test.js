'use strict';

const assert = require('assert');
const {
  qIdentity,
  qNormalize,
  qMul,
  qFromAxisAngle,
  qFromVectors,
  mat3FromQuat,
  mat3Transpose
} = require('./math');

describe('Quaternion Math Functions', function() {
  
  // Helper to check if two numbers are approximately equal
  function approx_equal(a, b, epsilon = 1e-10) {
    return Math.abs(a - b) < epsilon;
  }
  
  // Helper to check if two arrays are approximately equal
  function approx_equal_array(a, b, epsilon = 1e-10) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!approx_equal(a[i], b[i], epsilon)) return false;
    }
    return true;
  }
  
  // Helper to compute quaternion magnitude
  function q_magnitude(q) {
    return Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
  }
  
  describe('qIdentity', function() {
    it('should return identity quaternion [0, 0, 0, 1]', function() {
      const q = qIdentity();
      assert.deepStrictEqual(q, [0, 0, 0, 1]);
    });
  });
  
  describe('qNormalize', function() {
    it('should normalize a quaternion to unit length', function() {
      const q = [1, 2, 3, 4];
      const normalized = qNormalize(q);
      const mag = q_magnitude(normalized);
      assert(approx_equal(mag, 1.0), `Magnitude should be 1.0, got ${mag}`);
    });
    
    it('should handle zero quaternion gracefully', function() {
      const q = [0, 0, 0, 0];
      const normalized = qNormalize(q);
      // Should normalize to [0,0,0,0] since magnitude is 0
      assert.deepStrictEqual(normalized, [0, 0, 0, 0]);
    });
    
    it('should preserve already normalized quaternions', function() {
      const q = qIdentity();
      const normalized = qNormalize(q);
      assert(approx_equal_array(normalized, [0, 0, 0, 1]));
    });
  });
  
  describe('qMul', function() {
    it('should multiply two quaternions correctly', function() {
      // Identity * anything = anything
      const q1 = qIdentity();
      const q2 = [1, 2, 3, 4];
      const result = qMul(q1, q2);
      assert(approx_equal_array(result, q2, 1e-9));
    });
    
    it('should be non-commutative (q1*q2 != q2*q1 in general)', function() {
      const q1 = qFromAxisAngle(1, 0, 0, Math.PI / 4);
      const q2 = qFromAxisAngle(0, 1, 0, Math.PI / 4);
      const r1 = qMul(q1, q2);
      const r2 = qMul(q2, q1);
      
      // These should not be equal
      const are_equal = approx_equal_array(r1, r2, 1e-6);
      assert(!are_equal, 'Quaternion multiplication should be non-commutative');
    });
    
    it('should compose rotations correctly', function() {
      // 90° rotation around Z-axis
      const q1 = qFromAxisAngle(0, 0, 1, Math.PI / 2);
      // Another 90° rotation around Z-axis
      const q2 = qFromAxisAngle(0, 0, 1, Math.PI / 2);
      // Combined should be 180° around Z-axis
      const result = qNormalize(qMul(q1, q2));
      const expected = qFromAxisAngle(0, 0, 1, Math.PI);
      
      // Allow for both q and -q (they represent same rotation)
      const match = approx_equal_array(result, expected, 1e-9) ||
                    approx_equal_array(result, [-expected[0], -expected[1], -expected[2], -expected[3]], 1e-9);
      assert(match, `Expected ${expected}, got ${result}`);
    });
  });
  
  describe('qFromAxisAngle', function() {
    it('should create quaternion from axis-angle', function() {
      // 180° rotation around X-axis
      const q = qFromAxisAngle(1, 0, 0, Math.PI);
      const mag = q_magnitude(q);
      assert(approx_equal(mag, 1.0), 'Quaternion should be unit length');
      assert(approx_equal(q[0], 1.0, 1e-9), 'X component should be ~1');
      assert(approx_equal(q[3], 0.0, 1e-9), 'W component should be ~0');
    });
    
    it('should handle zero angle (identity)', function() {
      const q = qFromAxisAngle(1, 0, 0, 0);
      assert(approx_equal_array(q, [0, 0, 0, 1], 1e-9));
    });
    
    it('should normalize axis internally', function() {
      // Non-unit axis
      const q = qFromAxisAngle(3, 4, 0, Math.PI / 2);
      const mag = q_magnitude(q);
      assert(approx_equal(mag, 1.0), 'Result should be unit quaternion');
    });
  });
  
  describe('qFromVectors', function() {
    it('should create quaternion rotating u to v', function() {
      const u = [1, 0, 0];
      const v = [0, 1, 0];
      const q = qFromVectors(u, v);
      
      // Verify it's a unit quaternion
      const mag = q_magnitude(q);
      assert(approx_equal(mag, 1.0), 'Should be unit quaternion');
    });
    
    it('should handle identical vectors (no rotation)', function() {
      const u = [1, 0, 0];
      const v = [1, 0, 0];
      const q = qFromVectors(u, v);
      
      // Should be identity or very close
      assert(approx_equal_array(q, [0, 0, 0, 1], 1e-9));
    });
    
    it('should handle opposite vectors (180° rotation)', function() {
      const u = [1, 0, 0];
      const v = [-1, 0, 0];
      const q = qFromVectors(u, v);
      
      // Should be a 180° rotation
      const mag = q_magnitude(q);
      assert(approx_equal(mag, 1.0), 'Should be unit quaternion');
      // W component should be ~0 for 180° rotation
      assert(approx_equal(Math.abs(q[3]), 0.0, 1e-9));
    });
    
    it('should handle small angle rotations robustly', function() {
      const u = [1, 0, 0];
      const v = [0.99999, 0.00001, 0];
      // Normalize v
      const vn = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      v[0] /= vn; v[1] /= vn; v[2] /= vn;
      
      const q = qFromVectors(u, v);
      const mag = q_magnitude(q);
      assert(approx_equal(mag, 1.0), 'Should be unit quaternion');
    });
  });
  
  describe('mat3FromQuat', function() {
    it('should create rotation matrix from quaternion', function() {
      const q = qIdentity();
      const m = mat3FromQuat(q);
      
      // Identity quaternion should give identity matrix
      const identity = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      ];
      assert(approx_equal_array(m, identity, 1e-9));
    });
    
    it('should create correct matrix for 90° Z rotation', function() {
      const q = qFromAxisAngle(0, 0, 1, Math.PI / 2);
      const m = mat3FromQuat(q);
      
      // 90° Z rotation matrix (column-major)
      const expected = [
        0, 1, 0,
        -1, 0, 0,
        0, 0, 1
      ];
      assert(approx_equal_array(m, expected, 1e-9));
    });
    
    it('should produce orthogonal matrix', function() {
      const q = qNormalize([1, 2, 3, 4]);
      const m = mat3FromQuat(q);
      
      // Check if M * M^T = I (orthogonality test)
      const mt = mat3Transpose(m);
      
      // Multiply M * M^T (both are column-major)
      const result = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          let sum = 0;
          for (let k = 0; k < 3; k++) {
            // m is column-major: element at (row, k) is m[k*3 + row]
            // mt is column-major: element at (k, col) is mt[col*3 + k]
            sum += m[k * 3 + row] * mt[col * 3 + k];
          }
          result.push(sum);
        }
      }
      
      const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      assert(approx_equal_array(result, identity, 1e-9));
    });
  });
  
  describe('mat3Transpose', function() {
    it('should transpose a 3x3 matrix', function() {
      const m = [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
      ];
      const mt = mat3Transpose(m);
      const expected = [
        1, 4, 7,
        2, 5, 8,
        3, 6, 9
      ];
      assert.deepStrictEqual(mt, expected);
    });
    
    it('should be self-inverse (transpose twice = original)', function() {
      const m = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const mt = mat3Transpose(m);
      const mtt = mat3Transpose(mt);
      assert.deepStrictEqual(mtt, m);
    });
  });
  
  describe('Integration Tests', function() {
    it('should rotate a vector correctly using quaternion', function() {
      // Rotate point [1,0,0] by 90° around Z-axis
      // Should get [0,1,0]
      const q = qFromAxisAngle(0, 0, 1, Math.PI / 2);
      const m = mat3FromQuat(q);
      
      const v = [1, 0, 0];
      const result = [
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
      ];
      
      assert(approx_equal_array(result, [0, 1, 0], 1e-9));
    });
    
    it('should compose multiple rotations correctly', function() {
      // Rotate 90° around X, then 90° around Y
      const qx = qFromAxisAngle(1, 0, 0, Math.PI / 2);
      const qy = qFromAxisAngle(0, 1, 0, Math.PI / 2);
      const qCombined = qNormalize(qMul(qy, qx));
      
      // Apply to point [1, 0, 0]
      const m = mat3FromQuat(qCombined);
      const v = [1, 0, 0];
      const result = [
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
      ];
      
      // Should get [0, 0, -1] (or close to it)
      assert(approx_equal_array(result, [0, 0, -1], 1e-9));
    });
  });
});
