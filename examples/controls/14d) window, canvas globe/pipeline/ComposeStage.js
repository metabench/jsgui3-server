const BaseStage = require('./BaseStage');

class ComposeStage extends BaseStage {
  /** @param {RenderState} rs */
  execute(rs) {
    const ctx = rs.ctx;
    ctx.beginPath();
    ctx.arc(rs.cx, rs.cy, rs.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
}

module.exports = ComposeStage;
