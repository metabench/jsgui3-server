
const jsgui = require('jsgui3-client');
const {controls} = jsgui;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Shared math helpers
const M = require('./math'); // <- math.js in the same folder

// ----------------------------------------------------------------------------
// HexPentGlobeRenderer
// Renders a "soccer-ball" style Earth made of hexagons + 12 pentagons:
// 1) Build a geodesic sphere by subdividing an icosahedron (levels = 0..4 typical)
// 2) Project vertices to unit sphere
// 3) Build the dual mesh: one cell per original vertex; cell vertices are the
//    centers of faces incident to that vertex (sorted around the vertex).
// 4) Shade each cell with simple directional lighting.
// ----------------------------------------------------------------------------
class HexPentGlobeRenderer {
  constructor(canvas, opts = {}) {
    this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!(this.canvas instanceof HTMLCanvasElement)) throw new Error('Pass a canvas element or its id');
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    // -------- Options --------
    const visual = opts.visual || {};
    const stroke = visual.stroke || {};
    this.opts = {
      padding: opts.padding ?? 8,
      background: opts.background ?? '#081019',

      // Mesh detail: levels=0 gives raw icosahedron; each level doubles edge frequency (n = 2^levels).
      levels: Math.max(0, Math.min(5, opts.levels ?? 3)),

      // Lighting
      ambient: opts.ambient ?? 0.15,
      diffuse: opts.diffuse ?? 0.95,
      specular: opts.specular ?? 0.25,
      shininess: opts.shininess ?? 60,

      // Colors
      baseColor: opts.baseColor ?? [0.13, 0.42, 0.86], // linear-ish RGB 0..1
      pentagonTint: opts.pentagonTint ?? [0.08, 0.10, 0.14], // extra tint for 12 pentagons
      cellJitter: opts.cellJitter ?? 0.06, // subtle per-cell brightness randomization

      // Strokes
      visual: {
        fillAlpha: visual.fillAlpha ?? 1.0,
        strokeAlpha: visual.strokeAlpha ?? 0.22,
        strokeWidth: stroke.width ?? 0.8,
        strokeColor: stroke.color ?? '#FFFFFF'
      },

      // Interaction
      inertiaFriction: opts.inertiaFriction ?? 2.6,
  inertiaMinSpeed: opts.inertiaMinSpeed ?? 0.05,
  dragInvertX: opts.dragInvertX ?? false,
  dragInvertY: opts.dragInvertY ?? false,
  dragSwapAxes: opts.dragSwapAxes ?? false,
  dragSensitivity: opts.dragSensitivity ?? 1.0,

      dpr: window.devicePixelRatio || 1
    };

  // Sun (unit, camera frame)
  this.sun = M.vec3.norm([-0.45, 0.55, 0.65]);

  // Orientation (Arcball quaternion) and drag state
  this.Q = [0,0,0,1]; // [x,y,z,w]
  this._dragging = false;
  this._pickObj = null; // object-space unit vector of picked point
  this._updateR();

    // Build geodesic-dual mesh once
    this._buildCells();

    this._attachPointerHandlers();

    // Initial draw
    this.resize();
    this.render();

    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this._detachPointerHandlers();
    if (this._animHandle) cancelAnimationFrame(this._animHandle);
  }

  // -------- Public API --------
  setSunDirection(vec3) { this.sun = M.vec3.norm(vec3); this.render(); }
  setSunFromSpherical(lonDeg, latDeg) {
    const lon = M.deg2rad(lonDeg), lat = M.deg2rad(latDeg);
    const cx = Math.cos(lat), sx = Math.sin(lat), sz = Math.sin(lon), cz = Math.cos(lon);
    this.setSunDirection([ cx*sz, sx, cx*cz ]);
  }
  setRotation(yawDeg, pitchDeg) {
    // Preserve API: map yaw/pitch to quaternion for convenience
    const yaw = M.deg2rad(yawDeg), pitch = M.deg2rad(pitchDeg);
    const qy = M.quat.fromAxisAngle(0,1,0, yaw);
    const qx = M.quat.fromAxisAngle(1,0,0, pitch);
    this.Q = M.quat.normalize(M.quat.mul(qx, qy));
    this._updateR(); this.render();
  }

  resize() {
    const dpr = (this.opts.dpr = window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width || this.canvas.width;
    const displayHeight = rect.height || this.canvas.height;
    const w = Math.max(1, Math.round(displayWidth * dpr));
    const h = Math.max(1, Math.round(displayHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.scale(dpr, dpr);
  }

  // -------- Core rendering --------
  render() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.width / this.opts.dpr;
    const height = rect.height || this.canvas.height / this.opts.dpr;

    // Background
    ctx.clearRect(0, 0, width, height);
    if (this.opts.background) {
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = this.opts.padding;
    const r = Math.max(1, Math.min(width, height) / 2 - pad);
    const cx = width / 2, cy = height / 2;

    // Clip to disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();

    // Prepare transforms + lighting
    this._updateR();
    const R = this._R;
    const L = this.sun;

    // Rotate all face centers once per frame
    const C = this._faceCenters;             // [Nf][3]
    const Cr = this._rotCenters;             // rotated centers cached per frame
    const nF = C.length;
    for (let i = 0; i < nF; i++) {
      const c = C[i];
      Cr[i][0] = R[0]*c[0] + R[1]*c[1] + R[2]*c[2];
      Cr[i][1] = R[3]*c[0] + R[4]*c[1] + R[5]*c[2];
      Cr[i][2] = R[6]*c[0] + R[7]*c[1] + R[8]*c[2];
    }

    // For each cell (one per original vertex) draw polygon
    const cells = this._cells; // {v:[x,y,z], idxs:[faceIndices...], pent:boolean, jitter:number}
    const fillAlpha = this.opts.visual.fillAlpha;
    const strokeAlpha = this.opts.visual.strokeAlpha;
    const strokeColor = this.opts.visual.strokeColor;
    const strokeWidth = this.opts.visual.strokeWidth;

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.globalAlpha = 1;

    // Sort cells back-to-front by depth of cell center (painter's algorithm within clipped disk)
    // Using rotated vertex (cell center) depth
    const sortTmp = this._sorted;
    for (let i = 0; i < cells.length; i++) {
      const v = cells[i].v; // original unit vertex
      const vx = R[0]*v[0] + R[1]*v[1] + R[2]*v[2];
      const vy = R[3]*v[0] + R[4]*v[1] + R[5]*v[2];
      const vz = R[6]*v[0] + R[7]*v[1] + R[8]*v[2];
      sortTmp[i].z = vz;
      sortTmp[i].i = i;
      // Store rotated center for shading
      cells[i]._vr = [vx, vy, vz];
    }
    sortTmp.sort((a,b)=> b.z - a.z); // draw far to near would overdraw wrongly; we clip anyway.
    // We'll actually draw near-to-far so closer edges sit above. Use ascending z:
    sortTmp.reverse();

    for (let si = 0; si < sortTmp.length; si++) {
      const cidx = sortTmp[si].i;
      const cell = cells[cidx];
      const vr = cell._vr;

      // Cull back hemisphere by center
      if (vr[2] <= 0) continue;

      // Lighting for the whole cell (use cell normal ~ vr)
      const NL = Math.max(0, vr[0]*L[0] + vr[1]*L[1] + vr[2]*L[2]);
      const diff = this.opts.diffuse * NL;
      const amb = this.opts.ambient;
      const spec = this.opts.specular * Math.pow(Math.max(0, NL), this.opts.shininess/100); // subtle

      // Base color (+ pentagon tint + per-cell jitter)
      let rLin = this.opts.baseColor[0];
      let gLin = this.opts.baseColor[1];
      let bLin = this.opts.baseColor[2];

      if (cell.pent) {
        rLin += this.opts.pentagonTint[0];
        gLin += this.opts.pentagonTint[1];
        bLin += this.opts.pentagonTint[2];
      }

      const jit = cell.jitter;
      rLin = Math.max(0, rLin + jit); gLin = Math.max(0, gLin + jit); bLin = Math.max(0, bLin + jit);

      // Final lighting and simple tone map
      rLin = M.toneMap(rLin*(amb + diff) + spec);
      gLin = M.toneMap(gLin*(amb + diff) + spec);
      bLin = M.toneMap(bLin*(amb + diff) + spec);

      const Rsrgb = Math.round(M.toSRGB_linear(rLin)*255);
      const Gsrgb = Math.round(M.toSRGB_linear(gLin)*255);
      const Bsrgb = Math.round(M.toSRGB_linear(bLin)*255);

      // Fill color
      this.ctx.fillStyle = 'rgba(' + Rsrgb + ',' + Gsrgb + ',' + Bsrgb + ',' + fillAlpha + ')';
      this.ctx.globalAlpha = 1;

      // Build polygon path from rotated face-centers
      const poly = cell.idxs;
      this.ctx.beginPath();
      for (let k = 0; k < poly.length; k++) {
        const P = Cr[poly[k]];
        const x = cx + r * P[0];
        const y = cy - r * P[1];
        if (k === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();

      // Stroke (draw after fill)
      this.ctx.save();
      this.ctx.globalAlpha = strokeAlpha * (cell.pent ? 1.25 : 1.0);
      this.ctx.stroke();
      this.ctx.restore();
    }

    ctx.restore();

    // Subtle globe outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }

  // -------- Mesh generation (geodesic icosahedron → dual) --------
  _buildCells() {
    // 1) Icosahedron
    const ico = this._icosahedron();
    let V = ico.vertices;   // Array<[x,y,z]>
    let F = ico.faces;      // Array<[i,j,k]>

    // 2) Subdivide by levels (Loop-like midpoint; each iteration splits tri into 4)
    for (let l = 0; l < this.opts.levels; l++) {
      const nextFaces = [];
      const midCache = new Map(); // key "a,b" with a<b -> vertex index
      const getKey = (a,b)=> a<b ? (a+'_'+b) : (b+'_'+a);
      const midpoint = (a,b)=>{
        const key = getKey(a,b);
        if (midCache.has(key)) return midCache.get(key);
        const pa = V[a], pb = V[b];
        const m = M.vec3.norm([ (pa[0]+pb[0]), (pa[1]+pb[1]), (pa[2]+pb[2]) ]);
        const idx = V.push(m) - 1;
        midCache.set(key, idx);
        return idx;
      };
      for (let fi = 0; fi < F.length; fi++) {
        const a = F[fi][0], b = F[fi][1], c = F[fi][2];
        const ab = midpoint(a,b);
        const bc = midpoint(b,c);
        const ca = midpoint(c,a);
        nextFaces.push([a, ab, ca]);
        nextFaces.push([b, bc, ab]);
        nextFaces.push([c, ca, bc]);
        nextFaces.push([ab, bc, ca]);
      }
      F = nextFaces;
      // vertices already normalized via midpoint step; keep them on unit sphere
    }

    // Ensure exact normalization (avoid drift)
    for (let i = 0; i < V.length; i++) {
      V[i] = M.vec3.norm(V[i]);
    }

    // 3) Face centers (normalized)
    const faceCenters = new Array(F.length);
    for (let i = 0; i < F.length; i++) {
      const a = V[F[i][0]], b = V[F[i][1]], c = V[F[i][2]];
      const s = [ (a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3 ];
      faceCenters[i] = M.vec3.norm(s);
    }

    // 4) Build incident face list per vertex
    const inc = new Array(V.length);
    for (let i = 0; i < V.length; i++) inc[i] = [];
    for (let fi = 0; fi < F.length; fi++) {
      const tri = F[fi];
      inc[tri[0]].push(fi);
      inc[tri[1]].push(fi);
      inc[tri[2]].push(fi);
    }

    // 5) For each vertex, sort its incident face-centers around the vertex to form a polygon
    const cells = [];
    const rotCenters = new Array(faceCenters.length);
    for (let i = 0; i < faceCenters.length; i++) rotCenters[i] = [0,0,0];

    // local tangent basis per vertex for angle sort
    for (let vi = 0; vi < V.length; vi++) {
      const v = V[vi];
      const facesAround = inc[vi];

      // Build local basis (u,w) perp to v
      let ref = Math.abs(v[1]) < 0.9 ? [0,1,0] : [1,0,0];
      const u = M.vec3.norm(M.vec3.cross(ref, v));
      const w = M.vec3.cross(v, u); // already unit since u and v unit & perpendicular

      // compute angle of each incident face center around v
      const withAngles = new Array(facesAround.length);
      for (let k = 0; k < facesAround.length; k++) {
        const fc = faceCenters[facesAround[k]];
        // project onto tangent plane
        const dot_v = fc[0]*v[0] + fc[1]*v[1] + fc[2]*v[2];
        const t = [ fc[0] - dot_v*v[0], fc[1] - dot_v*v[1], fc[2] - dot_v*v[2] ];
        const x = t[0]*u[0] + t[1]*u[1] + t[2]*u[2];
        const y = t[0]*w[0] + t[1]*w[1] + t[2]*w[2];
        const ang = Math.atan2(y, x);
        withAngles[k] = { fi: facesAround[k], ang };
      }
      withAngles.sort((a,b)=> a.ang - b.ang);
      const idxs = withAngles.map(o => o.fi);

      // Identify pentagons (valence 5 at the 12 original icosahedron vertices)
      const isPent = idxs.length === 5;

      // Per-cell color jitter (consistent pseudo-random from index)
      const jitter = (hashInt(vi) * 2 - 1) * this.opts.cellJitter;

      cells.push({ v: v, idxs: idxs, pent: isPent, jitter: jitter, _vr: [0,0,0] });
    }

    // Sort helper buffer (reused each frame)
    const sorted = new Array(cells.length);
    for (let i = 0; i < sorted.length; i++) sorted[i] = { z: 0, i: 0 };

    this._verts = V;
    this._faces = F;
    this._faceCenters = faceCenters;
    this._rotCenters = rotCenters;
    this._cells = cells;
    this._sorted = sorted;
  }

  _icosahedron() {
    // Returns {vertices, faces} for a unit icosahedron (vertices normalized)
    const t = (1 + Math.sqrt(5)) / 2; // golden ratio
    const raw = [
      [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
      [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
      [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
    ];
    const vertices = raw.map(M.vec3.norm);
    const faces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];
    return { vertices, faces };
  }

  // -------- Rotation / math --------
  _updateR() {
    // Rotation matrix from quaternion
    this._R = M.mat3.fromQuat(this.Q);
  }

  // -------- Interaction --------
  _attachPointerHandlers() {
    const el = this.canvas;
    if (getComputedStyle(el).touchAction !== 'none') el.style.touchAction = 'none';

    const onDown = (ev)=>{
      const { cx, cy, r } = this._viewGeo();
      const v0 = M.screenToArcball(ev.clientX, ev.clientY, cx, cy, r);
      // Ignore presses far outside the disc
      if (v0[2] === 0) {
        const dx = (ev.clientX - cx) / r, dy = (cy - ev.clientY) / r;
        if (dx*dx + dy*dy > 1.5*1.5) return;
      }
      this._updateR();
      const R = this._R;
      // pickObj = R^T * v0 (row-major R)
      const px = R[0]*v0[0] + R[3]*v0[1] + R[6]*v0[2];
      const py = R[1]*v0[0] + R[4]*v0[1] + R[7]*v0[2];
      const pz = R[2]*v0[0] + R[5]*v0[1] + R[8]*v0[2];
      const invLen = 1/Math.max(1e-12, Math.hypot(px,py,pz));
      this._pickObj = [px*invLen, py*invLen, pz*invLen];
      this._dragging = true;
      try { el.setPointerCapture(ev.pointerId); } catch {}
    };
    const onMove = (ev)=>{
      if (!this._dragging) return;
  const { cx, cy, r } = this._viewGeo();
  const v1 = M.screenToArcball(ev.clientX, ev.clientY, cx, cy, r);
  if (!this._pickObj) return;
  this._updateR();
  const R = this._R;
  // current camera-space position of picked object point
  const cxp = R[0]*this._pickObj[0] + R[1]*this._pickObj[1] + R[2]*this._pickObj[2];
  const cyp = R[3]*this._pickObj[0] + R[4]*this._pickObj[1] + R[5]*this._pickObj[2];
  const czp = R[6]*this._pickObj[0] + R[7]*this._pickObj[1] + R[8]*this._pickObj[2];
  const clen = Math.max(1e-12, Math.hypot(cxp,cyp,czp));
  const c = [cxp/clen, cyp/clen, czp/clen];
      // Compute stable axis/angle for c -> v1
      let dot = c[0]*v1[0] + c[1]*v1[1] + c[2]*v1[2];
      dot = Math.max(-1, Math.min(1, dot));
      let angle = Math.acos(dot);
      let axis = [ c[1]*v1[2] - c[2]*v1[1], c[2]*v1[0] - c[0]*v1[2], c[0]*v1[1] - c[1]*v1[0] ];
      let an = Math.hypot(axis[0], axis[1], axis[2]);
      if (an < 1e-8) {
        // 0° or 180°: choose a stable axis orthogonal to c
        const ref = Math.abs(c[1]) < 0.9 ? [0,1,0] : [1,0,0];
        axis = [ c[1]*ref[2] - c[2]*ref[1], c[2]*ref[0] - c[0]*ref[2], c[0]*ref[1] - c[1]*ref[0] ];
        an = Math.hypot(axis[0], axis[1], axis[2]);
        if (an < 1e-8) axis = [0,1,0]; else { axis[0]/=an; axis[1]/=an; axis[2]/=an; }
      } else {
        axis[0]/=an; axis[1]/=an; axis[2]/=an;
      }

      // Clamp large steps to avoid overshoot on slow frames
      const MAX_STEP_ANGLE = 0.35; // ~20° per event
      if (angle > MAX_STEP_ANGLE) angle = MAX_STEP_ANGLE;

      if (angle < 1e-6) { return; }
      const dq = M.quat.fromAxisAngle(axis[0], axis[1], axis[2], angle);
      const qNew = M.quat.norm(M.quat.mul(dq, this.Q));
  this.Q = [qNew[0], qNew[1], qNew[2], qNew[3]];
  this._updateR();
  this.render();
    };
    const onUp = (ev)=>{
      this._dragging = false;
      try { el.releasePointerCapture(ev.pointerId); } catch {}
  this._pickObj = null;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    this._ptr = { onDown, onMove, onUp };
  }
  _detachPointerHandlers(){
    if (!this._ptr) return;
    const el = this.canvas;
    el.removeEventListener('pointerdown', this._ptr.onDown);
    el.removeEventListener('pointermove', this._ptr.onMove);
    el.removeEventListener('pointerup', this._ptr.onUp);
    el.removeEventListener('pointercancel', this._ptr.onUp);
    this._ptr = null;
  }
  // no inertia with arcball; rotation is directly under the cursor

  _viewGeo() {
    // center (in client px), radius in client px
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const r = Math.max(1, Math.min(rect.width, rect.height)/2 - (this.opts.padding||0));
    return { cx, cy, r };
  }

  // (no arcball helpers needed for yaw/pitch)
}

// Simple integer hash → [0,1)
function hashInt(i){
  // xorshift-ish; stable across runs for visual jitter
  let x = (i>>>0) + 0x9e3779b9;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x>>>0) % 1000) / 1000;
}

// ----------------------------------------------------------------------------
// Demo UI wiring (kept minimal; same structure you used previously)
// ----------------------------------------------------------------------------
class Demo_UI extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = spec.__type_name || 'demo_ui';
    super(spec);
    const {context} = this;
    if (typeof this.body.add_class === 'function') this.body.add_class('demo-ui');

    const compose = () => {
      const windowCtrl = new controls.Window({
        context,
        title: 'Hex/Pent Globe',
        pos: [5, 5]
      });
      windowCtrl.size = [1000, 1000];

      const canvas = new controls.Canvas({ context });
      canvas.dom.attributes.id = 'globeCanvas';
      canvas.size = [900, 900];

      windowCtrl.inner.add(canvas);
      this.body.add(windowCtrl);

      this._ctrl_fields = this._ctrl_fields || {};
      this._ctrl_fields.canvas = this.canvas = canvas;
    };

    if (!spec.el) compose();
  }

  activate() {
    if (!this.__active) {
      super.activate();
      const {context} = this;
      console.log('activate Demo_UI');

      const globe = new HexPentGlobeRenderer('globeCanvas', {
        background: '#081019',
        // Increase polygons: each level ~x4 cells; 5 -> ~10242 cells (~16x from 3)
        levels: 4,
        ambient: 0.18,
        diffuse: 0.95,
        specular: 0.22,
        shininess: 70,
        visual: {
          fillAlpha: 1.0,
          strokeAlpha: 0.22,
          stroke: { width: 0.8, color: '#FFFFFF' }
        }
      });

      globe.setSunFromSpherical(-35, 25);

      context.on('window-resize', () => {
        globe.resize();
        globe.render();
      });
    }
  }
}
Demo_UI.css = `
*{margin:0;padding:0}
body{overflow-x:hidden;overflow-y:hidden;background-color:#E0E0E0}
.demo-ui{}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
