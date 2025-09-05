'use strict';

// Quaternion and matrix helpers for the globe renderer

function qIdentity() { return [0, 0, 0, 1]; } // [x,y,z,w]

function qNormalize(q) {
  let x = q[0], y = q[1], z = q[2], w = q[3];
  let n = Math.hypot(x, y, z, w) || 1;
  q[0] = x / n; q[1] = y / n; q[2] = z / n; q[3] = w / n;
  return q;
}

function qMul(a, b) {
  // a*b
  return [
    a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
    a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
    a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
    a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
  ];
}

function qFromAxisAngle(ax, ay, az, angle) {
  let n = Math.hypot(ax, ay, az) || 1;
  let s = Math.sin(angle * 0.5) / n;
  return [ax * s, ay * s, az * s, Math.cos(angle * 0.5)];
}

function qFromVectors(u, v) {
  // Returns rotation taking u -> v (both unit); robust for small angles
  let dot = u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
  if (dot >= 1.0 - 1e-10) return [0,0,0,1];
  if (dot <= -1.0 + 1e-10) {
    // 180°: pick any orthogonal axis
    let ax = Math.abs(u[0]) < 0.9 ? 1 : 0;
    let ay = Math.abs(u[1]) < 0.9 ? 1 : 0;
    let az = Math.abs(u[2]) < 0.9 ? 1 : 0;
    // cross(u, axis)
    let cx = u[1]*az - u[2]*ay;
    let cy = u[2]*ax - u[0]*az;
    let cz = u[0]*ay - u[1]*ax;
    return qNormalize([cx, cy, cz, 0]);
  }
  let cx = u[1]*v[2] - u[2]*v[1];
  let cy = u[2]*v[0] - u[0]*v[2];
  let cz = u[0]*v[1] - u[1]*v[0];
  let w = 1 + dot;
  return qNormalize([cx, cy, cz, w]);
}

function mat3FromQuat(q) {
  // 3x3 rotation matrix (column-major in array)
  let x=q[0], y=q[1], z=q[2], w=q[3];
  let x2=x+x, y2=y+y, z2=z+z;
  let xx=x*x2, yy=y*y2, zz=z*z2;
  let xy=x*y2, xz=x*z2, yz=y*z2;
  let wx=w*x2, wy=w*y2, wz=w*z2;
  return [
    1 - (yy + zz),  xy + wz,        xz - wy,
    xy - wz,        1 - (xx + zz),  yz + wx,
    xz + wy,        yz - wx,        1 - (xx + yy)
  ];
}

function mat3Transpose(m) { return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]]; }

module.exports = {
  qIdentity,
  qNormalize,
  qMul,
  qFromAxisAngle,
  qFromVectors,
  mat3FromQuat,
  mat3Transpose
};
