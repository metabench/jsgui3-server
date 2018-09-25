// Just a Class for a change


// then handle...
//  need to handle http requests, for the resource.


class Resource_Publisher {
    constructor(spec) {
        this.resource = spec.resource;

        // Don't make a new server interface by default.

        this.name = spec.name;
    }
    handle_http(req, res) {
        //console.log('Resource_Publisher handle HTTP');
        // then the http request params...
        //console.log('req', req);
        let {
            headers,
            url,
            method,
            params
        } = req;
        //console.log('headers, url, method, params', headers, url, method, params);
        let resource_url_parts = url.split('/').slice(3).filter(x => x != '');
        //console.log('resource_url_parts', resource_url_parts);
        // 
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
                if (method === 'GET') {
                    let r = await this.resource.get(resource_url_parts);
                    if (r !== undefined) {
                        //console.log('r', r);
                        // Then turn it to JSON.
                        // to server output json.
                        let j = JSON.stringify(r);
                        //console.log('j', j);
                        //console.log('typeof r', typeof r);

                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Length', j.length);
                        res.end(j);
                    }
                }
            })();
        }

        // then do get on that resource.
        //  could be get subscription.

        // when we get an event, if it's an observable, we need to send the data back with an HTTP long poll.
        //  possibly upgrade to websockets here? server-sent events too.

        // The sse spec could help.

        // get subscription, or whatever.
        //  if an observable is returnes, can use SSE.
        //  possibly a Subscription or Resource_Subscription object?

        // could also check the data type expected.

        // lets stick with status.json

        // could do status diffs too on the client.






    }

    // override handle_http

}


module.exports = Resource_Publisher;