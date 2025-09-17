const BaseStage = require('./BaseStage');

class ShadeSphereStage extends BaseStage {
  /**
   * Per-pixel shading of the sphere into an offscreen buffer, then composited.
   * Performance note: inner loop kept monolithic to encourage engine inlining
   * and avoid function call overhead per pixel.
   * @param {RenderState} rs
   */
  execute(rs) {
    const rInst = this.r;

    const q = rInst.opts.quality * (
      rs.interactive ? rInst.opts.interactiveQualityScale : 1
    );
    const d = Math.max(2, (2 * rs.radius * q) | 0);
    const off = rInst._getOff(d, d);

    if (rInst._mapSize !== d) {
      rInst._buildNormalMap(d);
    }
    if (!rInst._imgData || rInst._imgData.width !== d) {
      rInst._imgData = off.ctx.createImageData(d, d);
    }

    const data = rInst._imgData.data;
    const base = rInst.opts.baseColor;
    const amb = rInst.opts.ambient;
    const kd = rInst.opts.diffuse;
    const ks = rInst.opts.specular;
    const shin = rInst.opts.shininess;
    const termSoft = rInst.opts.terminatorSoftness;
    const atm = rInst.opts.atmosphere;
    const back = rInst.opts.backlight;
    const Lx = rInst.sun[0], Ly = rInst.sun[1], Lz = rInst.sun[2];

    // Half vector (approx: light + view(0,0,1))
    let Hx = Lx, Hy = Ly, Hz = Lz + 1;
    {
      const invH = 1 / Math.hypot(Hx, Hy, Hz);
      Hx *= invH; Hy *= invH; Hz *= invH;
    }

    const Rt = rInst.Rt;
    const Rt00 = Rt[0], Rt01 = Rt[1], Rt02 = Rt[2];
    const Rt10 = Rt[3], Rt11 = Rt[4], Rt12 = Rt[5];
    const Rt20 = Rt[6], Rt21 = Rt[7], Rt22 = Rt[8];

    const Nx = rInst._Nx, Ny = rInst._Ny, Nz = rInst._Nz, A8 = rInst._A8;
    const texAlb = rInst.tex.albedo, texWater = rInst.tex.water, texIce = rInst.tex.ice;
    const needTex = !!(texAlb || texWater || texIce);

    const toneLUT = rInst._toneLUT;
    const sLinToSRGB = rInst._lin2sU8;
    const toneScale = (toneLUT.length - 1) / 4;

    const nPix = d * d;
    let p = 0;
  for (let i = 0; i < nPix; i++) { // hot loop
      const nz = Nz[i];
      if (nz < 0) {
        data[p] = data[p + 1] = data[p + 2] = data[p + 3] = 0;
        p += 4;
        continue;
      }

      const nx = Nx[i];
      const ny = Ny[i];
      const NL = nx * Lx + ny * Ly + nz * Lz;
      const NV = nz; // view = (0,0,1)
      const NH = nx * Hx + ny * Hy + nz * Hz;

      let t = (NL + termSoft) / (2 * termSoft);
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const dayMask = (3 - 2 * t) * t * t * (NL > 0 ? NL : 0);

      let albR = base[0], albG = base[1], albB = base[2];
      let oceanW = 1, iceW = 0;

      if (needTex) {
        const Wx = Rt00 * nx + Rt01 * ny + Rt02 * nz;
        const Wy = Rt10 * nx + Rt11 * ny + Rt12 * nz;
        const Wz = Rt20 * nx + Rt21 * ny + Rt22 * nz;
        const lon = Math.atan2(Wx, Wz);
        const WyC = Wy < -1 ? -1 : (Wy > 1 ? 1 : Wy);
        const lat = Math.asin(WyC);
        if (texAlb) {
          const s = rInst._sampleSRGB(texAlb, lon, lat);
            const lut = rInst._s2l;
            albR = lut[s.r]; albG = lut[s.g]; albB = lut[s.b];
        }
        if (texWater) {
          const sw = rInst._sampleSRGB(texWater, lon, lat);
          oceanW = (sw.r + sw.g + sw.b) / 765;
        }
        if (texIce) {
          const si = rInst._sampleSRGB(texIce, lon, lat);
          iceW = (si.r + si.g + si.b) / 765;
        }
      }

      const diff = kd * dayMask;
      const specW = oceanW * (1 - 0.9 * iceW);
      const spec = NL > 0 ? ks * specW * Math.pow(NH > 0 ? NH : 0, shin) : 0;
      const NVc = NV < 0 ? 0 : (NV > 1 ? 1 : NV);
      const rimDay = atm * Math.pow(1 - NVc, 2.4) * (NL + 0.15 > 0 ? NL + 0.15 : 0);
      let rimBack = 0;
      if (Lz < 0 && NL < 0) {
        rimBack = back * Math.pow(1 - NVc, 3.2) * (-NL);
      }

      let rLin = albR * (amb + diff) + spec + 0.40 * rimDay + 0.25 * rimBack;
      let gLin = albG * (amb + diff) + spec + 0.65 * rimDay + 0.40 * rimBack;
      let bLin = albB * (amb + diff) + spec + 1.00 * rimDay + 0.80 * rimBack;

      if (rLin < 0) rLin = 0; else if (rLin > 4) rLin = 4;
      if (gLin < 0) gLin = 0; else if (gLin > 4) gLin = 4;
      if (bLin < 0) bLin = 0; else if (bLin > 4) bLin = 4;

      rLin = toneLUT[(rLin * toneScale) | 0];
      gLin = toneLUT[(gLin * toneScale) | 0];
      bLin = toneLUT[(bLin * toneScale) | 0];

      if (rLin > 1) rLin = 1;
      if (gLin > 1) gLin = 1;
      if (bLin > 1) bLin = 1;

  data[p]     = sLinToSRGB[(rLin * 4095) | 0];
      data[p + 1] = sLinToSRGB[(gLin * 4095) | 0];
      data[p + 2] = sLinToSRGB[(bLin * 4095) | 0];
      data[p + 3] = A8[i];
      p += 4;
    }

    off.ctx.putImageData(rInst._imgData, 0, 0);
    const drawSize = d / q;
    const ctx = rInst.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rs.cx, rs.cy, rs.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      off.canvas,
      rs.cx - drawSize / 2,
      rs.cy - drawSize / 2,
      drawSize,
      drawSize
    );
    ctx.restore();
  }
}

module.exports = ShadeSphereStage;
