


const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Checkbox, Date_Picker, Text_Input, Text_Field, Dropdown_Menu} = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
class EarthGlobeRenderer {
  constructor(canvasOrId, options) {
    if (!options) options = {};
    let cid = canvasOrId || 'globeCanvas';
    let el = typeof cid === 'string' ? document.getElementById(cid) : cid;
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Canvas 'globeCanvas' not found.");
    this.canvas = el;
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    // ---------- Options / state ----------
    this.opts = {
      padding: options.padding != null ? options.padding : 8,
      background: options.background != null ? options.background : null,

      // Lighting/material
      baseColor: options.baseColor || [0.13, 0.42, 0.86], // linear-ish RGB
      ambient: options.ambient != null ? options.ambient : 0.08,
      diffuse: options.diffuse != null ? options.diffuse : 1.0,
      specular: options.specular != null ? options.specular : 0.7,
      shininess: options.shininess != null ? options.shininess : 140.0,
      terminatorSoftness: options.terminatorSoftness != null ? options.terminatorSoftness : 0.08,
      atmosphere: options.atmosphere != null ? options.atmosphere : 0.5,
      backlight: options.backlight != null ? options.backlight : 0.25,

      // Quality
      quality: Math.min(2, Math.max(0.5, options.quality != null ? options.quality : 1.15)),

      // Grid
      grid: {
        enabled: options.grid && options.grid.enabled != null ? options.grid.enabled : false,
        color: options.grid && options.grid.color ? options.grid.color : '#444',
        lineWidth: options.grid && options.grid.lineWidth != null ? options.grid.lineWidth : 0.8,
        alpha: options.grid && options.grid.alpha != null ? options.grid.alpha : 0.7,
        stepLat: options.grid && options.grid.stepLat != null ? options.grid.stepLat : 10,
        stepLon: options.grid && options.grid.stepLon != null ? options.grid.stepLon : 10,
        sampleStepDeg: options.grid && options.grid.sampleStepDeg != null ? options.grid.sampleStepDeg : 2
      },

      // Antarctica styling
      antarcticaFill: options.antarcticaFill || 'rgba(220,240,255,0.85)',
      antarcticaStroke: options.antarcticaStroke || 'rgba(180,200,220,0.9)',
      antarcticaLineWidth: options.antarcticaLineWidth != null ? options.antarcticaLineWidth : 1.0,

      // Inertia
      inertiaFriction: options.inertiaFriction != null ? options.inertiaFriction : 2.6,
      inertiaMinSpeed: options.inertiaMinSpeed != null ? options.inertiaMinSpeed : 0.05,

      // Workers/tiling
      maxWorkers: options.maxWorkers || (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4),

      dpr: (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1
    };

    // Sun direction (camera frame)
    this.sun = this._normVec([-0.45, 0.55, 0.65]);

    // Orientation (arcball) quaternion
    this.q = this._qIdentity();
    this.R = this._mat3FromQuat(this.q);
    this.Rt = this._mat3Transpose(this.R);

    // Offscreen + internal disc
    this._off = null;
    this._discSize = 0;
    this._Nx = null; this._Ny = null; this._Nz = null; this._A8 = null;

    // Workers & shared buffers
    this._useWorkers = typeof Worker !== 'undefined';
    this._useSAB = (typeof SharedArrayBuffer !== 'undefined') && (typeof crossOriginIsolated !== 'undefined') && crossOriginIsolated;
    this._workers = [];
    this._rgbaSAB = null;
    this._rgba = null;
    this._imgData = null;
    this._jobSeq = 0;
    this._shadingInProgress = false;
    this._rerenderRequested = false;

    // Interaction & inertia
    this._dragging = false;
    this._v0 = [0,0,1];
    this._axis = [0,1,0];
    this._omega = 0;
    this._lastTime = 0;
    this._animRAF = 0;
    this._isAnimating = false;

    // Antarctica outline
    this._ANT = [
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
    ];

    this._attachPointerHandlers();
    this.resize();
    this.render();

    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this._detachPointerHandlers();
    if (this._animRAF) cancelAnimationFrame(this._animRAF);
    for (let i = 0; i < this._workers.length; i++) {
      try { this._workers[i].terminate(); } catch(e){}
    }
    this._workers = [];
  }

  // ---------- Public controls ----------
  enableGrid(enabled) { this.opts.grid.enabled = !!enabled; this.render(); }
  setGridColor(color) { this.opts.grid.color = color || '#444'; this.render(); }
  setSunDirection(vec3) { this.sun = this._normVec(vec3); this.render(); }
  setSunFromSpherical(lonDeg, latDeg) {
    let toR = Math.PI / 180, lon = lonDeg * toR, lat = latDeg * toR;
    let cx = Math.cos(lat), sx = Math.sin(lat), sz = Math.sin(lon), cz = Math.cos(lon);
    this.setSunDirection([cx*sz, sx, cx*cz]);
  }
  centerOnLatLon(latDeg, lonDeg) {
    let φ = latDeg * Math.PI / 180;
    let λ = lonDeg * Math.PI / 180;
    let qy = this._qFromAxisAngle(0,1,0, -λ);
    let qx = this._qFromAxisAngle(1,0,0,  φ);
    this.q = this._qNormalize(this._qMul(qx, qy));
    this._updateRot();
    this.render();
  }
  centerOnAntarctica() { this.centerOnLatLon(-90, 0); }
  setQuality(q) { this.opts.quality = Math.min(2, Math.max(0.5, q || 1)); this._discSize = 0; this.render(); }

  resize() {
    let dpr = (this.opts.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
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

  // ---------- Render ----------
  render() {
    if (this._shadingInProgress) { this._rerenderRequested = true; return; }

    let ctx = this.ctx;
    let rect = this.canvas.getBoundingClientRect();
    let width = rect.width || this.canvas.width / this.opts.dpr;
    let height = rect.height || this.canvas.height / this.opts.dpr;

    ctx.clearRect(0, 0, width, height);
    if (this.opts.background) {
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, width, height);
    }

    let pad = this.opts.padding;
    let r = Math.max(1, Math.min(width, height) / 2 - pad);
    let cx = width / 2, cy = height / 2;

    // Placeholder ocean fill so it isn't black while workers run
    let bc = this.opts.baseColor;
    let pr = Math.max(0, Math.min(255, Math.round(Math.pow(bc[0], 1/2.2) * 255)));
    let pg = Math.max(0, Math.min(255, Math.round(Math.pow(bc[1], 1/2.2) * 255)));
    let pb = Math.max(0, Math.min(255, Math.round(Math.pow(bc[2], 1/2.2) * 255)));
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();
    ctx.fillStyle = 'rgb(' + pr + ',' + pg + ',' + pb + ')';
    ctx.fillRect(cx - r, cy - r, 2*r, 2*r);
    ctx.restore();

    // Internal disc size & rotation
    let q = this.opts.quality;
    let d = Math.max(2, Math.floor(2 * r * q));
    this._updateRot();

    // Ensure disc + workers
    this._ensureDiscAndWorkers(d);

    // Shade with workers
    this._shadingInProgress = true;
    let jobId = ++this._jobSeq;

    this._shadeWithWorkers(jobId, {
      Rt: this.Rt,
      sun: this.sun,
      amb: this.opts.ambient,
      kd: this.opts.diffuse,
      ks: this.opts.specular,
      shininess: this.opts.shininess,
      termSoft: this.opts.terminatorSoftness,
      atm: this.opts.atmosphere,
      back: this.opts.backlight,
      baseColor: this.opts.baseColor
    }).then((completedJobId) => {
      if (completedJobId !== this._jobSeq) return; // stale result, ignore

      let off = this._getOff(d, d);
      off.ctx.putImageData(this._imgData, 0, 0);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.clip();
      let drawSize = d / this.opts.quality;
      ctx.drawImage(off.canvas, cx - drawSize/2, cy - drawSize/2, drawSize, drawSize);

      if (this.opts.grid.enabled) this._drawGraticule(cx, cy, r, this._isAnimating ? 2 : 1);
      this._drawAntarctica(cx, cy, r);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      this._shadingInProgress = false;
      if (this._rerenderRequested) {
        this._rerenderRequested = false;
        this.render();
      }
    }).catch(() => {
      this._shadingInProgress = false;
    });
  }

  // ---------- Workers / tiling ----------
  _ensureDiscAndWorkers(d) {
    if (this._discSize !== d) {
      this._buildNormalMap(d);
      this._discSize = d;

      if (this._useSAB) {
        this._rgbaSAB = new SharedArrayBuffer(d * d * 4);
        this._rgba = new Uint8ClampedArray(this._rgbaSAB);
        this._imgData = new ImageData(this._rgba, d, d);
      } else {
        this._rgbaSAB = null;
        this._rgba = new Uint8ClampedArray(d * d * 4);
        this._imgData = new ImageData(this._rgba, d, d);
      }
      this._initWorkerPool(d);
    } else if (this._workers.length === 0) {
      this._initWorkerPool(d);
    }
  }

  _initWorkerPool(d) {
    for (let i = 0; i < this._workers.length; i++) {
      try { this._workers[i].terminate(); } catch(e){}
    }
    this._workers = [];
    if (!this._useWorkers) return;

    let src = this._workerSource();
    let blob = new Blob([src], { type: 'application/javascript' });
    let url = URL.createObjectURL(blob);

    let N = Math.max(1, Math.min(this.opts.maxWorkers, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4)));
    for (let i = 0; i < N; i++) {
      let w = new Worker(url);
      this._workers.push(w);
    }
    // Workers have loaded the code by now
    URL.revokeObjectURL(url);

    // Prepare and send INIT per worker
    if (this._useSAB) {
      let sabNx = new SharedArrayBuffer(this._Nx.byteLength);
      let sabNy = new SharedArrayBuffer(this._Ny.byteLength);
      let sabNz = new SharedArrayBuffer(this._Nz.byteLength);
      let sabA8 = new SharedArrayBuffer(this._A8.byteLength);
      new Float32Array(sabNx).set(this._Nx);
      new Float32Array(sabNy).set(this._Ny);
      new Float32Array(sabNz).set(this._Nz);
      new Uint8ClampedArray(sabA8).set(this._A8);

      for (let i = 0; i < this._workers.length; i++) {
        this._workers[i].postMessage({
          type: 'init',
          d,
          useSAB: true,
          sabRGBA: this._rgbaSAB,
          sabNx, sabNy, sabNz, sabA8
        });
      }
    } else {
      // IMPORTANT: clone **per worker**; each transfer detaches the buffer!
      for (let i = 0; i < this._workers.length; i++) {
        let nxBuf = this._Nx.buffer.slice(0);
        let nyBuf = this._Ny.buffer.slice(0);
        let nzBuf = this._Nz.buffer.slice(0);
        let a8Buf = this._A8.buffer.slice(0);
        this._workers[i].postMessage({
          type: 'init',
          d,
          useSAB: false,
          sabRGBA: null,
          sabNx: nxBuf, sabNy: nyBuf, sabNz: nzBuf, sabA8: a8Buf
        }, [nxBuf, nyBuf, nzBuf, a8Buf]);
      }
    }
  }

  _shadeWithWorkers(jobId, params) {
    if (this._workers.length === 0) {
      return new Promise((resolve) => {
        this._shadeTileOnMain(0, this._discSize, params);
        resolve(jobId);
      });
    }

    let d = this._discSize;
    let W = this._workers.length;
    let colsPer = Math.floor(d / W);
    let rem = d - colsPer * W;
    let promises = [];
    let self = this;

    for (let i = 0; i < W; i++) {
      let x0 = i * colsPer + Math.min(i, rem);
      let x1 = x0 + colsPer + (i < rem ? 1 : 0);

      promises.push(new Promise(function(resolve) {
        let w = self._workers[i];

        let handler = function(ev) {
          let m = ev.data;
          if (!m || m.jobId !== jobId) return;
          // Non-SAB: stitch returned tile
          if (!self._useSAB && m.rgba) {
            let tile = new Uint8ClampedArray(m.rgba);
            let width = self._discSize;
            let tileW = x1 - x0;
            for (let y = 0; y < width; y++) {
              let dst = (y * width + x0) * 4;
              let src = (y * tileW) * 4;
              self._rgba.set(tile.subarray(src, src + tileW*4), dst);
            }
          }
          w.removeEventListener('message', handler);
          resolve();
        };
        w.addEventListener('message', handler);

        w.postMessage({
          type: 'shade',
          jobId,
          x0, x1,
          Rt: params.Rt,
          sun: params.sun,
          amb: params.amb, kd: params.kd, ks: params.ks,
          shininess: params.shininess,
          termSoft: params.termSoft, atm: params.atm, back: params.back,
          baseColor: params.baseColor
        });
      }));
    }

    return Promise.all(promises).then(function(){ return jobId; });
  }

  // ---------- Single-thread fallback ----------
  _shadeTileOnMain(x0, x1, P) {
    let d = this._discSize;
    let Nx = this._Nx, Ny = this._Ny, Nz = this._Nz, A8 = this._A8;
    let rgba = this._rgba;

    let Lx = P.sun[0], Ly = P.sun[1], Lz = P.sun[2];
    let Hx = Lx, Hy = Ly, Hz = Lz + 1.0;
    let invH = 1 / Math.hypot(Hx, Hy, Hz);
    Hx *= invH; Hy *= invH; Hz *= invH;

    let amb = P.amb, kd = P.kd, ks = P.ks, shin = P.shininess;
    let termSoft = P.termSoft, atm = P.atm, back = P.back;
    let baseR = P.baseColor[0], baseG = P.baseColor[1], baseB = P.baseColor[2];

    let tone = function(c){ return 1 - Math.exp(-2.6*c); };
    let toSRGB = function(l){ if (l<0) l=0; if (l>1) l=1; return Math.pow(l, 1/2.2); };

    for (let y = 0; y < d; y++) {
      let row = y * d;
      for (let x = x0; x < x1; x++) {
        let i = row + x;
        let nz = Nz[i];
        let p = i<<2;
        if (nz < 0) { rgba[p]=0; rgba[p+1]=0; rgba[p+2]=0; rgba[p+3]=0; continue; }
        let nx = Nx[i], ny = Ny[i];

        let NL = nx*Lx + ny*Ly + nz*Lz;
        let NV = nz;
        let NH = nx*Hx + ny*Hy + nz*Hz;

        let t = (NL + termSoft) / (2*termSoft);
        if (t < 0) t = 0; else if (t > 1) t = 1;
        let dayMask = (3 - 2*t) * t * t * (NL > 0 ? NL : 0);

        let diff = kd * dayMask;
        let spec = NL > 0 ? ks * Math.pow(NH > 0 ? NH : 0, shin) : 0;

        let rimDay = atm * Math.pow(1 - (NV < 0 ? 0 : (NV > 1 ? 1 : NV)), 2.4) * (NL + 0.15 > 0 ? NL + 0.15 : 0);
        let rimBack = 0;
        if (Lz < 0) {
          let away = NL < 0 ? -NL : 0;
          rimBack = back * Math.pow(1 - (NV < 0 ? 0 : (NV > 1 ? 1 : NV)), 3.2) * away;
        }

        let rLin = baseR*(amb + diff) + spec + 0.40*rimDay + 0.25*rimBack;
        let gLin = baseG*(amb + diff) + spec + 0.65*rimDay + 0.40*rimBack;
        let bLin = baseB*(amb + diff) + spec + 1.00*rimDay + 0.80*rimBack;

        rLin = tone(rLin); gLin = tone(gLin); bLin = tone(bLin);

        rgba[p]   = Math.round(toSRGB(rLin)*255);
        rgba[p+1] = Math.round(toSRGB(gLin)*255);
        rgba[p+2] = Math.round(toSRGB(bLin)*255);
        rgba[p+3] = A8[i];
      }
    }
  }

  // ---------- Worker source ----------
  _workerSource() {
    let s = '';
    s += `
    let d=0, useSAB=false;
    let Nx=null, Ny=null, Nz=null, A8=null;
    let rgba=null;

    function tone(c){ return 1 - Math.exp(-2.6*c); }
    function toSRGB(l){ if (l<0) l=0; if (l>1) l=1; return Math.pow(l, 1/2.2); }

    onmessage = function(ev){
      let m = ev.data;
      if (m.type === 'init') {
        d = m.d;
        useSAB = !!m.useSAB;
        if (useSAB) {
          if (m.sabRGBA) rgba = new Uint8ClampedArray(m.sabRGBA);
          Nx = new Float32Array(m.sabNx);
          Ny = new Float32Array(m.sabNy);
          Nz = new Float32Array(m.sabNz);
          A8 = new Uint8ClampedArray(m.sabA8);
        } else {
          Nx = new Float32Array(m.sabNx);
          Ny = new Float32Array(m.sabNy);
          Nz = new Float32Array(m.sabNz);
          A8 = new Uint8ClampedArray(m.sabA8);
        }
        return;
      }
      if (m.type === 'shade') {
        let jobId = m.jobId|0;
        let x0 = m.x0|0, x1 = m.x1|0;

        let Lx = m.sun[0], Ly = m.sun[1], Lz = m.sun[2];
        let Hx = Lx, Hy = Ly, Hz = Lz + 1.0;
        let invH = 1 / Math.hypot(Hx,Hy,Hz);
        Hx *= invH; Hy *= invH; Hz *= invH;

        let amb = m.amb, kd = m.kd, ks = m.ks, shin = m.shininess;
        let termSoft = m.termSoft, atm = m.atm, back = m.back;
        let baseR = m.baseColor[0], baseG = m.baseColor[1], baseB = m.baseColor[2];

        if (useSAB) {
          for (let y=0; y<d; y++) {
            let row = y * d;
            for (let x=x0; x<x1; x++) {
              let i = row + x;
              let nz = Nz[i];
              let p = i<<2;
              if (nz < 0) { rgba[p]=0; rgba[p+1]=0; rgba[p+2]=0; rgba[p+3]=0; continue; }
              let nx = Nx[i], ny = Ny[i];

              let NL = nx*Lx + ny*Ly + nz*Lz;
              let NV = nz;
              let NH = nx*Hx + ny*Hy + nz*Hz;

              let t = (NL + termSoft) / (2*termSoft);
              if (t<0) t=0; else if (t>1) t=1;
              let dayMask = (3-2*t)*t*t*(NL>0?NL:0);

              let diff = kd * dayMask;
              let spec = NL>0 ? ks * Math.pow(NH>0?NH:0, shin) : 0;

              let rimDay = atm * Math.pow(1 - (NV<0?0:(NV>1?1:NV)), 2.4) * (NL+0.15>0?NL+0.15:0);
              let rimBack = 0;
              if (Lz < 0) {
                let away = NL<0 ? -NL : 0;
                rimBack = back * Math.pow(1 - (NV<0?0:(NV>1?1:NV)), 3.2) * away;
              }

              let rLin = baseR*(amb + diff) + spec + 0.40*rimDay + 0.25*rimBack;
              let gLin = baseG*(amb + diff) + spec + 0.65*rimDay + 0.40*rimBack;
              let bLin = baseB*(amb + diff) + spec + 1.00*rimDay + 0.80*rimBack;

              rLin = tone(rLin); gLin = tone(gLin); bLin = tone(bLin);

              rgba[p]   = Math.round(toSRGB(rLin)*255);
              rgba[p+1] = Math.round(toSRGB(gLin)*255);
              rgba[p+2] = Math.round(toSRGB(bLin)*255);
              rgba[p+3] = A8[i];
            }
          }
          postMessage({ jobId });
        } else {
          let tileW = x1 - x0;
          let out = new Uint8ClampedArray(tileW * d * 4);
          for (let y=0; y<d; y++) {
            let row = y * d;
            let base = y * tileW * 4;
            for (let x=x0; x<x1; x++) {
              let i = row + x;
              let nz = Nz[i];
              let p = base + (x - x0) * 4;
              if (nz < 0) { out[p]=0; out[p+1]=0; out[p+2]=0; out[p+3]=0; continue; }
              let nx = Nx[i], ny = Ny[i];

              let NL = nx*Lx + ny*Ly + nz*Lz;
              let NV = nz;
              let NH = nx*Hx + ny*Hy + nz*Hz;

              let t = (NL + termSoft) / (2*termSoft);
              if (t<0) t=0; else if (t>1) t=1;
              let dayMask = (3-2*t)*t*t*(NL>0?NL:0);

              let diff = kd * dayMask;
              let spec = NL>0 ? ks * Math.pow(NH>0?NH:0, shin) : 0;

              let rimDay = atm * Math.pow(1 - (NV<0?0:(NV>1?1:NV)), 2.4) * (NL+0.15>0?NL+0.15:0);
              let rimBack = 0;
              if (Lz < 0) {
                let away = NL<0 ? -NL : 0;
                rimBack = back * Math.pow(1 - (NV<0?0:(NV>1?1:NV)), 3.2) * away;
              }

              let rLin = baseR*(amb + diff) + spec + 0.40*rimDay + 0.25*rimBack;
              let gLin = baseG*(amb + diff) + spec + 0.65*rimDay + 0.40*rimBack;
              let bLin = baseB*(amb + diff) + spec + 1.00*rimDay + 0.80*rimBack;

              rLin = tone(rLin); gLin = tone(gLin); bLin = tone(bLin);

              out[p]   = Math.round(toSRGB(rLin)*255);
              out[p+1] = Math.round(toSRGB(gLin)*255);
              out[p+2] = Math.round(toSRGB(bLin)*255);
              out[p+3] = A8[i];
            }
          }
          postMessage({ jobId, rgba: out.buffer }, [out.buffer]);
        }
      }
    };
    `;
    return s;
  }

  // ---------- Graticule & Antarctica ----------
  _drawGraticule(cx, cy, r, coarsenFactor) {
    let g = this.opts.grid;
    let ctx = this.ctx;
    let stepLat = Math.max(2, g.stepLat * (coarsenFactor || 1));
    let stepLon = Math.max(2, g.stepLon * (coarsenFactor || 1));
    let sampleStep = Math.max(1, Math.floor(g.sampleStepDeg * (coarsenFactor || 1)));

    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.globalAlpha = g.alpha;
    ctx.lineWidth = g.lineWidth;
    ctx.lineCap = 'round';

    for (let lat=-80; lat<=80; lat+=stepLat) this._strokeLatitude(cx, cy, r, lat, sampleStep);
    for (let lon=-180; lon<180; lon+=stepLon) this._strokeLongitude(cx, cy, r, lon, sampleStep);

    ctx.restore();
  }

  _drawAntarctica(cx, cy, r) {
    let ctx = this.ctx;
    let allFront = true;
    for (let i=0;i<this._ANT.length;i++){
      let w = this._latLonToXYZ(this._ANT[i][0], this._ANT[i][1]);
      let c = this._applyR(w);
      if (c[2] < 0) { allFront = false; break; }
    }

    ctx.save();
    ctx.fillStyle = this.opts.antarcticaFill;
    ctx.strokeStyle = this.opts.antarcticaStroke;
    ctx.lineWidth = this.opts.antarcticaLineWidth;

    if (allFront) {
      ctx.beginPath();
      for (let i=0;i<this._ANT.length;i++){
        let v = this._projectLatLon(this._ANT[i][0], this._ANT[i][1]); if (!v) continue;
        let x = cx + r*v[0], y = cy - r*v[1];
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      let runs = this._densifyAndSplitFrontRuns(this._ANT, 1.2);
      for (let k=0;k<runs.length;k++){
        let run = runs[k]; if (run.length<2) continue;
        ctx.beginPath();
        for (let i=0;i<run.length;i++){
          let v = this._projectLatLon(run[i][0], run[i][1]); if (!v) continue;
          let x = cx + r*v[0], y = cy - r*v[1];
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  _strokeLatitude(cx, cy, r, latDeg, stepDeg) {
    let ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let lon=-180; lon<=180; lon+=stepDeg) {
      let v = this._projectLatLon(latDeg, lon);
      if (!v) { drawing = false; continue; }
      let x = cx + r*v[0], y = cy - r*v[1];
      if (!drawing) { ctx.moveTo(x,y); drawing=true; } else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  _strokeLongitude(cx, cy, r, lonDeg, stepDeg) {
    let ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let lat=-90; lat<=90; lat+=stepDeg) {
      let v = this._projectLatLon(lat, lonDeg);
      if (!v) { drawing = false; continue; }
      let x = cx + r*v[0], y = cy - r*v[1];
      if (!drawing) { ctx.moveTo(x,y); drawing=true; } else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  _densifyAndSplitFrontRuns(latLonPts, stepDeg) {
    let out = [];
    let pts = latLonPts.slice(0);
    if (pts[0][0] !== pts[pts.length-1][0] || pts[0][1] !== pts[pts.length-1][1]) {
      pts.push([pts[0][0], pts[0][1]]);
    }
    let run = [];
    for (let i=0;i<pts.length-1;i++){
      let a=pts[i], b=pts[i+1];
      let seg=this._interpLL(a,b,stepDeg);
      for (let j=0;j<seg.length;j++){
        let W=this._latLonToXYZ(seg[j][0], seg[j][1]);
        let C=this._applyR(W);
        if (C[2]>=0) run.push([seg[j][0], seg[j][1]]);
        else { if (run.length>2) out.push(run); run=[]; }
      }
    }
    if (run.length>2) out.push(run);
    return out;
  }
  _interpLL(a,b,stepDeg){
    let latA=a[0], lonA=a[1], latB=b[0], lonB=b[1];
    let dLon = lonB - lonA; if (dLon>180) dLon-=360; if (dLon<-180) dLon+=360;
    let dLat = latB - latA;
    let dist = Math.hypot(dLat, dLon);
    let steps = Math.max(1, Math.ceil(dist / stepDeg));
    let out = [];
    for (let i=0;i<steps;i++){
      let t = i/steps;
      out.push([latA + dLat*t, lonA + dLon*t]);
    }
    return out;
  }

  _projectLatLon(latDeg, lonDeg) {
    let v = this._latLonToXYZ(latDeg, lonDeg);
    let c = this._applyR(v);
    if (c[2] < 0) return null;
    return [c[0], c[1]];
  }
  _latLonToXYZ(latDeg, lonDeg){
    let φ = latDeg * Math.PI / 180, λ = lonDeg * Math.PI / 180;
    let cφ = Math.cos(φ), sφ = Math.sin(φ);
    let sλ = Math.sin(λ), cλ = Math.cos(λ);
    return [cφ*sλ, sφ, cφ*cλ];
  }

  // ---------- Unit-disc normal map ----------
  _buildNormalMap(d) {
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
          this._Nz[i] = -1;
          this._A8[i] = 0;
        } else {
          let dist = Math.sqrt(rr);
          let vz = Math.sqrt(1 - (rr < 0 ? 0 : rr));
          this._Nx[i] = vx; this._Ny[i] = vy; this._Nz[i] = vz;
          let aa = (1 - dist) * rad; if (aa < 0) aa = 0; if (aa > 1) aa = 1;
          this._A8[i] = Math.round(255 * aa);
        }
        i++;
      }
    }
  }

  // ---------- Offscreen ----------
  _getOff(w, h) {
    if (!this._off || this._off.canvas.width !== w || this._off.canvas.height !== h) {
      let c = document.createElement('canvas'); c.width = w; c.height = h;
      this._off = { canvas: c, ctx: c.getContext('2d') };
    }
    return this._off;
  }

  // ---------- Arcball + inertia ----------
  _attachPointerHandlers() {
    let el = this.canvas;
    let s = getComputedStyle(el);
    if (s.touchAction !== 'none') el.style.touchAction = 'none';
    let onDown = (ev) => {
      this._dragging = true; this._isAnimating = true;
      this._v0 = this._screenToArcball(ev.clientX, ev.clientY);
      this._omega = 0; this._lastTime = performance.now();
      try { el.setPointerCapture(ev.pointerId); } catch(e){}
    };
    let onMove = (ev) => {
      if (!this._dragging) return;
      let v1 = this._screenToArcball(ev.clientX, ev.clientY);
      let dq = this._qFromVectors(this._v0, v1);
      this.q = this._qNormalize(this._qMul(dq, this.q));
      this._v0 = v1;

      let now = performance.now(), dt = Math.max(1, now - this._lastTime) / 1000;
      this._lastTime = now;

      let angle = 2 * Math.acos(Math.max(-1, Math.min(1, dq[3])));
      if (angle > Math.PI) angle = 2*Math.PI - angle;
      let s = Math.sqrt(Math.max(0, 1 - dq[3]*dq[3]));
      if (s < 1e-6) { this._axis[0]=0; this._axis[1]=1; this._axis[2]=0; }
      else { this._axis[0]=dq[0]/s; this._axis[1]=dq[1]/s; this._axis[2]=dq[2]/s; }
      this._omega = angle / dt;

      this._updateRot();
      this.render();
    };
    let onUp = (ev) => {
      this._dragging = false;
      try { el.releasePointerCapture(ev.pointerId); } catch(e){}
      this._startInertia();
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
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
    if (this._omega <= this.opts.inertiaMinSpeed) { this._omega = 0; this._isAnimating = false; this.render(); return; }
    let friction = this.opts.inertiaFriction;
    let last = performance.now();
    let step = (now) => {
      let dt = Math.max(1, now - last) / 1000; last = now;
      this._omega *= Math.exp(-friction * dt);
      if (this._omega <= this.opts.inertiaMinSpeed) {
        this._omega = 0; this._isAnimating = false; this._animRAF = 0; this.render(); return;
      }
      let dq = this._qFromAxisAngle(this._axis[0], this._axis[1], this._axis[2], this._omega * dt);
      this.q = this._qNormalize(this._qMul(dq, this.q));
      this._updateRot();
      this.render();
      this._animRAF = requestAnimationFrame(step);
    };
    if (this._animRAF) cancelAnimationFrame(this._animRAF);
    this._animRAF = requestAnimationFrame(step);
  }
  _screenToArcball(clientX, clientY) {
    let rect = this.canvas.getBoundingClientRect();
    let cx = rect.left + rect.width / 2;
    let cy = rect.top + rect.height / 2;
    let pad = this.opts.padding;
    let r = Math.max(1, Math.min(rect.width, rect.height)/2 - pad);
    let x = (clientX - cx) / r;
    let y = (cy - clientY) / r;
    let d2 = x*x + y*y;
    if (d2 <= 1) return [x, y, Math.sqrt(1 - d2)];
    let inv = 1 / Math.sqrt(d2);
    return [x*inv, y*inv, 0];
  }

  // ---------- Math ----------
  _updateRot() { this.R = this._mat3FromQuat(this.q); this.Rt = this._mat3Transpose(this.R); }
  _applyR(v) {
    let R = this.R;
    return [ R[0]*v[0] + R[3]*v[1] + R[6]*v[2],
             R[1]*v[0] + R[4]*v[1] + R[7]*v[2],
             R[2]*v[0] + R[5]*v[1] + R[8]*v[2] ];
  }
  _qIdentity() { return [0,0,0,1]; }
  _qNormalize(q){ let x=q[0],y=q[1],z=q[2],w=q[3]; let n=Math.hypot(x,y,z,w)||1; q[0]=x/n;q[1]=y/n;q[2]=z/n;q[3]=w/n; return q; }
  _qMul(a,b){ return [ a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
                       a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
                       a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
                       a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2] ]; }
  _qFromAxisAngle(ax,ay,az,angle){ let n=Math.hypot(ax,ay,az)||1; let s=Math.sin(angle*0.5)/n; return [ax*s,ay*s,az*s,Math.cos(angle*0.5)]; }
  _qFromVectors(u,v){
    let dot=u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
    if (dot>=1-1e-10) return [0,0,0,1];
    if (dot<=-1+1e-10){ let ax=Math.abs(u[0])<0.9?1:0, ay=Math.abs(u[1])<0.9?1:0, az=Math.abs(u[2])<0.9?1:0;
      let cx=u[1]*az-u[2]*ay, cy=u[2]*ax-u[0]*az, cz=u[0]*ay-u[1]*ax; return this._qNormalize([cx,cy,cz,0]); }
    let cx=u[1]*v[2]-u[2]*v[1], cy=u[2]*v[0]-u[0]*v[2], cz=u[0]*v[1]-u[1]*v[0], w=1+dot;
    return this._qNormalize([cx,cy,cz,w]);
  }
  _mat3FromQuat(q){
    let x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z,xx=x*x2,yy=y*y2,zz=z*z2,xy=x*y2,xz=x*z2,yz=y*z2,wx=w*x2,wy=w*y2,wz=w*z2;
    return [1-(yy+zz), xy+wz, xz-wy, xy-wz, 1-(xx+zz), yz+wx, xz+wy, yz-wx, 1-(xx+yy)];
  }
  _mat3Transpose(m){ return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]]; }
  _normVec(v){ let n=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/n, v[1]/n, v[2]/n]; }
}
class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }
        const compose = () => {
            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Dropdown_Menu',
                pos: [5, 5]
            });
            window.size = [1000, 1000];
            const canvas = new controls.Canvas({
                context
            });
            canvas.dom.attributes.id = 'globeCanvas'
            canvas.size = [900, 900];
            window.inner.add(canvas);
            this.body.add(window);
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.canvas = this.canvas = canvas;
        }
        if (!spec.el) {
            compose();
            //this.add_change_listeners();
        }
    }
    /*
    add_change_listeners() {
        const {select_options} = this;
        select_options.data.model.on('change', e => {
            console.log('select_options.data.model change e', e);
        });
    }
        */
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, ti1, ti2} = this;
            //this.add_change_listeners();
            console.log('activate Demo_UI');
            context.on('window-resize', e_resize => {
            });

            /*
            const globe = new EarthGlobeRenderer("globeCanvas", {
              background: "#081019",
              quality: 1.25,
              grid: { enabled: true, color: "#444" },   // dark grey default
              inertiaFriction: 2.8,
              zoom: 1
            });

            // Place sun front-left-up:
            globe.setSunFromSpherical(-35, 25);
            */

            let globe = new EarthGlobeRenderer('globeCanvas', {
              background: '#081019',
              quality: 1.2,
              grid: { enabled: true, color: '#444' } // dark grey default
            });
            globe.setSunFromSpherical(-35, 25);
        }
    }
}
Demo_UI.css = `
* {
    margin: 0;
    padding: 0;
}
body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #E0E0E0;
}
.demo-ui {
}
`;
controls.Demo_UI = Demo_UI;
module.exports = jsgui;