const {each, Evented_Class} = require('lang-mini');
const fs = require('fs');
const JS_File = require('./JS_File/JS_File');

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
    'arguments'

];

const map_vanilla_names = new Map();
each(arr_vanilla_object_names, vanilla_name => map_vanilla_names.set(vanilla_name, true));

class Workspace extends Evented_Class {

    // Loading in files

    constructor(spec = {}) {
        super(spec);

        const map_workspace_files_on_disk_by_path = new Map();
        const index_declaration_names_to_files = new Map();
        const index_file_names_to_paths = new Map();

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
            console.log('num_currently_loading', num_currently_loading);
            process_queue();
        }

        const handle_loaded_ast_file_node = (node) => {
            //console.log('handle_loaded_ast_file_node');

            // return some properties?
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

                handle_loaded_ast_file_node(value);
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
            })
        }

        const load_queue = [];
        const num_simultaneous_loads = 1;
        let num_currently_loading = 0;


        const load_file_by_path = (file_path) => {
            //console.log('file_path', file_path);

            const fstream = fs.createReadStream(file_path);
            load_file_stream(file_path, fstream);

        }

        const start_queued_file_load = () => {
            //console.log('load_queue.length', load_queue.length);
            const file_path = load_queue.shift();
            num_currently_loading++;
            load_file_by_path(file_path);
        }

        const process_queue = () => {
            if (load_queue.length > 0) {
                while (num_currently_loading < num_simultaneous_loads) {

                    if (load_queue.length > 0) {
                        start_queued_file_load();
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

        const build_output = (arr_declaration_names) => {
            console.log('build_output', build_output);
            // are they in order?

            //  Finding the declaration / platform level makes a lot of sense.

            //  Can find the platform levels of everything once it's been added to the system.

            // but can do this recursively without first building the platform levels.
            each(arr_declaration_names, declaration_name => {
                console.log('declaration_name', declaration_name);

                const files_with_name_declared = index_declaration_names_to_files.get(declaration_name);
                console.log('files_with_name_declared', files_with_name_declared);

                if (files_with_name_declared.length === 1) {
                    const [file_name] = files_with_name_declared;
                    const files_with_name = index_js_files_by_name.get(file_name);
                    if (files_with_name.length === 1) {
                        const [js_file] = files_with_name;
                        console.log('');
                        console.log('js_file.name', js_file.name);


                        /*

                        const declared_objects = js_file.node_root.nav('0').query.collect.child.exe().query.collect.child.declared.object.exe().flat();
                        //console.log('declared_objects', declared_objects);

                        let map_declared_objects = new Map();
                        each(declared_objects, arr_declared_object => {
                            const [name, node] = arr_declared_object;

                            if (!map_declared_objects.has(name)) {
                                map_declared_objects.set(name, node);
                            } else {
                                throw 'stop';
                            }

                        });

                        console.log('map_declared_objects', map_declared_objects);

                        const filter_out_undefined = map => {
                            const res = new Map();
                            each(Array.from(map.entries()), entry => {
                                const [k, v] = entry;
                                if (v !== undefined) res.set(k, v);
                            });
                            return res;
                        }
                        */

                        const map_declared_objects = get_map_node_delcared_objects(js_file.node_root.nav('0'));
                        //console.log('map_declared_objects', map_declared_objects);




                        // Then go through those declared objects, looking for any (external) references.
                        each(Array.from(map_declared_objects.entries()), entry => {
                            const [name, node] = entry;
                            const referred_to_names = get_node_referred_to_names(node);
                            const vanilla_names = [];
                            const non_vanilla_names = [];
                            each(referred_to_names, name => {
                                if (map_vanilla_names.has(name)) {
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



                        // .each.child.declared.object next

                        // collect.child.declared.object

                        // Then find that declaration.

                        //  Being able to lookup / reference single object declarations would be cool.


                        // We don't have these queries on the file object (for the moment).

                        // select all child declaration?
                        // find.child.declaration.with.name

                        // node.query.child.declared.objects.exe();

                        // Worth doing more specialised development and testing of the child.declared.objects query.
                        //  Will need a function that's a little more advanced.

                        //  Will need to work with object pattern, array pattern etc.






                        // js_file.query.select.declared.object.by.name.exe();


                    } else {
                        throw 'NYI';
                    }
                } else {
                    throw 'NYI';
                }

            });

            //throw 'stop';


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
    }


}

module.exports = Workspace;