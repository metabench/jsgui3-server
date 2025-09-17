// PlaneClipStrategy: spherical clipping of a polygon against the visible hemisphere (z >= 0)
// Produces clipped fill triangles and a stroke polyline in rotated (view) space.

// Helper math
function norm3(x, y, z) {
  const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l];
}
function slerp(A, B, t) {
  const [ax, ay, az] = norm3(A[0], A[1], A[2]);
  const [bx, by, bz] = norm3(B[0], B[1], B[2]);
  let dot = ax * bx + ay * by + az * bz; dot = Math.max(-1, Math.min(1, dot));
  const th = Math.acos(dot);
  if (th === 0) return [ax, ay, az];
  const s = Math.sin(th), s1 = Math.sin((1 - t) * th) / s, s2 = Math.sin(t * th) / s;
  return [ax * s1 + bx * s2, ay * s1 + by * s2, az * s1 + bz * s2];
}
// Sample a great-circle arc between A and B with optional horizon-aware refinement
function sampleGreatCircle(A, B, stepRad = 0.03, refineFn) {
  const [ax, ay, az] = norm3(A[0],A[1],A[2]), [bx, by, bz] = norm3(B[0],B[1],B[2]);
  let dot = ax*bx + ay*by + az*bz; dot = Math.max(-1, Math.min(1, dot));
  const th = Math.acos(dot);
  if (th === 0) return [[ax, ay, az]];
  const n = Math.max(1, Math.ceil(th / stepRad));
  const out = [];
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = slerp([ax,ay,az],[bx,by,bz], t);
    if (refineFn && prev) {
      const toAdd = refineFn(prev, p);
      if (toAdd && toAdd.length) out.push(...toAdd);
    }
    out.push(p);
    prev = p;
  }
  return out;
}
function intersectHorizon(A, B) {
  const fz = (t) => slerp(A, B, t)[2];
  let t0 = 0, t1 = 1, z0 = fz(t0), z1 = fz(t1);
  if (z0 === 0) return slerp(A, B, 0);
  if (z1 === 0) return slerp(A, B, 1);
  if ((z0 > 0) === (z1 > 0)) return null;
  for (let i = 0; i < 30; i++) {
    const tm = 0.5 * (t0 + t1), zm = fz(tm);
    if (Math.abs(zm) < 1e-8) return norm3(...slerp(A, B, tm));
    if ((z0 > 0) === (zm > 0)) { t0 = tm; z0 = zm; } else { t1 = tm; z1 = zm; }
  }
  return norm3(...slerp(A, B, 0.5 * (t0 + t1)));
}

function clipPolygonHemisphere_SH(poly3) {
  if (!poly3 || poly3.length < 3) return [];
  const isInside = (p) => p[2] >= 0;
  const out = [];
  for (let i = 0; i < poly3.length; i++) {
    const A = poly3[i];
    const B = poly3[(i + 1) % poly3.length];
    const Ain = isInside(A), Bin = isInside(B);
    if (Ain && Bin) {
      out.push(B);
    } else if (Ain && !Bin) {
      const X = intersectHorizon(A, B); if (X) out.push(X);
    } else if (!Ain && Bin) {
      const X = intersectHorizon(A, B); if (X) out.push(X);
      out.push(B);
    }
  }
  return out;
}

// Tesselate polygon into small spherical triangles and cull to hemisphere
function tessellateClipHemisphere(poly3, opts = {}) {
  const stepRad = opts.stepRad || 0.05; // densify edges before triangulation
  const maxDepth = opts.maxDepth || 6;
  const horizonRefine = opts.horizonRefine || { enabled: true, zThresh: 0.15, midSubdiv: 1 };
  if (!poly3 || poly3.length < 3) return [];

  // Densify the ring to improve initial triangulation
  const dense = [];
  const refineFn = horizonRefine && horizonRefine.enabled ? (P, Q) => {
    const zP = P[2], zQ = Q[2];
    if (Math.abs(zP) < horizonRefine.zThresh || Math.abs(zQ) < horizonRefine.zThresh || (zP > 0) !== (zQ > 0)) {
      const mids = [];
      for (let k = 1; k <= horizonRefine.midSubdiv; k++) {
        const t = k / (horizonRefine.midSubdiv + 1);
        mids.push(norm3(...slerp(P, Q, t)));
      }
      return mids;
    }
    return null;
  } : null;

  for (let i = 0; i < poly3.length; i++) {
    const A = poly3[i], B = poly3[(i + 1) % poly3.length];
    const seg = sampleGreatCircle(A, B, stepRad, refineFn);
    if (i > 0 && dense.length) seg.shift(); // avoid duplicates between consecutive segments
    dense.push(...seg);
  }
  if (dense.length && (dense[0] !== dense[dense.length - 1])) dense.push(dense[0]);

  // Build a fan from a stable anchor (first vertex) to avoid degenerate centroid artifacts
  const anchor = dense[0];
  const tris = [];
  for (let i = 1; i < dense.length - 1; i++) {
    const A = dense[i], B = dense[i + 1];
    tris.push([anchor, A, B]);
  }

  const result = [];
  const allSign = (tri) => tri.every(p => p[2] >= 0) ? 1 : (tri.every(p => p[2] < 0) ? -1 : 0);

  const subdivide = (tri, depth) => {
    const sign = allSign(tri);
    if (sign === 1) { result.push(tri); return; }
    if (sign === -1) { return; }
    if (depth >= maxDepth) {
      const clipped = clipPolygonHemisphere_SH(tri);
      if (clipped.length >= 3) {
        for (let i = 1; i < clipped.length - 1; i++) {
          result.push([clipped[0], clipped[i], clipped[i+1]]);
        }
      }
      return;
    }
    const [A, B, C] = tri;
    const AB = norm3(...slerp(A, B, 0.5));
    const BC = norm3(...slerp(B, C, 0.5));
    const CA = norm3(...slerp(C, A, 0.5));
    subdivide([A, AB, CA], depth + 1);
    subdivide([AB, B, BC], depth + 1);
    subdivide([CA, BC, C], depth + 1);
    subdivide([AB, BC, CA], depth + 1);
  };

  for (const t of tris) subdivide(t, 0);
  return result; // array of triangles (arrays of 3 pts)
}

// Simple 2D ear clipping on XY projection (for polygons entirely within hemisphere)
function triangulateXY(poly) {
  const n = poly.length; if (n < 3) return [];
  const px = new Array(n), py = new Array(n);
  for (let i = 0; i < n; i++) { px[i] = poly[i][0]; py[i] = poly[i][1]; }
  const V = []; for (let i = 0; i < n; i++) V.push(i);
  function area() { let a = 0; for (let i = 0; i < V.length; i++) { const i0 = V[i], i1 = V[(i + 1) % V.length]; a += px[i0] * py[i1] - px[i1] * py[i0]; } return a * 0.5; }
  const orientCW = area() < 0;
  function isConvex(a, b, c) { const ax = px[a], ay = py[a], bx = px[b], by = py[b], cx = px[c], cy = py[c]; const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); return orientCW ? cross < 0 : cross > 0; }
  function inTri(a, b, c, p) { const x = px[p], y = py[p]; const ax = px[a], ay = py[a], bx = px[b], by = py[b], cx = px[c], cy = py[c]; const v0x = cx - ax, v0y = cy - ay, v1x = bx - ax, v1y = by - ay, v2x = x - ax, v2y = y - ay; const den = v0x * v1y - v1x * v0y; if (Math.abs(den) < 1e-12) return false; const inv = 1 / den; const A = (v2x * v1y - v1x * v2y) * inv; const B = (v0x * v2y - v2x * v0y) * inv; const C = 1 - A - B; return A > 0 && B > 0 && C > 0; }
  const out = [];
  let guard = 0;
  while (V.length > 3 && guard < 10000) {
    let ear = false;
    for (let i = 0; i < V.length; i++) {
      const iPrev = V[(i + V.length - 1) % V.length], iCurr = V[i], iNext = V[(i + 1) % V.length];
      if (!isConvex(iPrev, iCurr, iNext)) continue;
      let inside = false;
      for (let k = 0; k < V.length; k++) { const idx = V[k]; if (idx === iPrev || idx === iCurr || idx === iNext) continue; if (inTri(iPrev, iCurr, iNext, idx)) { inside = true; break; } }
      if (inside) continue;
      out.push(iPrev, iCurr, iNext);
      V.splice(i, 1);
      ear = true;
      break;
    }
    if (!ear) break; guard++;
  }
  if (V.length === 3) out.push(V[0], V[1], V[2]);
  return out; // indices into poly
}

// Remove duplicate consecutive vertices and nearly collinear points (XY plane)
function cleanRingXY(pts, eps = 1e-10) {
  if (!pts || pts.length < 3) return pts || [];
  const out = [];
  // remove consecutive duplicates
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!out.length) { out.push(p); continue; }
    const q = out[out.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) > eps) out.push(p);
  }
  // if first equals last, drop last
  if (out.length >= 2) {
    const a = out[0], b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= eps) out.pop();
  }
  if (out.length < 3) return out;
  // remove collinear points by checking cross product with previous anchor
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const A = out[(i + out.length - 1) % out.length];
    const B = out[i];
    const C = out[(i + 1) % out.length];
    const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    if (Math.abs(cross) > eps) res.push(B);
  }
  return res;
}

function process(renderer, continent, R) {
  const poly = continent.polyXYZ; if (!poly || poly.length < 9) { continent._clipFillTris = null; continent._clipStrokeXY = null; continent._visTrisLen = 0; return; }
  // Rotate vertices to view space
  if (!continent._rotated || continent._rotated.length !== poly.length) continent._rotated = new Float32Array(poly.length);
  const rot = continent._rotated;
  const R00 = R[0], R01 = R[3], R02 = R[6]; const R10 = R[1], R11 = R[4], R12 = R[7]; const R20 = R[2], R21 = R[5], R22 = R[8];
  for (let i = 0; i < poly.length; i += 3) { const x = poly[i], y = poly[i + 1], z = poly[i + 2]; rot[i] = R00 * x + R01 * y + R02 * z; rot[i + 1] = R10 * x + R11 * y + R12 * z; rot[i + 2] = R20 * x + R21 * y + R22 * z; }

  // Build polygon in rotated space
  const n = poly.length / 3; const ring = new Array(n);
  for (let i = 0; i < n; i++) { const k = i * 3; ring[i] = [rot[k], rot[k + 1], rot[k + 2]]; }

    // Detect if entire polygon is strictly in front (including along edges)
    const isAllFront = (() => {
      const step = 0.15; // coarse check
      for (let i = 0, n = ring.length; i < n; i++) {
        const A = ring[i], B = ring[(i + 1) % n];
        const seg = sampleGreatCircle(A, B, step);
        for (const p of seg) if (p[2] < 0) return false;
      }
      return true;
    })();

    if (isAllFront) {
      // Fast path: ear-clip the original ring in XY
      const stepRad = 0.05;
      const dense = [];
      for (let i = 0; i < ring.length; i++) {
        const A = ring[i], B = ring[(i + 1) % ring.length];
        const seg = sampleGreatCircle(A, B, stepRad);
        if (i > 0 && dense.length) seg.shift();
        dense.push(...seg);
      }
      let poly2 = cleanRingXY(dense.map(p => [p[0], p[1], p[2]]), 1e-12);
      // Provide a clean fill path to avoid AA seams
      continent._clipFillPathXY = new Float32Array(poly2.length * 2);
      for (let i = 0, j = 0; i < poly2.length; i++) { continent._clipFillPathXY[j++] = poly2[i][0]; continent._clipFillPathXY[j++] = poly2[i][1]; }
      const triIdx = triangulateXY(poly2);
      if (triIdx && triIdx.length >= 3 && (triIdx.length % 3) === 0) {
        if (!continent._clipFillTris || continent._clipFillTris.length !== triIdx.length * 2) continent._clipFillTris = new Float32Array(triIdx.length * 2);
        let w = 0; for (let i = 0; i < triIdx.length; i++) { const p = poly2[triIdx[i]]; continent._clipFillTris[w++] = p[0]; continent._clipFillTris[w++] = p[1]; }
        continent._clipFillTrisLen = triIdx.length;
      } else {
        continent._clipFillTris = null; continent._clipFillTrisLen = 0;
      }
      // Single stroke run around full boundary
      const run = new Float32Array(dense.length * 2);
      for (let i = 0, j = 0; i < dense.length; i++) { run[j++] = dense[i][0]; run[j++] = dense[i][1]; }
      continent._clipStrokeRuns = [run];
      continent._visTrisLen = 0;
      return;
    }

    // Partial visibility: clip to hemisphere and ear-clip the resulting polygon in XY
    let clipped = clipPolygonHemisphere_SH(ring);
    if (!clipped || clipped.length < 3) { continent._clipFillTris = null; continent._clipStrokeRuns = []; continent._visTrisLen = 0; return; }
    const stepRadFill = 0.025;
    const dens = [];
    for (let i = 0; i < clipped.length; i++) {
      const A = clipped[i], B = clipped[(i + 1) % clipped.length];
      const seg = sampleGreatCircle(A, B, stepRadFill, (P, Q) => {
        const zP = P[2], zQ = Q[2];
        if ((zP >= 0 && zQ >= 0) && (Math.abs(zP) < 0.12 || Math.abs(zQ) < 0.12)) {
          // bias sampling toward the horizon for visible edges
          return [norm3(...slerp(P, Q, 0.33)), norm3(...slerp(P, Q, 0.66))];
        }
        if ((zP > 0) !== (zQ > 0)) {
          // crossing: ensure mid sample for stability
          return [norm3(...slerp(P, Q, 0.5))];
        }
        return null;
      });
      if (i > 0 && dens.length) seg.shift();
      dens.push(...seg);
    }
    let poly2 = cleanRingXY(dens.map(p => [p[0], p[1], p[2]]), 1e-12);
    // Provide a clean fill path for partial visibility as well
    continent._clipFillPathXY = new Float32Array(poly2.length * 2);
    for (let i = 0, j = 0; i < poly2.length; i++) { continent._clipFillPathXY[j++] = poly2[i][0]; continent._clipFillPathXY[j++] = poly2[i][1]; }
    let triIdx = triangulateXY(poly2);
    if (!triIdx || triIdx.length < 3 || (triIdx.length % 3) !== 0) {
      // Final fallback: spherical tessellation
      const smallTris = tessellateClipHemisphere(ring, { stepRad: 0.03, maxDepth: 6, horizonRefine: { enabled: true, zThresh: 0.1, midSubdiv: 1 } });
      if (!smallTris || !smallTris.length) { continent._clipFillTris = null; continent._clipStrokeRuns = []; continent._visTrisLen = 0; }
      else {
        const idxCount = smallTris.length * 3;
        const floats = idxCount * 2;
        if (!continent._clipFillTris || continent._clipFillTris.length !== floats) continent._clipFillTris = new Float32Array(floats);
        let w = 0; for (const tri of smallTris) { for (let k = 0; k < 3; k++) { const p = tri[k]; continent._clipFillTris[w++] = p[0]; continent._clipFillTris[w++] = p[1]; } }
        continent._clipFillTrisLen = idxCount;
      }
    } else {
      if (!continent._clipFillTris || continent._clipFillTris.length !== triIdx.length * 2) continent._clipFillTris = new Float32Array(triIdx.length * 2);
      let w = 0; for (let i = 0; i < triIdx.length; i++) { const p = poly2[triIdx[i]]; continent._clipFillTris[w++] = p[0]; continent._clipFillTris[w++] = p[1]; }
      continent._clipFillTrisLen = triIdx.length;
    }

    // Build visible coastline stroke runs
    const runs = [];
    let curr = [];
    const pushXY = (pt) => {
      const x = pt[0], y = pt[1];
      const L = curr.length;
      if (L >= 2) { const dx = x - curr[L-2], dy = y - curr[L-1]; if (dx*dx + dy*dy < 1e-12) return; }
      curr.push(x, y);
    };
    for (let i = 0, n = ring.length; i < n; i++) {
      const A = ring[i], B = ring[(i + 1) % n];
      const Ain = A[2] >= 0, Bin = B[2] >= 0;
      if (Ain && Bin) {
        const seg = sampleGreatCircle(A, B, stepRadFill);
        if (!curr.length && seg.length) pushXY(seg[0]);
        for (let s = 1; s < seg.length; s++) pushXY(seg[s]);
      } else if (Ain && !Bin) {
        const X = intersectHorizon(A, B); if (X) {
          const seg = sampleGreatCircle(A, X, stepRadFill);
          if (!curr.length && seg.length) pushXY(seg[0]);
          for (let s = 1; s < seg.length; s++) pushXY(seg[s]);
        }
        if (curr.length >= 4) runs.push(new Float32Array(curr));
        curr = [];
      } else if (!Ain && Bin) {
        const X = intersectHorizon(A, B); if (X) {
          const seg = sampleGreatCircle(X, B, stepRadFill);
          curr = [];
          if (seg.length) { pushXY(seg[0]); for (let s = 1; s < seg.length; s++) pushXY(seg[s]); }
        }
      } else {
        if (curr.length >= 4) runs.push(new Float32Array(curr));
        curr = [];
      }
    }
    if (curr.length >= 4) runs.push(new Float32Array(curr));
    continent._clipStrokeRuns = runs;

  // Disable legacy front-face fill for this continent (handled via _clipFillTris)
  continent._visTrisLen = 0;
}

module.exports = { process, name: 'planeClip' };
