const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs, prom_or_cb} = require('fnl');
const {tof, each} = require('jsgui3-html');
const fnlfs = require('fnlfs');
const browserify = require('browserify');
const babel = require('@babel/core');
const stream_to_array = require('stream-to-array');
const util = require('util');
const Stream = require('stream');
// Will put the JS together. Maybe images?

const JS_AST_Node = require('./../resources/jsbuilder/JS_AST/JS_AST_Node');

// Will put the JS together. Maybe images?
//  Get everything ready to serve.

// Would need a JS file that contains refs to all of the components used.
//  Examine what is in the website and what JS it needs.

// Should be customisable which system gets used to make the bundle.
//  eg babel or esbuild. Browserify still seems to work on code here at least, but esbuild seems better.

// JS bundling will become a bit more advanced in this server. Similar principles.

// JS_Bundler reporting css that gets found while bundling JS would make sense.

// jsgui3-jsbuilder could be a separate project too.
// or jsgui3-js-builder even.


// bundle_css_from_js_file?
// scan_js_file_for_css perhaps.
// scan_js_for_css
//  maybe scan an AST or AST stream as it's coming in.



const bundle_css_from_js_str = (js_str, options = {}) => {

    console.log('js_str.length', js_str.length);
    // Moving towards using observables as a matter of course for longer-running functions.

    // Seems like this makes a settimeout as well???
    return obs((next, complete, error) => {

        console.log('js_str.length', js_str.length);

        // Returning a Bundle object when done could be best...?

        const spec = {
            source: js_str
        };

        const js_ast_node = JS_AST_Node.from_spec(spec);

        console.log('!!js_ast_node', !!js_ast_node);

        console.log('Object.keys(js_ast_node)', Object.keys(js_ast_node));

        // count all

        //console.log('js_ast_node.query("count all")', js_ast_node.query("count all"));

        console.log('js_ast_node.query.count.all.exe()', js_ast_node.query.count.all.exe());

        // A filter iterate query....? filter_deep_iterate could work.
        //  but we are looking specifically for 'ClassName.css'
        //   .css property assignments.

        const ae_nodes = [];


        // Just assigning a template literal to .css?
        const css_ae_nodes = [];

        js_ast_node.deep_iterate(node => {
            //console.log('node', node);
            //console.log('Object.keys(node)', Object.keys(node));
            //console.log('node.type_signature', node.type_signature);
            //console.log('node.signature', node.signature);
            //console.log('node.type', node.type);
            //console.log('node.abbreviated_type', node.abbreviated_type);

            if (node.type === 'AssignmentExpression') {
                //return true;
                ae_nodes.push(node);
                //console.log('node.source', node.source);
                
                //console.log('Object.keys(node)', Object.keys(node));

                //console.log('node.child_nodes.length', node.child_nodes.length);

                const [node_assigned_to, node_assigned] = node.child_nodes;
                //console.log('node_assigned_to.source', node_assigned_to.source);
                //console.log('node_assigned_to.type', node_assigned_to.type);
                //console.log('node_assigned.type', node_assigned.type);

                if (node_assigned.type === 'TemplateLiteral') {

                    if (node_assigned_to.type === 'MemberExpression') {

                        //console.log('node_assigned_to', node_assigned_to);

                        // the last ID being .css?
                        const last_me_child = node_assigned_to.child_nodes[node_assigned_to.child_nodes.length - 1];
                        //console.log('last_me_child', last_me_child);
                        //console.log('last_me_child.source', last_me_child.source);

                        if (last_me_child.source === 'css') {
                            css_ae_nodes.push(node);
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

        const arr_css = [];

        if (css_ae_nodes.length > 0) {
            //console.log('css_ae_nodes', css_ae_nodes);

            each(css_ae_nodes, css_ae_node => {
                //console.log('css_ae_node.source', css_ae_node.source);
                const tl = css_ae_node.child_nodes[1].child_nodes[0];
                //console.log('tl', tl);
                console.log('tl.source', tl.source);
                arr_css.push(tl.source);


            })
        }

        if (arr_css.length > 0) {
            const str_css = arr_css.join('\n');

            complete(str_css);
        } else {
            complete();
        }





        
        // Can then do query to get all .css properties that are string templates.
        //  is it a property of a Class object?





        // Need to get an AST from it....
        //  Or could simply search (regex?) for .css = `...`?




        // Go through each file? Just the first?

        // Or should the whole bundled (browserified) JS be consulted?

        const [stop, pause, resume] = [() => {}, () => {}, () => {}];
        return [stop, pause, resume];

    });

}



class CSS_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

CSS_Bundler.bundle_css_from_js_str = bundle_css_from_js_str;
module.exports = CSS_Bundler;