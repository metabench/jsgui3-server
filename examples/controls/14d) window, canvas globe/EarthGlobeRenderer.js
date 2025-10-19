const { mat3FromQuat, mat3Transpose } = require('./math');
const {
  RenderingPipeline,
  TransformStage,
  ShadeSphereStage,
  GridStage,
  ClippingStage,
  ContinentsStage,
  ComposeStage,
  HUDStage
} = require('./RenderingPipeline');
const ArcballDragBehaviour = require('./arcball-drag-behaviour');
const DragController = require('./drag-controller');

// Approximate simplified continent outlines (lat, lon in degrees)
const CONTINENT_OUTLINES = {
  Antarctica: { outline: [
    [-70,0],[-70.5,7.5],[-70.3,15],[-70,22.5],[-69.5,30],[-69,37.5],[-68.5,45],[-68,52.5],[-67.5,60],[-67.2,67.5],
    [-66.8,75],[-66.5,82.5],[-66.3,90],[-66.2,100],[-66.5,110],[-66.8,120],[-67,130],[-67.5,140],[-68.5,150],[-70,160],
    [-73,170],[-75.5,178],[-77.5,-175],[-78.5,-170],[-79,-160],[-78.8,-150],[-77.5,-140],[-76.5,-130],[-75.5,-120],[-74.5,-110],
    [-73.5,-100],[-72.5,-90],[-71.8,-80],[-70.5,-72],[-68.8,-68],[-66.5,-66],[-64.5,-64],[-63,-60],[-64.5,-58],[-66.5,-55],
    [-70,-50],[-73,-45],[-76,-42],[-78,-40],[-79,-35],[-78.5,-25],[-76.5,-15],[-73.5,-7.5],[-71,-2.5],[-70,0]
  ], densifyStep:1.0 },
  Africa: { outline: [
    [37,-9],[35,-1],[32,4],[30,10],[28,19],[24,25],[20,32],[15,39],[12,44],[10,50],[8,49],[5,45],[2,43],[0,41],[-2,40],[-5,39],[-8,39],[-12,38],
    [-15,35],[-18,32],[-22,30],[-25,28],[-28,25],[-32,20],[-34,18],[-34,15],[-30,10],[-25,8],[-20,6],[-15,4],[-10,0],[-5,-5],[0,-8],[5,-10],
    [10,-14],[12,-16],[15,-17],[18,-17],[22,-16],[25,-15],[28,-14],[31,-12],[33,-10],[35,-9],[37,-9]
  ], densifyStep:0.8, fill:'rgba(16,70,16,0.85)', stroke:'rgba(8,40,8,0.9)'}
};

const DEFAULT_OPTIONS = {
  dpr: (typeof devicePixelRatio !== 'undefined') ? devicePixelRatio : 1,
  padding: 8,
  background: '#001018',
  baseColor: [0.15,0.32,0.55],
  quality: 1.0,
  interactiveQualityScale: 0.55,
  ambient: 0.12,
  diffuse: 1.0,
  specular: 0.45,
  shininess: 48,
  terminatorSoftness: 0.35,
  atmosphere: 0.65,
  backlight: 0.35,
  grid: { enabled:true, stepLat:10, stepLon:10, sampleStepDeg:2, color:'#fff', alpha:0.18, lineWidth:1 },
  continents: { refineMidpointMaxDepth:3, refineMinAngleDeg:6 },
  antarcticaFill: 'rgba(140,170,190,0.55)',
  antarcticaStroke: 'rgba(220,240,255,0.15)',
  antarcticaLineWidth: 1,
  clipping: { enabled:false },
  inertiaFriction: 1.7,
  inertiaMinSpeed: 0.25,
  showFPS: true
};

class EarthGlobeRenderer {
  constructor(canvas, opts={}) {
    // Allow passing a DOM id string.
    if (typeof canvas === 'string') {
      const el = (typeof document !== 'undefined') ? document.getElementById(canvas) : null;
      if (!el) throw new Error('Canvas element id "' + canvas + '" not found');
      canvas = el;
    }
    if (!canvas || typeof canvas.getContext !== 'function') throw new Error('EarthGlobeRenderer requires a <canvas> element');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
    this.setOptions(opts);
    
    // Initialize arcball drag behavior
    this.drag_behaviour = new ArcballDragBehaviour({
      inertia_friction: this.opts.inertiaFriction,
      inertia_min_speed: this.opts.inertiaMinSpeed,
      on_rotation_change: (q, R, Rt) => {
        this.q = q;
        this.R = R;
        this.Rt = Rt;
      }
    });
    
    // Access quaternion and matrices from behavior
    this.q = this.drag_behaviour.q;
    this.R = this.drag_behaviour.R;
    this.Rt = this.drag_behaviour.Rt;
    
    this.sun = this._normVec([1,0,0.25]);
    this.pipelineEnabled = true;
  this._fps = 0;
  this._fpsFrames = 0;
  this._fpsLastUpdate = performance.now();
    this.tex = { albedo:null, water:null, ice:null };
    this._samp = { r:0,g:0,b:0 };
    this._initLUTs();
    this._buildContinents();
    this.pipeline = new RenderingPipeline(
      this,
      [
        new TransformStage(this),
        new ShadeSphereStage(this),
        new GridStage(this),
        new ClippingStage(this),
        new ContinentsStage(this),
        new ComposeStage(this),
        new HUDStage(this)
      ]
    );
    
    // Initialize drag controller
    this.drag_controller = new DragController(
      this.canvas,
      this.drag_behaviour,
      {
        padding: this.opts.padding,
        on_interactive_frame: () => this.render(true),
        on_drag_end: () => {
          // Delay final high-quality render to allow inertia to start
          setTimeout(() => {
            if (!this.drag_behaviour.omega) this.render(false);
          }, 120);
        }
      }
    );
    
    this.resize();
    this.render(false);
  }

  setOptions(partial) {
    if (!partial) return;
    // shallow merge (nested simple objects handled manually)
    for (const k of Object.keys(partial)) {
      if (typeof partial[k] === 'object' && !Array.isArray(partial[k]) && this.opts[k]) {
        Object.assign(this.opts[k], partial[k]);
      } else {
        this.opts[k] = partial[k];
      }
    }
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.opts.dpr || 1;
    const w = Math.max(1, rect.width|0), h = Math.max(1, rect.height|0);
    if (this.canvas.width !== (w*dpr) || this.canvas.height !== (h*dpr)) {
      this.canvas.width = w*dpr; this.canvas.height = h*dpr;
      this.canvas.style.width = w+'px'; this.canvas.style.height = h+'px';
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
  }
  enablePipeline() { this.pipelineEnabled = true; }
  disablePipeline() { this.pipelineEnabled = false; }
  setSunDirection(vec3) { this.sun = this._normVec(vec3); this.render(false); }
  setSunFromSpherical(lonDeg, latDeg) {
    // convenience API used by existing client code
    const λ = lonDeg * Math.PI/180;
    const φ = latDeg * Math.PI/180;
    const cφ = Math.cos(φ);
    this.setSunDirection([
      cφ * Math.sin(λ),
      Math.sin(φ),
      cφ * Math.cos(λ)
    ]);
  }

  _buildContinents() {
    const arr = [];
    for (const name of Object.keys(CONTINENT_OUTLINES)) {
      const def = CONTINENT_OUTLINES[name];
      const out = def.outline;
      const stepRad = (def.densifyStep||1)*Math.PI/180;
      const verts = [];
      const slerp = (a, b, t) => {
        let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
        const th = Math.acos(dot);
        if (th < 1e-8) return a.slice();
        const sA = Math.sin((1 - t) * th);
        const sB = Math.sin(t * th);
        const inv = 1 / Math.sin(th);
        return [
          (a[0] * sA + b[0] * sB) * inv,
          (a[1] * sA + b[1] * sB) * inv,
          (a[2] * sA + b[2] * sB) * inv
        ];
      };
      const toXYZ = (lat, lon) => {
        const φ = lat * Math.PI/180;
        const λ = lon * Math.PI/180;
        const cφ = Math.cos(φ), sφ = Math.sin(φ);
        return [ cφ * Math.sin(λ), sφ, cφ * Math.cos(λ) ];
      };
      for (let i=0;i<out.length-1;i++) {
        const a = toXYZ(out[i][0], out[i][1]);
        const b = toXYZ(out[i+1][0], out[i+1][1]);
  let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
        const ang = Math.acos(dot);
  const segs = Math.max(1, Math.round(ang / stepRad));
        for (let s=0;s<segs;s++) {
          // avoid duplicating previous edge's end
          const v = (s === 0 && i > 0) ? null : slerp(a, b, s / segs);
          if (v) verts.push(v[0], v[1], v[2]);
        }
      }
      // last vertex (do not close duplicate – implicit)
      const last = out[out.length-1];
      const lv = toXYZ(last[0], last[1]);
      verts.push(lv[0], lv[1], lv[2]);
      arr.push({
        name,
        polyXYZ: new Float32Array(verts),
        fill: def.fill || null,
        stroke: def.stroke || null,
        lineWidth: def.lineWidth || null,
        tri: null
      });
    }
    this._continents = arr;
  }

  render(interactive=false) {
    if (this.pipelineEnabled && this.pipeline) {
      this.resize();
      this.pipeline.run({ interactive });
    }
  }

  // -------------- LUTs & shading utilities --------------
  _initLUTs() {
    if (this._lutsInit) return;
    const s2l = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const c = i / 255;
      s2l[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    this._s2l = s2l;
    const l2s = new Uint8ClampedArray(4096);
    for (let i = 0; i < 4096; i++) {
      let v = i / 4095;
      let srgb = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      l2s[i] = (srgb * 255 + 0.5) | 0;
    }
    this._lin2sU8 = l2s;
    const tone = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const x = 4 * i / 2047;
      tone[i] = 1 - Math.exp(-2.6 * x);
    }
    this._toneLUT = tone;
    this._lutsInit = true;
  }
  _buildNormalMap(d) {
    this._mapSize = d;
    const rad = d * 0.5;
    const invR = 1 / rad;
    this._Nx = new Float32Array(d * d);
    this._Ny = new Float32Array(d * d);
    this._Nz = new Float32Array(d * d);
    this._A8 = new Uint8ClampedArray(d * d);
    let i = 0;
    for (let y = 0; y < d; y++) {
      const vy_s = (y + 0.5 - rad) * invR;
      for (let x = 0; x < d; x++) {
        const vx = (x + 0.5 - rad) * invR;
        const vy = -vy_s;
        const rr = vx * vx + vy * vy;
        if (rr > 1.0005) {
          this._Nz[i] = -1;
          this._A8[i] = 0;
        } else {
          const dist = Math.sqrt(rr);
          const vz = Math.sqrt(1 - (rr < 0 ? 0 : rr));
          this._Nx[i] = vx;
          this._Ny[i] = vy;
          this._Nz[i] = vz;
          let aa = (1 - dist) * rad;
          if (aa < 0) aa = 0; else if (aa > 1) aa = 1;
          this._A8[i] = Math.round(255 * aa);
        }
        i++;
      }
    }
  }
  _getOff(w, h) {
    if (!this._off || this._off.canvas.width !== w || this._off.canvas.height !== h) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      this._off = { canvas: c, ctx: c.getContext('2d') };
    }
    return this._off;
  }
  _sampleSRGB(s, lon, lat) {
    let u = lon / (2 * Math.PI) + 0.5;
    u -= Math.floor(u);
    let v = 0.5 - lat / Math.PI;
    if (v < 0) v = 0; else if (v > 1) v = 1;
    const ix = (u * s.w) | 0;
    const iy = (v * s.h) | 0;
    let idx = (iy * s.w + ix) * 4;
    const d = s.data;
    const samp = this._samp;
    samp.r = d[idx];
    samp.g = d[idx + 1];
    samp.b = d[idx + 2];
    return samp;
  }
  _makeSampler(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height, data: id.data };
  }
  async loadAlbedo(url) {
    const img = await this._loadImage(url);
    this.tex.albedo = this._makeSampler(img);
    this.render(false);
  }
  async _loadImage(url) {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return img;
  }

  _normVec(v) {
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0]/n, v[1]/n, v[2]/n];
  }

  _drawFPS() {
    const now = performance.now();
    this._fpsFrames++;
    const dt = now - this._fpsLastUpdate;
    if (dt >= 500) {
      this._fps = (this._fpsFrames * 1000 / dt) || 0;
      this._fpsFrames = 0;
      this._fpsLastUpdate = now;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '12px system-ui,sans-serif';
    ctx.textBaseline = 'top';
    const txt = this._fps.toFixed(1) + ' fps';
    const pad = 4;
    const w = ctx.measureText(txt).width + pad * 2;
    const h = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, pad, 2);
    ctx.restore();
  }
}

module.exports = EarthGlobeRenderer;