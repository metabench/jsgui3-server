# Chapter 8: Domain Controls — Route Table & API Explorer

## Overview

The Route Table displays every HTTP route registered in the server's router. Each row shows the HTTP method (as a colored badge), the path, the handler description, and the route type category. The design reference shows this within a tabbed panel ("Routes & API" tab), alongside a build status sidebar.

An API Explorer extension allows developers to test function-published endpoints directly from the admin UI.

---

## Route_Table Control

### Spec

```javascript
{
    __type_name: 'route_table',
    routes: [                       // Data from /api/admin/routes
        {
            path: '/',
            method: 'GET',
            handler_type: 'Static_Route_HTTP_Responder',
            handler_name: null,
            category: 'auto',
            description: 'renderControl → HTML'
        }
    ]
}
```

### Visual Anatomy

```
  METHOD    PATH                  HANDLER              TYPE
  ──────────────────────────────────────────────────────────
  [GET ]    /                     renderControl → HTML  [auto]
  [GET ]    /js/js.js             Client JS bundle     [auto]
  [GET ]    /css/css.css          Extracted CSS bundle  [auto]
  [POST]    /api/validateUser     server.publish()     [API ]
  [POST]    /api/register         server.publish()     [API ]
  [GET ]    /static/*             Static file serving  [static]
  ──────────────────────────────────────────────────────────
  + 1 additional static route
```

### Constructor

```javascript
class Route_Table extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'route_table';
        super(spec);
        const { context } = this;
        this._routes = spec.routes || [];

        const compose = () => {
            // Table header
            const header = new controls.div({ context, class: 'route-table-header' });
            this.add(header);

            ['METHOD', 'PATH', 'HANDLER', 'TYPE'].forEach(col => {
                const cell = new controls.span({ context, class: 'route-header-cell' });
                cell.add(col);
                header.add(cell);
            });

            // Table body
            const body = new controls.div({ context, class: 'route-table-body' });
            this.add(body);
            this._body = body;

            this._routes.forEach(route => {
                const row = this._create_route_row(route);
                body.add(row);
            });

            // Footer
            const admin_count = this._routes.filter(r => r.category === 'admin').length;
            if (admin_count > 0) {
                const footer = new controls.div({ context, class: 'route-table-footer' });
                footer.add(
                    `+ ${admin_count} admin route(s) · Router supports :param and error/not-found events`
                );
                this.add(footer);
            }
        };

        if (!spec.el) { compose(); }
    }

    _create_route_row(route) {
        const { context } = this;
        const row = new controls.div({ context, class: 'route-row' });

        // Method badge
        const method_badge = new Method_Badge({
            context,
            method: this._infer_method(route)
        });
        row.add(method_badge);

        // Path
        const path_cell = new controls.span({ context, class: 'route-path' });
        path_cell.add(route.path);
        row.add(path_cell);

        // Handler
        const handler_cell = new controls.span({ context, class: 'route-handler' });
        handler_cell.add(this._describe_handler(route));
        row.add(handler_cell);

        // Type badge
        const type_badge = new controls.span({
            context,
            class: `route-type-badge type-${route.category}`
        });
        type_badge.add(route.category);
        row.add(type_badge);

        return row;
    }

    _infer_method(route) {
        // API routes (function publishers) are typically POST
        if (route.category === 'api') return 'POST';
        // Observable and SSE routes are GET (with SSE accept)
        if (route.category === 'observable' || route.category === 'sse') return 'GET';
        // Everything else defaults to GET
        return route.method || 'GET';
    }

    _describe_handler(route) {
        switch (route.handler_type) {
            case 'Static_Route_HTTP_Responder':
                if (route.path.endsWith('.js')) return 'Client JS bundle';
                if (route.path.endsWith('.css')) return 'Extracted CSS bundle';
                if (route.path === '/') return 'renderControl → HTML';
                return 'Static file serving';
            case 'HTTP_Function_Publisher':
                return 'server.publish()';
            case 'Observable_Publisher':
                return 'Observable → SSE stream';
            case 'HTTP_SSE_Publisher':
                return 'Event stream';
            case 'HTTP_Website_Publisher':
                return 'Website publisher';
            default:
                return route.handler_name || route.handler_type || 'Handler';
        }
    }

    update(routes_data) {
        this._routes = routes_data;
        if (this._body && this._body.el) {
            this._body.el.innerHTML = '';
            routes_data.forEach(route => {
                const row = this._create_route_row(route);
                this._body.add(row);
            });
        }
    }
}
```

---

## Method_Badge Control

A small colored badge displaying the HTTP method name.

### Spec

```javascript
{
    __type_name: 'method_badge',
    method: 'GET'     // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
}
```

### Constructor

```javascript
class Method_Badge extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'method_badge';
        super(spec);
        const { context } = this;
        const method = (spec.method || 'GET').toUpperCase();

        const compose = () => {
            this.add(method);
        };

        if (!spec.el) { compose(); }

        // Set class for color
        if (typeof this.add_class === 'function') {
            this.add_class(`method-${method.toLowerCase()}`);
        }
    }
}

Method_Badge.css = `
.method_badge {
    display: inline-block;
    font-size: 7px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 2px;
    text-align: center;
    min-width: 30px;
}

.method-get {
    background: rgba(72, 184, 72, 0.15);
    border: 0.5px solid #48B848;
    color: #2A6A2A;
}

.method-post {
    background: rgba(144, 112, 192, 0.15);
    border: 0.5px solid #9070C0;
    color: #5A3890;
}

.method-put {
    background: rgba(68, 136, 204, 0.15);
    border: 0.5px solid #4488CC;
    color: #2A5A8A;
}

.method-delete {
    background: rgba(204, 68, 68, 0.15);
    border: 0.5px solid #CC4444;
    color: #992222;
}

.method-patch {
    background: rgba(216, 160, 32, 0.15);
    border: 0.5px solid #D8A020;
    color: #8A6A10;
}
`;
```

---

## Route Type Badges

```css
.route-type-badge {
    display: inline-block;
    font-size: 7px;
    padding: 2px 6px;
    border-radius: 2px;
    text-align: center;
}

.type-auto {
    background: rgba(68, 136, 204, 0.12);
    border: 0.5px solid #4488CC;
    color: #3870A0;
}

.type-api {
    background: rgba(144, 112, 192, 0.12);
    border: 0.5px solid #9070C0;
    color: #5A3890;
}

.type-static {
    background: rgba(160, 140, 100, 0.12);
    border: 0.5px solid #A08060;
    color: #806040;
}

.type-observable {
    background: rgba(72, 184, 72, 0.12);
    border: 0.5px solid #48B848;
    color: #2A6A2A;
}

.type-sse {
    background: rgba(64, 152, 184, 0.12);
    border: 0.5px solid #4098B8;
    color: #205868;
}

.type-admin {
    background: rgba(128, 128, 128, 0.12);
    border: 0.5px solid #808080;
    color: #606060;
}

.type-website {
    background: rgba(68, 136, 204, 0.12);
    border: 0.5px solid #4488CC;
    color: #3870A0;
}
```

---

## Route Table CSS

```css
.route-table-header {
    display: grid;
    grid-template-columns: 60px 2fr 2fr 60px;
    padding: 6px 10px;
    background: #E8E4DC;
    border-top: 0.5px solid #C0B8A8;
    border-bottom: 0.5px solid #C0B8A8;
    gap: 8px;
}

.route-header-cell {
    font-size: 8px;
    font-weight: 600;
    color: #606060;
}

.route-table-body {
    display: flex;
    flex-direction: column;
}

.route-row {
    display: grid;
    grid-template-columns: 60px 2fr 2fr 60px;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-bottom: 0.5px solid #E8E4DC;
}

.route-row:hover {
    background: rgba(68, 136, 204, 0.05);
}

.route-path {
    font-size: 9px;
    color: #2A4060;
    font-family: 'Consolas', monospace;
}

.route-handler {
    font-size: 9px;
    color: #808080;
}

.route-table-footer {
    font-size: 8px;
    color: #908888;
    padding: 8px 4px 0;
}
```

---

## API Explorer (Phase 2)

The API Explorer extends the Route_Table with interactive testing for function-published endpoints.

### Concept

When a user clicks on an API route row, an expansion panel appears below with:
1. A request body editor (textarea or JSON input)
2. A "Send" button
3. A response viewer showing status and response body

### API_Test_Panel Control

```javascript
class API_Test_Panel extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'api_test_panel';
        super(spec);
        const { context } = this;

        const compose = () => {
            // Request section
            const req_section = new controls.div({ context, class: 'api-test-request' });
            this.add(req_section);

            const req_label = new controls.div({ context, class: 'api-test-label' });
            req_label.add('Request Body (JSON):');
            req_section.add(req_label);

            // Using a textarea for input
            const req_input = new controls.textarea({
                context,
                class: 'api-test-input'
            });
            req_input.dom.attributes.rows = '4';
            req_input.dom.attributes.placeholder = '{ "key": "value" }';
            req_section.add(req_input);
            this._input = req_input;

            // Send button
            const send_btn = new controls.Button({
                context,
                text: 'Send Request',
                class: 'api-test-send'
            });
            req_section.add(send_btn);
            this._send_btn = send_btn;

            // Response section
            const res_section = new controls.div({ context, class: 'api-test-response' });
            this.add(res_section);

            const res_label = new controls.div({ context, class: 'api-test-label' });
            res_label.add('Response:');
            res_section.add(res_label);

            const res_output = new controls.div({ context, class: 'api-test-output' });
            res_output.add('—');
            res_section.add(res_output);
            this._output = res_output;
        };

        if (!spec.el) { compose(); }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const route = this.spec.route;
            const method = this.spec.method || 'POST';

            this._send_btn.el.addEventListener('click', async () => {
                try {
                    const body = this._input.el.value;
                    const response = await fetch(route, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: body || undefined
                    });
                    const text = await response.text();
                    let display = `Status: ${response.status}\n\n`;
                    try {
                        display += JSON.stringify(JSON.parse(text), null, 2);
                    } catch {
                        display += text;
                    }
                    this._output.el.innerText = display;
                    this._output.el.className = response.ok
                        ? 'api-test-output response-ok'
                        : 'api-test-output response-error';
                } catch (err) {
                    this._output.el.innerText = `Error: ${err.message}`;
                    this._output.el.className = 'api-test-output response-error';
                }
            });
        }
    }
}

API_Test_Panel.css = `
.api_test_panel {
    background: #F8F6F2;
    border: 1px solid #D0C8B8;
    border-radius: 3px;
    padding: 12px;
    margin: 6px 0;
}

.api-test-label {
    font-size: 9px;
    font-weight: 500;
    color: #606060;
    margin-bottom: 4px;
}

.api-test-input {
    width: 100%;
    font-family: 'Consolas', monospace;
    font-size: 10px;
    padding: 6px;
    border: 1px solid #ACA899;
    border-radius: 2px;
    background: linear-gradient(to bottom, #E8E4DD 0%, #FFFFFF 3%, #FFFFFF 100%);
    resize: vertical;
}

.api-test-send {
    margin-top: 8px;
    padding: 4px 16px;
    font-size: 9px;
}

.api-test-response {
    margin-top: 12px;
}

.api-test-output {
    font-family: 'Consolas', monospace;
    font-size: 9px;
    padding: 8px;
    border: 1px solid #D0C8B8;
    border-radius: 2px;
    background: #FFFFFF;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
    color: #2A4060;
}

.response-ok { border-left: 3px solid #48B848; }
.response-error { border-left: 3px solid #CC4444; }
`;
```

---

## Adapter — `get_routes_list()`

The Admin Module must track routes as they are registered. Since the Router doesn't natively expose a route list, we intercept `set_route`:

```javascript
get_routes_list() {
    // Filter out admin routes for cleaner display (optional)
    const user_routes = this._route_registry.filter(
        r => r.category !== 'admin'
    );

    return {
        count: user_routes.length,
        routes: user_routes.map(r => ({
            path: r.path,
            method: this._infer_method_for_route(r),
            handler_type: r.handler_type,
            handler_name: r.handler_name,
            category: r.category,
            description: this._describe_handler_for_route(r)
        }))
    };
}

_infer_method_for_route(route) {
    if (route.category === 'api') return 'POST';
    if (route.category === 'observable') return 'GET';
    if (route.category === 'sse') return 'GET';
    return 'GET';
}

_describe_handler_for_route(route) {
    switch (route.handler_type) {
        case 'Static_Route_HTTP_Responder':
            if (route.path.endsWith('.js')) return 'Client JS bundle';
            if (route.path.endsWith('.css')) return 'Extracted CSS bundle';
            if (route.path === '/' || route.path === '/admin') return 'HTML page';
            return 'Static file';
        case 'HTTP_Function_Publisher':
            return `server.publish('${route.handler_name || route.path}')`;
        case 'Observable_Publisher':
            return 'Observable → SSE';
        case 'HTTP_SSE_Publisher':
            return 'Server-Sent Events';
        default:
            return route.handler_type;
    }
}
```

---

## Route Filtering

The Route_Table supports a simple filter bar for large route sets:

```javascript
// In activate():
const filter_input = document.querySelector('.route-filter-input');
if (filter_input) {
    filter_input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.route-row');
        rows.forEach(row => {
            const path = row.querySelector('.route-path')?.innerText?.toLowerCase() || '';
            row.style.display = path.includes(query) ? '' : 'none';
        });
    });
}
```
