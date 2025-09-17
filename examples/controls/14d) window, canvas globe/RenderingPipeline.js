// RenderingPipeline.js (modular version)
// Always loads fresh (removed previous idempotent caching to allow stage changes like ClippingStage).

const BaseStage = require('./pipeline/BaseStage');
const TransformStage = require('./pipeline/TransformStage');
const ShadeSphereStage = require('./pipeline/ShadeSphereStage');
const GridStage = require('./pipeline/GridStage');
const ClippingStage = require('./pipeline/ClippingStage');
const ContinentsStage = require('./pipeline/ContinentsStage');
const ComposeStage = require('./pipeline/ComposeStage');
const HUDStage = require('./pipeline/HUDStage');

class RenderingPipeline {
    constructor(renderer, stages){
      this.r=renderer;
      this.setStages(stages && stages.length ? stages : [
        new TransformStage(renderer),
        new ShadeSphereStage(renderer),
  new GridStage(renderer),
  new ClippingStage(renderer),
        new ContinentsStage(renderer),
        new ComposeStage(renderer),
        new HUDStage(renderer)
      ]);
      this._rs={ renderer, ctx:renderer.ctx, width:0,height:0,cx:0,cy:0,radius:0,interactive:false,time:0,qualityScale:1 };
    }
    setStages(stages){ this.stages=stages; }
    run({interactive=false}={}){
      const r=this.r; const ctx=r.ctx; const rect=r.canvas.getBoundingClientRect();
      const width=rect.width||r.canvas.width/r.opts.dpr; const height=rect.height||r.canvas.height/r.opts.dpr;
      ctx.clearRect(0,0,width,height);
      if(r.opts.background){ ctx.fillStyle=r.opts.background; ctx.fillRect(0,0,width,height); }
      const rs=this._rs; rs.interactive=interactive; rs.time=performance.now(); rs.ctx=ctx; rs.width=width; rs.height=height;
      for(const s of this.stages) if(s.prepare) s.prepare(rs);
      for(const s of this.stages) s.execute(rs);
    }
    insertStageBefore(stage, Type){ const i=this.stages.findIndex(s=>s instanceof Type); if(i===-1) this.stages.push(stage); else this.stages.splice(i,0,stage); }
    removeStage(Type){ const i=this.stages.findIndex(s=>s instanceof Type); if(i!==-1) this.stages.splice(i,1); }
  }

const exportsObj = { RenderingPipeline, BaseStage, TransformStage, ShadeSphereStage, GridStage, ClippingStage, ContinentsStage, ComposeStage, HUDStage };
if (typeof globalThis !== 'undefined') globalThis.__EG_RENDERING_PIPELINE_EXPORTS__ = exportsObj; // still update for debugging
module.exports = exportsObj;
