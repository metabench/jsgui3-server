const BaseStage = require('./BaseStage');

class TransformStage extends BaseStage {
  /** @param {RenderState} rs */
  execute(rs) {
    const r = this.r;
    r._updateRot();

    const rect = r.canvas.getBoundingClientRect();
    const width = rect.width || r.canvas.width / r.opts.dpr;
    const height = rect.height || r.canvas.height / r.opts.dpr;
    rs.width = width;
    rs.height = height;

    const pad = r.opts.padding;
    const minSide = Math.min(width, height);
    rs.radius = Math.max(1, minSide / 2 - pad);
  rs.cx = width * 0.5;
  rs.cy = height * 0.5;
  }
}

module.exports = TransformStage;
