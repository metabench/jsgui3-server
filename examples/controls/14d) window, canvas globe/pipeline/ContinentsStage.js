const BaseStage = require('./BaseStage');

class ContinentsStage extends BaseStage {
  /** @param {RenderState} rs */
  execute(rs) {
    const rInst = this.r;
    if (!rInst._continents) return;
    const ctx = rInst.ctx;
    const clippingEnabled = !!rInst.opts.clipping.enabled; // currently front-face only

    for (const c of rInst._continents) {
  const rot = c._rotated;
  if (!rot) continue;

      const fillStyle = c.fill || rInst.opts.antarcticaFill;
      const strokeStyle = c.stroke || rInst.opts.antarcticaStroke;
      const lw = c.lineWidth || rInst.opts.antarcticaLineWidth;

  // Fill: draw a solid path when available (prevents triangle AA seams)
      if (c._clipFillPathXY && c._clipFillPathXY.length >= 6) {
        const path = c._clipFillPathXY;
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(rs.cx + rs.radius * path[0], rs.cy - rs.radius * path[1]);
        for (let i = 2; i < path.length; i += 2) {
          const x = path[i], y = path[i+1];
          ctx.lineTo(rs.cx + rs.radius * x, rs.cy - rs.radius * y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (c._clipFillTris && c._clipFillTrisLen) {
        const buf = c._clipFillTris;
        ctx.save();
        ctx.fillStyle = fillStyle;
        for (let i = 0; i < c._clipFillTrisLen * 2; i += 6) {
          const ax = buf[i], ay = buf[i + 1];
          const bx = buf[i + 2], by = buf[i + 3];
          const cx = buf[i + 4], cy = buf[i + 5];
          ctx.beginPath();
          ctx.moveTo(rs.cx + rs.radius * ax, rs.cy - rs.radius * ay);
          ctx.lineTo(rs.cx + rs.radius * bx, rs.cy - rs.radius * by);
          ctx.lineTo(rs.cx + rs.radius * cx, rs.cy - rs.radius * cy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (c._visTrisLen) {
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        const len = c._visTrisLen;
        for (let i = 0; i < len; i += 3) {
          const ia = c._visTris[i];
          const ib = c._visTris[i + 1];
          const ic = c._visTris[i + 2];
          const a = ia * 3, b = ib * 3, d = ic * 3;
          const ax = rot[a], ay = rot[a + 1];
          const bx = rot[b], by = rot[b + 1];
          const cx = rot[d], cy = rot[d + 1];
          ctx.moveTo(rs.cx + rs.radius * ax, rs.cy - rs.radius * ay);
          ctx.lineTo(rs.cx + rs.radius * bx, rs.cy - rs.radius * by);
          ctx.lineTo(rs.cx + rs.radius * cx, rs.cy - rs.radius * cy);
        }
        ctx.fill();
        ctx.restore();
      }

      // Stroke: prefer clipped runs if present, else legacy runs, else legacy polyline
      if (c._clipStrokeRuns && c._clipStrokeRuns.length) {
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lw;
        for (const buf of c._clipStrokeRuns) {
          if (!buf || buf.length < 4) continue;
          ctx.beginPath();
          let sx = rs.cx + rs.radius * buf[0];
          let sy = rs.cy - rs.radius * buf[1];
          ctx.moveTo(sx, sy);
          for (let i = 2; i < buf.length; i += 2) {
            sx = rs.cx + rs.radius * buf[i];
            sy = rs.cy - rs.radius * buf[i + 1];
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (c._strokeRuns && c._strokeRuns.length) {
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lw;
        for (const run of c._strokeRuns) {
          if (run.idx.length < 2) continue;
          ctx.beginPath();
          for (let i = 0; i < run.idx.length; i++) {
            const vi = run.idx[i] * 3;
            const x = rot[vi];
            const y = rot[vi + 1];
            const sx = rs.cx + rs.radius * x;
            const sy = rs.cy - rs.radius * y;
            if (!i) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // Placeholder: if future partial clipping is added, use original + rot arrays here
      void clippingEnabled;
    }
  }
  // Triangulation handled in ClippingStage
}

module.exports = ContinentsStage;
