'use strict';

// Math helpers for the polyglobe renderer (API expected by client.js)

// ------------- Scalars -------------
function deg2rad(deg) { return deg * Math.PI / 180; }
function toneMap(c) { return 1 - Math.exp(-2.6 * c); } // simple filmic-ish curve
function toSRGB_linear(lin) {
  const x = lin < 0 ? 0 : lin > 1 ? 1 : lin;
  return Math.pow(x, 1/2.2);
}

// ------------- vec3 -------------
const vec3 = {
  norm(v) {
    const x=v[0], y=v[1], z=v[2];
    const n = Math.hypot(x, y, z);
    if (!n) return [0,0,0];
    const inv = 1/n;
    return [x*inv, y*inv, z*inv];
  },
  cross(a, b) {
    return [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ];
  },
  dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; },
  add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; },
  sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; },
  scale(a, s) { return [a[0]*s, a[1]*s, a[2]*s]; }
};

// ------------- mat3 -------------
const mat3 = {
  // Row-major 3x3; R = Rx(pitch) * Ry(yaw)
  fromYawPitch(yaw, pitch) {
    const cy = Math.cos(yaw),  sy = Math.sin(yaw);
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    // Ry(yaw)
    // [ cy 0 sy; 0 1 0; -sy 0 cy ]
    // Rx(pitch)
    // [1 0 0; 0 cx -sx; 0 sx cx]
    // R = Rx * Ry (row-major):
    return [
      // row 0
      1*cy + 0*0 + 0*(-sy),  1*0 + 0*1 + 0*0,           1*sy + 0*0 + 0*cy,
      // row 1
      0*cy + cx*0 + (-sx)*(-sy),  0*0 + cx*1 + (-sx)*0,  0*sy + cx*0 + (-sx)*cy,
      // row 2
      0*cy + sx*0 + cx*(-sy),  0*0 + sx*1 + cx*0,       0*sy + sx*0 + cx*cy
    ];
  }
};

// ------------- quaternion -------------
const quat = {
  identity() { return [0,0,0,1]; }, // [x,y,z,w]
  normalize(q) {
    const x=q[0], y=q[1], z=q[2], w=q[3];
    const n = Math.hypot(x,y,z,w) || 1;
    q[0]=x/n; q[1]=y/n; q[2]=z/n; q[3]=w/n; return q;
  },
  // Non-mutating normalize (returns a new array)
  norm(q) {
    const x=q[0], y=q[1], z=q[2], w=q[3];
    const n = Math.hypot(x,y,z,w) || 1;
    return [x/n, y/n, z/n, w/n];
  },
  mul(a,b) { // a*b
    return [
      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
    ];
  },
  fromAxisAngle(ax, ay, az, angle) {
    const n = Math.hypot(ax,ay,az) || 1; const s = Math.sin(0.5*angle)/n;
    return [ax*s, ay*s, az*s, Math.cos(0.5*angle)];
  },
  fromVectors(u,v) {
    const dot = u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
    if (dot >= 1.0 - 1e-10) return [0,0,0,1];
    if (dot <= -1.0 + 1e-10) {
      let ax = Math.abs(u[0]) < 0.9 ? 1 : 0;
      let ay = Math.abs(u[1]) < 0.9 ? 1 : 0;
      let az = Math.abs(u[2]) < 0.9 ? 1 : 0;
      const cx = u[1]*az - u[2]*ay;
      const cy = u[2]*ax - u[0]*az;
      const cz = u[0]*ay - u[1]*ax;
      return quat.normalize([cx, cy, cz, 0]);
    }
    const cx = u[1]*v[2] - u[2]*v[1];
    const cy = u[2]*v[0] - u[0]*v[2];
    const cz = u[0]*v[1] - u[1]*v[0];
    const w = 1 + dot; return quat.normalize([cx, cy, cz, w]);
  }
};

// Also provide rotation matrix from quat (row-major)
mat3.fromQuat = function(q){
  const x=q[0], y=q[1], z=q[2], w=q[3];
  const x2=x+x, y2=y+y, z2=z+z;
  const xx=x*x2, yy=y*y2, zz=z*z2;
  const xy=x*y2, xz=x*z2, yz=y*z2;
  const wx=w*x2, wy=w*y2, wz=w*z2;
  return [
    1 - (yy + zz),  xy + wz,        xz - wy,
    xy - wz,        1 - (xx + zz),  yz + wx,
    xz + wy,        yz - wx,        1 - (xx + yy)
  ];
};

// Convenience: quat.toMat3 alias
quat.toMat3 = function(q){ return mat3.fromQuat(q); };

// Arcball mapping helper
function screenToArcball(px, py, cx, cy, r){
  const x = (px - cx) / r;
  const y = (cy - py) / r;
  const d2 = x*x + y*y;
  if (d2 <= 1) return [x, y, Math.sqrt(1 - d2)];
  const inv = 1 / Math.sqrt(d2);
  return [x*inv, y*inv, 0];
}

module.exports = {
  vec3,
  mat3,
  quat,
  deg2rad,
  toneMap,
  toSRGB_linear,
  screenToArcball
};
