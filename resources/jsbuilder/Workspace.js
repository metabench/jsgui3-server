const {Evented_Class} = require('lang-mini');

const JS_File = require('./JS_File/JS_File');

class Workspace extends Evented_Class {

    // Loading in files

    constructor(spec = {}) {
        super(spec);

        const map_workspace_files_on_disk_by_path = {};

        this.on('file-load-progress', e_progress => {
            const {status, value} = e_progress;

            // see what is exported from that file...

            console.log('value.exports.exported.keys', value.exports.exported.keys);
        });


        this.load_file_stream = (file_disk_path, readable_stream) => {

            // probably should return an observable?
            //  or just listen to the workspace events?

            const js_file = new JS_File({
                rs: readable_stream,
                path: file_disk_path
            });

            map_workspace_files_on_disk_by_path[file_disk_path] = js_file;

            js_file.on('parsed-js_ast', e_parsed => {
                const {value} = e_parsed;
                //console.log('value', value);
                console.log('value.query.count.all.node.exe()', value.query.count.all.node.exe());

                this.raise('file-load-progress', {
                    status: 'js_ast_node-ready',
                    value: value
                })
            })


        }


    }


}

module.exports = Workspace;