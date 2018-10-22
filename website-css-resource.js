/*
 if (typeof define !== 'function') {
 var define = require('amdefine')(module);
 }

 define(['module', 'path', 'fs', 'url', '../../web/jsgui-html', 'os', 'http', 'url', './resource',
 '../../web/jsgui-je-suis-xml', 'cookies', '../../fs/jsgui-node-fs2-core'],

 function(module, path, fs, url, jsgui, os, http, libUrl,
 Resource, JeSuisXML, Cookies, fs2) {
 */

var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	jsgui = require('jsgui3-html'),
	os = require('os'),
	http = require('http'),
	libUrl = require('url'),
	Resource = jsgui.Resource,
	Cookies = require('cookies'),
	fs2 = require('./fs2');

const fnl = require('fnl');

var stringify = jsgui.stringify,
	each = jsgui.each,
	arrayify = jsgui.arrayify,
	tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class,
	Data_Object = jsgui.Data_Object,
	Enhanced_Data_Object = jsgui.Enhanced_Data_Object;
var fp = jsgui.fp,
	is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;

const prom_or_cb = fnl.prom_or_cb;

// Extends AutoStart_Resource?

// May need to change around a fair few references to make it workable.
// May need some more complicated logic to change it to the path for service.

// jsgui3 now has its own css in the 'client' folder.
//  Should be able to just serve css files from there.

var serve_css_string = function(css, response) {
	response.writeHead(200, {
		'Content-Type': 'text/css'
	});
	response.end(css);
}

var serve_css_file_from_disk = function (filePath, response) {
	// look for the file in two places.
	// look within the project
	// look within jsgui

	// Checking if a file exists is not recommended.
	//  Possible race condition where exists checks and sees it's there, something else deletes it, then try to open the file thinking that it exists.
	//  Now recommended to open the file and handle error if it does not exist.
	//

	var file_path_in_project = filePath;
	// And also need to work outs path within the ws system.

	let attempt_load = (path, callback) => {
		fs2.load_file_as_string(path, function (err, data) {
			if (err) {
				console.log('could not open file path', path);
				//jsgui_css_file_path = '../../' + filePath;
				//console.log('jsgui_css_file_path', jsgui_css_file_path);
				callback(null, false);
			} else {
				callback(null, data);
			}
		});
	}

	// should get and use the current module path.

	// console.log(__dirname);

	let internal_client_path = path.resolve(__dirname, '../client');

	//


	// just the file name

	let filename = path.basename(filePath);


	//console.log('filePath', filePath);



	let internal_client_file_path = path.join(internal_client_path, filePath);
	let internal_client_filename = path.join(internal_client_path, filename);

	//console.log('internal_client_file_path', internal_client_file_path);
	//console.log('internal_client_filename', internal_client_filename);

	// chould be able to use the path of this module itself for basic / default css.
	//  Always want jsgui to be able to return its own css.
	// This worked while serving examples from within jsgui.
	//  Now we need the css to be contained within jsgui itself.
	// just the file name, check if that css file is in the client path.
	// '/css/basic.css' it treats the client path as /css but only will serve css from that path.

	let candidate_paths = [filePath, internal_client_file_path, '../../css/' + filePath, './css/' + filePath, './' + filePath, '../../ws/' + filePath, '../../../' + filePath];
	let c = 0,
		l = candidate_paths.length,
		spath;
	let go = () => {
		if (c < l) {
			spath = candidate_paths[c];
			//console.log('spath', spath);
			let rpath = path.resolve(spath);

			//console.log('rpath', rpath);

			//console.log('path css test', (rpath.lastIndexOf('.css') === rpath.length - 4));
			// Security check
			if (rpath.toLowerCase().lastIndexOf('.css') === rpath.length - 4) {
				attempt_load(spath, (err, res_load) => {
					if (res_load === false) {
						c++;
						go();
					} else {
						next(null, res_load);
					}
				});
			} else {
				next(null, false);
			}

			//console.log('rpath', rpath);
			
			//c++;
			//go();
		} else {
			next(null, false);
		}
	}
	go();
	let next = (err, css) => {
		//console.log('css', css);
		if (css !== false) {
			//console.log('css', css);
			response.writeHead(200, {
				'Content-Type': 'text/css'
			});
			response.end(css);
		} else {
			console.log('could not load css', filePath);
			// serve a 404?
			response.writeHead(404, {
				"Content-Type": "text/plain"
			});
			response.write("404 Not Found\n");
			response.end();
		}
	}
}

class Site_CSS extends Resource {
	constructor(spec) {
		super(spec);
		//this.meta.set('custom_paths', new Data_Object({}));
		this.custom_paths = new Data_Object({});
		// Those are custom file paths.
		// could have a collection of directories, indexed by name, that get served.
		// Index the collection by string value?
		//this.meta.set('served_directories', new Collection({'index_by': 'name'}));
		this.served_directories = new Collection({
			'index_by': 'name'
		});
	}
	'start' (callback) {
		callback(null, true);
	}
	'serve_directory' (path) {
		// Serves that directory, as any files given in that directory can be served from /js
		var served_directories = this.served_directories;
		//console.log('served_directories ' + stringify(served_directories));
		//served_directories.push(path);
		// May also want to serve a directory under a different path.
		served_directories.push({
			'name': path
		});
		//console.log('served_directories ' + stringify(served_directories));
		//console.log('path ' + path);
		//throw 'stop';
	}
	'serve' (serve_as, system_file_path, callback) {
		return prom_or_cb((resolve, reject) => {
			console.log('css serve_as', serve_as);
			//this.custom_paths.set(serve_as, system_file_path);
			this.custom_paths[serve_as] = system_file_path;
			resolve(true);
		}, callback);
	}
	'process' (req, res) {
		//console.log('Site_CSS processing HTTP request');
		var remoteAddress = req.connection.remoteAddress;
		var custom_paths = this.custom_paths;
		var rurl = req.url;
		var pool = this.pool;
		// should have a bunch of resources from the pool.
		//var pool_resources = pool.resources();
		//console.log('pool_resources ' + stringify(pool_resources));
		//console.log('css 1) rurl', rurl);
		// Need to serve CSS from memory as well.
		//  Css is in the HTML module. Server needs to send that correct html to the client.
		//console.log('custom_paths', custom_paths);
		var url_parts = url.parse(req.url, true);
		//console.log('url_parts ' + stringify(url_parts));
		var splitPath = url_parts.path.substr(1).split('/');
		//console.log('resource site css splitPath ' + stringify(splitPath));

		var custom_response_entry;
		if (splitPath.length === 2) {
			if (splitPath[0] === 'css') {
				let filename = path.basename(splitPath[1]).slice(0, -4);
				//console.log('filename', filename);
				//console.log('jsgui.css', jsgui.css);
				//console.log('!!jsgui.css[filename]', !!jsgui.css[filename]);

				if (jsgui.css[filename]) {
					serve_css_string(jsgui.css[filename], res);
					return true;
				} else {
					custom_response_entry = custom_paths[splitPath[1]];
				}
			}
		}

		//if (rurl.substr(0, 1) == '/') rurl = rurl.substr(1);
		//rurl = rurl.replace(/\./g, '☺');
		//console.log('2) rurl ' + rurl);
		//console.log('custom_response_entry ' + (custom_response_entry));

		if (custom_response_entry) {
			var tcr = tof(custom_response_entry);
			//console.log('tcr ' + tcr);
			//throw 'stop';
			if (tcr == 'data_value') {
				var val = custom_response_entry.value();
				//console.log('val ' + val);
				throw 'stop';
				var tval = tof(val);
				if (tval == 'string') {
					// then it should be a local file path, serve it.
					serve_css_file_from_disk(val, res);
				}
			}
			if (tcr == 'string') {
				serve_css_file_from_disk(custom_response_entry, res);
			}
		} else {
			if (splitPath.length > 0) {
				if (splitPath[0] === 'css') {
					if (splitPath.length > 1) {
						if (splitPath.length == 2) {
							var fileName = splitPath[1];
							//var filePath = 'css/' + fileName;
							serve_css_file_from_disk(fileName, res);
						} else {
							if (splitPath.length === 3) {

							}
						}
					}
				}
			}
		}
	}
}


//return Site_CSS;


//});
module.exports = Site_CSS;