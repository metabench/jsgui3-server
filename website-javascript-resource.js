var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	jsgui = require('jsgui3-html'),
	os = require('os'),
	http = require('http'),
	libUrl = require('url'),
	Resource = jsgui.Resource,
	fs2 = require('./fs2'),
	brotli = require('iltorb').compress,
	//UglifyJS = require('uglify-js'),
	zlib = require('zlib');



//fs.createReadStream(filename).pipe(brotli()).pipe(res);

const fnl = require('fnl');
const prom_or_cb = fnl.prom_or_cb;
const fnlfs = require('fnlfs');


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
var call_multi = jsgui.call_multi,
	get_truth_map_from_arr = jsgui.get_truth_map_from_arr;

var browserify = require('browserify');
//var zlib = require('zlib');
var util = require('util');

const babel = require('babel-core');

// Extends AutoStart_Resource?
const stream_to_array = require('stream-to-array');



// This could do with some overhauling.
//  Only need to have it do what the applications need from it.
//  Building the app may take place automatically elsewhere.



// May need to change around a fair few references to make it workable.
// May need some more complicated logic to change it to the path for service.


// This will also be able to be told to serve some particular files from some particular locations.


// It can have a custom_serving_map.

// That means that some specific urls that are given as inputs refer to specific files, perhaps with
//  relative paths.

// Since this is a resource, we could wrap that in the .meta object.
//  Or just have a custom_paths_map Data_Object.


// Not so sure about this.
//  Processing of files for serving. Maybe some kind of map would work well.
//  Now the path name is needed in order to serve various files.
//  Some of the files will be useful on the client as well (possibly resources).

// This file seems too hackily put together.

// There may be different categories of JavaScript files to serve or not serve.
//  We want the app, by default, to serve necessary files for the JSGUI client.
//  May get into compressing and browserifying them too.

// May need some more general purpose resource for dealing with JavaScript files.
//  Want to make it easy to serve the client files in its default configuration.

// Perhaps we could have availability comments within the JavaScript files.
//  So whatever folder it is in, we can know it should be served at /js/jsgui-lang-utils or similar.
//  However, it may be best to have the client app mirror the structure on the server.
//  Could make the app easier to serve, and mean we don't need to transform references.

// /js/web/jsgui-html-client
//  could start with that path.
//  most of what we look for will be within web anyway.
//  we could also make some other things available from resources.
//   not everything in web is suitable for the client anyway.
//   many things from outside web will be suitable for the client.

// Needs to make sure the require.js file gets served.
//  Then there will be a bunch of other files that get requested.
//  Better to try serving the files in their paths without modification.



// 21/02/2018 - Need site JavaScript to be able to send a specified Buffer for a specified JS path.


var serve_js_file_from_disk_updated_refs = function (filePath, response, callback) {
	fs2.load_file_as_string(filePath, function (err, data) {
		if (err) {
			throw err;
		} else {
			//console.log('');
			//console.log('serve_js_file_from_disk_updated_refs filePath ' + filePath);

			//console.log('data ' + data);
			//var servableJs = updateReferencesForServing(data);

			response.writeHead(200, {
				'Content-Type': 'text/javascript'
			});
			//response.end(servableJs);
			response.end(data);
		}
	});
}

var check_served_directories_for_requested_file = function (arr_served_paths, split_path_within_js, callback) {
	//console.log('check_served_directories_for_requested_file');
	//console.log('split_path_within_js ' + stringify(split_path_within_js));
	//console.log('arr_served_paths ' + stringify(arr_served_paths));
	// use call_multi.
	// maybe we get a result from them all.

	var fns = [

	]

	var checkPath = function (path, callback) {
		// check to see if an existing file matches up with the path that is requested.
		// so, from that path, we use the split_path_within_js for the rest of the file path.

		// then we check if such a (JS) file exists.
	}

	// fns.push([fs2.load_file_as_string, [source_path_item], function(err, res_loaded) {

	// Not so sure I can use the exists function like this...
	var reconstitutedPathWithinJs = split_path_within_js.join('/');
	var firstFoundPath;
	each(arr_served_paths, function (i, fsPath) {
		fns.push([function (callback) {
				var checkingPath = fsPath + '/' + reconstitutedPathWithinJs;
				fs.exists(checkingPath, function (exists) {
					//console.log('cb fsPath ' + checkingPath + ' exists ' + exists)
					if (exists & !firstFoundPath) {
						firstFoundPath = checkingPath;
					}
					callback(null, exists);
				})
			},
			[]
		]);
	});

	call_multi(fns, function (err, res_multi) {
		if (err) {
			console.log('err ' + err);
			throw 'stop';
		} else {
			//console.log('res_multi ' + stringify(res_multi));
			//throw 'stop';

			if (firstFoundPath) {
				callback(null, firstFoundPath);
			} else {
				callback(null, null);
			}
		}
	})

	// add a function check for each of the
}

// A way of serving a file so that it includes custom code.
//  Or have a standard client template that is easy to serve.

// Maybe do more with custom controls, such as custom page controls.
//  Those page controls would know which control types are within them.
//  That info could then be used to write JS code that sets up the references on the client.



// Possibly this should have its own routing tree to connect paths with js files?
//  Need to set up custom paths.



class Site_JavaScript extends Resource {
	//'fields': {
	//	'custom_paths': 'data_object'
	//},

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
		//console.log('Site_JavaScript start');
		var build_on_start = this.build_on_start;
		if (build_on_start) {
			this.build_client(function (err, res_build) {
				if (err) {
					callback(err)
				} else {
					callback(null, true);
				}
			})
		} else {
			callback(null, true);
		}
		// Let's have it build the client-side code.
		//  Need the options to ignore various files, as well as to include the source maps in the output.
	}

	// build client, and serve it from one particular place
	//  do so with a promise.

	// serve_package

	// Need to bundle / build together a package from the disk path, then serve it under a URL route.





	// want to give it the file to build.
	// There will be a variety of jsgui packages.

	'build_client' (callback) {
		// Need the reference relative to the application directory.

		//var path = __dirname + '/js/app.js';
		var appDir = path.dirname(require.main.filename);
		//console.log('appDir', appDir);

		var app_path = appDir + '/js/app.js';
		var app_bundle_path = appDir + '/js/app-bundle.js';

		//
		var wstream = fs.createWriteStream(app_bundle_path);
		var b = browserify();

		//b.require(app_path, {
		//	entry: true,
		//	debug: true
		//});
		b.add(app_path);
		//console.log('app_path', app_path);
		//console.log('pre browserify bundle');
		//b.bundle().pipe(process.stdout);

		b.bundle().pipe(wstream);

		wstream.end = function (data) {

			//console.log('file bundle write complete');

			callback(null, app_bundle_path);
			// no more writes after end
			// emit "close" (optional)
		}
	}

	// Will could serve all jsgui code?
	//  May be better not to allow server-side code to be read on the client.
	//  Could have specific directories within jsgui that get served to the client.

	'serve_directory' (path) {
		// Serves that directory, as any files given in that directory can be served from /js
		var served_directories = this.served_directories;
		//console.log('served_directories ' + stringify(served_directories));
		//served_directories.push(path);
		served_directories.push({
			'name': path
		});
		//console.log('served_directories ' + stringify(served_directories));
		//console.log('path ' + path);

		//throw 'stop';

	}

	// Want to be able to serve specific js files.

	// Need better syntax than this:
	//  //site_js.meta.set('custom_paths.js/modernizr-latest☺js', './client/js/modernizr-latest.js');

	// .set_custom_path(url, fileName)
	//  would need to appear in the main routing tree perhaps?

	// However, may set it using a buffer, not a file path.
	// The app-bundle may be created on application start.

	// options...



	// but serving a package when we have the path will be a little different.


	// However, loading it from disk allows for content replacement better.
	//  However, supply the package ourselves, and its fine.

	'serve_package' (url, js_package, options = {}, callback) {
		return this.serve_package_from_path(url, require.resolve(js_package), options, callback);
	}


	// Can't use this for scs any longer I think.
	'serve_package_from_path' (url, js_file_path, options = {}, callback) {


		// js_mode option may need to be used.

		let a = arguments;
		if (typeof a[2] === 'function') {
			callback = a[2];
			options = {
				//'babel': 'mini',
				'include_sourcemaps': true
			};
		}


		return prom_or_cb((resolve, reject) => {
			(async () => {
				// options

				// may want a replacement within the client-side code.

				// Can we call browserify on the code string?
				//  Creating a modified copy of the file would do.
				//  Load the file, modify it, save it under a different name


				let s = new require('stream').Readable(),
					path = require('path').parse(js_file_path);

				let fileContents = await fnlfs.load(js_file_path);
				//console.log('1) fileContents.length', fileContents.length);
				// are there any replacements to do?
				// options.replacements


				if (options.js_mode === 'debug') {
					options.include_sourcemaps = true;
				}
				if (options.js_mode === 'compress' || options.js_mode === 'mini') {
					options.include_sourcemaps = false;
					options.babel = 'mini';
				}

				if (options.replace) {
					let s_file_contents = fileContents.toString();
					//console.log('s_file_contents', s_file_contents);
					each(options.replace, (text, key) => {
						//console.log('key', key);
						//console.log('text', text);
						let running_fn = '(' + text + ')();'
						//console.log('running_fn', running_fn);
						s_file_contents = s_file_contents.split(key).join(running_fn);
					})
					fileContents = Buffer.from(s_file_contents);
					//console.log('2) fileContents.length', fileContents.length);
				}
				// Then we can replace some of the file contents with specific content given when we tall it to serve that file.
				//  We have a space for client-side activation.
				s.push(fileContents);
				s.push(null);


				//let include_sourcemaps = true;


				let b = browserify(s, {
					basedir: path.dir,
					//builtins: false,
					builtins: ['buffer'],
					'debug': options.include_sourcemaps
				});



				// Prefer the idea of sending a stream to browserify.


				let parts = await stream_to_array(b.bundle());



				/*
				var b = browserify([js_file_path], {
					'debug': true
				});
				*/
				//let parts = await stream_to_array(b.bundle());
				const buffers = parts
					.map(part => util.isBuffer(part) ? part : Buffer.from(part));
				let buf_js = Buffer.concat(buffers);
				let str_js = buf_js.toString();

				//console.log('buf_js.length', buf_js.length);
				//console.log('str_js.length', str_js.length);
				// options.babel === true

				let babel_option = options.babel
				console.log('babel_option', babel_option);
				if (babel_option === 'es5') {
					// es5 option
					//  not sure if it babels async await though.

					/*
					{
						"presets": [
							"es2015",
							"es2017"
						],
						"plugins": [
							"transform-runtime"
						]
						}
					*/

					/*
					let res_transform = babel.transform(str_js, {
						//'plugins': ['transform-class']
						'plugins': ['transform-es2015-object-super', 'transform-es2015-classes', 'remove-comments'],
						'sourceMaps': 'inline'
						//'plugins': ['transform-es2015-classes']
						// transform-es2015-object-super
					});
					*/

					let o_tranform = {
						"presets": [
							"es2015",
							"es2017"
						],
						"plugins": [
							"transform-runtime"
						] //,
						//'sourceMaps': 'inline'
					};

					if (options.include_sourcemaps) o_tranform.sourceMaps = 'inline';


					let res_transform = babel.transform(str_js, o_tranform);


					//console.log('res_transform', res_transform);
					//console.log('Object.keys(res_transform)', Object.keys(res_transform));
					let jst_es5 = res_transform.code;
					//let {jst_es5, map, ast} = babel.transform(str_js);
					//console.log('jst_es5.length', jst_es5.length);
					buf_js = Buffer.from(jst_es5);
				} else if (babel_option === 'mini') {

					/*
					let o_transform = {
						presets: ["minify"]//,
						//'sourceMaps': 'inline'
					};
					*/

					let o_transform = {
						"presets": [
							["minify", {
								//"mangle": {
								//"exclude": ["MyCustomError"]
								//},
								//"unsafe": {
								//	"typeConstructors": false
								//},
								//"keepFnName": true
							}]
						],
						//plugins: ["minify-dead-code-elimination"]
					};


					if (options.include_sourcemaps) o_transform.sourceMaps = 'inline';

					let res_transform = babel.transform(str_js, o_transform);
					//let jst_es5 = res_transform.code;
					//let {jst_es5, map, ast} = babel.transform(str_js);
					//console.log('jst_es5.length', jst_es5.length);
					buf_js = Buffer.from(res_transform.code);

					/*
					{
					"presets": [["minify", {
						"mangle": {
						"exclude": ["MyCustomError"]
						},
						"unsafe": {
						"typeConstructors": false
						},
						"keepFnName": true
					}]]
					}

					*/
					//

				} else {
					buf_js = Buffer.from(str_js);
				}
				// uglify and remove comments?

				// Coming up with different built / compressed versions makes sense.

				// Need to be able to return uncompressed if client cannot accept compressed data.

				//throw 'stop';
				// Then run it through babel to change the ES6 classes into older style.

				// then need to serve it under url

				var escaped_url = url.replace(/\./g, '☺');



				brotli(buf_js, (err, buffer) => {
					console.log('deflated buffer.length', buffer.length);

					if (err) {
						reject(err);
					} else {

						// 
						buffer.encoding = 'br';
						this.custom_paths.set(escaped_url, buffer);

						resolve(true);
					}
					//res.writeHead(200, {
					//	'Content-Encoding': 'deflate',
					//	'Content-Type': 'text/javascript'
					//});
					//res.end(buffer);
					//res.writeHead(200, {'Content-Type': 'text/javascript'});
					//response.end(servableJs);
					//res.end(minified.code);
				});

				/*
				zlib.deflate(buf_js, (err, buffer) => {
					console.log('deflated buffer.length', buffer.length);


					if (err) {
						reject(err);
					} else {

						// 
						buffer.encoding = 'deflate';
						this.custom_paths.set(escaped_url, buffer);

						resolve(true);
					}
					//res.writeHead(200, {
					//	'Content-Encoding': 'deflate',
					//	'Content-Type': 'text/javascript'
					//});
					//res.end(buffer);
					//res.writeHead(200, {'Content-Type': 'text/javascript'});
					//response.end(servableJs);
					//res.end(minified.code);
				});
				*/

				// 

				// then need to store that compiled file at that URL.

			})();
		}, callback);
	}


	'set_custom_path' (url, file_path) {
		// But change the URL to have a smiley face instead of fullstops
		//console.log('url', url);
		var escaped_url = url.replace(/\./g, '☺');
		//console.log('escaped_url', escaped_url);
		//this.meta.set('custom_paths.' + escaped_url, file_path);
		//var custom_paths = this.meta.get('custom_paths');
		//console.log('custom_paths', custom_paths);
		this.custom_paths.set(escaped_url, file_path);
	}

	// 

	'process' (req, res) {
		//console.log('Site_JavaScript processing req.url', req.url);
		var remoteAddress = req.connection.remoteAddress;
		//console.log('remoteAddress ' + remoteAddress);

		// Need to be able to get the resource pool from this resource.
		//  It routes http calls to particular resources, and resources in the same pool make use of each


		// Could have specific processing for the app bundle
		//  Use browserify to put the bundle into one JavaScript file.

		// Need some default client-side bundle too.
		// With jsgui and the various controls.
		//

		// Maybe a jsgui-client dependancy would do the job best.
		//  Contains HTML and some client-specific tech.

		// It should be able to serve jsgui2-client to the client easily, as a default.









		//   other.


		// /js/...js

		// //site_js.meta.set('custom_paths.js/app☺js', './client/js/app.js');

		// http://192.168.2.3/js/app.js

		// need to serve /js/app.js.
		//  however the Website Resource should set this up.


		// the site's static file resources.
		//  a file server that serves the files with their mime types.
		//   nice to have encapsulation of this because it can do compression.

		// It may be useful to get given the rest of the URL.


		var custom_paths = this.custom_paths;

		//console.log('custom_paths', custom_paths);
		//throw 'stop'
		//console.log('tof custom_paths', tof(custom_paths));

		var rurl = req.url.replace(/\./g, '☺');

		//if (rurl.substr(0, 1) == '/') rurl = rurl.substr(1);


		//console.log('rurl', rurl);

		var custom_response_entry = custom_paths[rurl];
		console.log('custom_response_entry.encoding', custom_response_entry.encoding);

		// hmmmm get not working right?


		//console.log('custom_response_entry', custom_response_entry);

		var pool = this.pool;
		if (custom_response_entry) {

			let t = tof(custom_response_entry._);
			console.log('t', t);
			if (t === 'buffer') {
				let o_head = {
					'Content-Type': 'text/javascript'
				}
				if (custom_response_entry._.encoding) {
					o_head['Content-Encoding'] = custom_response_entry._.encoding;
				}

				res.writeHead(200, o_head);
				//response.end(servableJs);
				res.end(custom_response_entry._);
			} else {
				var file_path = custom_response_entry.value();
				//console.log('file_path', file_path);



				//throw 'stop';
				//var disk_path = '../../ws/js/' + wildcard_value;
				fs2.load_file_as_string(file_path, function (err, data) {
					if (err) {
						throw err;
					} else {
						res.writeHead(200, {
							'Content-Type': 'text/javascript'
						});
						//response.end(servableJs);
						res.end(data);
					}
				});
			}

			// 
			//console.trace();
			//throw 'stop';

			// we serve the file pointed to.

		} else {

			var served_directories = this.served_directories;

			console.log('served_directories', served_directories);

			//console.trace();
			//throw 'stop';


			var url_parts = url.parse(req.url, true);
			//console.log('url_parts ' + stringify(url_parts));
			var splitPath = url_parts.path.substr(1).split('/');

			var wildcard_value = req.params.wildcard_value;
			//console.log('*** wildcard_value', wildcard_value);

			if (wildcard_value == 'web/require.js') {

			} else {
				// Can get the path on disk...
				//console.log('wildcard_value', wildcard_value);
				// Best to check the app's directory.
				//  We probably won't need to be serving the whole jsgui framework from here.
				//  It can be built and put in the app's js directory.
				//  Could also make it buildable on the server?
				//var disk_path = './js/' + wildcard_value;

				//console.log('__dirname', __dirname);
				//console.log('require.main.filename', require.main.filename);
				// Would be good to uglify and gzip what gets served.

				var disk_path = path.dirname(require.main.filename) + '/' + 'js/' + wildcard_value;



				var compress = false;


				//console.log('disk_path', disk_path);

				if (compress) {
					throw 'NYI with Babel';

					// Uglify removed. Using babel instead.
					/*

					fs2.load_file_as_string(disk_path, function (err, data) {
						if (err) {
							throw err;
						} else {
							// And gzipped too...
							var minified = UglifyJS.minify(data, {
								fromString: true
							});
							//console.log('minified', minified);
							zlib.deflate(minified.code, function (err, buffer) {
								if (err) throw err;
								res.writeHead(200, {
									'Content-Encoding': 'deflate',
									'Content-Type': 'text/javascript'
								});
								res.end(buffer);

								//res.writeHead(200, {'Content-Type': 'text/javascript'});
								//response.end(servableJs);
								//res.end(minified.code);
							});
						}
					});

					*/
				} else {
					// try to load it from the project's js path.
					//console.log('disk_path', disk_path);
					var project_js_path = 'js/' + wildcard_value;
					//console.log('project_js_path', project_js_path);

					fs2.load_file_as_string(disk_path, function (err, str_js) {
						if (err) {
							console.log('error loading from project_js_path: ', project_js_path);
							console.log(err);

							/*
							var b = browserify();
							b.add(require.resolve(('jsgui2-client')));

							//b.bundle().pipe(process.stdout);
							res.writeHead(200, {'Content-Type': 'text/javascript'});

							var string = '';
							var stream = b.bundle();
							stream.on('readable',function(buffer){
								var part = buffer.read().toString();
								string += part;
								console.log('stream data ' + part);
							});

							stream.on('end',function(){
								console.log('final output ' + string);

								console.log('string.length', string.length);
								res.end(string);
							});

							//b.bundle().pipe(res);

							//res.pipe(b.bundle());
							*/

							//setTimeout(function() {
							//throw err;
							//}, 5000)


						} else {
							// Have loaded the js from the project path, we can serve it.
							console.log('have loaded js');
							// serve the js.


							//res.writeHead(200, {'Content-Type': 'text/javascript'});
							// Could possibly stream it from disk instead, that would likely be more efficient.
							console.log('str_js.length', str_js.length);

							zlib.deflate(str_js, function (err, buffer) {
								console.log('deflated buffer.length', buffer.length);


								if (err) throw err;
								res.writeHead(200, {
									'Content-Encoding': 'deflate',
									'Content-Type': 'text/javascript'
								});
								res.end(buffer);
								//res.writeHead(200, {'Content-Type': 'text/javascript'});
								//response.end(servableJs);
								//res.end(minified.code);
							});


							//response.end(servableJs);
							//res.end(str_js);
							//throw 'stop';
						}
					})
				}
			}
		}
	}
}

module.exports = Site_JavaScript;