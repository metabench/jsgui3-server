'use strict';

const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

/**
 * Group_Box — a Windows-style grouping container with a title
 * rendered on the top border. Used to visually separate sections
 * of the admin dashboard.
 *
 * Book reference: Chapter 6 — Implementation Patterns (reusable wrapper)
 * Layer: D (Concrete Render)
 */
class Group_Box extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'group_box';
        super(spec);
        const { context } = this;

        const compose = () => {
            // Legend / title
            const title_text = spec.title || '';
            if (title_text) {
                const legend = new controls.div({ context, 'class': 'group-box-legend' });
                legend.add(title_text);
                this.add(legend);
            }

            // Content container — callers add children here
            const content = new controls.div({ context, 'class': 'group-box-content' });
            this.add(content);
            this._content = content;
        };

        if (!spec.el) {
            compose();
        }
    }

    /**
     * Returns the inner content container so callers can do:
     *   group.inner.add(child);
     */
    get inner() {
        return this._content;
    }

    activate() {
        if (!this.__active) {
            super.activate();
        }
    }
}

Group_Box.css = `
.group-box {
    position: relative;
    border: 1px solid #3a3a5a;
    border-radius: 8px;
    margin-bottom: 20px;
    padding: 20px 16px 16px;
    background: transparent;
}
.group-box-legend {
    position: absolute;
    top: -10px;
    left: 16px;
    padding: 0 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8888aa;
    background: #1a1a2e;
}
.group-box-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}
`;

controls.Group_Box = Group_Box;
module.exports = Group_Box;
