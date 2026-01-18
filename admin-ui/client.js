const jsgui = require('jsgui3-client');
const { controls, Control, mixins } = jsgui;
const Active_HTML_Document = require('../controls/Active_HTML_Document');

class Admin_Page extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'admin_page';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('admin-page');
        }

        const compose = () => {
            // Sidebar
            const sidebar = new controls.div({ context, class: 'admin-sidebar' });
            this.body.add(sidebar);
            this.sidebar = sidebar;

            // Sidebar Header
            const brand = new controls.div({ context, class: 'admin-brand' });
            brand.add(new controls.span({ context, class: 'brand-icon' }).add('⚙️'));
            brand.add(new controls.span({ context, class: 'brand-text' }).add('jsgui3 Admin'));
            sidebar.add(brand);

            // Menu Container (Placeholder for Resource_List and Observables_List)
            const menu = new controls.div({ context, class: 'admin-menu' });
            sidebar.add(menu);
            this.menu = menu;

            this._add_menu_item('Overview', 'overview', true);
            this._add_menu_item('Resources', 'resources');
            this._add_menu_item('Observables', 'observables');
            this._add_menu_item('Settings', 'settings');


            // Main Content Area
            const main = new controls.div({ context, class: 'admin-main' });
            this.body.add(main);
            this.main = main;

            // Top Bar
            const top_bar = new controls.div({ context, class: 'admin-top-bar' });
            main.add(top_bar);

            // Breadcrumbs / Title
            this.page_title = new controls.h2({ context, class: 'page-title' });
            this.page_title.add('Overview');
            top_bar.add(this.page_title);

            // Content Panel
            const content = new controls.div({ context, class: 'admin-content' });
            main.add(content);
            this.content = content;

            // Default content (Overview)
            this._render_overview();
        };

        if (!spec.el) {
            compose();
        }
    }

    _add_menu_item(label, id, active = false) {
        const item = new controls.div({
            context: this.context,
            class: `menu-item ${active ? 'active' : ''}`
        });
        item.dom.attributes['data-id'] = id;
        item.add(label);
        this.menu.add(item);
        return item;
    }

    _render_overview() {
        // Clear main content area (this.content is the admin-content div)
        if (this.content && this.content.content && typeof this.content.content.clear === 'function') {
            this.content.content.clear();
        }

        const welcome = new controls.div({ context: this.context, class: 'welcome-card' });
        welcome.add(new controls.h3({ context: this.context }).add('Welcome directly to jsgui3-server Admin'));
        welcome.add(new controls.p({ context: this.context }).add('Select a resource from the sidebar to inspect.'));
        this.content.add(welcome);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Handle menu clicks
            const menu_items = document.querySelectorAll('.menu-item');
            menu_items.forEach(el => {
                el.addEventListener('click', () => {
                    // Update Active State
                    menu_items.forEach(i => i.classList.remove('active'));
                    el.classList.add('active');

                    // Update Title
                    const id = el.getAttribute('data-id');
                    const label = el.innerText;
                    document.querySelector('.page-title').innerText = label;

                    // Placeholder navigation logic
                    console.log('Navigate to:', id);
                });
            });
        }
    }
}

Admin_Page.css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
    background: #1a1a2e; 
    color: #e0e0e0; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    height: 100vh;
    overflow: hidden;
}
.admin-page {
    display: grid;
    grid-template-columns: 260px 1fr;
    height: 100%;
}

/* Sidebar */
.admin-sidebar {
    background: #16213e;
    border-right: 1px solid #2a2a4a;
    display: flex;
    flex-direction: column;
}
.admin-brand {
    padding: 20px;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    border-bottom: 1px solid #2a2a4a;
    display: flex;
    align-items: center;
    gap: 10px;
}
.brand-icon { filter: drop-shadow(0 0 5px rgba(255,255,255,0.3)); }

.admin-menu {
    flex: 1;
    padding: 20px 0;
    overflow-y: auto;
}
.menu-item {
    padding: 12px 24px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.2s;
    color: #a0a0b0;
}
.menu-item:hover {
    background: rgba(255,255,255,0.05);
    color: #fff;
}
.menu-item.active {
    background: rgba(79, 172, 254, 0.1);
    color: #4facfe;
    border-left-color: #4facfe;
}

/* Main Area */
.admin-main {
    display: flex;
    flex-direction: column;
    background: #1a1a2e;
}
.admin-top-bar {
    height: 64px;
    border-bottom: 1px solid #2a2a4a;
    display: flex;
    align-items: center;
    padding: 0 30px;
    background: #16213e;
}
.page-title {
    font-size: 1.2rem;
    font-weight: 500;
    color: #fff;
}

.admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    position: relative;
}

/* Cards */
.welcome-card {
    background: #2a2a4a;
    padding: 40px;
    border-radius: 12px;
    text-align: center;
    max-width: 600px;
    margin: 40px auto;
    border: 1px solid #3a3a5a;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.welcome-card h3 { color: #fff; margin-bottom: 15px; }
.welcome-card p { color: #a0a0b0; }
`;

controls.Admin_Page = Admin_Page;
module.exports = jsgui;
