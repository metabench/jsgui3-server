const JS_AST_Node_Index = require('./JS_AST_Node_8-Features');

const {each} = require('lang-mini');



// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
const arr_vanilla_object_names = [
    'Infinity', 'NaN', 'undefined', 'globalThis',
    'eval', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'encodeURI',
    'Object', 'Function', 'Boolean', 'Symbol',
    'Error', 'AggregateError', 'EvalError', 'InternalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError',
    'Number', 'BigInt', 'Math', 'Date',
    'String', 'RegExp',
    'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
    'Map', 'Set', 'WeakMap', 'WeakSet',
    'ArrayBuffer', 'SharedArrayBuffer', 'Atomics', 'DataView', 'JSON',
    'Promise', 'Generator', 'GeneratorFunction', 'AsyncFunction', 'AsyncGenerator', 'AsyncGeneratorFunction',
    'Reflect', 'Proxy',
    'Intl',
    'WebAssembly',
    'arguments'//,

    //'this' // not formally there? An (informal) extension to VanillaJS?
    // 'this' is not officially part of the VanillaJS spec, but is nevertheless available when using VanillaJS.
    //  'this' is part of JavaScript itself, not part of the VanillaJS library. Don't think we need to recognise it on this level as it gets recognised as a JS language object.


];

const arr_commonjs_object_names = [
    'require'
];

const js_runtime_object_names = [
    'console', 'document'
]

const map_vanilla_names = new Map();
each(arr_vanilla_object_names, vanilla_name => map_vanilla_names.set(vanilla_name, true));

const map_commonjs_names = new Map();
each(arr_commonjs_object_names, commonjs_name => map_commonjs_names.set(commonjs_name, true));


const map_jssystem_names = new Map();
each(arr_vanilla_object_names, vanilla_name => map_jssystem_names.set(vanilla_name, true));
each(arr_commonjs_object_names, commonjs_name => map_jssystem_names.set(commonjs_name, true));
each(js_runtime_object_names, runtime_object_name => map_jssystem_names.set(runtime_object_name, true));



class JS_AST_Node_Planning extends JS_AST_Node_Index {
    constructor(spec = {}) {
        super(spec);

        // sets the childnodes here.
        //  will also make available the relevant bable properties.

        // Use the lower level tools to kind of understand the node.
        //  Provide property getters that will do this.

        // Seeing what pattern / recognised object / pattern it is.

        // plan_variable_name_remapping

        // Will be fastest to carry out multiple changes at once in one iteration.
        //  May use quite standard babel transform syntax once I have the changes arranged in a nice object that makes them clear.

        // Set up more ctrl-alt-\ then a letter remappings.
        //  Can use that to quickly type a varierty of snippets.

        const collect_inner_referenced_external_names = node => {
            const res = [];
            const map_keys_declared_in_scope = new Map();
            const map_res_names = new Map();
    
            node.query.callmap.inner.exe(node => node.type, {'VariableDeclaration': node => {
                //console.log('VD node', node);
                //console.log('node.declared.keys', node.declared.keys);
                each(node.declared.keys, key => map_keys_declared_in_scope.set(key, true));
            }, 'ClassDeclaration': node => {
                //console.log('CD node', node);
                //console.log('node.declared.keys', node.declared.keys);
                each(node.declared.keys, key => map_keys_declared_in_scope.set(key, true));
            }, 'Identifier': node => {
    
                // the identifier could be 
    
                if (node.is_object_reference) {
                    //console.log('objref node.name', node.name);
        
                    if (map_keys_declared_in_scope.has(node.name)) {
                        // the object reference refers to a key already declared in the current scope.
        
                        //console.log('Found object reference using object already declared in the current scope:', node.name);
        
                    } else {
                        if (map_jssystem_names.has(node.name)) {
                            //console.log('Found reference to object provided by the VanillaJS library:', node.name);
                        } else {
                            //console.log('Found reference to object not declared in current scope:', node.name);
    
                            if (!map_res_names.has(node.name)) {
                                map_res_names.set(node.name, true);
                                res.push(node.name);
                            }
    
                        }
                    }
                } else {
                    // is it 0 index?
                    // is its parent an arrow function expression?
    
                    if (node.parent_node.t === 'AFE') {
                        //if (node.index === 0) {
                            
                        //} else {
                            //throw 'stop';
                        //}
                        map_keys_declared_in_scope.set(node.name, true)
                    }
                }
            }})
            return res;
        }

        const collect_inner_identifiers_that_reference_external_names = node => {
            const res = [];
            const map_keys_declared_in_scope = new Map();
            const map_res_names = new Map();
    
            node.query.callmap.inner.exe(node => node.type, {'VariableDeclaration': node => {
                //console.log('VD node', node);
                //console.log('node.declared.keys', node.declared.keys);
                each(node.declared.keys, key => map_keys_declared_in_scope.set(key, true));
            }, 'ClassDeclaration': node => {
                //console.log('CD node', node);
                //console.log('node.declared.keys', node.declared.keys);
                each(node.declared.keys, key => map_keys_declared_in_scope.set(key, true));
            }, 'Identifier': node => {
                if (node.is_object_reference) {
                    if (map_keys_declared_in_scope.has(node.name)) {
                    } else {
                        if (map_jssystem_names.has(node.name)) {
                            //console.log('Found reference to object provided by the VanillaJS library:', node.name);
                        } else {
                            if (!map_res_names.has(node.name)) {
                                map_res_names.set(node.name, true);
                                res.push(node);
                            }
                        }
                    }
                } else {
                    if (node.parent_node.t === 'AFE') {
                        map_keys_declared_in_scope.set(node.name, true)
                    }
                }
            }})
            return res;
        }

        this.collect_inner_referenced_external_names = () => collect_inner_referenced_external_names(this);
        this.collect_inner_identifiers_that_reference_external_names = () => collect_inner_identifiers_that_reference_external_names(this);

        
        

    }
    //plan_variable_name_remapping() {
    //    this.each_inner_declaration_declarator_identifier()
    //}
}

module.exports = JS_AST_Node_Planning;