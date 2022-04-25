
var jsgui = require('jsgui3-html'), os = require('os'), http = require('http'),
	libUrl = require('url'),
	Resource = jsgui.Resource;

var stringify = jsgui.stringify, each = jsgui.each, arrayify = jsgui.arrayify, tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class, Data_Object = jsgui.Data_Object;
var fp = jsgui.fp, is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;

var exec = require('child_process').exec;


/*
var Network_Interfaces = Collection.extend({
	'item_def': {'name': 'string', 'entries': [{'address': 'string', 'family': 'string', 'internal': 'boolean'}]}
});
*/

var local_server_info_fields = [
	//['name', 'string'],
	['networkInterfaces', Object], // was Network_Interfaces
	['status', 'string']
];
class Local_Server_Info extends Resource {
	// A network interfaces field.
	constructor(spec) {
		super(spec);
		// meta status.
		//this.meta.set('status', 'off');
		// could use a _ object with proxies.
		this.status = 'off';


		this.getters = {};

		var getters = {
			'net': (callback) => {
				callback(null, os.networkInterfaces());
			},
			'cpus': (callback) => {
				callback(null, os.cpus());
			}
		};
		Object.assign(this.getters, getters);

	}
	// context needs to work properly in call multiple.. need to sort that out.
	//  may need to specify the calling object and the function.
	//  may not just be a pair.

	'start'(callback) {

		// Returning observable / optional callback would be better.
		//  Switching to observable may be best all round.


        //var that = this;

		// Super should not be callback start? Seems a little confusing or like it could go wrong here.



		super.start((err, res_start) => {
			if (err) {
				callback(err);
			} else {

				console.log('\n start callback \n');

                // collections responding to events in their objects?
                if (this.status === 'off') {
                    //that.meta.set('status', 'starting');
                    this.status = 'starting';
					
                    this.status = 'on';
                    this.raise_event('started');
                    if (callback) {
                        //console.log('pre cb lsi');
                        callback(null, true);
                    }
					
                } else if (o_status == 'on') {
                    callback(null, true);
                }
			}
		});
	}
	'meets_requirements'() {
		return true;
	}
}

Local_Server_Info.prototype.fields = local_server_info_fields;
module.exports = Local_Server_Info;
