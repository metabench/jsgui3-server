
/**
 * @typedef {Object} RenderState
 * @property {CanvasRenderingContext2D} ctx - Destination 2D context.
 * @property {number} width - Canvas width in CSS pixels.
 * @property {number} height - Canvas height in CSS pixels.
 * @property {number} radius - Globe screen-space radius (px).
 * @property {number} cx - Globe center X in canvas coordinates.
 * @property {number} cy - Globe center Y in canvas coordinates.
 * @property {boolean} interactive - True if frame triggered by interaction (may raise quality scale).
 */

/**
 * @typedef {Object} Continent
 * @property {string} name
 * @property {Float32Array} polyXYZ - Original great-circle densified polygon vertices (triplets).
 * @property {Uint16Array|null} tri - Triangulated index list (ear clipping) referencing polygon vertex order.
 * @property {Float32Array} [_rotated] - Per-frame rotated vertices (camera space).
 * @property {Uint16Array} [_visTris] - Front-facing triangle indices (subset of tri).
 * @property {number} [_visTrisLen] - Number of used indices in _visTris.
 * @property {{idx:number[]}[]} [_strokeRuns] - Contiguous front-facing edge runs for outline stroking.
 * @property {string|null} [fill]
 * @property {string|null} [stroke]
 * @property {number|null} [lineWidth]
 */

/**
 * BaseStage
 * Lightweight interface each pipeline stage implements. Stages may override
 * prepare (optional) and must implement execute. Keeping the interface tiny
 * avoids overhead inside the render loop.
 */
class BaseStage {
	/**
	 * @param {any} r - Renderer instance.
	 */
	constructor(r) {
		this.r = r;
	}
	/** @param {RenderState} _rs */
	prepare(_rs) {}
	/** @param {RenderState} _rs */
	execute(_rs) {}
}

module.exports = BaseStage;
