


const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Checkbox, Date_Picker, Text_Input, Text_Field, Dropdown_Menu} = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');


// EarthLikeSphereRenderer.js
// Renders a blue "Earth-like" sphere with sunlit shading and ocean glint.
// - Proper diffuse + specular lighting from a 3D sun direction vector
// - Soft day/night terminator
// - Atmospheric rim, including backlit twilight when the sun is behind Earth
// - High-DPI aware, resizes with the canvas element

class EarthLikeSphereRenderer {
  constructor(canvas, opts = {}) {
    this.canvas =
      typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error("Pass a canvas element or its id");
    }

    this.ctx = this.canvas.getContext("2d");

    // Lighting / material defaults tuned for "ocean Earth" look
    this.opts = {
      padding: opts.padding ?? 8,
      background: opts.background ?? null,        // e.g. "#071018" or null
      baseColor: opts.baseColor ?? [0.13, 0.42, 0.86], // ocean-ish RGB (linear-ish 0..1)
      ambient: opts.ambient ?? 0.08,              // base floor light
      diffuse: opts.diffuse ?? 1.0,               // lambertian strength
      specular: opts.specular ?? 0.75,            // specular strength (ocean glint)
      shininess: opts.shininess ?? 120.0,         // specular tightness (higher = tighter)
      terminatorSoftness: opts.terminatorSoftness ?? 0.08, // soften day/night edge
      atmosphere: opts.atmosphere ?? 0.45,        // day-side rim
      backlight: opts.backlight ?? 0.22,          // night-side backscatter (sun behind)
      dpr: window.devicePixelRatio || 1,
      quality: Math.min(2, Math.max(0.5, opts.quality ?? 1.0)), // internal sampling scale
    };

    // Default sun direction (unit; toward viewer is +Z). This is "above-left-front".
    this.sun = this._normalize([ -0.45, 0.55, 0.65 ]);

    this.resize();
    this.render();

    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener("resize", this._onResize, { passive: true });
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
  }

  // ---- Public controls ------------------------------------------------------

  /**
   * Set sun direction as a unit vector [x, y, z] in camera coordinates.
   * Axes: +X right, +Y up, +Z toward camera (viewer).
   * Example: front-left-up is [-0.5, 0.5, 0.7]
   */
  setSunDirection(vec3) {
    this.sun = this._normalize(vec3);
    this.render();
  }

  /**
   * Convenience: set sun from spherical angles (degrees).
   * lonDeg: 0° is toward camera (+Z), +90° is to the right (+X), ±180° is away (-Z)
   * latDeg: +90° straight up (+Y), -90° straight down (-Y)
   */
  setSunFromSpherical(lonDeg, latDeg) {
    const toRad = Math.PI / 180;
    const lon = lonDeg * toRad;
    const lat = latDeg * toRad;
    const cx = Math.cos(lat), sx = Math.sin(lat);
    const sz = Math.sin(lon), cz = Math.cos(lon);
    this.setSunDirection([ cx * sz, sx, cx * cz ]);
  }

  /**
   * Convenience: set sun from azimuth/elevation (degrees) in camera frame.
   * azimuthDeg: 0° = straight toward camera (+Z), 90° = right (+X), 180° = away (-Z)
   * elevationDeg: 0° = horizon plane, +90° = straight up (+Y)
   */
  setSunFromAzEl(azimuthDeg, elevationDeg) {
    this.setSunFromSpherical(azimuthDeg, elevationDeg);
  }

  /**
   * Optional helper: very rough astronomical position -> direction in an
   * inertial, equatorial-like frame (J2000-ish). For realism you’ll typically
   * rotate this into your camera frame. Good enough as a starting point.
   */
  setSunApproxFromDateUTC(dateUtc /* Date */) {
    const vEci = this._approxSunEciUnit(dateUtc);
    // Default assumption: camera frame aligned with ECI, viewer on +Z.
    // If you have your own camera orientation, rotate vEci accordingly before setSunDirection.
    this.setSunDirection(vEci);
  }

  // ---- Canvas sizing --------------------------------------------------------

  resize() {
    const dpr = (this.opts.dpr = window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width || this.canvas.width;
    const displayHeight = rect.height || this.canvas.height;

    const w = Math.max(1, Math.round(displayWidth * dpr));
    const h = Math.max(1, Math.round(displayHeight * dpr));

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Scale so drawing uses CSS pixels.
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  // ---- Rendering ------------------------------------------------------------

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

    // Sphere geometry
    const pad = this.opts.padding;
    const r = Math.max(1, Math.min(width, height) / 2 - pad);
    const cx = width / 2;
    const cy = height / 2;

    // Offscreen buffer in CSS pixels for clean putImageData/drawImage
    // (quality allows oversampling for smoother edges/specular)
    const q = this.opts.quality;
    const d = Math.max(2, Math.floor(2 * r * q));
    const off = this._getOffscreen(d, d);
    const id = off.ctx.createImageData(d, d);
    const data = id.data;

    // Precompute lighting constants
    const L = this.sun; // [x,y,z], unit
    const V = [0, 0, 1]; // viewer along +Z
    const H = this._normalize([ L[0] + V[0], L[1] + V[1], L[2] + V[2] ]); // Blinn-Phong half-vector

    const base = this.opts.baseColor;           // base ocean color (linear-ish 0..1)
    const amb = this.opts.ambient;
    const kd = this.opts.diffuse;
    const ks = this.opts.specular;
    const shin = this.opts.shininess;
    const termSoft = this.opts.terminatorSoftness;
    const atm = this.opts.atmosphere;
    const back = this.opts.backlight;

    // Helpers
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const smoothstep = (e0, e1, x) => {
      const t = clamp01((x - e0) / (e1 - e0));
      return t * t * (3 - 2 * t);
    };
    const pow = Math.pow;

    // Loop over the square and shade only pixels within the circle
    const rad = d * 0.5;
    const invR = 1 / rad;

    let p = 0;
    for (let y = 0; y < d; y++) {
      const vy_screen = (y + 0.5 - rad) * invR; // +down in screen
      for (let x = 0; x < d; x++) {
        const vx = (x + 0.5 - rad) * invR;      // +right
        const vy = -vy_screen;                  // convert to +up for math

        const rr = vx * vx + vy * vy;
        if (rr > 1.0005) {
          // outside sphere — transparent
          data[p++] = 0; data[p++] = 0; data[p++] = 0; data[p++] = 0;
          continue;
        }

        // Anti-aliased edge alpha: blend over ~1 pixel at the rim
        const dist = Math.sqrt(rr);
        const aa = clamp01((1 - dist) * rad); // ~1 pixel smoothing
        const alpha = Math.round(255 * aa);

        // Sphere normal
        const vz = Math.sqrt(Math.max(0, 1 - rr));
        const N = [vx, vy, vz];

        // Lighting terms
        const NL = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];         // cosine to light
        const NV = N[2];                                            // dot(N, V) since V = [0,0,1]
        const NH = N[0] * H[0] + N[1] * H[1] + N[2] * H[2];

        // Softened terminator so night/day edge isn’t razor-sharp
        const dayMask = smoothstep(-termSoft, termSoft, NL) * clamp01(NL);

        // Diffuse (Lambert)
        const diff = kd * dayMask;

        // Specular (Blinn-Phong) — only on lit side
        const spec = NL > 0 ? ks * pow(clamp01(NH), shin) : 0;

        // Atmospheric rim (day side): stronger near limb (low NV)
        let rimDay = atm * pow(1 - clamp01(NV), 2.4) * clamp01(NL + 0.15);

        // Backlit rim (sun behind Earth): glow near limb where N faces away from sun
        let rimBack = 0;
        if (L[2] < 0) { // sun somewhere behind viewer
          const away = clamp01(-NL); // how much the normal faces away from light
          rimBack = back * pow(1 - clamp01(NV), 3.2) * away;
        }

        // Combine lighting
        let rLin = base[0] * (amb + diff) + spec + 0.40 * rimDay + 0.25 * rimBack;
        let gLin = base[1] * (amb + diff) + spec + 0.65 * rimDay + 0.40 * rimBack;
        let bLin = base[2] * (amb + diff) + spec + 1.00 * rimDay + 0.80 * rimBack;

        // Simple tone & gamma to keep it punchy but not clipped
        const tone = (c) => 1 - Math.exp(-2.6 * c); // filmic-ish
        rLin = tone(rLin); gLin = tone(gLin); bLin = tone(bLin);

        const r8 = Math.round(clamp01(pow(rLin, 1 / 2.2)) * 255);
        const g8 = Math.round(clamp01(pow(gLin, 1 / 2.2)) * 255);
        const b8 = Math.round(clamp01(pow(bLin, 1 / 2.2)) * 255);

        data[p++] = r8; data[p++] = g8; data[p++] = b8; data[p++] = alpha;
      }
    }

    // Blit with masking onto main canvas
    off.ctx.putImageData(id, 0, 0);

    // Draw at the correct size and position; offscreen is in CSS px already
    const drawSize = (d / q);
    const drawX = cx - drawSize * 0.5;
    const drawY = cy - drawSize * 0.5;

    // Ensure we stay within a circular footprint on the main canvas
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(off.canvas, drawX, drawY, drawSize, drawSize);
    ctx.restore();

    // Optional subtle outline for crispness
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // ---- Internals ------------------------------------------------------------

  _getOffscreen(w, h) {
    if (!this._off || this._off.canvas.width !== w || this._off.canvas.height !== h) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      this._off = { canvas: c, ctx: c.getContext("2d") };
    }
    return this._off;
  }

  _normalize(v) {
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    return [ v[0] / n, v[1] / n, v[2] / n ];
  }

  // Very rough solar position in an Earth-centered, equatorial-like frame.
  // Enough to get a plausible sun direction that varies with date.
  _approxSunEciUnit(dateUtc) {
    // Julian centuries since J2000
    const JD = (dateUtc.getTime() / 86400000) + 2440587.5;
    const n = JD - 2451545.0;

    // mean anomaly (deg) & mean longitude (deg)
    const g = this._deg2rad((357.529 + 0.98560028 * n) % 360);
    const L = this._deg2rad((280.459 + 0.98564736 * n) % 360);

    // ecliptic longitude (deg)
    const lambda = L + this._deg2rad(1.915) * Math.sin(g) + this._deg2rad(0.020) * Math.sin(2 * g);

    // obliquity of the ecliptic (deg)
    const eps = this._deg2rad(23.439 - 0.00000036 * n);

    // convert to equatorial (RA/Dec) then to Cartesian unit vector
    const x = Math.cos(lambda);
    const y = Math.cos(eps) * Math.sin(lambda);
    const z = Math.sin(eps) * Math.sin(lambda);

    // This vector points from Earth to Sun. Align camera so +Z ≈ viewer.
    // You may rotate this to match your camera.
    return this._normalize([ x, z, y ]); // a simple axis shuffle to fit our (+X right, +Y up, +Z toward viewer) convention
  }

  _deg2rad(d) { return d * Math.PI / 180; }
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
            window.size = [480, 400];
            const canvas = new controls.canvas({
                context
            });
            canvas.dom.attributes.id = 'globeCanvas'
            canvas.size = [300, 300];
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

            const earth = new EarthLikeSphereRenderer("globeCanvas", {
              background: "#081019",
              quality: 1.25,            // 1.0..2.0 (higher = smoother, slower)
              shininess: 140,           // tighten/loosen the ocean glint
              atmosphere: 0.5,          // rim intensity (day side)
              backlight: 0.25           // twilight rim when sun is behind Earth
            });

            // Place sun front-left-up:
            earth.setSunFromSpherical(-35, 25);
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