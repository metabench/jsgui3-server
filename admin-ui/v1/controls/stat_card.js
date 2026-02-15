'use strict';

const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

/**
 * Stat_Card — a single KPI card showing value, label, and optional detail.
 * Accent colour on the left border is set via spec.accent (CSS colour string).
 *
 * Usage:
 *   new Stat_Card({
 *       context,
 *       label: 'Uptime',
 *       value: '3h 22m',
 *       detail: 'Since 09:41',
 *       accent: '#4facfe'
 *   })
 *
 * Book reference: Chapter 6 — Implementation Patterns (domain control)
 * Layer: D (Concrete Render) — pure presentation, no data fetching
 */
class Stat_Card extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'stat_card';
        super(spec);
        const { context } = this;

        const compose = () => {
            // Accent stripe colour
            const accent = spec.accent || '#4facfe';
            this.dom.attributes.style = `border-left-color: ${accent};`;

            // Value (big number / text)
            const value_el = new controls.div({ context, 'class': 'stat-value' });
            value_el.add(String(spec.value != null ? spec.value : '—'));
            this.add(value_el);
            this._value_el = value_el;

            // Label
            const label_el = new controls.div({ context, 'class': 'stat-label' });
            label_el.add(String(spec.label || ''));
            this.add(label_el);
            this._label_el = label_el;

            // Detail (small secondary text)
            if (spec.detail) {
                const detail_el = new controls.div({ context, 'class': 'stat-detail' });
                detail_el.add(String(spec.detail));
                this.add(detail_el);
                this._detail_el = detail_el;
            }
        };

        if (!spec.el) {
            compose();
        }
    }

    // ─── Client-side updates ─────────────────────────────────

    /**
     * Update displayed value (client-side only).
     */
    set_value(value) {
        if (this._value_el && this._value_el.el) {
            this._value_el.el.textContent = String(value != null ? value : '—');
        }
    }

    /**
     * Update displayed detail text (client-side only).
     */
    set_detail(text) {
        if (this._detail_el && this._detail_el.el) {
            this._detail_el.el.textContent = String(text);
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();
        }
    }
}

Stat_Card.css = `
.stat_card {
    background: #2a2a4a;
    border-left: 4px solid #4facfe;
    border-radius: 8px;
    padding: 20px 24px;
    min-width: 180px;
    flex: 1 1 180px;
    max-width: 280px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: default;
}
.stat_card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 4px;
}
.stat-label {
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8888aa;
    margin-bottom: 6px;
}
.stat-detail {
    font-size: 0.75rem;
    color: #6a6a8a;
}
`;

controls.Stat_Card = Stat_Card;
module.exports = Stat_Card;
