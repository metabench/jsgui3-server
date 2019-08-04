var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	jsgui = require('jsgui3-html'),
	os = require('os'),
	http = require('http'),
	libUrl = require('url'),
	Resource = jsgui.Resource,
	fs2 = require('../fs2'),
	//brotli = require('iltorb').compress,
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

const babel = require('@babel/core');

// Extends AutoStart_Resource?
const stream_to_array = require('stream-to-array');


const process_js = require('./process-js');
const {analyse_js_doc_formatting, extract_client_js} = process_js;

// // analyse_js_doc_formatting extract_client_js


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
	});
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
	'start'(callback) {
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

	'build_client'(callback) {
		// Need the reference relative to the application directory.
		//var path = __dirname + '/js/app.js';
		var appDir = path.dirname(require.main.filename);
		//console.log('appDir', appDir);
		var app_path = appDir + '/js/app.js';
		var app_bundle_path = appDir + '/js/app-bundle.js';
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

	'serve_directory'(path) {
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

	'serve_package'(url, js_package, options = {}, callback) {
		console.log('serve_package', url, js_package);
		console.log('js_package', js_package);
		console.log('typeof js_package', typeof js_package);
		let tjp = typeof js_package;
		return this.serve_package_from_path(url, require.resolve(js_package), options, callback);
	}

	'package'(js_file_path, options = {}, callback) {

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

				//console.log('options.babel', options.babel);

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

				let parts = await stream_to_array(b.bundle());

				const buffers = parts
					.map(part => util.isBuffer(part) ? part : Buffer.from(part));
				let buf_js = Buffer.concat(buffers);
				let str_js = buf_js.toString();

				let babel_option = options.babel
				//console.log('babel_option', babel_option);
				if (babel_option === 'es5') {

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
					buf_js = Buffer.from(res_transform.code);
				} else {
					buf_js = Buffer.from(str_js);
				}
				//var escaped_url = url.replace(/\./g, '☺');
				//console.log('pre brot buf_js.length', buf_js.length);
				//console.trace();
				/*
				brotli(buf_js, (err, buffer) => {
					console.log('* brotli deflated buffer.length', buffer.length);
					if (err) {
						reject(err);
					} else {
						// 
						buffer.encoding = 'br';
						//this.custom_paths.set(escaped_url, buffer);
						resolve(buffer);
					}
				});
				*/
				resolve(buf_js);
			})();
		}, callback);
	}

	// Can't use this for scs any longer I think. Seems we can :)
	//  May be worth separating out different preparation and compilation functions.


	// prepare_root_js
	//  ?compile root js?

	// Moving code out of the resource itself.
	//  have a directory called js_process?
	//  a bunch of functions available in process_js?





	// Different preparation / compilation phases.


	// Separating out client js, (server js), css
	//  from one file

	// process single source js file
	//  splitting for client
	



	// Then browserify compilation - bringing all the files.





	'serve_package_from_path'(url, js_file_path, options = {}, callback) {
		//console.log('serve_package_from_path', url, js_file_path);
		// js_mode option may need to be used.


		// Make it an observable?
		//  Raise an event when we have the browserified fill js file (uncompressed?).


		let a = arguments;
		if (typeof a[2] === 'function') {
			callback = a[2];
			options = {
				//'babel': 'mini',
				'include_sourcemaps': false
			};
		}
		let serve_raw = options.serve_raw || options.raw;
		let accepts_brotli = false;

		// Need to come up with compressed versions.
		//  An object that provides different versions.


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
				//console.log('options.babel', options.babel);

				//  Likely to remove this....
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
				// want a raw option with no browserify.
				//console.log('serve_raw', serve_raw);
				if (serve_raw) {
					var escaped_url = url.replace(/\./g, '☺');
					this.custom_paths.set(escaped_url, fileContents);
				} else {
					// Early filtering / transformation to the client CSS.
					//  Need to transform a single file, such as in a single page (single file) app, making it work as client-side code.

					// May be nice to move filtering / recompilation like this to a more general file / module?
					//  Not for the moment, this is quite specific.
					//  If it would help later on, then do it.


					// Will be very useful for making apps with just one code file.
					//  The server-side code gets removed during this compilation.


					// find indentation scheme.
					//  and then can find the indentation level on each line.

					// and find the line separation character.
					//  could count \r\n as well as \n by itself.



					// get the line separator
					//  get the indentation character or sequence (ie 4 spaces)


					

					const formatting_info = analyse_js_doc_formatting(fileContents.toString());
					//console.log('formatting_info', formatting_info);

					const {arr_lines, line_break, indentation_analysis} = formatting_info;
					const {parsed_lines, str_indentation} = indentation_analysis;

					//console.log('parsed_lines', parsed_lines);
					//console.log('indentation_analysis', indentation_analysis);

					const client_root_js = extract_client_js(formatting_info);

					//let client_js = arr_client_js_lines.join('\n');



					fnlfs.save('d:\\saved.js', client_root_js);;



					// Then can analyse the lines to see what type of lines they are.
					//  Comment, server, isomorphic, client

					// Not so sure there will even be client only code apart from code in the filke, or it will be encapsulated deeper in activate.


					// 







					//throw 'stop';

					// &#13   -- Carriage return.
					//  Maybe there is a prob with windows files using 2 characters for new lines.






					//const no_server_js = transform_ensure_client_side_js(fileContents.toString());
					//console.log('no_server_js', no_server_js);

					s.push(client_root_js);
					s.push(null);
					//let include_sourcemaps = true;

					// Filtering out server-side code.

					// recompile js module(s).

					// for the moment keep that functionality here as functions.


					const lines_file_content = [];








					// Don't always include sourcemap?
					//  Separate out the sourcemap?

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

					// the part prior to '//# sourceMappingURL' is the code itself.
					//  we could parse it into AST?
					//  and find all controls with .css properties?

					// could do a more rudimentary dearch on each line of code.
					//  That makes most sense.
					// And can use the info to recompile the js code, with the CSS parts removed.

					// This js resource could raise an event saying it's got the extracted / removed CSS.
					//  Makes sense for the js resource to handle it.

					// This will make it a lot easier to edit the CSS alongside the relevant controls.
					// Controls could possibly have different themes that operate too.
					//  Could make a theme-name css class, such as 'dark', and have css for specific themes declared in the control CSS / SASS.

					let str_js_code = str_js;
					let str_sourcemap;

					let pos_prior_sourcemap = str_js.indexOf('//# sourceMappingURL');
					if (pos_prior_sourcemap > -1) {
						str_js_code = str_js.substr(0, pos_prior_sourcemap);
						str_sourcemap = str_js.substr(pos_prior_sourcemap);
					}

					// can add the same sourcemap back?
					//  Would prob be OK with the CSS code removed.





					// extract css function...
					//  extract css lines
					//   returns css, non-css

					// filter_extract_css

					const js_remove_comments = (str_js_code) => {
						// comments will be OK within a string.

						// Be able to work out what type of code we are in at all points...?
						//  Non-tokenising scanner...?

						// Knowing whether or not */ // /* is within a string is important - because if it's in a string its not a comment.
						//  seems like making the scanning parser is a bit of a large task. It would constantly need to know what symbol type / string encapsulator to use.

						// Could split it into lines, spot whenever a line starts a comment...?
					} 

					//const filter_js_remove_server_js
					// compile_client_js_from_server_js
					// is_server_js




					const filter_js_extract_control_css = (str_js_code) => {
						// res = [css, js_no_css]
						// Split the js lines.

						const s_js = str_js_code.split('\n');

						// Mark the relative lines.
						//  Could remove comment sections...
						//  Spot comments begginning, comments ending.
						//   Then could remove all comments from here, so we don't make use of any commented code.

						// My own (basic) code to strip comments?
						//  Stripping out commented CSS is relatively important
						//  And replace some specific comments?
						// Could go through the whole js string, char by char, removing comments.
						// Make it so that all css that gets used has no indent...
						//  That could work.

						// Any line with .css = funny quote

						let within_class_css = false;
						const control_css_lines = [];
						const js_non_css_lines = [];
						// and the non-css lines.
						// And need to look for its stop.
						// And leave the first and last line out of the css.
						each(s_js, js_line => {
							let placed_js_line = false;
							const pos_class_css_begin = js_line.indexOf('.css = `');
							// if its 0

							if (pos_class_css_begin > -1) {
								//console.log('js_line', js_line);
								within_class_css = true;
							}
							// Put empty lines (back) into the js array?

							if (within_class_css) {
								//console.log('js_line', js_line);

								const pos_control_css_end = js_line.indexOf('`;');
								//console.log('pos_control_css_end', pos_control_css_end);
								if (pos_control_css_end > -1) {
									within_class_css = false;
								} else {
									if (pos_class_css_begin > -1) {

									} else {
										control_css_lines.push(js_line);
									}
									
								}
							} else {
								js_non_css_lines.push(js_line);
								placed_js_line = true;
							}

							if (!placed_js_line) {
								js_non_css_lines.push('');
							}
							//let is_control_css_start = js_line.indexOf()

							if (control_css_lines.length > 200) throw 'stop';

						})
						return [control_css_lines.join('\n'), js_non_css_lines.join('\n')];
					}

					let [str_css, str_js_no_css] = filter_js_extract_control_css(str_js_code);

					// Add the sourcemaps back? Its working.

					if (str_sourcemap) {
						str_js_no_css = str_js_no_css + str_sourcemap;
					}

					//console.log('str_css.length', str_css.length);
					//console.log('str_js_no_css.length', str_js_no_css.length);
					//console.log('str_css', str_css);

					this.raise('extracted-controls-css', str_css);
					// And the server / website resource can listen for these, and then give the data to the css.


					// string of extracted Control css.

					// Very nice... looks like the css and js separation and compilation is working OK.

					// Work with the JS when serving the JS.
					//  Could raise an event from the resource saying that we have the extracted / compiled CSS...?







					//throw 'stop';









					




					//await fnlfs.save('D:\\saved_no_css.js', str_js_no_css);

					// Then with str_js....
					//  That is the part where we can find / remove the css parts.

					// Use a JS parser?
					//  Is that overkill?

					// can we separate statements by ';'?
					//  then go through them, looking for the css.

					// or look for Class.css = {..

					//console.log('str_js.length', str_js.length);

					//console.log('buf_js.length', buf_js.length);
					//console.log('str_js.length', str_js.length);
					// options.babel === true

					let babel_option = options.babel;

					//console.log('babel_option', babel_option);

					//babel_option = 'es5';
					//console.log('babel_option', babel_option);
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

						let res_transform = babel.transform(str_js_no_css, o_tranform);
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
							"comments": false
							//plugins: ["minify-dead-code-elimination"]
						};

						if (options.include_sourcemaps) o_transform.sourceMaps = 'inline';
						let res_transform = babel.transform(str_js_no_css, o_transform);
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
						buf_js = Buffer.from(str_js_no_css);
					}
					var escaped_url = url.replace(/\./g, '☺');

					//console.log('pre compress buf_js.length', buf_js.length);
					zlib.gzip(buf_js, {level: 9}, (err, buffer) => {
						//console.log('deflated buffer.length', buffer.length);
	
						if (err) {
							reject(err);
						} else {
							// 
							//buffer.encoding = 'deflate';

							this.custom_paths.set(escaped_url, {
								raw: buf_js,
								gzip: buffer
							});
	
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

					// uglify and remove comments?

					// Coming up with different built / compressed versions makes sense.

					// Need to be able to return uncompressed if client cannot accept compressed data.

					//throw 'stop';
					// Then run it through babel to change the ES6 classes into older style.

					// then need to serve it under url

					

					
					//console.trace();


					// want it compressed with a few different ways.

					// want to compress to gzip by default

					// Will change the way that .custom paths works.

					// need to come up with both gzip and brotli compressed.
					//  well, could ignore brotli for the moment
					// could also have them become ready.





					/*

					if (accepts_brotli) {

						brotli(buf_js, (err, buffer) => {
							console.log('* brotli deflated buffer.length', buffer.length);

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
					} else {
						
					}
					*/
				}
				/*
				*/
				// 
				// then need to store that compiled file at that URL.
			})();
		}, callback);
	}

	'set_custom_path'(url, file_path) {
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

	'process'(req, res) {
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
		//console.log('custom_response_entry', custom_response_entry);
		//console.log('custom_response_entry.encoding', custom_response_entry.encoding);

		// hmmmm get not working right?


		//console.log('custom_response_entry', custom_response_entry);

		var pool = this.pool;
		if (custom_response_entry) {

			//let t = tof(custom_response_entry._);

			//console.log('req.headers', req.headers);
			const ae = req.headers['accept-encoding'];
			let data_to_serve;
			let o_head = {
				'Content-Type': 'text/javascript'
			}
			if (ae.includes('gzip')) {
				o_head['Content-Encoding'] = 'gzip';
				data_to_serve = custom_response_entry._.gzip;
			} else {
				data_to_serve = custom_response_entry._.raw;
			}
			res.writeHead(200, o_head);
			res.end(data_to_serve);




			//throw 'stop';


			// it's an object.

			// ._.raw, ._.gzip



			/*
			console.log('t', t);
			if (t === 'buffer') {
				//console.log('sending js');
				let o_head = {
					'Content-Type': 'text/javascript'
				}
				//console.log('custom_response_entry._.encoding', custom_response_entry._.encoding);
				if (custom_response_entry._.encoding) {

					o_head['Content-Encoding'] = custom_response_entry._.encoding;
				}

				res.writeHead(200, o_head);
				//response.end(servableJs);
				//console.log('custom_response_entry._', custom_response_entry._);
				//console.log('custom_response_entry._.length', custom_response_entry._.length);
				res.end(custom_response_entry._);
				//console.log('response js written');

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
			*/

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


							// use gzip in many cases.
							// want to support that.

							// a streaming middleware fn could work...?

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