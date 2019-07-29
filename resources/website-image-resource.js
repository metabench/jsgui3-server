

// 24/07/2019 - Looks like this needs more work.
//  Want to provide simple and powerful API.
//  Load images from disk to memory upon startup?
//   Make resized versions?

// Specifically being able to deal with icons and a directory of icons.

var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    jsgui = require('jsgui3-html'),
    os = require('os'),
    http = require('http'),
    libUrl = require('url'),
    Resource = jsgui.Resource;

const fs2 = require('../fs2');
const fnlfs = require('fnlfs');

const libpath = require('path');

// Then could this connect to a cms db?
//  Or a wider source of images?
// Mapping the ws image requests to acquiring the image data.
//  Won't necessarily be on disk. Could call to another resource, such as network / file / files on network.
//  Could map over / use another resource.

/*
jsgui_jpeg = require('../../image/node/jsgui-node-jpeg'),
jsgui_png = require('../../image/node/jsgui-node-png');
*/
//Worker = require('webworker-threads');

var stringify = jsgui.stringify,
    each = jsgui.each,
    arrayify = jsgui.arrayify,
    tof = jsgui.tof;
var call_multi = jsgui.call_multi;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class,
    Data_Object = jsgui.Data_Object,
    Enhanced_Data_Object = jsgui.Enhanced_Data_Object;
var fp = jsgui.fp,
    is_defined = jsgui.is_defined;
var get_item_sig = jsgui.get_item_sig;
var Collection = jsgui.Collection;

// need to see what type of image it is.
var mime_types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'otf': 'application/font-sfnt',
    'ttf': 'application/font-sfnt'
}

var serve_image_file_from_buffer = function (buffer, filename, response) {
    console.log('filename', filename);
    var extname = path.extname(filename);
    console.log('extname ' + extname);
    var extension = extname.substr(1);
    console.log('extension ' + extension);
    response.writeHead(200, {
        'Content-Type': mime_types[extension]
    });
    response.end(buffer, 'binary');
}

var serve_image_file_from_disk = function (filePath, response) {
    var extname = path.extname(filePath);
    console.log('extname ' + extname);
    var extension = extname.substr(1);
    console.log('extension ' + extension);
    fs.readFile(filePath, function (err, data) {
        if (err) {
            throw err;
        } else {
            response.writeHead(200, {
                'Content-Type': mime_types[extension]
            });
            response.end(data, 'binary');
        }
    });
}

class Site_Images extends Resource {
    constructor(spec) {
        super(spec);
        this.custom_paths = {};
        this.served_directories = new Collection({
            'index_by': 'name'
        });

        // A cache?
        //  By path?
        //  By name?

        // Maybe an icon cache makes sense for the moment.
        //  All icons get loaded at the beginning.
        //   Want to be able to show mime types easily in a selector.

        // Getting icons set up easily for an app will be very useful.
        //  Going to be similar between apps too.


        // map icons name to buffer
        //  or map icons, then there is some info within an obj.

        this.map_icons = {};

        // this.map_resized_icons = {} ???

        //  icons by name.
        //  will have the loaded buffers for the icons in memory too.
    }
    'start'(callback) {
        callback(null, true);
    }
    'get_image_url'(image_key) {

    }
    'get_icon_url'(icon_key) {
        // May have different size icons
        //  For the moment will keep this simple.
        return '/img/icons/' + icon_key + '.png';
    }
    load_icon_set(path, map_icons) {

        // Observable? Promise?

        const my_map_icons = this.map_icons;
        //const {map_icons} = this;

        // Async function?
        //  Callback?
        //  lets just load them for the moment.
        // obs function to show progress along the way could help too.

        // use of fnlfs?
        //  do more work on that too?
        //  fnlfs definitely makes sense.

        // maybe will have an observable (ofp) that loads a bunch of files.
        //  ofp seems perfect for this.

        // A reverse of the map icons....
        //  mapping from the file name to the icon name

        const map_icon_filenames_to_names = {};
        // Worth making an array of them in each place.


        each(map_icons, (v, k) => {
            map_icon_filenames_to_names[v] = map_icon_filenames_to_names[v] || [];
            map_icon_filenames_to_names[v].push(k)
        });

        console.log('Website Image Resource load_icon_set', map_icons);

        const icons_to_load = [];
        const resolved_path = libpath.resolve(path);
        console.log('resolved_path', resolved_path);
        const obs_files = fnlfs.dir_files(resolved_path);
        console.log('obs_files', obs_files);
        obs_files.on('next', data => {
            //console.log('obs_files next data', data);

            // does the file match the map_icons
            // extname
            const {name, path} = data;
            // search for it before the last .
            let noextname;
            let pos1 = name.lastIndexOf('.');
            //  just need to get these icons easily available....

            if (pos1 > -1) {
                noextname = name.substring(0, pos1);
            } else {
                noextname = name;
            }
            console.log('noextname', noextname);
            // check for the name match....

            if (map_icon_filenames_to_names[name]) {
                console.log('found match', name);
                console.log('map_icon_filenames_to_names[name]', map_icon_filenames_to_names[name]);

                each(map_icon_filenames_to_names[name], filename => {
                    icons_to_load.push([filename, name, path]);
                })


                // Then put it in icons_to_load
                //  keep track of the relvant paths and icon names.
                // best to include the full path...
                
            }
        });

        obs_files.on('complete', async() => {
            console.log('obs files complete. icons_to_load', icons_to_load);

            // Then go through this list, loading them into buffers.
            //  Then those buffers will be served on request using the names given for the icons.

            // async for in loop...

            for (let icon_info of icons_to_load) {
                const [icon_key, filename, path] = icon_info;
                // load the file....

                // is load an obs?
                const buf_file = await fnlfs.load(path);
                console.log('buf_file', buf_file);
                console.log('buf_file.length', buf_file.length);

                // then put this into the buffer of icons.
                //  by size? icon resizing?

                // mime_types
                //  look into mime_types

                // look at the file extension too.
                //  work out the mime_type that way.

                const ext = libpath.extname(filename).substr(1);
                console.log('ext', ext);

                const mime_type = mime_types[ext];
                console.log('mime_type', mime_type);

                my_map_icons[icon_key] = {
                    'mime_type': mime_type,
                    'key': icon_key,
                    'buffer': buf_file
                }
            }
        });

        // Send the names of all icons over to the client?
        //  Not right now, just make them available from the server.

        //  load the file names in the path...?
        //  see which correspond to the map_icons
        //   then load those icons from disk. - done that.




    }

    // load_icon_set
    //  will get them served under /img/icons/...





    // want to be able to serve a path better.
    //  still has bug here.
    'serve_directory'(path) {
        this.served_directories.push({
            'name': path
        });
    }
    // basically get requests, but can handle more than just get.
    'process'(req, res) {
        //console.log('Site_Images processing');

        // Escaping etc?
        //  slashed in icon keys? escape and unescape them...?

        // change some keys...? avoid slashes in keys...




        // Should look into icons collection?
        //  A specific /img/icons/ system will be in use.
        //   Means to get resized versions too?

        // When processing a request, check if there is such an icon?

        // looking in img/icons/?
        //  will have special processing for them.

        const {map_icons} = this;


        var remoteAddress = req.connection.remoteAddress;
        var custom_paths = this.custom_paths;

        var rurl = req.url;
        //var pool = this.pool;
        // should have a bunch of resources from the pool.
        //var pool_resources = pool.resources();
        //console.log('pool_resources ' + stringify(pool_resources));
        var url_parts = url.parse(req.url, true);
        //console.log('url_parts ' + stringify(url_parts));
        var splitPath = url_parts.path.substr(1).split('/');
        console.log('resource site images splitPath ' + stringify(splitPath));

        // Will check for icons first.
        //  Be able to reference icons without the extension.
        //   easier that way. just icon keys.

        let ctu = true;

        if (splitPath.length === 3) {
            // and the icons...

            if (splitPath[1] === 'icons') {
                const icon_key = splitPath[2];
                const icon_info = map_icons[icon_key];
                if (icon_info) {
                    console.log('icon_info', icon_info);

                    const {mime_type, buffer} = icon_info;

                    // then serve that buffer with that mime type.

                    res.writeHead(200, {
                        "Content-Type": mime_type
                    });
                    res.write(buffer);
                    res.end();
                    ctu = false;


                }
            }




        }


        if (ctu) {
            if (rurl.substr(0, 1) == '/') rurl = rurl.substr(1);
            rurl = rurl.replace(/\./g, '☺');
            //console.log('rurl ' + rurl);
            var custom_response_entry = custom_paths[rurl];
            var that = this;
            //console.log('custom_response_entry ' + stringify(custom_response_entry));



            if (custom_response_entry) {
                var tcr = tof(custom_response_entry);
                //console.log('tcr ' + tcr);
                if (tcr == 'data_value') {
                    val = custom_response_entry.value();
                    //console.log('val ' + val);
                    var tval = tof(val);
                    if (tval == 'string') {
                        // then it should be a local file path, serve it.
                        serve_image_file_from_disk(val, res);
                    }
                }
                //throw 'stop';
            } else {
                //console.log('splitPath', splitPath);
                if (splitPath.length > 0) {
                    if (splitPath[0] == 'img' || splitPath[0] == 'images') {
                        //console.log('splitPath', splitPath);
                        if (splitPath.length > 1) {
                            // At this point, can look for the file on disk within the app directory.
                            //console.log('rurl', rurl);
                            //console.log('req.url', req.url);
                            // replace /images/ with /img/
                            var project_disk_path = req.url.replace('images/', 'img/');
                            if (project_disk_path.substr(0, 1) == '/') project_disk_path = project_disk_path.substr(1);
                            // try to load it from disk.
                            //  try to load it as a buffer
                            fs2.load_file_as_buffer(project_disk_path, function (err, buffer) {
                                if (err) {
                                    console.log('error loading ' + project_disk_path + ': ' + err);
                                    // Then try serving the file using the other methods, but will need to take care not to expect some resources to be there,
                                    //  such as the web_data resource.
                                    // Want top have a very versitile web_data resource that uses a DB, but also to have the means to interact with the files on disk
                                    //  in the project directory.
                                    res.writeHead(404, {
                                        "Content-Type": "text/plain"
                                    });
                                    res.write("404 Not Found\n");
                                    res.end();
                                } else {
                                    console.log('loaded file, need to serve it');
                                    // need to set the mime type correctly.
                                    //  We can get this from the file name for the moment.
                                    // serve_image_file_from_buffer
                                    //serve_image_file_from_disk(diskPath, res);
                                    console.log('buffer', buffer);
                                    console.log('project_disk_path', project_disk_path);
                                    serve_image_file_from_buffer(buffer, project_disk_path, res);
                                }
                            })
                        }
                    }
                }
            }

        }

        
    }
}
module.exports = Site_Images;