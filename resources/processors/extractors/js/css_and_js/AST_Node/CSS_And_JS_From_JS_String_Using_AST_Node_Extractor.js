

// Extract the CSS and JS from JS, using AST_Node.
//   AST_Node is part of jsgui3-server, possibly too slow though.

const {obs} = require('fnl');


const JS_AST_Node = require('../../../../../jsbuilder/JS_AST/JS_AST_Node');
const Extractor = require('../../../Extractor');

const Pos_Span_String_Extractor = require('../../../string/Pos_Span_String_Extractor');

// Seems like a really specific and JS-AST aware algorithm.
//   The JS AST parsing (single thread JS, maybe inefficient class structure) is relatively slow, but much faster than Babel compilation
//   was / is.

// const String_Pos_Spans_Remover = ....

// Really specifically named and categorised classes will be a main feature of this part of the (Server) architecture.






// But also being able to recreate the AST without the CSS will help.

// This extraction extracts parts from the JS file that directly are CSS.
//   I don't think at the moment it does anything further than that - though want it to remove all the declarations of CSS
//   from the JS and return that JS.

// See about removing the nodes from the tree....

class CSS_And_JS_From_JS_String_Using_AST_Node_Extractor extends Extractor {
    constructor(spec) {
        super(spec);

        this.pos_span_string_extractor = new Pos_Span_String_Extractor();
    }

    extract(str_js) {
        const {pos_span_string_extractor} = this;

        const js_str = str_js;
        return obs((next, complete, error) => {
            const spec = {
                source: js_str
            };

            // This part is kind-of slow.

            //console.log('pre create js ast node');
            console.log('Separating styles and JS');
            const js_ast_node = JS_AST_Node.from_spec(spec);
            //console.log('post create js ast node');
            
            //const ae_nodes = [];

            const arr_pos_spans_style_js_nodes = [];  // will remove them from the JS that's built / published.
            const arr_css = [];
            const arr_scss = [];
            const arr_sass = [];
            const arr_style_segments = [];

            js_ast_node.deep_iterate(node => {

                const {start, end} = node.babel;

                // Maybe this part is slow? Don't think so though.

                //console.log('node', node);
                //console.log('Object.keys(node)', Object.keys(node));
                //console.log('node.type_signature', node.type_signature);
                //console.log('node.signature', node.signature);
                //console.log('node.type', node.type);
                //console.log('node.abbreviated_type', node.abbreviated_type);

                if (node.type === 'AssignmentExpression') {
                    //return true;
                    //ae_nodes.push(node);
                    //console.log('node.source', node.source);
                    
                    //console.log('Object.keys(node.babel)', Object.keys(node.babel));

                    //console.log('node.child_nodes.length', node.child_nodes.length);

                    const [node_assigned_to, node_assigned] = node.child_nodes;
                    //console.log('node_assigned_to.source', node_assigned_to.source);
                    //console.log('node_assigned_to.type', node_assigned_to.type);
                    //console.log('node_assigned.type', node_assigned.type);

                    if (node_assigned.type === 'TemplateLiteral') {

                        if (node_assigned_to.type === 'MemberExpression') {

                            //console.log('node_assigned_to', node_assigned_to);

                            // the last ID being .css / .scss / .sass?
                            const last_me_child = node_assigned_to.child_nodes[node_assigned_to.child_nodes.length - 1];
                            //console.log('last_me_child', last_me_child);
                            //console.log('last_me_child.source', last_me_child.source);

                            if (last_me_child.source === 'css' || last_me_child.source === 'scss' || last_me_child.source === 'sass') {
                                const tl_node = node_assigned.child_nodes[0];
                                const tl_source = tl_node ? tl_node.source : '';

                                const style_type = last_me_child.source;
                                if (style_type === 'css') arr_css.push(tl_source);
                                if (style_type === 'scss') arr_scss.push(tl_source);
                                if (style_type === 'sass') arr_sass.push(tl_source);

                                arr_style_segments.push({
                                    type: style_type,
                                    source: tl_source,
                                    start,
                                    end
                                });

                                arr_pos_spans_style_js_nodes.push([start, end]);
                            }

                            // does it end '.css'?
                            //  break it down further?

                        }

                        ///console.log('node.source', node.source);
                        //throw 'stop';

                    }

                    //console.log('');
                    // look at the left part...
                }

                //throw 'stop';
            });
            //console.log('ae_nodes', ae_nodes);
            //console.log('ae_nodes.length', ae_nodes.length);
            //console.log('css_ae_nodes.length', css_ae_nodes.length);
            console.log('arr_pos_spans_style_js_nodes.length', arr_pos_spans_style_js_nodes.length);

            const str_css = arr_css.join('\n');
            const str_scss = arr_scss.join('\n');
            const str_sass = arr_sass.join('\n');

            if (arr_pos_spans_style_js_nodes.length > 1) {
                arr_pos_spans_style_js_nodes.sort((a, b) => a[0] - b[0]);
            }

            let style_segments = arr_style_segments;
            if (style_segments.length > 1) {
                style_segments.sort((a, b) => a.start - b.start);
            }
            style_segments = style_segments.map(({type, source}) => ({type, source}));

            const str_js_without_style_assignments = arr_pos_spans_style_js_nodes.length > 0
                ? pos_span_string_extractor.extract(js_str, arr_pos_spans_style_js_nodes, {invert: true})
                : js_str;

            complete({
                css: str_css,
                scss: str_scss,
                sass: str_sass,
                style_segments,
                js: str_js_without_style_assignments
            });

            const [stop, pause, resume] = [() => {}, () => {}, () => {}];
            return [stop, pause, resume];

        });

    }

    // Then extract by giving it a JS string?
    // A file path???






}

module.exports = CSS_And_JS_From_JS_String_Using_AST_Node_Extractor;
