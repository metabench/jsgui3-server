

// Publishes the HTML format.


const HTTP_Publisher = require('./http-publisher');

// This part will process the requests and responses, not the JS resource itself.



class HTTP_JS_Publisher extends HTTP_Publisher {
    constructor(spec) {

        // Should probably take one or more JS Resources.



        super(spec);
    }

    // Will publish HTML documents over HTTP, but seems as though it would need to be configured / called with
    //  something to render as well as a rendering engine and parameters.

    // compilation = rendering? not exactly.

    // handle_http()

	'handle_http'(req, res) {

		// Will the resource itself process the requests? Maybe only the Resource Publisher should do that.
		//  A greater level of abstraction there, more splitting of responsibilities.





		console.log('HTTP_JS_Publisher processing req.url', req.url);
		var remoteAddress = req.connection.remoteAddress;
		var custom_paths = this.custom_paths;
		var rurl = req.url.replace(/\./g, '☺');
		var custom_response_entry = custom_paths[rurl];
		var pool = this.pool;
		if (custom_response_entry) {
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
		} else {
			//var served_directories = this.served_directories;
			//console.log('served_directories', served_directories);
			var url_parts = url.parse(req.url, true);
			//console.log('url_parts ' + stringify(url_parts));
			var splitPath = url_parts.path.substr(1).split('/');

			var wildcard_value = req.params.wildcard_value;
			//console.log('*** wildcard_value', wildcard_value);

			if (wildcard_value == 'web/require.js') {

			} else {
				var disk_path = path.dirname(require.main.filename) + '/' + 'js/' + wildcard_value;
				var compress = false;


				//console.log('disk_path', disk_path);

				if (compress) {
					throw 'NYI with Babel';

				} else {
					// try to load it from the project's js path.
					//console.log('disk_path', disk_path);
					var project_js_path = 'js/' + wildcard_value;
					//console.log('project_js_path', project_js_path);

					fs2.load_file_as_string(disk_path, function (err, str_js) {
						if (err) {
							console.log('error loading from project_js_path: ', project_js_path);
							console.log(err);
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

module.exports = HTTP_JS_Publisher;