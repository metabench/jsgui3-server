// Sep 2023:
//  This Resource itself is huge in scope, but maybe would be better to make the Resource more in terms of representing the Resource itself
//  and having things like Resource_Processor? Resource_Analyser? Resource_Miner? Resource_Extracter? Resource_Transformer?
//  Resource_Bundler? Resource_Builder?

// Resource_Verb_Carryouter  Resource_Processor seems like the general name. Could do analysis, building, extraction etc.
// Raising events / announcements when it finds things.

// Does seem like refactoring the Resource so it is much simpler will be worth it, but also going into detail on the
//  different ways the resources can be processed, doing it in a polymorphic way, observables, promises, making more classes for it if needed.

// Maybe do want the classes with processing functions built-in?
//   Changing the syntax to more explictly use various files and classes which will be interchangable and separately upgradable
//   and testable will help.

// Need to refactor, this code no longer works as first intended, and was slow when it did its full thing.
//   Can do things much more optimially, maybe with esbuild and hashing and caching.

// List of processes that get done on JS resources:
//  Parsing
//  Extracting CSS
//  Building
//   Compressing
//  (Serving) - probably not a 'process' like the others. But maybe could be.
//   Though 'serve' is indeed one of the things the functions currently here perportedly do.
//    Many are for some more specific needs / APIs, want to keep the functionalty available but provide and require a few more options.
//    Using esbuild or even something else for various parts of it. Encapsulating esbuild or babel within an API so they are swappable easily?

// Defaulting to esbuild for some things will help.
// Breaking the longer pieces of code up into different files and classes and functions, with more flexibility.
// Do this so that it is very easy to run the server, and also will be able to view the progress of what it does to build,
//  and hopefully see it all go very quickly. Maybe % complete estimates.















// Nov 2020:
//  Need to overhaul this, bugs are on the client, need to be careful and clear about what will be sent to the client.
//   Need to get more into the tools for building JS for the client. Can I do the outline / much of the outline of it myself?
//   Build up a huge JS AST of the whole thing.
//   Build up a system that understands what code does (to an extent) and how it fits together.

// Could do my own application-level compression.

// JS-Build.
//  Could identify the resources / files used in the site?

// Load all the files in, made into a function that will return what the module exports.
//  Or not...
// Make the module into just the code, store it as a variable, then be able to build 

// Would make quite a difference - with a lot of localised references made possible.
//  


// JS_File
//  Be able to get transformed versions of it
//   JS_File_


// Much of this could be better expressed as a Compiler_Resource.


// Plan: Do more of this through lower level compilation features.
//  Accessing a compilation resource makes sense structurally.

// May want a server to create and test compilation resources / compilers.

// Compilers, Bundlers, HTTP Request Handlers - Somewhat lower level, ie tools to get things done.
// Then also: resources which make use of upgraded and new lower level components.

// Server_Resource could help?

// Late 2023 - Should keep most of this for the moment, see about using parts when / where needed, also add in other (maybe simpler)
// ways to do things that are needed to publish JS.

// This resource seems like it's responsible for building JS.
// Seems like a piece of 'server' functionality that will be kind of hidden, need to make sure it's not a leaky abstraction.
//  Also worth considering 'shorthands' where specific pieces of functionality are not needed to be specified, but usually we
//  need to tell it that it needs to compile the JS (and other things).

// Maybe this JS resource would be responsible for extracting the CSS from JS and providing it to the CSS resource.
// Would be best to work through getting a few examples, and implementations of simple apps with nice (maybe new) APIs that need
// to be supported by jsgui3.

// For the moment, don't make anything really complex when it's not needed, but make it so on the lower levels (incl mid)
// it accesses functionality that is structured in a somewhat complex way, but uses it to do things which by default make the whole
// process simple.

// This runs automatically I think.
//  Probably need to get it automatically building the client js on server start if needed.
//  Likely best to save it locally, as well as to make a hash of all the files that went into the build, save that, only
//  rebuild when it has changed.

// Could even provide a list of the intial control jsgui IDs, some empty items in an array? or the index of the node in the doc
// and then the control id that will be applied.
// This could make cleaner HTML be served by default, with IDs added later on the client-side using possibly a small amount of
//  supplementary info.
// Or the ids could be assigned using xpaths.











const path = require('path'),
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

const each = jsgui.each,
	arrayify = jsgui.arrayify,
	tof = jsgui.tof;
const filter_map_by_regex = jsgui.filter_map_by_regex;
const Class = jsgui.Class,
	Data_Object = jsgui.Data_Object,
	Enhanced_Data_Object = jsgui.Enhanced_Data_Object;
	const fp = jsgui.fp,
	is_defined = jsgui.is_defined;
const Collection = jsgui.Collection;
const call_multi = jsgui.call_multi,
	get_truth_map_from_arr = jsgui.get_truth_map_from_arr;


//var zlib = require('zlib');
const util = require('util');

//const browserify = require('browserify');
const babel = require('@babel/core');

// Extends AutoStart_Resource?
const stream_to_array = require('stream-to-array');


const process_js = require('./process-js');
const {analyse_js_doc_formatting, extract_client_js} = process_js;

const CSS_And_JS_From_JS_String_Extractor = require('./processors/extractors/js/css_and_js/CSS_And_JS_From_JS_String_Extractor');
const {compile_styles} = require('./processors/bundlers/style-bundler');
const css_and_js_from_js_string_extractor = new CSS_And_JS_From_JS_String_Extractor();


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
		//this.custom_paths = new Data_Object({});
		// Those are custom file paths.
		// could have a collection of directories, indexed by name, that get served.
		// Index the collection by string value?
		//this.meta.set('served_directories', new Collection({'index_by': 'name'}));

		// But this could be held (only) in the router.
		this.served_directories = new Collection({
			'index_by': 'name'
		});
	}
	'start'(callback) {
		//console.log('Site_JavaScript start');
		const build_on_start = this.build_on_start;
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


	// Will be better as a promise.

	// client_builder processor?

	// Should use / allow for this functionality, but not default to writing it to disk in a set place,
	//  have that clearer when it's fully set up, then specify whatever shorthands.


	// And make this async / promise / observable instead.


	'build_client'(callback) {

		console.trace();
		throw 'Deprecated';

		// Configurable building mechanisms....
		//  Want to provide jsgui events / logs on the build process.

		// jsgui.notify could be used for some kinds of internal event logging.
		//  a specific type of event system.

		// jsgui.raise('notification', )

		// .note may be faster.
		



		// jsgui.notify('start', 'build_client');
		

		// Need the reference relative to the application directory.
		//var path = __dirname + '/js/app.js';

		// Can we stream it to a buffer in memory instead?

		// Using a compilation resource may be better long-term.
		//  Creating and using a relevant abstraction.

		// The server should have already loaded (a few) compilers.


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


	// May be best thinking of bundling up one or more objects / files ready for the server to serve.


	'serve_directory'(path) {
		// Serves that directory, as any files given in that directory can be served from /js

		// Perhaps just using the router would be better.

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
	'serve_package'(url, js_package, options = {}, callback) {
		//console.log('serve_package', url, js_package);
		//console.log('js_package', js_package);
		//console.log('typeof js_package', typeof js_package);
		//let tjp = typeof js_package;
		return this.serve_package_from_path(url, require.resolve(js_package), options, callback);
	}

	// Possibly some functionality would be better within the js bundler.



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
					builtins: ['buffer', 'process'],
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

					let o_transform = {
						"presets": [
							"es2015",
							"es2017"
						],
						"plugins": [
							"transform-runtime"
						] //,
						//'sourceMaps': 'inline'
					};

					if (options.include_sourcemaps) o_transform.sourceMaps = 'inline';
					let res_transform = babel.transform(str_js, o_transform);
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
				resolve(buf_js);
			})();
		}, callback);
	}

	// This is a lot about creating some 'package' that includes built JS and CSS

	// It is not so clear what 'serve' means here though.
	// Perhaps using this functionality could take a few more function calls that are more explicit,
	//  but also be set up so that it happens by default when appropriate, or some other function
	//  that uses some of the same newly refactored / referenced functions will do the job.

	// Being more explicit about making sure the server has access to:
	// 1) The client side JS
	// 2) The means to build the client side JS
	// 3) Analysis of the client-side JS source file / files
	//      If they contain CSS, that extracted CSS, as a CSS file.
	//        Probably best to make a callback saying that it's got it?
	//        An 'announcement'? New 'announcement' mechanism, so that when the CSS has been found the CSS publisher hears the announcement.
	//        Means the JS resource or publisher does not need a direct reference to the CSS resource or publisher.

	// Also, make use of the distinction between a Resource and a Publisher.
	// A Resource is something like a file on the disk.
	// The Resources get provided to the Publishers.
	//   Then do the Publishers create Resources? Publications? Published_Resources?









	// 3) The built client-side JS (with or without sourcemaps)
	// 4) The compression setting (brotli/gzip) to compress that client-side JS




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
				const Stream = require('stream');

				let s = new Stream.Readable(),
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
						const running_fn = '(' + text + ')();'
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
					const escaped_url = url.replace(/\./g, '☺');
					//this.custom_paths.set(escaped_url, fileContents);

					throw 'NYI';
				} else {
					const formatting_info = analyse_js_doc_formatting(fileContents.toString());
					//console.log('formatting_info', formatting_info);

					const {arr_lines, line_break, indentation_analysis} = formatting_info;
					const {parsed_lines, str_indentation} = indentation_analysis;
					const client_root_js = extract_client_js(formatting_info);

					//fnlfs.save('d:\\saved.js', client_root_js);


					s.push(client_root_js);
					s.push(null);
					const lines_file_content = [];

					// Don't always include sourcemap?
					//  Separate out the sourcemap?

					const b = browserify(s, {
						basedir: path.dir,
						//builtins: false,
						builtins: ['buffer'],
						'debug': options.include_sourcemaps
					});
					// Prefer the idea of sending a stream to browserify.
					const parts = await stream_to_array(b.bundle());
					/*
					var b = browserify([js_file_path], {
						'debug': true
					});
					*/
					//let parts = await stream_to_array(b.bundle());
					const buffers = parts
						.map(part => util.isBuffer(part) ? part : Buffer.from(part));
					let buf_js = Buffer.concat(buffers);
					const str_js = buf_js.toString();
					const str_js_code = str_js;
					let str_sourcemap;

					let pos_prior_sourcemap = str_js.indexOf('//# sourceMappingURL');
					if (pos_prior_sourcemap > -1) {
						str_js_code = str_js.substr(0, pos_prior_sourcemap);
						str_sourcemap = str_js.substr(pos_prior_sourcemap);
					}
					// filter_extract_css


					/*
					const js_remove_comments = (str_js_code) => {
						// comments will be OK within a string.

						// Be able to work out what type of code we are in at all points...?
						//  Non-tokenising scanner...?

						// Knowing whether or not * / // / * is within a string is important - because if it's in a string its not a comment.
						//  seems like making the scanning parser is a bit of a large task. It would constantly need to know what symbol type / string encapsulator to use.

						// Could split it into lines, spot whenever a line starts a comment...?
					} 
					*/

					const res_extract_styles = await css_and_js_from_js_string_extractor.extract(str_js_code);
					let {
						css = '',
						scss = '',
						sass = '',
						style_segments = [],
						js: str_js_no_css = str_js_code
					} = res_extract_styles || {};
					const style_bundle = compile_styles({css, scss, sass, style_segments}, options.style || {});
					let str_css = style_bundle.css || '';

					// Add the sourcemaps back? Its working.

					if (str_sourcemap) {
						str_js_no_css = str_js_no_css + str_sourcemap;
					}
					this.raise('extracted-controls-css', str_css);
					let babel_option = options.babel;

					//console.log('babel_option', babel_option);
					//throw 'stop';
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
					} else {
						buf_js = Buffer.from(str_js_no_css);
						console.log('no babel use');
					}
					var escaped_url = url.replace(/\./g, '☺');

					//console.log('pre compress buf_js.length', buf_js.length);
					zlib.gzip(buf_js, {level: 9}, (err, buffer) => {
						console.log('deflated buf_js buffer.length', buffer.length);
	
						if (err) {
							reject(err);
						} else {
							// 
							//buffer.encoding = 'deflate';
							console.log('');
							console.log('escaped_url', escaped_url);
							console.log('url', url);
							console.log('');

							const rp = this.pool;
							console.log('rp', rp);
							console.log('rp.resource_names', rp.resource_names);

							const router = rp.get_resource('Site Router');
							console.log('router', router);

							router.set_route(url, this, (req, res) => {
								console.log('router', [!!req, !!res]);
							});

							/*
							'set_route'(str_route, context, fn_handler) {
							*/

							// Setting up routing here?
							//  Or returning it to the server?

							// hack_setup_routing - as in it hacks into another part of the system (which is available)
							//  to set up the routing. A more top-down approach would be for the Server module to set the
							//  routing up itself.
							// May be nice if components / resources could set up their own routing, with access to the
							//  Resource_Pool.



							/*

							// Would need to check operation of custom paths.
							//  Maybe its use was removed...?
							this.custom_paths.set(escaped_url, {
								raw: buf_js,
								gzip: buffer
							});

							*/


	
							resolve(true);
						}
					});
				}
			})();
		}, callback);
	}

	/*
	'set_custom_path'(url, file_path) {
		var escaped_url = url.replace(/\./g, '☺');
		this.custom_paths.set(escaped_url, file_path);
	}
	*/
	//


	// Not so sure that it should process the request.
	//  A more general purpose request handler...?
	//  Have more request handling code within one js file, a cenralised portion of the app.
	//  And then within those request handlers call on useful abstractions.

	// Setting up one or more Compilers seems like it would solve some of what this is doing.
	//  Even a Compilation_Process object that provides data for monitoring.
	//   Published with a Resource_Publisher possibly.
	
	// Website_HTTP_Publisher maybe

	// or just HTTP_Publisher, a Publisher rather than a Resource.
	//  HTTP_Publisher, which is focused on publishing HTTP, may be the best option here.
	// Seems best to fix what we have already first though. Could then work on HTTP_Publisher.

	

	// Website_HTTP_Publisher_Resource possibly?

	// 



	// Site_JavaScript seems more about bundling / compiling rather than serving.
	//  Resources could present their data ahead of time / be asked for them and provide it, and the server
	//   keeps track of info more centrally.
	//  



	
}

module.exports = Site_JavaScript;
