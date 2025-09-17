const BaseStage = require('./BaseStage');

class HUDStage extends BaseStage {
		/** @param {RenderState} _rs */
		execute(_rs) {
		if (this.r.opts.showFPS) this.r._drawFPS();
	}
}

module.exports = HUDStage;
