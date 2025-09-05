const { qIdentity, qNormalize, qMul, qFromAxisAngle, qFromVectors, mat3FromQuat, mat3Transpose } = require('./math');

// ------------------ Continent outlines (approximate) ------------------
// NOTE: These are intentionally low-resolution, hand-crafted / simplified polygons for demo use.
// They are NOT accurate cartography. Additional continents / islands can be added following the same pattern.
const CONTINENT_OUTLINES = {
  Antarctica: {
    outline: [
      [-70.0, 0.0], [-70.5, 7.5], [-70.3, 15.0], [-70.0, 22.5], [-69.5, 30.0],
      [-69.0, 37.5], [-68.5, 45.0], [-68.0, 52.5], [-67.5, 60.0], [-67.2, 67.5],
      [-66.8, 75.0], [-66.5, 82.5], [-66.3, 90.0], [-66.2, 100.0], [-66.5, 110.0],
      [-66.8, 120.0], [-67.0, 130.0], [-67.5, 140.0], [-68.5, 150.0], [-70.0, 160.0],
      [-73.0, 170.0], [-75.5, 178.0], [-77.5, -175.0], [-78.5, -170.0], [-79.0, -160.0],
      [-78.8, -150.0], [-77.5, -140.0], [-76.5, -130.0], [-75.5, -120.0], [-74.5, -110.0],
      [-73.5, -100.0], [-72.5, -90.0], [-71.8, -80.0], [-70.5, -72.0], [-68.8, -68.0],
      [-66.5, -66.0], [-64.5, -64.0], [-63.0, -60.0], [-64.5, -58.0], [-66.5, -55.0],
      [-70.0, -50.0], [-73.0, -45.0], [-76.0, -42.0], [-78.0, -40.0], [-79.0, -35.0],
      [-78.5, -25.0], [-76.5, -15.0], [-73.5, -7.5], [-71.0, -2.5], [-70.0, 0.0]
    ],
    densifyStep: 1.0,
    // Styles overridable via existing antarctica* options for backward compat.
    fill: null,
    stroke: null,
    lineWidth: null
  },
  Africa: {
    // Very rough coastal outline (no Madagascar / large islands). Clockwise from NW Morocco.
    outline: [
      [37.0, -9.0], [35.0, -1.0], [32.0, 4.0], [30.0, 10.0], [28.0, 19.0], [24.0, 25.0],
      [20.0, 32.0], [15.0, 39.0], [12.0, 44.0], [10.0, 50.0], [8.0, 49.0], [5.0, 45.0],
      [2.0, 43.0], [0.0, 41.0], [-2.0, 40.0], [-5.0, 39.0], [-8.0, 39.0], [-12.0, 38.0],
      [-15.0, 35.0], [-18.0, 32.0], [-22.0, 30.0], [-25.0, 28.0], [-28.0, 25.0], [-32.0, 20.0],
      [-34.0, 18.0], [-34.0, 15.0], [-30.0, 10.0], [-25.0, 8.0], [-20.0, 6.0], [-15.0, 4.0],
      [-10.0, 0.0], [-5.0, -5.0], [0.0, -8.0], [5.0, -10.0], [10.0, -14.0], [12.0, -16.0],
      [15.0, -17.0], [18.0, -17.0], [22.0, -16.0], [25.0, -15.0], [28.0, -14.0], [31.0, -12.0],
      [33.0, -10.0], [35.0, -9.0], [37.0, -9.0]
    ],
    densifyStep: 0.8,
    fill: 'rgba(16,70,16,0.85)', // dark green fill
    stroke: 'rgba(8,40,8,0.9)',
    lineWidth: 1.0
  }
};

// Helper to build a densified polyline (lat/lon pairs) as a Float32Array once.
function buildDensifiedPolylineLL(outline, stepDeg = 1.2) {
  const pts = [];
  const n = outline.length;
  // Ensure closed by iterating including last->first
  for (let i=0;i<n;i++) {
    const a = outline[i];
    const b = outline[(i+1)%n];
    let latA=a[0], lonA=a[1], latB=b[0], lonB=b[1];
    let dLon = lonB - lonA;
    if (dLon > 180) dLon -= 360; else if (dLon < -180) dLon += 360;
    let dLat = latB - latA;
    const dist = Math.hypot(dLat, dLon);
    const steps = Math.max(1, Math.ceil(dist / stepDeg));
    const invSteps = 1/steps;
    for (let s=0;s<steps;s++) { // exclude final point; next segment adds it
      const t = s*invSteps;
      pts.push(latA + dLat*t, lonA + dLon*t);
    }
  }
  // Add final first point explicitly to close
  pts.push(outline[0][0], outline[0][1]);
  return new Float32Array(pts);
}

// ------------------ Renderer ------------------
class EarthGlobeRenderer {
  constructor(canvasOrId, options = {}) {
    let cid = canvasOrId || 'globeCanvas';
    let el = typeof cid === 'string' ? document.getElementById(cid) : cid;
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Canvas 'globeCanvas' not found.");
    this.canvas = el;
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    // ---------- Options / state ----------
    this.opts = {
      padding: options.padding ?? 8,
      background: options.background ?? null,
      // Lighting/material
      baseColor: options.baseColor ?? [0.13, 0.42, 0.86], // linear-ish RGB 0..1
      ambient: options.ambient ?? 0.08,
      diffuse: options.diffuse ?? 1.0,
      specular: options.specular ?? 0.75,
      shininess: options.shininess ?? 140.0,
      terminatorSoftness: options.terminatorSoftness ?? 0.08,
      atmosphere: options.atmosphere ?? 0.5,
      backlight: options.backlight ?? 0.25,
      // Quality
  quality: Math.min(2, Math.max(0.5, options.quality ?? 1.15)),
  interactiveQualityScale: options.interactiveQualityScale ?? 0.6, // resolution scale while dragging/inertia
  showFPS: options.showFPS ?? true,
  // Note: We previously skipped overlays during interaction for perf (they vanished while dragging).
  // If you want that optimization back, add a flag here and gate _drawOverlays.
      // Grid
      grid: {
        enabled: options.grid?.enabled ?? false,
        color: options.grid?.color ?? '#444',
        lineWidth: options.grid?.lineWidth ?? 0.8,
        alpha: options.grid?.alpha ?? 0.7,
        stepLat: options.grid?.stepLat ?? 10,
        stepLon: options.grid?.stepLon ?? 10,
        sampleStepDeg: options.grid?.sampleStepDeg ?? 2
      },
      // Antarctica styling
      antarcticaFill: options.antarcticaFill ?? 'rgba(220,240,255,0.85)',
      antarcticaStroke: options.antarcticaStroke ?? 'rgba(180,200,220,0.9)',
      antarcticaLineWidth: options.antarcticaLineWidth ?? 1.0,
      // Inertia
      inertiaFriction: options.inertiaFriction ?? 2.6, // higher = stops sooner
      inertiaMinSpeed: options.inertiaMinSpeed ?? 0.05, // rad/s cutoff
      dpr: window.devicePixelRatio || 1
    };

    // Sun direction (camera frame)
    this.sun = this._normVec([-0.45, 0.55, 0.65]);

    // Orientation (arcball) quaternion
    this.q = qIdentity();
    this.R = mat3FromQuat(this.q);           // camera rotation (world->camera)
    this.Rt = mat3Transpose(this.R);         // transpose for world sampling

    // Offscreen & precomputed maps
    this._off = null;
    this._mapSize = 0;
    this._Nx = null; this._Ny = null; this._Nz = null; // per-pixel normals (camera space)
    this._A8 = null;                                   // precomputed alpha (AA)

    // Textures (optional samplers)
    this.tex = { albedo: null, water: null, ice: null };

    // Pointer / inertia state
    this._dragging = false;
    this._v0 = [0,0,1]; // arcball start vector
    this._lastTime = 0;
    this._axis = [0,1,0]; // inertia axis
    this._omega = 0;      // rad/s
    this._raf = 0;
  this._pendingInteractive = false; // rAF scheduling flag

  this._attachPointerHandlers();
  this.resize();
  this._initLUTs();
  // FPS counters
  this._fpsFrames = 0; this._fps = 0; this._fpsLastUpdate = performance.now();
    // Build continent data (densified typed polylines) & styles.
    this._continents = [];
    for (const name in CONTINENT_OUTLINES) {
      const def = CONTINENT_OUTLINES[name];
      const polyline = buildDensifiedPolylineLL(def.outline, def.densifyStep || 1.0);
      // Style fallback for Antarctica -> preserve existing option API.
      let fill = def.fill;
      let stroke = def.stroke;
      let lineWidth = def.lineWidth;
      if (name === 'Antarctica') {
        fill = this.opts.antarcticaFill;
        stroke = this.opts.antarcticaStroke;
        lineWidth = this.opts.antarcticaLineWidth;
      }
      this._continents.push({
        name,
        coarse: def.outline,
        poly: polyline,
        fill,
        stroke,
        lineWidth
      });
    }
  // Grid cache (typed arrays of xyz triples)
  this._gridCache = null;
  this.render();
    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  destroy() {
    // Backwards compatibility: destroy now delegates to dispose.
    this.dispose();
  }

  // Release references & listeners so GC can reclaim memory (idempotent).
  dispose() {
    if (this._disposed) return;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    if (this._onResize) { window.removeEventListener('resize', this._onResize); }
    this._detachPointerHandlers();

    // Null large typed arrays / ImageData for GC.
    this._Nx = this._Ny = this._Nz = this._A8 = null;
    this._imgData = null;
  this._continents = null;
    this._gridCache = null;
    this._toneLUT = this._lin2sU8 = this._s2l = null;
    if (this._off && this._off.canvas) {
      // Optionally shrink offscreen canvas to free backing store sooner.
      try { this._off.canvas.width = this._off.canvas.height = 0; } catch {}
    }
    this._off = null;
    this.tex = {};
    // Mark disposed.
    this._disposed = true;
  }

  // ------------------ Public API ------------------
  enableGrid(enabled = true) { this.opts.grid.enabled = enabled; this.render(); }
  setGridColor(color) { this.opts.grid.color = color; this.render(); }

  setSunDirection(vec3) { this.sun = this._normVec(vec3); this.render(); }
  setSunFromSpherical(lonDeg, latDeg) {
    let toR = Math.PI / 180, lon = lonDeg * toR, lat = latDeg * toR;
    let cx = Math.cos(lat), sx = Math.sin(lat), sz = Math.sin(lon), cz = Math.cos(lon);
    this.setSunDirection([cx*sz, sx, cx*cz]);
  }

  // Center view on [lat, lon] (deg). Ensures Antarctica not clipped when lat = -90.
  centerOnLatLon(latDeg, lonDeg) {
    let φ = latDeg * Math.PI / 180;
    let λ = lonDeg * Math.PI / 180;
    // rotate by -λ around Y, then by φ around X (world->camera)
    let qy = qFromAxisAngle(0,1,0, -λ);
    let qx = qFromAxisAngle(1,0,0,  φ);
    this.q = qNormalize(qMul(qx, qy));
    this._updateRot();
  // Reusable scratch containers (avoid GC)
  this._scratch2 = [0,0];
  this._samp = { r:0, g:0, b:0 };
  this._closedAntarctica = null; // cached closed polygon
  this.render();
  }
  centerOnAntarctica() { this.centerOnLatLon(-90, 0); }

  async loadTextures({ albedo, waterMask, iceMask } = {}) {
    let toSampler = async (src) => {
      if (!src) return null;
      let img = typeof src === 'string' ? await this._loadImage(src) : src;
      return this._makeSampler(img);
    };
    this.tex.albedo = await toSampler(albedo);
    this.tex.water  = await toSampler(waterMask);
    this.tex.ice    = await toSampler(iceMask);
    this.render();
  }

  setQuality(q) {
    this.opts.quality = Math.min(2, Math.max(0.5, q || 1));
    this._mapSize = 0; // force remap
    this.render();
  }

  resize() {
    let dpr = (this.opts.dpr = window.devicePixelRatio || 1);
    let rect = this.canvas.getBoundingClientRect();
    let dw = rect.width || this.canvas.width;
    let dh = rect.height || this.canvas.height;
    let w = Math.max(1, Math.round(dw * dpr));
    let h = Math.max(1, Math.round(dh * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.scale(dpr, dpr);
  }

  // ------------------ Rendering ------------------
  render(interactive = false) {
    let ctx = this.ctx;
    let rect = this.canvas.getBoundingClientRect();
    let width = rect.width || this.canvas.width / this.opts.dpr;
    let height = rect.height || this.canvas.height / this.opts.dpr;

    // Background
    ctx.clearRect(0, 0, width, height);
    if (this.opts.background) {
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, width, height);
    }

    // Sphere geometry
    let pad = this.opts.padding;
    let r = Math.max(1, Math.min(width, height) / 2 - pad);
    let cx = width / 2, cy = height / 2;

    // Update per-frame rotation matrices
    this._updateRot();

    // 1) shaded sphere
  this._renderShadedSphere(cx, cy, r, interactive);

  // 2) overlays (always drawn now for correct visual feedback while moving)
  this._drawOverlays(cx, cy, r, interactive);

    // subtle outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 1.1;
  ctx.stroke();
  if (this.opts.showFPS) this._drawFPS();
  }

  _renderShadedSphere(cx, cy, r, interactive) {
    const q = this.opts.quality * (interactive ? this.opts.interactiveQualityScale : 1);
    const d = Math.max(2, (2 * r * q) | 0);
    const off = this._getOff(d, d);
    if (this._mapSize !== d) this._buildNormalMap(d);

    // Reuse ImageData buffer (allocate once per size)
    if (!this._imgData || this._imgData.width !== d) this._imgData = off.ctx.createImageData(d, d);
    const data = this._imgData.data;

    // Cache frequently used values / arrays
    const base = this.opts.baseColor;
    const amb = this.opts.ambient, kd = this.opts.diffuse, ks = this.opts.specular;
    const shin = this.opts.shininess;
    const termSoft = this.opts.terminatorSoftness;
    const atm = this.opts.atmosphere, back = this.opts.backlight;
    const Lx = this.sun[0], Ly = this.sun[1], Lz = this.sun[2];
    // Half vector (viewer is +Z)
    let Hx = Lx, Hy = Ly, Hz = Lz + 1.0; {
      const invH = 1 / Math.hypot(Hx, Hy, Hz); Hx*=invH; Hy*=invH; Hz*=invH;
    }
    const Rt = this.Rt;
    const Rt00=Rt[0], Rt01=Rt[1], Rt02=Rt[2], Rt10=Rt[3], Rt11=Rt[4], Rt12=Rt[5], Rt20=Rt[6], Rt21=Rt[7], Rt22=Rt[8];

    const Nx = this._Nx, Ny = this._Ny, Nz = this._Nz, A8 = this._A8;
    const nPix = d * d;
    let p = 0;

    const texAlb = this.tex.albedo, texWater = this.tex.water, texIce = this.tex.ice;
    const needTex = !!(texAlb || texWater || texIce);

    // Lightweight tone + gamma (gamma 1/2.2 approx by pow) – could swap for LUT later
  const toneLUT = this._toneLUT;
  const sLinToSRGB = this._lin2sU8;
  const toneScale = (toneLUT.length - 1) / 4; // input assumed in [0,4]

    for (let i=0;i<nPix;i++) {
      const nz = Nz[i];
      if (nz < 0) { data[p]=data[p+1]=data[p+2]=data[p+3]=0; p+=4; continue; }
      const nx = Nx[i], ny = Ny[i];

      // Lighting terms independent of textures
      const NL = nx*Lx + ny*Ly + nz*Lz;
      const NV = nz; // view dir dot normal
      const NH = nx*Hx + ny*Hy + nz*Hz;

      // Day mask (soft terminator)
      let t = (NL + termSoft) / (2*termSoft);
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const dayMask = (3 - 2*t) * t * t * (NL > 0 ? NL : 0);

      let albR = base[0], albG = base[1], albB = base[2];
      let oceanW = 1.0, iceW = 0.0;

    if (needTex) {
        // Transform to world for UV only when needed
        const Wx = Rt00*nx + Rt01*ny + Rt02*nz;
        const Wy = Rt10*nx + Rt11*ny + Rt12*nz;
        const Wz = Rt20*nx + Rt21*ny + Rt22*nz;
        const lon = Math.atan2(Wx, Wz);
        const WyClamped = Wy < -1 ? -1 : (Wy > 1 ? 1 : Wy);
        const lat = Math.asin(WyClamped);
        if (texAlb) {
      const s = this._sampleSRGB(texAlb, lon, lat);
      const lut = this._s2l; // 256-entry linear LUT
      albR = lut[s.r];
      albG = lut[s.g];
      albB = lut[s.b];
        }
        if (texWater) {
      const sw = this._sampleSRGB(texWater, lon, lat);
      oceanW = (sw.r + sw.g + sw.b) * (1/765); // 3*255 = 765
        }
        if (texIce) {
      const si = this._sampleSRGB(texIce, lon, lat);
      iceW = (si.r + si.g + si.b) * (1/765);
        }
      }

      const diff = kd * dayMask;
      const specW = oceanW * (1 - 0.9*iceW);
      const spec = NL > 0 ? ks * specW * Math.pow(NH > 0 ? NH : 0, shin) : 0;

      // Atmosphere / rim
      const NVc = NV < 0 ? 0 : (NV > 1 ? 1 : NV);
      const oneMinusNV = 1 - NVc;
      const rimDay = atm * Math.pow(oneMinusNV, 2.4) * (NL + 0.15 > 0 ? NL + 0.15 : 0);
      let rimBack = 0;
      if (Lz < 0 && NL < 0) rimBack = back * Math.pow(oneMinusNV, 3.2) * (-NL);

      let rLin = albR*(amb + diff) + spec + 0.40*rimDay + 0.25*rimBack;
      let gLin = albG*(amb + diff) + spec + 0.65*rimDay + 0.40*rimBack;
      let bLin = albB*(amb + diff) + spec + 1.00*rimDay + 0.80*rimBack;

  if (rLin < 0) rLin = 0; if (gLin < 0) gLin = 0; if (bLin < 0) bLin = 0;
  if (rLin > 4) rLin = 4; if (gLin > 4) gLin = 4; if (bLin > 4) bLin = 4;
  rLin = toneLUT[(rLin * toneScale) | 0];
  gLin = toneLUT[(gLin * toneScale) | 0];
  bLin = toneLUT[(bLin * toneScale) | 0];
  if (rLin > 1) rLin = 1; if (gLin > 1) gLin = 1; if (bLin > 1) bLin = 1;
  data[p]   = sLinToSRGB[(rLin * 4095) | 0];
  data[p+1] = sLinToSRGB[(gLin * 4095) | 0];
  data[p+2] = sLinToSRGB[(bLin * 4095) | 0];
      data[p+3] = A8[i];
      p += 4;
    }

    off.ctx.putImageData(this._imgData, 0, 0);
    const drawSize = d / q;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();
    ctx.drawImage(off.canvas, cx - drawSize/2, cy - drawSize/2, drawSize, drawSize);
    ctx.restore();
  }

  _drawGraticule(cx, cy, r) {
    const g = this.opts.grid;
    const ctx = this.ctx;
    // Build cache if needed
    this._rebuildGridCacheIfNeeded();
    const cache = this._gridCache;
    if (!cache) return;
    const R = this.R;
    const R00=R[0],R01=R[3],R02=R[6], R10=R[1],R11=R[4],R12=R[7], R20=R[2],R21=R[5],R22=R[8];
    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.globalAlpha = g.alpha;
    ctx.lineWidth = g.lineWidth;
    ctx.lineCap = 'round';

    const drawLines = (lines)=>{
      for (let k=0;k<lines.length;k++){
        const arr = lines[k];
        let drawing=false;
        ctx.beginPath();
        for (let i=0;i<arr.length;i+=3){
          const vx=arr[i], vy=arr[i+1], vz=arr[i+2];
          const xw = R00*vx + R01*vy + R02*vz;
          const yw = R10*vx + R11*vy + R12*vz;
          const zw = R20*vx + R21*vy + R22*vz;
          if (zw >= 0) {
            const sx = cx + r*xw, sy = cy - r*yw;
            if (!drawing) { ctx.moveTo(sx, sy); drawing=true; }
            else ctx.lineTo(sx, sy);
          } else if (drawing) { ctx.stroke(); ctx.beginPath(); drawing=false; }
        }
        if (drawing) ctx.stroke();
      }
    };

    drawLines(cache.parallels);
    drawLines(cache.meridians);
    ctx.restore();
  }

  // Unified overlays draw (grid + Antarctica) so we can easily toggle / optimize later.
  _drawOverlays(cx, cy, r, interactive) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();
    if (this.opts.grid.enabled) this._drawGraticule(cx, cy, r);
  this._drawContinents(cx, cy, r);
    ctx.restore();
    // Future optimization idea:
    // if (interactive) skip Antarctica fill or draw a cached path to reduce CPU.
  }

  _rebuildGridCacheIfNeeded() {
    const g = this.opts.grid;
    if (!g.enabled) return;
    const params = this._gridCache?.params;
    if (params && params.stepLat===g.stepLat && params.stepLon===g.stepLon && params.sampleStepDeg===g.sampleStepDeg) return;
    // Build new cache
    const parallels = [];
    for (let lat=-80; lat<=80; lat+=g.stepLat) {
      const pts = [];
      for (let lon=-180; lon<=180; lon+=g.sampleStepDeg) {
        const φ = lat*Math.PI/180, λ=lon*Math.PI/180;
        const cφ=Math.cos(φ), sφ=Math.sin(φ), sλ=Math.sin(λ), cλ=Math.cos(λ);
        pts.push(cφ*sλ, sφ, cφ*cλ);
      }
      parallels.push(new Float32Array(pts));
    }
    const meridians = [];
    for (let lon=-180; lon<180; lon+=g.stepLon) {
      const pts=[];
      for (let lat=-90; lat<=90; lat+=g.sampleStepDeg) {
        const φ = lat*Math.PI/180, λ=lon*Math.PI/180;
        const cφ=Math.cos(φ), sφ=Math.sin(φ), sλ=Math.sin(λ), cλ=Math.cos(λ);
        pts.push(cφ*sλ, sφ, cφ*cλ);
      }
      meridians.push(new Float32Array(pts));
    }
    this._gridCache = { parallels, meridians, params: { stepLat:g.stepLat, stepLon:g.stepLon, sampleStepDeg:g.sampleStepDeg } };
  }

  _drawContinents(cx, cy, r) {
    const ctx = this.ctx;
    const R = this.R;
    if (!this._continents) return;
    for (let c=0; c<this._continents.length; c++) {
      const cdef = this._continents[c];
      const coarse = cdef.coarse;
      // Determine if entire coarse polygon is front-facing.
      let allFront = true;
      for (let i=0;i<coarse.length;i++) {
        const ll = coarse[i];
        const φ = ll[0]*Math.PI/180, λ = ll[1]*Math.PI/180;
        const cφ=Math.cos(φ), sφ=Math.sin(φ), sλ=Math.sin(λ), cλ=Math.cos(λ);
        const vx=cφ*sλ, vy=sφ, vz=cφ*cλ;
        const z = R[2]*vx + R[5]*vy + R[8]*vz;
        if (z < 0) { allFront = false; break; }
      }
      const poly = cdef.poly;
      const len = poly.length;
      ctx.save();
      ctx.fillStyle = cdef.fill || this.opts.antarcticaFill; // Antarctica fallback
      ctx.strokeStyle = cdef.stroke || this.opts.antarcticaStroke;
      ctx.lineWidth = cdef.lineWidth || this.opts.antarcticaLineWidth;
      if (allFront) {
        ctx.beginPath();
        let firstDone=false;
        for (let i=0;i<len;i+=2) {
          const lat = poly[i], lon = poly[i+1];
          const φ = lat*Math.PI/180, λ = lon*Math.PI/180;
          const cφ=Math.cos(φ), sφ=Math.sin(φ), sλ=Math.sin(λ), cλ=Math.cos(λ);
          const vx=cφ*sλ, vy=sφ, vz=cφ*cλ;
          const xw = R[0]*vx + R[3]*vy + R[6]*vz;
          const yw = R[1]*vx + R[4]*vy + R[7]*vz;
          if (!firstDone) { ctx.moveTo(cx + r*xw, cy - r*yw); firstDone=true; }
          else ctx.lineTo(cx + r*xw, cy - r*yw);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Stroke only visible segments to avoid fill crossing limb.
        let drawing=false;
        ctx.beginPath();
        for (let i=0;i<len;i+=2) {
          const lat = poly[i], lon = poly[i+1];
          const φ = lat*Math.PI/180, λ = lon*Math.PI/180;
          const cφ=Math.cos(φ), sφ=Math.sin(φ), sλ=Math.sin(λ), cλ=Math.cos(λ);
          const vx=cφ*sλ, vy=sφ, vz=cφ*cλ;
          const xw = R[0]*vx + R[3]*vy + R[6]*vz;
          const yw = R[1]*vx + R[4]*vy + R[7]*vz;
          const zw = R[2]*vx + R[5]*vy + R[8]*vz;
          if (zw >= 0) {
            const sx = cx + r*xw, sy = cy - r*yw;
            if (!drawing) { ctx.moveTo(sx, sy); drawing=true; }
            else ctx.lineTo(sx, sy);
          } else if (drawing) { ctx.stroke(); ctx.beginPath(); drawing=false; }
        }
        if (drawing) ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ------------------ Mapping helpers ------------------
  _strokeLatitude(cx, cy, r, latDeg, step) {
    let ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let lon=-180; lon<=180; lon+=step) {
      let v = this._projectLatLon(latDeg, lon);
      if (!v) { drawing = false; continue; }
      let x = cx + r*v[0], y = cy - r*v[1];
      if (!drawing) { ctx.moveTo(x,y); drawing=true; } else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  _strokeLongitude(cx, cy, r, lonDeg, step) {
    let ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let lat=-90; lat<=90; lat+=step) {
      let v = this._projectLatLon(lat, lonDeg);
      if (!v) { drawing = false; continue; }
      let x = cx + r*v[0], y = cy - r*v[1];
      if (!drawing) { ctx.moveTo(x,y); drawing=true; } else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  _projectLatLon(latDeg, lonDeg) {
  // Reuse scratch array to avoid per-vertex allocations (lazy init safeguard)
  let out = this._scratch2;
  if (!out) out = this._scratch2 = [0,0];
    const φ = latDeg * Math.PI / 180, λ = lonDeg * Math.PI / 180;
    const cφ = Math.cos(φ), sφ = Math.sin(φ);
    const sλ = Math.sin(λ), cλ = Math.cos(λ);
    const vx = cφ*sλ, vy = sφ, vz = cφ*cλ;
    const R = this.R;
    const cx = R[0]*vx + R[3]*vy + R[6]*vz;
    const cy = R[1]*vx + R[4]*vy + R[7]*vz;
    const cz = R[2]*vx + R[5]*vy + R[8]*vz;
    if (cz < 0) return null;
    out[0] = cx; out[1] = cy; return out;
  }
  _latLonToXYZ(latDeg, lonDeg) {
    let φ = latDeg * Math.PI / 180, λ = lonDeg * Math.PI / 180;
    let cφ = Math.cos(φ), sφ = Math.sin(φ);
    let sλ = Math.sin(λ), cλ = Math.cos(λ);
    return [cφ*sλ, sφ, cφ*cλ];
  }
  _applyR(v) {
    let R = this.R;
    return [
      R[0]*v[0] + R[3]*v[1] + R[6]*v[2],
      R[1]*v[0] + R[4]*v[1] + R[7]*v[2],
      R[2]*v[0] + R[5]*v[1] + R[8]*v[2]
    ];
  }
  // Legacy densify & interpolation helpers removed in favor of single typed-array polyline.

  // ------------------ Arcball & inertia ------------------
  _attachPointerHandlers() {
    let el = this.canvas;
    if (getComputedStyle(el).touchAction !== 'none') el.style.touchAction = 'none';

    let onDown = (ev) => {
      this._dragging = true;
      this._v0 = this._screenToArcball(ev.clientX, ev.clientY);
      this._omega = 0;
      this._lastTime = performance.now();
      try { el.setPointerCapture(ev.pointerId); } catch {}
    };
    let onMove = (ev) => {
      if (!this._dragging) return;
      let v1 = this._screenToArcball(ev.clientX, ev.clientY);
      // incremental rotation dq = Rot(v0->v1) in camera space
      let dq = qFromVectors(this._v0, v1);
      this.q = qNormalize(qMul(dq, this.q));
      this._v0 = v1;

      // estimate angular speed for inertia
      let now = performance.now(), dt = Math.max(1, now - this._lastTime) / 1000;
      this._lastTime = now;

      // extract axis-angle from dq
      let angle = 2 * Math.acos(Math.max(-1, Math.min(1, dq[3])));
      if (angle > Math.PI) angle = 2*Math.PI - angle;
      let s = Math.sqrt(1 - dq[3]*dq[3]);
      if (s < 1e-6) { this._axis[0]=0; this._axis[1]=1; this._axis[2]=0; }
      else { this._axis[0]=dq[0]/s; this._axis[1]=dq[1]/s; this._axis[2]=dq[2]/s; }
      this._omega = angle / dt;

  this._updateRot();
  this._requestInteractiveFrame();
    };
    let onUp = (ev) => {
      this._dragging = false;
      try { el.releasePointerCapture(ev.pointerId); } catch {}
  this._startInertia();
  // schedule a high-quality pass after inertia ends
  setTimeout(()=>{ if (!this._omega) this.render(false); }, 120);
    };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  // pointerrawupdate can give higher-fidelity small movements (supported in some browsers)
  try { el.addEventListener('pointerrawupdate', onMove); } catch {}
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    this._ptr = { onDown, onMove, onUp };
  }
  _detachPointerHandlers() {
    if (!this._ptr) return;
    let el = this.canvas;
    el.removeEventListener('pointerdown', this._ptr.onDown);
    el.removeEventListener('pointermove', this._ptr.onMove);
    el.removeEventListener('pointerup', this._ptr.onUp);
    el.removeEventListener('pointercancel', this._ptr.onUp);
    this._ptr = null;
  }
  _startInertia() {
    if (this._omega <= this.opts.inertiaMinSpeed) return;

    let friction = this.opts.inertiaFriction;
    let last = performance.now();
    let step = (now) => {
      let dt = Math.max(1, now - last) / 1000;
      last = now;

      // decay angular speed
      this._omega *= Math.exp(-friction * dt);
      if (this._omega <= this.opts.inertiaMinSpeed) { this._omega = 0; this._raf = 0; return; }

      // apply small rotation about stored axis
      let dq = qFromAxisAngle(this._axis[0], this._axis[1], this._axis[2], this._omega * dt);
      this.q = qNormalize(qMul(dq, this.q));
  this._updateRot();
  this._requestInteractiveFrame();
      this._raf = requestAnimationFrame(step);
    };
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(step);
  }
  _requestInteractiveFrame() {
    if (this._pendingInteractive) return;
    this._pendingInteractive = true;
    requestAnimationFrame(()=>{
      this._pendingInteractive = false;
      // interactive flag => lower resolution scaling applied
      this.render(true);
    });
  }

  // ------------------ LUT init (tone + gamma) ------------------
  _initLUTs() {
    if (this._lutsInit) return;
    // sRGB -> linear (256)
    const s2l = new Float32Array(256);
    for (let i=0;i<256;i++) {
      let c = i/255;
      s2l[i] = c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    }
    this._s2l = s2l;
    // linear -> sRGB (4096) pre-quantized to 0..255
    const l2sU8 = new Uint8ClampedArray(4096);
    for (let i=0;i<4096;i++) {
      let v = i/4095;
      let srgb = v <= 0.0031308 ? v*12.92 : 1.055*Math.pow(v, 1/2.4) - 0.055;
      l2sU8[i] = (srgb*255 + 0.5) | 0;
    }
    this._lin2sU8 = l2sU8;
    // tone curve LUT (size 2048 over [0,4])
    const toneLUT = new Float32Array(2048);
    for (let i=0;i<2048;i++) {
      let x = 4 * i / 2047; // 0..4
      toneLUT[i] = 1 - Math.exp(-2.6 * x);
    }
    this._toneLUT = toneLUT;
    this._lutsInit = true;
  }
  _screenToArcball(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let cx = rect.left + rect.width / 2;
    let cy = rect.top + rect.height / 2;
    let pad = this.opts.padding;
    let r = Math.max(1, Math.min(rect.width, rect.height)/2 - pad);

    // map to [-1,1] on arcball disc
    let x = (clientX - cx) / r;
    let y = (cy - clientY) / r;
    let d2 = x*x + y*y;
    if (d2 <= 1) {
      // on the sphere
      return [x, y, Math.sqrt(1 - d2)];
    } else {
      // outside: project onto hyperbolic sheet (normalize to unit length)
      let inv = 1 / Math.sqrt(d2);
      return [x*inv, y*inv, 0];
    }
  }

  // ------------------ Precompute unit-disc normal map ------------------
  _buildNormalMap(d) {
    this._mapSize = d;
    let rad = d * 0.5, invR = 1 / rad;
    this._Nx = new Float32Array(d*d);
    this._Ny = new Float32Array(d*d);
    this._Nz = new Float32Array(d*d);
    this._A8 = new Uint8ClampedArray(d*d);

    let i = 0;
    for (let y=0; y<d; y++) {
      let vy_screen = (y + 0.5 - rad) * invR;
      for (let x=0; x<d; x++) {
        let vx = (x + 0.5 - rad) * invR;
        let vy = -vy_screen;
        let rr = vx*vx + vy*vy;
        if (rr > 1.0005) {
          this._Nz[i] = -1; // mark outside
          this._A8[i] = 0;
        } else {
          let dist = Math.sqrt(rr);
          let vz = Math.sqrt(1 - (rr < 0 ? 0 : rr));
          this._Nx[i] = vx; this._Ny[i] = vy; this._Nz[i] = vz;
          // 1-px antialiasing rim
          let aa = (1 - dist) * rad;
          if (aa < 0) aa = 0; if (aa > 1) aa = 1;
          this._A8[i] = Math.round(255 * aa);
        }
        i++;
      }
    }
  }

  // ------------------ Textures (2D sampling) ------------------
  async _loadImage(url) {
    let img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return img;
  }
  _makeSampler(img) {
    let c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    let x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    let id = x.getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height, data: id.data };
  }
  _sampleSRGB(s, lon, lat) {
    // equirectangular sample into reusable object
    let u = lon / (2*Math.PI) + 0.5;
    u -= Math.floor(u);
    let v = 0.5 - lat / Math.PI;
    if (v < 0) v = 0; else if (v > 1) v = 1;
    let ix = (u * s.w) | 0;
    let iy = (v * s.h) | 0;
    if (ix < 0) ix += s.w; else if (ix >= s.w) ix -= s.w;
    let idx = (iy * s.w + ix) * 4;
    const samp = this._samp;
    const d = s.data;
    samp.r = d[idx]; samp.g = d[idx+1]; samp.b = d[idx+2];
    return samp;
  }

  // ------------------ Misc math ------------------
  _normVec(v) {
    let n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0]/n, v[1]/n, v[2]/n];
  }
  _updateRot() {
    this.R = mat3FromQuat(this.q);
    this.Rt = mat3Transpose(this.R);
  }

  // ------------------ Offscreen ------------------
  _getOff(w, h) {
    if (!this._off || this._off.canvas.width !== w || this._off.canvas.height !== h) {
      let c = document.createElement('canvas');
      c.width = w; c.height = h;
      this._off = { canvas: c, ctx: c.getContext('2d') };
    }
    return this._off;
  }

  // ------------------ FPS overlay ------------------
  _drawFPS() {
    const now = performance.now();
    this._fpsFrames++;
    const dt = now - this._fpsLastUpdate;
    if (dt >= 500) { // update ~2x per second
      this._fps = (this._fpsFrames * 1000 / dt) || 0;
      this._fpsFrames = 0;
      this._fpsLastUpdate = now;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '12px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    const txt = this._fps.toFixed(1) + ' fps';
    const pad = 4;
    const w = ctx.measureText(txt).width + pad*2;
    const h = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, pad, 2);
    ctx.restore();
  }
}

module.exports = EarthGlobeRenderer;