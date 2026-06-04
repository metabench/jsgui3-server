// site-page-composer.js
//
// Builds a Ctrl class for a Resolved_Page that renders shell slots, regions,
// and page body into an Active_HTML_Document.
//
// Strategy: the composer returns a class extending Active_HTML_Document. Its
// constructor walks the layout's slot order and instantiates each slot's
// resolved value (region ctrl, page ctrl, or inline ctrl), adding it to the
// document body. Because Active_HTML_Document already handles head/body, the
// direct server-side renderer can emit the document as normal HTML.

const jsgui = require('jsgui3-html');
const Active_HTML_Document = require('./Active_HTML_Document');

const is_object = (value) => value !== null && typeof value === 'object';

const make_control = (tag_name, context) => {
    const Control_Ctor = jsgui.controls[tag_name] || jsgui.Control;
    return new Control_Ctor(jsgui.controls[tag_name] ? { context } : { context, tag_name });
};

const set_attributes = (ctrl, attributes = {}) => {
    for (const [name, value] of Object.entries(attributes)) {
        if (value === undefined || value === null || value === false) continue;
        ctrl.dom.attributes[name] = value === true ? name : String(value);
    }
};

const add_meta_entry = (head, context, meta_entry) => {
    if (!head || !is_object(meta_entry)) return;
    const meta = make_control('meta', context);
    set_attributes(meta, meta_entry);
    head.add(meta);
};

const add_link_entry = (head, context, link_entry) => {
    if (!head || !is_object(link_entry)) return;
    const link = make_control('link', context);
    set_attributes(link, link_entry);
    head.add(link);
};

const add_script_entry = (head, context, script_entry) => {
    if (!head || !is_object(script_entry)) return;
    const script = make_control('script', context);
    const attributes = { ...script_entry };
    const content = attributes.content || attributes.text || '';
    delete attributes.content;
    delete attributes.text;
    set_attributes(script, attributes);
    if (content) script.add(content);
    head.add(script);
};

const add_style_entry = (head, context, style_entry) => {
    if (!head || style_entry === undefined || style_entry === null || style_entry === false) return;

    if (is_object(style_entry) && style_entry.href) {
        add_link_entry(head, context, { rel: 'stylesheet', ...style_entry });
        return;
    }

    const style = make_control('style', context);
    if (is_object(style_entry)) {
        const attributes = { ...style_entry };
        const content = attributes.content || attributes.text || '';
        delete attributes.content;
        delete attributes.text;
        set_attributes(style, attributes);
        if (content) style.add(content);
    } else {
        style.add(String(style_entry));
    }
    head.add(style);
};

const add_head_entries = (head, context, resolved_page) => {
    if (!head || !resolved_page) return;

    if (resolved_page.meta && is_object(resolved_page.meta)) {
        for (const [name, content] of Object.entries(resolved_page.meta)) {
            if (content === undefined || content === null || content === false) continue;
            add_meta_entry(head, context, { name, content: String(content) });
        }
    }

    const page_head = resolved_page.head || {};
    for (const meta_entry of page_head.meta || []) add_meta_entry(head, context, meta_entry);
    for (const link_entry of page_head.links || []) add_link_entry(head, context, link_entry);
    for (const style_entry of page_head.styles || []) add_style_entry(head, context, style_entry);
    for (const script_entry of page_head.scripts || []) add_script_entry(head, context, script_entry);
};

const as_array = (value) => {
    if (value === undefined || value === null || value === false) return [];
    return Array.isArray(value) ? value : [value];
};

const normalize_css_asset = (asset) => {
    if (typeof asset === 'string') return { href: asset };
    if (!is_object(asset)) return null;
    const normalized = { ...asset };
    if (!normalized.href && normalized.url) normalized.href = normalized.url;
    return normalized;
};

const normalize_js_asset = (asset) => {
    if (typeof asset === 'string') return { src: asset };
    if (!is_object(asset)) return null;
    const normalized = { ...asset };
    if (!normalized.src && normalized.href) {
        normalized.src = normalized.href;
        delete normalized.href;
    }
    if (!normalized.src && normalized.url) normalized.src = normalized.url;
    return normalized;
};

const add_site_asset_links = (head, context, assets = {}) => {
    if (!head || !is_object(assets)) return;
    const css_assets = [
        ...as_array(assets.css),
        ...as_array(assets.stylesheets)
    ];
    for (const css_asset of css_assets) {
        const normalized = normalize_css_asset(css_asset);
        if (normalized) add_style_entry(head, context, normalized);
    }
};

const add_site_asset_scripts = (body, head, context, assets = {}) => {
    if (!is_object(assets)) return;
    const target = body || head;
    if (!target) return;
    const js_assets = [
        ...as_array(assets.js),
        ...as_array(assets.scripts)
    ];
    for (const js_asset of js_assets) {
        const normalized = normalize_js_asset(js_asset);
        if (normalized) add_script_entry(target, context, normalized);
    }
};

const get_control_children = (ctrl) => {
    if (!ctrl || !is_object(ctrl)) return [];
    const content = ctrl.content;
    if (!content) return [];
    if (Array.isArray(content._arr)) return content._arr;
    if (Array.isArray(content)) return content;
    return [];
};

const collect_control_tree_css = (ctrl, state = {}) => {
    const seen_controls = state.seen_controls || new Set();
    const seen_css = state.seen_css || new Set();
    const css = state.css || [];

    if (!ctrl || !is_object(ctrl) || seen_controls.has(ctrl)) return css;
    seen_controls.add(ctrl);

    const ctor = ctrl.constructor;
    const static_css = ctor && ctor.css;
    if (typeof static_css === 'string') {
        const trimmed_css = static_css.trim();
        if (trimmed_css && !seen_css.has(trimmed_css)) {
            seen_css.add(trimmed_css);
            css.push(trimmed_css);
        }
    }

    for (const child of get_control_children(ctrl)) {
        collect_control_tree_css(child, { seen_controls, seen_css, css });
    }

    return css;
};

const add_control_css = (head, context, root_ctrl) => {
    if (!head || !root_ctrl) return;
    const css_text = collect_control_tree_css(root_ctrl).join('\n\n');
    if (!css_text) return;
    add_style_entry(head, context, {
        'data-jsgui-auto-css': 'controls',
        content: css_text
    });
};

const get_binding_context = (model, page, context) => {
    const site_ctx = context.site_ctx || model.render_context({ path: page.path });
    return {
        site: model,
        model,
        page,
        route: site_ctx.route,
        section: site_ctx.section,
        navigation: site_ctx.navigation,
        data: site_ctx.data,
        request_data: site_ctx.request_data,
        locale: site_ctx.locale,
        requested_locale: site_ctx.requested_locale,
        request: context.req,
        response: context.res,
        context,
        site_ctx
    };
};

const get_path_value = (root, path_expression) => {
    if (typeof path_expression !== 'string' || !path_expression) return undefined;
    const parts = path_expression.split('.').filter(Boolean);
    let value = root;
    for (let index = 0; index < parts.length; index++) {
        if (value === undefined || value === null) return undefined;
        value = value[parts[index]];
    }

    if (parts[0] === 'navigation' && parts.length === 2 && value && Object.prototype.hasOwnProperty.call(value, 'items')) {
        return value.items;
    }
    return value;
};

const resolve_bindings = (bind, model, page, context) => {
    if (!is_object(bind)) return {};

    const binding_context = get_binding_context(model, page, context);
    const resolved = {};
    for (const [prop_name, binding] of Object.entries(bind)) {
        let value;
        if (typeof binding === 'function') {
            value = binding(binding_context);
        } else if (typeof binding === 'string') {
            value = get_path_value(binding_context, binding);
        } else {
            value = binding;
        }
        if (value !== undefined) resolved[prop_name] = value;
    }
    return resolved;
};

const should_render = (render_when, model, page, context) => {
    if (render_when === undefined || render_when === null || render_when === 'always') return true;
    if (render_when === false || render_when === 'never') return false;
    if (typeof render_when === 'function') {
        return render_when(get_binding_context(model, page, context)) !== false;
    }
    if (typeof render_when === 'string') {
        return Boolean(get_path_value(get_binding_context(model, page, context), render_when));
    }
    return Boolean(render_when);
};

const make_slot_spec = (base_props, bind, model, page, context) => ({
    context,
    ...(is_object(base_props) ? base_props : {}),
    ...resolve_bindings(bind, model, page, context)
});

const instantiate_slot = (slot_value, model, page, context) => {
    if (!slot_value || slot_value.kind === 'omit') return null;

    if (slot_value.kind === 'region') {
        const region = model.regions.get(slot_value.region);
        if (!region) return null;
        if (!should_render(region.render_when, model, page, context)) return null;
        return new region.ctrl(make_slot_spec(region.props, region.bind, model, page, context));
    }
    if (slot_value.kind === 'ctrl') {
        return new slot_value.ctrl({ context });
    }
    if (slot_value.kind === 'inline') {
        if (!should_render(slot_value.render_when, model, page, context)) return null;
        return new slot_value.ctrl(make_slot_spec(slot_value.props, slot_value.bind, model, page, context));
    }
    if (slot_value.kind === 'list') {
        const wrapper = new jsgui.controls.div({ context });
        for (const child_slot of slot_value.children) {
            const child = instantiate_slot(child_slot, model, page, context);
            if (child) wrapper.add(child);
        }
        return wrapper;
    }
    if (slot_value.kind === 'fn') {
        const produced = slot_value.fn({
            page,
            model,
            context,
            site_ctx: context.site_ctx,
            request: context.req,
            response: context.res
        });
        if (!produced) return null;
        if (typeof produced === 'function') {
            return new produced({ context });
        }
        if (typeof produced === 'string') {
            const span = new jsgui.controls.span({ context });
            span.add(produced);
            return span;
        }
        if (produced.dom || produced.content) {
            return produced;
        }
        return null;
    }
    return null;
};

const compose_page_ctrl = (resolved_page, model, options = {}) => {
    return class Site_Composed_Page extends Active_HTML_Document {
        constructor(spec = {}) {
            spec.__type_name = spec.__type_name || `composed_page_${(resolved_page.id || resolved_page.path).replace(/\W+/g, '_')}`;
            super(spec);

            const { context } = this;
            context.site_model = model;
            context.site_page = resolved_page;
            context.site_ctx = spec.site_ctx || context.site_ctx || model.render_context({ path: resolved_page.path });
            const layout = model.layouts.get(resolved_page.layout);
            const head = this.head || this.get('head');
            const body = this.body || this.get('body');

            // Title
            if (resolved_page.title && head) {
                const title_ctrl = this.title || new jsgui.controls.title({ context });
                title_ctrl.add(typeof resolved_page.title === 'string'
                    ? resolved_page.title
                    : (resolved_page.title[model.default_locale] || ''));
                if (!this.title) head.add(title_ctrl);
            }

            add_site_asset_links(head, context, model.assets);
            add_site_asset_links(head, context, options.client_assets);
            add_head_entries(head, context, resolved_page);

            // Slot composition (in layout-declared order)
            const slot_order = layout ? layout.slots : ['main'];
            for (const slot_name of slot_order) {
                const slot_value = resolved_page.slots[slot_name];
                const ctrl = instantiate_slot(slot_value, model, resolved_page, context);
                if (ctrl) {
                    // Wrap slot in a div with a class so authors can target it.
                    const slot_div = new jsgui.controls.div({ context });
                    slot_div.dom.attributes['class'] = `slot slot-${slot_name}`;
                    slot_div.add(ctrl);
                    body.add(slot_div);
                }
            }

            add_control_css(head, context, body);
            add_site_asset_scripts(body, head, context, model.assets);
            add_site_asset_scripts(body, head, context, options.client_assets);
        }
    };
};

module.exports = compose_page_ctrl;
module.exports.instantiate_slot = instantiate_slot;
module.exports.resolve_bindings = resolve_bindings;
module.exports.should_render = should_render;
module.exports.collect_control_tree_css = collect_control_tree_css;
