const BaseStage = require('./BaseStage');

// Precompute constant to avoid repeated division inside loops.
const DEG = Math.PI / 180;

class GridStage extends BaseStage {
  /** @param {RenderState} rs */
  execute(rs) {
    const rInst = this.r;
    if (!rInst.opts.grid?.enabled) return;

    const g = rInst.opts.grid;
    const params = rInst._gridCache?.params;

    const unchanged = (
      params &&
      params.stepLat === g.stepLat &&
      params.stepLon === g.stepLon &&
      params.sampleStepDeg === g.sampleStepDeg
    );

    if (!unchanged) {
      const parallels = [];
    for (let lat = -80; lat <= 80; lat += g.stepLat) {
        const pts = [];
        for (let lon = -180; lon <= 180; lon += g.sampleStepDeg) {
      const φ = lat * DEG;
      const λ = lon * DEG;
          const cφ = Math.cos(φ), sφ = Math.sin(φ);
          const sλ = Math.sin(λ), cλ = Math.cos(λ);
          pts.push(cφ * sλ, sφ, cφ * cλ);
        }
        parallels.push(new Float32Array(pts));
      }

      const meridians = [];
    for (let lon = -180; lon < 180; lon += g.stepLon) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += g.sampleStepDeg) {
      const φ = lat * DEG;
      const λ = lon * DEG;
      const cφ = Math.cos(φ), sφ = Math.sin(φ);
      const sλ = Math.sin(λ), cλ = Math.cos(λ);
      pts.push(cφ * sλ, sφ, cφ * cλ);
        }
        meridians.push(new Float32Array(pts));
      }

      rInst._gridCache = {
        parallels,
        meridians,
        params: {
          stepLat: g.stepLat,
          stepLon: g.stepLon,
          sampleStepDeg: g.sampleStepDeg
        }
      };
    }

    const cache = rInst._gridCache;
    if (!cache) return;
    const ctx = rInst.ctx;
    const R = rInst.R;
    const R00 = R[0], R01 = R[3], R02 = R[6];
    const R10 = R[1], R11 = R[4], R12 = R[7];
    const R20 = R[2], R21 = R[5], R22 = R[8];

    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.globalAlpha = g.alpha;
    ctx.lineWidth = g.lineWidth;
    ctx.lineCap = 'round';

  const drawLines = (lines) => {
      for (const L of lines) {
        let drawing = false;
        ctx.beginPath();
        for (let i = 0; i < L.length; i += 3) {
          const vx = L[i], vy = L[i + 1], vz = L[i + 2];
          const xw = R00 * vx + R01 * vy + R02 * vz;
          const yw = R10 * vx + R11 * vy + R12 * vz;
          const zw = R20 * vx + R21 * vy + R22 * vz;
          if (zw >= 0) {
            const sx = rs.cx + rs.radius * xw;
            const sy = rs.cy - rs.radius * yw;
            if (!drawing) { ctx.moveTo(sx, sy); drawing = true; }
            else ctx.lineTo(sx, sy);
          } else if (drawing) {
            ctx.stroke();
            ctx.beginPath();
            drawing = false;
          }
        }
        if (drawing) ctx.stroke();
      }
    };

  // Parallels first (visual layering), then meridians.
  drawLines(cache.parallels);
  drawLines(cache.meridians);
    ctx.restore();
  }
}

module.exports = GridStage;
