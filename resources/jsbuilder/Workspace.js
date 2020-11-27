const {each, Evented_Class} = require('lang-mini');
const fs = require('fs');
const JS_File = require('./JS_File/JS_File');

const libpath = require('path');
const { IoT1ClickDevicesService } = require('../../../../../../../../../../AppData/Local/Microsoft/TypeScript/4.0/node_modules/aws-sdk/index');

// Workpace should encompass all operations.
// Projects and platforms will work within them.
// Files and functions and declarations will also exist within the abstract within a workspace.

// Being able to find all the lowest level functions.
// While many files could be loaded, there could be many variables which would be able to operate when removed from their surrounding code.
//   For other code, the question should be able what objects need to be iether provided to it or available in its scope for it to operate.
//    Querying all references within a scope (of an object). So if it finds references to anything outside of the object or standard JS, it will know that such references are being
//     made there, and it's not suitable to be at the lowest level.

// So the various pieces of code from various files could algorithmicallty be sorted / fitted into levels, and then those levels are written out sequentially in one long JS file.
//  Many of these features would require further querying / lower level code, but it will be clearer what advances would be most requirted at the lower level to get the code building
//  functionality working.

// Recursively loading lots of files, such as jsgui client, would be a good way to get the system up and running.
//  Then analysis would get done on the various files that are loaded, and we would be able to find the lowest level functions out of all of them.
//  Getting all of the level 0 declarations would be very interesting to see. Then there can be a whole sequence of declaration levels.
//   Everything that gets declared in the output would have a declaration level. That is a virtual level, as it's in a flat output file.
//    Also a declaration index / root declaration index.


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



// again, could go into the system on a lower level.
//  Maybe want some advanced misc functions section.
//   They would then also be made available as queries.



// Make another function to collect child object assign require paths ???
// And another function to collect child inner required paths.



const collect_child_declaration_required_paths = (node) => {

    const res = [];
    node.query.each.child.exe(cn => {
        if (cn.t === 'VDn') {
            const assigned_nodes = cn.declaration.assigned.nodes;
            //console.log('assigned_nodes.length', assigned_nodes.length);
            each(assigned_nodes, node => {
                if (node.type === 'CallExpression') {
                    //console.log('node.source', node.source);
                    //console.log('node', node);

                    if (node.child_nodes[0].name === 'require') {
                        res.push(node.child_nodes[1].value);
                    }
                }
            })
        }


        // so that's probably a call to object.assign

        // check if there is any inner require call....
        // .query.find.inner.require.call.exe


        // eh Object.assign(jsgui.controls, require('./controls/controls'));


    });
    //throw 'stop';
    // each child declaration 
    // .declaration.assigned
    
    // all require calls.
    // node.is_require_call may be of use.
    // and would be into the more detail on a function call expression, or whatever the require statements use.
    // then being able to find the path of it on disk through the node_modules path, then going into the dir would follow the link.
    // also 'require' is not vanilla, but CommonJS.
    return res;
}

const get_node_modules_path_from_sourcepath = (sourcepath) => {


    throw 'NYI';
}

const resolve_destpath_from_sourcepath = (destpath, sourcepath) => {
    // the destpath could be a node modules path.
    if (destpath.startsWith('../')) {

    } else if (destpath.startsWith('./')) {
        
    } else {
        const nm_path = get_node_modules_path_from_sourcepath(sourcepath);
        console.log('nm_path', nm_path);
        throw 'stop';
    }
    throw 'stop';
    //require("path").dirname(destpath)
}

// collect_inner_referenced_external_names should be put lower down into the system and incorportated into queries.

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

                //console.log('node.parent_node', node.parent_node);
                //console.log('node.parent_node.source', node.parent_node.source);
                //console.log('node.index', node.index);

                //res.push(node.name);

                // Finding parameters to that arrow function expression.

                //if (node.index === 0) {
                //    res.push(node.name);
                //}

                //throw 'stop';
                //if (node.index === 0) {
                    
                //} else {
                    //throw 'stop';
                //}
                map_keys_declared_in_scope.set(node.name, true)
            } else if (node.parent_node.t === 'FE') {

                console.log('node.parent_node', node.parent_node);
                console.log('node.parent_node.source', node.parent_node.source);
                throw 'stop';
                //if (node.index === 0) {
                    
                //} else {
                    //throw 'stop';
                //}
                map_keys_declared_in_scope.set(node.name, true)
            } else if (node.parent_node.t === 'CD') {

                if (node.index === 0) {
                    map_keys_declared_in_scope.set(node.name, true)
                } else {
                    console.log('node.parent_node', node.parent_node);
                    console.log('node.parent_node.source', node.parent_node.source);
                    throw 'stop';
                }

                
                //if (node.index === 0) {
                    
                //} else {
                    //throw 'stop';
                //}
                
            } else if (node.parent_node.t === 'CM') {

                if (node.index === 0) {
                    //map_keys_declared_in_scope.set(node.name, true)
                } else {
                    //console.log('node.parent_node', node.parent_node);
                    //console.log('node.parent_node.source', node.parent_node.source);
                    //console.log('node.index', node.index);
                    //console.log('node.name', node.name);

                    map_keys_declared_in_scope.set(node.name, true); // param name

                    //throw 'stop';
                }

                
                //if (node.index === 0) {
                    
                //} else {
                    //throw 'stop';
                //}
                
            } else if (node.parent_node.t === 'ME') {

                if (node.index === 0) {
                    //map_keys_declared_in_scope.set(node.name, true)

                    // do we have the name already?

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
                    //console.log('node.parent_node', node.parent_node);
                    //console.log('node.parent_node.source', node.parent_node.source);
                    //console.log('node.index', node.index);
                    //console.log('node.name', node.name);

                    //map_keys_declared_in_scope.set(node.name, true); // param name

                    //throw 'stop';
                }

                
                //if (node.index === 0) {
                    
                //} else {
                    //throw 'stop';
                //}
                
            } else {

                // ClassMethod cm

                // it's a name, not actually available in the scope as local, but not required from outside either

                

                //console.log('node.parent_node', node.parent_node);
                //console.log('node.parent_node.source', node.parent_node.source);
                //console.log('node.index', node.index);

                //console.log('node.parent_node.parent_node', node.parent_node.parent_node);
                //console.log('node.parent_node.parent_node.source', node.parent_node.parent_node.source);


                const pn = node.parent_node, gpn = pn.parent_node, ggpn = gpn.parent_node;

                //console.log('node.t', node.t);
                //console.log('pn.t', pn.t);
                //console.log('gpn.t', gpn.t);
                //console.log('ggpn.t', ggpn.t);
                //console.log('ggpn.source', ggpn.source);

                //console.log('node.name', node.name);


                if (pn.t === 'VDr') {
                    if (node.index === 0) {
                        map_keys_declared_in_scope.set(node.name, true);
                    } else {

                        // Need to check if it's part of SystemJS...

                        if (map_jssystem_names.has(node.name)) {

                        } else {
                            throw 'stop';
                        }

                        
                    }
                } else {


                    if (pn.t === 'OPr' && gpn.t === 'OPa' && ggpn.t === 'VDr') {
                        // its declared.

                        map_keys_declared_in_scope.set(node.name, true); // param name

                    } else {
                        throw 'stop';
                    }


                    

                }

                

                //if ()
                

            }
        }
    }});

    return res;
}

const iterate_back_through_scope = (node, callback) => {
    const prev_sib = node.previous.sibling;
    console.log('prev_sib', prev_sib);
    console.log('node.index', node.index);
}

class Workspace extends Evented_Class {

    // Loading in files

    constructor(spec = {}) {
        super(spec);


        // map workspace files on disk by name

        //const map_workspace_files_on_disk_by_name = new Map();


        const map_workspace_files_on_disk_by_path = new Map();
        const index_declaration_names_to_files = new Map();
        const index_file_names_to_paths = new Map();

        // index_namespaced_declarations?

        // index_namespaced_file_program_declarations 

        const index_namespaced_file_program_declarations = new Map();



        const index_js_files_by_name = new Map();
        // index_file_names_to_paths
        

        const handle_queue_complete = () => {
            //console.log('handle_queue_complete');
            //console.log('index_declaration_names_to_files', index_declaration_names_to_files);

            this.raise('ready', {});
        }

        const handle_found_root_declared_name = (js_file, name) => {
            //console.log('handle_found_root_declared_name name', name);
            //console.log('js_file.name', js_file.name);

            if (!index_declaration_names_to_files.has(name)) {
                index_declaration_names_to_files.set(name, []);
            }
            index_declaration_names_to_files.get(name).push(js_file.name);
        }


        this.on('add-file-complete', e_add_file_complete => {
            const {path, js_ast_node, js_file} = e_add_file_complete;

            //console.log('!!js_file', !!js_file);

            if (!index_file_names_to_paths.has(js_file.name)) {
                index_file_names_to_paths.set(js_file.name, []);
            }
            index_file_names_to_paths.get(js_file.name).push(js_file.path);

            // index_js_files_by_name
            if (!index_js_files_by_name.has(js_file.name)) {
                index_js_files_by_name.set(js_file.name, []);
            }
            index_js_files_by_name.get(js_file.name).push(js_file);


            // then there will be the possibility of further querying the features etc.
            // Creating an index of some things in those files would be useful.
            //  Those files should have indexes / available info of their own though.

            const program = js_ast_node.child_nodes[0];
            //const root_dec_names = program.query.collect.child.declaration.id.name.exe();

            //const cdecs = program.query.collect.child.declaration.exe();

            const root_declared_names_scan = () => {
                const collected_declaration_declarators = program.query.collect.child.declaration.exe().query.select.child.by.type.exe('VariableDeclarator');
                //console.log('cdecs', cdecs);
                //console.log('collected_declarators', collected_declarators);
                //console.log('collected_declaration_declarators.length', collected_declaration_declarators.length);

                each(collected_declaration_declarators, declaration_declarators => {
                    //console.log('declaration_declarators', declaration_declarators);
                    each(declaration_declarators, declarator => {
                        const vdrc0 = declarator.nav('0');
                        if (vdrc0.is_identifier) {
                            //console.log('vdrc0.name', vdrc0.name);
                            handle_found_root_declared_name(js_file, vdrc0.name);
                        }
                    })
                })

                //const collected_class_declarations = ;
                //console.log('collected_class_declarations', collected_class_declarations);

                //const class_dec_id_names = collected_class_declarations.query.collect.first.child.exe().query.collect.name.exe().flat();
                //console.log('class_dec_id_names', class_dec_id_names);
                //each(class_dec_id_names)

                program.query.select.child.by.type.exe('ClassDeclaration').query.collect.first.child.exe().query.each.name.exe(name => handle_found_root_declared_name(js_file, name));
            }
            root_declared_names_scan();  
        })
        this.on('queue-complete', () => {
            handle_queue_complete();
        });

        const handle_load_complete = (e_complete) => {
            this.raise('add-file-complete', {
                path: e_complete.path,
                js_ast_node: e_complete.value,
                js_file: e_complete.js_file
            });
            num_currently_loading--;
            //console.log('num_currently_loading', num_currently_loading);
            process_queue();
        }

        const handle_loaded_ast_file_node = (node, js_file_path) => {
            //console.log('handle_loaded_ast_file_node');

            // return some properties?

            const js_file_dir = libpath.dirname(js_file_path);
            //console.log('js_file_dir', js_file_dir);

            const program_node = node.nav('0');

            const required_paths = collect_child_declaration_required_paths(program_node);
            //console.log('required_paths', required_paths);

            each(required_paths, required_path => {
                // queue it for loading.


                // is it a module path?

                if (required_path.startsWith('./')) {
                    const module_path = libpath.resolve(js_file_dir, required_path + '.js');
                    //console.log('module_path', module_path);
                    queue_file_load_path(module_path);
                } else if (required_path.startsWith('../')) {
                    const module_path = libpath.resolve(js_file_dir, required_path + '.js');
                    //console.log('module_path', module_path);
                    queue_file_load_path(module_path);
                } else {
                    // it's a module.

                    const module_name = required_path;
                    //console.log('module_name', module_name);

                    const module_path = require.resolve(module_name);
                    //console.log('module_path', module_path);

                    if (module_path) {
                        queue_file_load_path(module_path);
                    } else {
                        throw 'Unresolved module path for module ' + module_name;
                    }
                }

            })
        }

        this.on('file-load-complete', e_complete => {
            //console.log('!!e_complete', !!e_complete);
            handle_load_complete(e_complete);
        })

        this.on('file-load-progress', e_progress => {
            const {status, value, path, js_file} = e_progress;
            // see what is exported from that file...
            //console.log('value.exports.exported.keys', value.exports.exported.keys);
            // Will probably reference the exported keys like this, but that code is not yet incorporated into the system.
            //console.log('status', status);
            if (status === 'js_ast_node-ready') {
                handle_loaded_ast_file_node(value, path);
                //console.log('pre raise ')
                this.raise('file-load-complete', {
                    path: path,
                    value: value,
                    js_file: js_file
                })
            }
        });

        const load_file_stream = (file_disk_path, readable_stream) => {

            // probably should return an observable?
            //  or just listen to the workspace events?

            const js_file = new JS_File({
                rs: readable_stream,
                path: file_disk_path
            });

            map_workspace_files_on_disk_by_path.set(file_disk_path, js_file);

            //map_workspace_files_on_disk_by_path[file_disk_path] = js_file;

            js_file.on('parsed-js_ast', e_parsed => {
                const {value} = e_parsed;
                //console.log('value', value);
                //console.log('value.query.count.all.node.exe()', value.query.count.all.node.exe());

                this.raise('file-load-progress', {
                    path: file_disk_path,
                    status: 'js_ast_node-ready',
                    js_file: js_file,
                    value: value
                })

                // Then further recursive loading?
                //js_file.required???

                // declarations that reference required file???
                //  just want to get the required files out of it.

                // .referenced_required


            })
        }

        const load_queue = [];
        const num_simultaneous_loads = 1;
        let num_currently_loading = 0;

        const load_file_by_path = (file_path) => {
            //console.log('file_path', file_path);

            if (!map_workspace_files_on_disk_by_path.has(file_path)) {
                const fstream = fs.createReadStream(file_path);
                load_file_stream(file_path, fstream);
            } else {
                num_currently_loading--;
                // signify the load is complete?
                //console.log('1) load_queue.length', load_queue.length);
                //process_queue();
                //console.log('2) load_queue.length', load_queue.length);
            }

            // What about recursive loading?
            //  We have that hapenning later on, when it has read the references from the file.

        }

        const start_queued_file_load = () => {
            //console.log('1) load_queue.length', load_queue.length);
            const file_path = load_queue.shift();
            //console.log('2) load_queue.length', load_queue.length);
            num_currently_loading++;
            load_file_by_path(file_path);
        }

        const process_queue = () => {
            //console.log('load_queue', load_queue);
            if (load_queue.length > 0) {
                //console.log('num_currently_loading', num_currently_loading);
                //console.log('num_simultaneous_loads', num_simultaneous_loads);
                while (num_currently_loading < num_simultaneous_loads) {

                    if (load_queue.length > 0) {
                        start_queued_file_load();
                        if (num_currently_loading === 0 && load_queue.length === 0) {
                            handle_queue_complete();
                            break;
                        }
                    }
                }
            } else {
                if (num_currently_loading === 0) {
                    this.raise('queue-complete', {})
                }
            }
            //console.log('load_queue.length', load_queue.length);
        }

        const queue_file_load_path = (path) => {
            load_queue.push(path);
            this.raise('file-load-queued', {
                path: path
            });
        }

        this.on('file-load-queued', e_queued => {
            const {path} = e_queued;

            process_queue();
        })

        const load_files_by_path = (paths) => {
            each(paths, path => {
                queue_file_load_path(path);
            })
        }

        if (spec.files) {
            load_files_by_path(spec.files);
        }

        Object.defineProperty(this, 'index_declaration_names_to_files', {
            get() { 
                return index_declaration_names_to_files;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'index_file_names_to_paths', {
            get() { 
                return index_file_names_to_paths;
            },
            enumerable: true,
            configurable: false
        });

        const get_file_name_conflicts = () => {
            const res = new Map();
            //console.log('index_file_names_to_paths.entries()', index_file_names_to_paths.entries());
            each(Array.from(index_file_names_to_paths.entries()), entry => {
                const [name, paths] = entry;
                if (paths.length > 1) {
                    res.set(name, paths);
                }
                //console.log('entry', entry);
                //throw 'stop';
            })
            return res;
        }


        // Will likely be further broken up into steps and queries.
        //  

        const get_map_node_delcared_objects = (node) => {
            const declared_objects = node.query.collect.child.exe().query.collect.child.declared.object.exe().flat();
            const map_declared_objects = new Map();
            each(declared_objects, arr_declared_object => {
                const [name, node] = arr_declared_object;
                if (!map_declared_objects.has(name)) {
                    map_declared_objects.set(name, node);
                } else {
                    throw 'stop';
                }
            });
            //console.log('map_declared_objects', map_declared_objects);
            const filter_out_undefined = map => {
                const res = new Map();
                each(Array.from(map.entries()), entry => {
                    const [k, v] = entry;
                    if (v !== undefined) res.set(k, v);
                });
                return res;
            }

            //map_declared_objects = filter_out_undefined(map_declared_objects);
            //console.log('map_declared_objects', map_declared_objects);

            return filter_out_undefined(map_declared_objects);

        }

        const get_node_referred_to_names = node => {

            const isolated = [];
            const first_part_objects = [];

            //const map_names_already_declared = new Map();
            //  

            //  So this can also find declarations within those nodes.


            node.query.each.inner.exe(node_inner => {
                let inside_me = false;
                const parent = node_inner.parent_node;
                const t = node_inner.t;
                //console.log('t', t);


                // 
                // collect.inner.referred.to.name


                if (t === 'ID') {
                    if (parent) {
                        //console.log('parent.t', parent.t);
                        if (parent.t === 'ME') inside_me = true;
                    }
                    if (inside_me) {
                        // want the first name - it's the name of the object
                        //const first_id_name = 

                    } else {
                        //console.log('not in ME: node_inner.name', node_inner.name);
                        if (node_inner.name !== undefined) isolated.push(node_inner.name);
                    }
                }

                if (t === 'ME') {
                    if (node_inner.nav('0').name !== undefined) first_part_objects.push(node_inner.nav('0').name);
                }
            });

            //console.log('isolated', isolated);
            //console.log('first_part_objects', first_part_objects);
            const map_referred_to_names = new Map();
            each(isolated, name => map_referred_to_names.set(name, true));
            each(first_part_objects, name => map_referred_to_names.set(name, first_part_objects));
            // and what about the nodes that make the references?
            //  from each of these, we could attempt to find the object reference within the node we are looking at.
            const all_referred_to_names = Array.from(map_referred_to_names.keys());
            //console.log('all_referred_to_names', all_referred_to_names);
            return all_referred_to_names;
        }
        // May need to be done after preparation of the declarations and the order of them.

        // plan output function
        //  will just contain the function names in direct order?
        //  the nodes in direct order?

        const iterate_output_declarations = namespaced_output_declaration_name => {
            let [namespace, name_within_namespace] = namespaced_output_declaration_name.split('/');
            const files_with_name_declared = index_declaration_names_to_files.get(name_within_namespace);

            console.log('files_with_name_declared', files_with_name_declared);
            console.log('namespace', namespace);

            const namespace_file_path = index_file_names_to_paths.get(namespace)[0];
            console.log('namespace_file_path', namespace_file_path);

            const js_file = map_workspace_files_on_disk_by_path.get(namespace_file_path);
            console.log('js_file', js_file);
            console.log('map_workspace_files_on_disk_by_path.keys()', map_workspace_files_on_disk_by_path.keys());


            const iterate_program_node_declarations = (program_node, callback) => {
                program_node.query.each.child.exe(program_child => {
                    // if its a variable declaration

                    // class declaration

                    // 'C:\\Users\\james\\Documents\\Copied_Over_Docs\\Documents\\code\\code\\js\\jsgui3-all\\jsgui3-server\\node_modules\\jsgui3-html\\html-core\\control-enh.js'
                    // 'C:\\Users\\james\\Documents\\Copied_Over_Docs\\Documents\\code\\code\\js\\jsgui3-all\\jsgui3-server\\node_modules\\jsgui3-html\\html-core\\control-enh.js',

                    if (program_child.type === 'VariableDeclaration') {
                        program_child.query.each.child.exe((vdr, index) => {
                            const declared_name = vdr.child_nodes[0].name;
                            console.log('declared_name', declared_name);
                            callback({
                                type: 'object_declared_name',
                                value: declared_name,
                                declarator: vdr,
                                index: index
                            })
                        })
                    }
                    if (program_child.type === 'ClassDeclaration') {
                        const declared_name = program_child.child_nodes[0].name;
                        callback({
                            type: 'class_declared_name',
                            value: declared_name,
                            class_declaration: program_child
                        })
                    }

                })

            }
            

            // So for Block_Scope nodes, I think Program and BlockStatement, there should be means to analyse and particularly index the declarations
            //  made as child nodes.

            // is the node declared as then being assigned to a require call?
            const map_available_declared_names = new Map();
            // and a map of the statement where they were declared.
            const map_declared_name_declaration_statements = new Map();

            iterate_program_node_declarations(js_file.node_root.child_nodes[0], cb_iteration => {
                //console.log('cb_iteration', cb_iteration);

                // does it contain an inner require call?
                //  as in, is the class or variable declared as being the result of a require call?


                const {type, value} = cb_iteration;
                if (type === 'object_declared_name') {
                    const {declarator, index} = cb_iteration;
                    //const declaration = declarator.parent_node;
                    //const index_in_declaration = declarator.index;

                    map_available_declared_names.set(value, true);
                    map_declared_name_declaration_statements.set(value, declarator.parent_node);
                };
                if (type === 'class_declared_name') {
                    const {class_declaration} = cb_iteration;
                    //const declaration = declarator.parent_node;
                    //const index_in_declaration = declarator.index;

                    map_available_declared_names.set(value, true);
                    map_declared_name_declaration_statements.set(value, class_declaration);
                };
            });


            const found_declaration = js_file.node_root.child_nodes[0].query.select.child.declaration.by.declared.name.exe(name_within_namespace)[0];
            //console.log('found_declaration', found_declaration);

            if (found_declaration) {
                //console.log('found_declaration.parentNode', found_declaration.parent_node);
                //add_declaration_to_output(found_declaration)    


                // Can we collect external namespaced names?
                //  Or do we take these found names, then look for the external references in that js file?
                const nonlocal_object_names_used = collect_inner_referenced_external_names(found_declaration);

                // Looks like it falsely thinks that 'spec' is nonlocal.

                //console.log('nonlocal_object_names_used', nonlocal_object_names_used);
                //console.log('found_declaration.source.length', found_declaration.source.length);

                // js_file.

                // js_file.node_root.child_nodes[0].query.collect.require.call.exe();

                const arr_require_calls = js_file.node_root.child_nodes[0].query.collect.require.call.exe();
                console.log('arr_require_calls', arr_require_calls);

                // source of all of them...?

                let all_source = '';
                const required_module_paths = [];

                

                each(arr_require_calls, rc => {
                    const mpath = rc.required_module_path;
                    console.log('mpath', mpath);
                    required_module_paths.push(mpath);
                });

                console.log('required_module_paths', required_module_paths);

                /*
                each(arr_require_calls, item => {

                    // item.is_require_call

                    //  then we can read the required module name from it.





                    const mpath = item.nav('1').value;
                    required_module_paths.push(mpath);

                    if (all_source.length > 0) all_source = all_source + '\n';
                    all_source = all_source + item.source;


                    console.log('item.parent_node.parent_node.source', item.parent_node.parent_node.source);
                    console.log('item.parent_node.parent_node', item.parent_node.parent_node);
                    console.log('item.parent_node', item.parent_node);
                    console.log('item', item);
                    

                    if (item.parent_node.t === 'VDr') {

                        if (item.parent_node.child.count === 2) {
                            if (item.parent_node.parent_node.t === 'VDn') {
                                const [c0, c1] = item.parent_node.child_nodes;
                                if (c0.t === 'ID') {

                                    const item_name = c0.name;
                                    console.log('item_name', item_name);

                                    // and find the module path.

                                    const rmp = item.required_module_path;
                                    console.log('rmp', rmp);



                                    //  

                                } else {
                                    throw 'stop';
                                }
                            }
                        } else {
                            throw 'stop';
                        }

                        

                    } else {
                        throw 'stop';
                    }



                    throw 'stop';
                });
                console.log('all_source', all_source);

                // But also want to iterate into and into the requirements of each of these required modules.


                console.log('required_module_paths', required_module_paths);

                // But what does it require from each of them?
                //  Which keys does it load?
                console.log('js_file.path', js_file.path);
                

                throw 'stop';
                */

            }
            






            throw 'stop';
        }


        const build_output = (arr_declaration_names) => {
            // could have the arr_declaration_names take js file or module names first
            //  eg control-enh.js/Control
            const change_let_to_const = true;
            //console.log('build_output', build_output);
            // are they in order?
            const arr_output_nodes = [];
            const arr_str_output = [];
            const map_available_declared_names = new Map();
            // and a map of the statement where they were declared.
            const map_declared_name_declaration_statements = new Map();

            const add_declaration_to_output = (node) => {

                if (change_let_to_const === true) {
                    // likely want a .clone function for a node.
                    ///  except it clones that node as the root.

                            // .clone_as_root
                            // .clone_as_program
                            // .clone_into_program
 
                            //  so it will parse the AST and create a new JS_AST_Node program at that point.


                    const tnode = node.clone_into_program();
                    //console.log('tnode', tnode);
                    if (tnode.type === 'VariableDeclaration') {
                        //console.log('tnode.babel.node', tnode.babel.node);
                        tnode.babel.node.kind = 'const';
                        //console.log('tnode.babel.node', tnode.babel.node);
                        const nonlocal_object_names_used = collect_inner_referenced_external_names(tnode);
                        //console.log('nonlocal_object_names_used', nonlocal_object_names_used);
                        if (nonlocal_object_names_used.length > 0) {
                            // Search back through the scope for the declaration of that object.
                            //  extract the single declared object from it (as a declaration can have multiple declarators)

                            // Find the declarator statement if there is one. (not the variable declaration statement parent)
                            // Find the class declaration statement if it's a class.
                            // have we got those names already loaded into the system?
                            each(nonlocal_object_names_used, nonlocal_name => {
                                if (map_declared_name_declaration_statements.has(nonlocal_name)) {
                                    const declaration_of_nonlocal_name = map_declared_name_declaration_statements.get(nonlocal_name);

                                    //console.log('declaration_of_nonlocal_name', declaration_of_nonlocal_name);

                                    if (declaration_of_nonlocal_name.t === 'VDn') {
                                        if (declaration_of_nonlocal_name.child.count === 1) {
                                            add_declaration_to_output(declaration_of_nonlocal_name);
                                        } else {
                                            throw 'stop';
                                        }
                                    }
                                }
                            })
                            //interate_back_through_scope(node)
                        }
                    }
                    arr_output_nodes.push(tnode);
                    arr_str_output.push(tnode.generate());
                }
            }

            // Need to better get into understanding which files export what, then how they could be added to in other files.

            // May be best to provide the file as well as the declaration.
            //  eg control-enh.js/Control


            each(arr_declaration_names, declaration_name => {
                //console.log('declaration_name', declaration_name);

                const files_with_name_declared = index_declaration_names_to_files.get(declaration_name);
                //console.log('files_with_name_declared', files_with_name_declared);

                // consulting the namespaced file names instead?
                //  

                if (files_with_name_declared.length === 1) {

                    const [file_name] = files_with_name_declared;
                    const files_with_name = index_js_files_by_name.get(file_name);
                    if (files_with_name.length === 1) {

                        const [js_file] = files_with_name;

                        //console.log('');
                        //console.log('js_file.name', js_file.name);
                        
                        const iterate_program_node_declarations = (program_node, callback) => {
                            program_node.query.each.child.exe(program_child => {
                                // if its a variable declaration

                                // class declaration

                                if (program_child.type === 'VariableDeclaration') {
                                    program_child.query.each.child.exe((vdr, index) => {
                                        const declared_name = vdr.child_nodes[0].name;
                                        console.log('declared_name', declared_name);
                                        callback({
                                            type: 'object_declared_name',
                                            value: declared_name,
                                            declarator: vdr,
                                            index: index
                                        })
                                    })
                                }
                                if (program_child.type === 'ClassDeclaration') {
                                    const declared_name = program_child.child_nodes[0].name;
                                    callback({
                                        type: 'class_declared_name',
                                        value: declared_name,
                                        class_declaration: program_child
                                    })
                                }

                            })

                        }
                        

                        // So for Block_Scope nodes, I think Program and BlockStatement, there should be means to analyse and particularly index the declarations
                        //  made as child nodes.

                        // is the node declared as then being assigned to a require call?


                        iterate_program_node_declarations(js_file.node_root.child_nodes[0], cb_iteration => {
                            console.log('cb_iteration', cb_iteration);

                            // does it contain an inner require call?
                            //  as in, is the class or variable declared as being the result of a require call?


                            const {type, value} = cb_iteration;
                            if (type === 'object_declared_name') {
                                const {declarator, index} = cb_iteration;
                                //const declaration = declarator.parent_node;
                                //const index_in_declaration = declarator.index;

                                map_available_declared_names.set(value, true);
                                map_declared_name_declaration_statements.set(value, declarator.parent_node);
                            };
                            if (type === 'class_declared_name') {
                                const {class_declaration} = cb_iteration;
                                //const declaration = declarator.parent_node;
                                //const index_in_declaration = declarator.index;

                                map_available_declared_names.set(value, true);
                                map_declared_name_declaration_statements.set(value, class_declaration);
                            };
                        });


                        const found_declaration = js_file.node_root.child_nodes[0].query.select.child.declaration.by.declared.name.exe(declaration_name)[0];
                        //console.log('found_declaration', found_declaration);

                        if (found_declaration) {
                            //console.log('found_declaration.parentNode', found_declaration.parent_node);
                            add_declaration_to_output(found_declaration)    
                        }




                        // seems like out of interest here.

                        // Then go through those declared objects, looking for any (external) references.

                        const iterate_for_references_info = () => {
                            each(Array.from(map_declared_objects.entries()), entry => {
                                const [name, node] = entry;
                                const referred_to_names = get_node_referred_to_names(node);
                                const vanilla_names = [];
                                const non_vanilla_names = [];
                                each(referred_to_names, name => {
                                    if (map_jssystem_names.has(name)) {
                                        vanilla_names.push(name);
                                    } else {
                                        non_vanilla_names.push(name);
                                    }
                                })
    
                                //console.log('');
                                console.log('referred_to_names', referred_to_names);
                                console.log('vanilla_names', vanilla_names);
                                console.log('non_vanilla_names', non_vanilla_names);
    
                                
                            });
                        }

                    } else {
                        throw 'NYI';
                    }
                } else {

                    throw 'NYI';
                }

            });



            /*
            let res = '';
            console.log('arr_output_nodes', arr_output_nodes);

            each(arr_output_nodes, output_node => {
                res += output_node.source;
            })

            //throw 'stop';
            return res;

            */

            return arr_str_output.join('\n');

        }

        Object.defineProperty(this, 'file_name_conflicts', {
            get() { 
                return get_file_name_conflicts();
            },
            enumerable: true,
            configurable: false
        });

        // index_js_files_by_name

        Object.defineProperty(this, 'index_js_files_by_name', {
            get() { 
                return index_js_files_by_name;
            },
            enumerable: true,
            configurable: false
        });



        this.load_file_stream = load_file_stream;
        this.load_files_by_path = load_files_by_path;
        this.build_output = build_output;
        this.iterate_output_declarations = iterate_output_declarations;
    }


}

module.exports = Workspace;