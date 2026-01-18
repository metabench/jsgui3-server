const jsgui = require('./client');
const { Admin_Page } = jsgui.controls;
const { each } = jsgui;

class Admin_Module {
    constructor(server) {
        this.server = server;
        this.setup_routes();
    }

    setup_routes() {
        const { server } = this;

        // 1. Main Admin Page Route
        // Using a custom Website_Resource for the admin app
        // We register Admin_Page as the content control

        // Manual route setup to render the page
        // (Similar to how examples work, but integrated)

        // We'll expose a 'setup' method that the main server calls
        // Or we can attach directly if we have access to the router
    }

    // Called by the main server to attach admin functionality
    attach_to_router(router) {
        console.log('[Admin_Module] Attaching /admin routes...');

        // API: List Resources
        // GET /api/admin/resources
        router.set_route('/api/admin/resources', (req, res) => {
            const resources_data = this.get_resources_tree();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resources_data));
        });

        // API: List Observables
        // GET /api/admin/observables
        router.set_route('/api/admin/observables', (req, res) => {
            const observables = this.get_observables_list();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(observables));
        });
    }

    get_resources_tree() {
        const pool = this.server.resource_pool;
        const tree = {
            name: 'Root',
            type: 'pool',
            children: []
        };

        if (pool && pool.resources) {
            // Need to iterate pool resources safely
            // resource_pool.resources is likely a Collection or array
            const resources = pool.resources._arr || []; // Assuming Data_Structures.Collection

            resources.forEach(res => {
                tree.children.push({
                    name: res.name || 'Unnamed Resource',
                    type: res.constructor.name
                });
            });
        }
        return tree;
    }

    get_observables_list() {
        // We need a way to track all published observables
        // Ideally, HTTP_Observable_Publisher instances are stored in the resource pool or a specific list

        // For now, we'll scan the router for observable publishers
        // This relies on the server exposing its router/routes map
        const observables = [];

        // Implementation detail: server.router doesn't expose a simple list of routes easily in standard Router
        // We might need to track them when publish_observable is called.
        // But we can look at server.resource_pool for publishers

        const pool = this.server.resource_pool;
        if (pool && pool.resources) {
            const resources = pool.resources._arr || [];
            resources.forEach(res => {
                // Check if it's an observable publisher
                // Robust check: does it have 'obs' property and handle_http? 
                // Or check constructor name if available
                if (res.constructor.name === 'Observable_Publisher' || (res.obs && res.handle_http)) {
                    observables.push({
                        name: res.name || 'Observable',
                        route: '?', // Route might not be stored on the resource itself, but on the router
                        schema: res.schema,
                        status: res.is_paused ? 'paused' : 'active',
                        connections: res.active_sse_connections ? res.active_sse_connections.size : 0
                    });
                }
            });
        }

        return observables;
    }
}

module.exports = Admin_Module;
