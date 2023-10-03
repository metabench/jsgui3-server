const Server_Page_Context = require('./page-context');


class Server_Static_Page_Context extends Server_Page_Context {
	constructor(spec = {}) {
		//spec = spec || {};
		super(spec);


    }

}

module.exports = Server_Static_Page_Context;