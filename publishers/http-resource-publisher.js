// Just a Class for a change
// then handle...
//  need to handle http requests, for the resource.
const zlib = require('zlib');
const Cookies = require('cookies');
const multiparty = require('multiparty');
//const util = require('util');

// Publishing using websockets would be cool.


// More observable systems?
//  Making use of ofp could be very useful in various cases.
//  mfp in some parts first?
const HTTP_Publisher = require('./http-publisher');


// For publishing a resource, implying resources don't themselves need http handling.

// maybe a handle-http js file may help that will do things in a rather general purpose way?
//  But it more seems as though we need to set the routing. Then we could assign such handlers from the router.

// Possibly there should be a Website_Router Resource?
//  Or a resource wrapper.




// Could extend a JSON_Publisher. Resource_JSON_Publisher possibly.
class Resource_Publisher extends HTTP_Publisher {

    // Make this able to publish any resource?
    //  But I don't think this is going to publish a Website Resource as a Website.
    //  There is now the specialised HTTP_Website_Publisher.


    constructor(spec) {
        super(spec);
        this.resource = spec.resource;
        // Don't make a new server interface by default.
        this.name = spec.name;
    }
    handle_http(req, res) {
        //console.log('Resource_Publisher handle HTTP');
        // then the http request params...
        //console.log('req.url', req.url);
        let {
            headers,
            url,
            method,
            params
        } = req;
        //console.log('headers, url, method, params', headers, url, method, params);
        let resource_url_parts = url.split('/').slice(3).filter(x => x != '');
        //console.log('resource_url_parts', resource_url_parts);
        if (resource_url_parts.length === 1 && resource_url_parts[0] === 'status.json') {
            (async () => {
                let status = await this.resource.status;
                //console.log('status', status);
                let s_status = JSON.stringify(status);
                //console.log('s_status', s_status);
                res.setHeader('Content-Type', 'application/json');
                res.end(s_status);
            })();
        } else {
            // get the result from the resource.
            // process?
            (async () => {
                let cookies = new Cookies(req, res);
                let serve_access_error = () => {
                    //res.sendStatus(403);
                    //res.status(500).send({ error: "access denied" });
                    res.writeHead(403);
                    res.end('Access Denied');
                }
                let serve_result = (r) => {
                    if (r !== undefined) {
                        //console.log('r', r);
                        // Then turn it to JSON.
                        // to server output json.

                        // Resources that don't return JSON?

                        let j = JSON.stringify(r);

                        // Middleware could be better?
                        //  Only want to gzip if the client says its accepted.

                        zlib.gzip(j, (error, result) => {
                            if (error) {
                                throw error;
                            } else {
                                // console.log(result);
                                res.setHeader('Content-Type', 'application/json');
                                res.setHeader('Content-Encoding', 'gzip');
                                res.setHeader('Content-Length', result.length);
                                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                                res.setHeader('Pragma', 'no-cache');
                                res.setHeader('Expires', '0');
                                /*
                                Cache-Control: no-cache, no-store, must-revalidate
                                Pragma: no-cache
                                Expires: 0
                                */
                                // compress with gzip
                                res.end(result);
                            }
                        });
                        //console.log('j', j);
                        //console.log('typeof r', typeof r);
                    } else {
                        // Serve error?

                    }
                }

                // Want to build auth into the server module itself.
                //  Will show simple unauthorised app / view.

                // /site/ controls?
                //  useful in particular for making a website?
                //  could be too large.

                // /auth/ makes sense for a 'not logged in' control with its own API.
                //  include the login.js control too.


                if (method === 'DELETE') {
                    let jwt_cookie = cookies.get('jwt') || cookies.get('Authentication');
                    let auth_info, r;
                    let restricted = false;
                    //console.log('jwt_cookie', jwt_cookie);
                    if (jwt_cookie) {
                        if (this.resource.authenticate) {
                            auth_info = this.resource.authenticate(jwt_cookie);
                            //let user_key = auth_info.key;
                        }
                        // Could provide further data...
                    } else {
                        // if there is an authenticate function but no cookie...
                        //console.log('this.resource.authenticate', this.resource.authenticate);
                        if (this.resource.authenticate) {
                            restricted = !this.resource.authenticate();
                        }
                    }
                    if (!restricted) {
                        if (auth_info && auth_info !== true) {
                            let r = await this.resource.delete(auth_info, resource_url_parts[0]);
                            serve_result(r);
                        } else {
                            console.log('resource_url_parts', resource_url_parts);
                            console.log('pre resource get');
                            let r = await this.resource.delete(resource_url_parts[0]);
                            serve_result(r);
                        }
                    } else {
                        console.log('restricted, so there is an error');
                        serve_access_error();
                    }
                }
                if (method === 'GET') {
                    let jwt_cookie = cookies.get('jwt') || cookies.get('Authentication');
                    let auth_info, r;
                    let restricted = false;
                    //console.log('jwt_cookie', jwt_cookie);
                    if (jwt_cookie) {
                        if (this.resource.authenticate) {
                            auth_info = this.resource.authenticate(jwt_cookie);
                            //let user_key = auth_info.key;
                        }
                        // Could provide further data...
                    } else {
                        // if there is an authenticate function but no cookie...
                        //console.log('this.resource.authenticate', this.resource.authenticate);
                        if (this.resource.authenticate) {
                            restricted = !this.resource.authenticate();
                        }
                    }
                    if (!restricted) {
                        if (auth_info && auth_info !== true) {
                            let r = await this.resource.get(auth_info, resource_url_parts);
                            serve_result(r);
                        } else {
                            console.log('resource_url_parts', resource_url_parts);
                            console.log('pre resource get');
                            let r = await this.resource.get(resource_url_parts);
                            serve_result(r);
                        }
                    } else {
                        console.log('restricted, so there is an error');
                        serve_access_error();
                    }
                }
                if (method === 'POST') {
                    //console.log('Resource_Publisher POST resource_url_parts');
                    //console.log('resource_url_parts', resource_url_parts);
                    //console.log('headers', headers);
                    let jwt_cookie = cookies.get('jwt') || cookies.get('Authentication');
                    let auth_info, r;
                    if (jwt_cookie) {
                        auth_info = this.resource.authenticate(jwt_cookie);
                        //let user_key = auth_info.key;
                    }
                    const content_type = headers['content-type'];
                    // 'multipart/form-data; boundary=----WebKitFormBoundaryxk08Mj2AlOPsmrGp'
                    let serve_result = r => {
                        if (r !== undefined) {
                            console.log('serve_result r', r);
                            // Then turn it to JSON.
                            // to server output json.
                            let j = JSON.stringify(r);
                            zlib.gzip(j, (error, result) => {
                                if (error) {
                                    throw error;
                                } else {
                                    // console.log(result);
                                    res.setHeader('Content-Type', 'application/json');
                                    res.setHeader('Content-Encoding', 'gzip');
                                    res.setHeader('Content-Length', result.length);
                                    // compress with gzip
                                    res.end(result);
                                }
                            });
                            //console.log('j', j);
                            //console.log('typeof r', typeof r);
                        }
                    }
                    if (content_type.indexOf('multipart/form-data') === 0) {
                        var form = new multiparty.Form();
                        let files = [];
                        form.on('error', err => {
                            // serve error result
                            res.writeHead(500);
                            res.end('Error: ' + err);
                        });
                        form.on('part', function (part) {
                            //console.log('Object.keys(part)', Object.keys(part));
                            const {
                                headers,
                                name,
                                filename,
                                readable,
                                byteCount
                            } = part;
                            var bufs = [];
                            part.on('data', function (d) {
                                bufs.push(d);
                            });
                            part.on('end', function () {
                                var buf = Buffer.concat(bufs);
                                //console.log('buf', buf);
                                //console.log('buf.length', buf.length);
                                files.push({
                                    buffer: buf,
                                    name: name,
                                    filename: filename
                                });
                            });
                        });
                        form.parse(req);
                        form.on('close', (async err => {
                            if (err) {

                            } else {
                                //console.log('form ended');
                                try {
                                    if (auth_info && auth_info !== true) {
                                        //console.log('pre resource post obj', obj);
                                        //console.log('this.resource', this.resource);
                                        //console.log('files', files);
                                        let r = await this.resource.post(auth_info, files);
                                        //console.log('r', r);
                                        serve_result(r);
                                    } else {
                                        //console.log('pre resource post');
                                        let r = await this.resource.post(files);
                                        serve_result(r);
                                    }
                                } catch (err) {
                                    //console.log('err', err);
                                    res.statusCode = 400;
                                    res.setHeader('Content-Type', 'application/json');
                                    let s_err = err.toString();
                                    res.setHeader('Content-Length', s_err.length);
                                    //console.log('s_err', s_err);
                                    res.end(s_err);
                                    //var e = new Error('error message');
                                    //next(e);
                                }
                            }
                        }));
                    } else {
                        const bufs = [];
                        req.on('data', function (data) {
                            bufs.push(data);
                        });
                        req.on('end', async () => {
                            const buf = Buffer.concat(bufs);
                            let obj = JSON.parse(buf.toString());
                            try {
                                if (auth_info && auth_info !== true) {
                                    let r = await this.resource.post(auth_info, obj);
                                    serve_result(r);
                                } else {
                                    let r = await this.resource.post(obj);
                                    serve_result(r);
                                }
                            } catch (err) {
                                console.log('err', err);
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                let s_err = err.toString();
                                res.setHeader('Content-Length', s_err.length);
                                res.end(s_err);
                                //var e = new Error('error message');
                                //next(e);
                            }
                        });
                    }
                }
            })();
        }
    }
    // override handle_http
}
module.exports = Resource_Publisher;