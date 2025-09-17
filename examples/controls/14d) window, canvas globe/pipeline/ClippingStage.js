const BaseStage = require('./BaseStage');
const frontFace = require('./clipping/FrontFaceStrategy');
const planeClip = require('./clipping/PlaneClipStrategy');

// Strategy registry (extensible)
const strategies = {
  frontFace,
  planeClip
};

class ClippingStage extends BaseStage {
  constructor(r){
    super(r);
  }
  /** @param {RenderState} _rs */
  execute(_rs){
    const r = this.r;
    if(!r._continents) return;
  // Choose best default strategy; allow override via opts.clipping.mode
  const mode = r.opts.clipping?.mode || 'planeClip';
    const strat = strategies[mode] || strategies.frontFace;
    const R = r.R;
    for(const c of r._continents){
      strat.process(r, c, R);
    }
  }
}

module.exports = ClippingStage;
