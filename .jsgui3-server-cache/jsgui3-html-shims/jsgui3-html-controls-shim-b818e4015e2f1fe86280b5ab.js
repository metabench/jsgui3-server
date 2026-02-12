const jsgui = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/html-core/html-core.js');
jsgui.Router = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/router/router.js');
jsgui.Resource = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/resource.js');
jsgui.Resource_Pool = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/pool.js');
jsgui.Resource.Data_KV = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/data-kv-resource.js');
jsgui.Resource.Data_Transform = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/data-transform-resource.js');
jsgui.Resource.Compilation = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/compilation-resource.js');
jsgui.Resource.Compiler = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/resource/compiler-resource.js');
jsgui.gfx = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/node_modules/jsgui3-gfx-core/core/gfx-core.js');
jsgui.Resource.load_compiler = (name, jsfn, options) => {
    const compiler_name = name;
    const compiler_fn = jsfn;
    const compiler_options = options || {};
    if (typeof compiler_name !== 'string' || compiler_name.length === 0) {
        throw new Error('Resource.load_compiler(name, fn, options) requires a non-empty string name');
    }
    if (typeof compiler_fn !== 'function') {
        throw new Error('Resource.load_compiler(name, fn, options) requires a function compiler implementation');
    }
    const compiler_resource = new jsgui.Resource.Compiler({ name: compiler_name });
    compiler_resource.transform = (input, transform_options = {}) => {
        const merged_options = Object.assign({}, compiler_options, transform_options);
        return compiler_fn(input, merged_options);
    };
    jsgui.Resource.compilers = jsgui.Resource.compilers || {};
    jsgui.Resource.compilers[compiler_name] = compiler_resource;
    const pool = compiler_options.pool || compiler_options.resource_pool;
    if (pool && typeof pool.add === 'function') {
        pool.add(compiler_resource);
    }
    return compiler_resource;
};
jsgui.controls = jsgui.controls || {};
Object.assign(jsgui.controls, {
    Date_Picker: require('/mnt/c/Users/james/Documents/repos/jsgui3-html/controls/organised/0-core/0-basic/0-native-compositional/date-picker'),
    Datetime_Picker: require('/mnt/c/Users/james/Documents/repos/jsgui3-html/controls/organised/0-core/0-basic/1-compositional/datetime-picker'),
    Window: require('/mnt/c/Users/james/Documents/repos/jsgui3-html/controls/organised/1-standard/6-layout/window')
});
Object.assign(jsgui, jsgui.controls);
jsgui.mixins = jsgui.mx = require('/mnt/c/Users/james/Documents/repos/jsgui3-html/control_mixins/mx.js');
module.exports = jsgui;
