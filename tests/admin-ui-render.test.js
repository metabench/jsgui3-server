const assert = require('assert');
const { describe, it } = require('mocha');
const { Page_Context } = require('jsgui3-html');

const admin_ui = require('../admin-ui/client');

describe('Admin UI rendering', function() {
    it('renders Admin_Page without overriding core content collection', () => {
        const Admin_Page = admin_ui.controls && admin_ui.controls.Admin_Page;
        assert.strictEqual(typeof Admin_Page, 'function', 'Expected Admin_Page control export');

        const page_context = new Page_Context({});
        const admin_page = new Admin_Page({
            context: page_context
        });

        assert(admin_page.content && typeof admin_page.content.length === 'function', 'Expected control content collection to remain intact');

        const html_output = admin_page.all_html_render();
        assert.strictEqual(typeof html_output, 'string');
        assert(html_output.includes('admin-content'));
        assert(html_output.includes('jsgui3 Admin'));
    });
});
