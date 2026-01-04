const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Checkbox, Date_Picker, Text_Input, Text_Field, Dropdown_Menu} = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');



class BlueSphereRenderer {
  constructor(canvas, opts = {}) {
    this.canvas =
      typeof canvas === "string" ? document.getElementById(canvas) : canvas;
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error("Pass a canvas element or its id");
    }

    this.ctx = this.canvas.getContext("2d");
    this.opts = {
      padding: opts.padding ?? 8,
      color: opts.color ?? "#2d7fff",       // base blue
      background: opts.background ?? null,  // e.g. "#0a0f1e" or null for transparent
      dpr: window.devicePixelRatio || 1
    };

    this.resize();
    this.render();

    // Re-render automatically on viewport resizes.
    this._onResize = () => { this.resize(); this.render(); };
    window.addEventListener("resize", this._onResize, { passive: true });
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
  }

  setColor(hex) {
    this.opts.color = hex;
    this.render();
  }

  resize() {
    const dpr = (this.opts.dpr = window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();

    // If CSS controls the canvas size, use that; otherwise fall back to attributes.
    const displayWidth = rect.width || this.canvas.width;
    const displayHeight = rect.height || this.canvas.height;

    const w = Math.max(1, Math.round(displayWidth * dpr));
    const h = Math.max(1, Math.round(displayHeight * dpr));

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Scale the drawing coordinates back to CSS pixels.
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  render() {
    const ctx = this.ctx;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.width / this.opts.dpr;
    const height = rect.height || this.canvas.height / this.opts.dpr;

    // Clear / background
    ctx.clearRect(0, 0, width, height);
    if (this.opts.background) {
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, width, height);
    }

    const pad = this.opts.padding;
    const r = Math.max(1, Math.min(width, height) / 2 - pad);
    const cx = width / 2;
    const cy = height / 2;

    // Clip to a circle so the gradient stays perfectly round.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Light from top-left: bright highlight near that side, darker on the rim.
    const hx = cx - r * 0.4;
    const hy = cy - r * 0.45;
    const grad = ctx.createRadialGradient(hx, hy, r * 0.15, cx, cy, r);

    const base = this.opts.color;
    grad.addColorStop(0.0, this._tint(base, 0.35));   // bright highlight
    grad.addColorStop(0.5, base);                     // mid
    grad.addColorStop(1.0, this._shade(base, 0.45));  // dark rim

    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    // Soft rim outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle glossy specular highlight
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.43, r * 0.25, r * 0.18, -0.35, 0, Math.PI * 2);
    const gloss = ctx.createRadialGradient(
      cx - r * 0.35, cy - r * 0.43, 0,
      cx - r * 0.35, cy - r * 0.43, r * 0.25
    );
    gloss.addColorStop(0, "rgba(255,255,255,0.9)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fill();
    ctx.restore();
  }

  // ---- helpers: simple HSL lighten/darken from a hex ----

  _tint(hex, amount) { // amount in [0..1]
    const { h, s, l } = this._hexToHSL(hex);
    return this._hslToCSS(h, s, Math.min(100, l + amount * 100));
    }

  _shade(hex, amount) {
    const { h, s, l } = this._hexToHSL(hex);
    return this._hslToCSS(h, s, Math.max(0, l - amount * 100));
  }

  _hexToHSL(hex) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = [...c].map(x => x + x).join("");

    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = 0; s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  _hslToCSS(h, s, l) {
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
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
            const canvas = new controls.Canvas({
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

            const globe = new BlueSphereRenderer("globeCanvas", {
                color: "#1e88e5",       // try different blues
                background: null,       // or a color like "#0b1020"
                padding: 10
            });
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