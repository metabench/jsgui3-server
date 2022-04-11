/**
 * Created by James on 02/10/2016.
 */




var jsgui = require('jsgui3-html'), os = require('os'), http = require('http'),
	Local_Server_Info = require('./local-server-info-resource'), Resource_Pool = jsgui.Resource_Pool;

var stringify = jsgui.stringify, each = jsgui.each, arrayify = jsgui.arrayify, tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class, Data_Object = jsgui.Data_Object, Enhanced_Data_Object = jsgui.Enhanced_Data_Object;
var fp = jsgui.fp, is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;

var exec = require('child_process').exec;

class Server_Resource_Pool extends Resource_Pool {
	constructor(spec) {
		super(spec);
		
		var lsi = new Local_Server_Info({
			'name': 'Local Server Info',
			'startup_type': 'auto',
			'access': {
				'full': ['server_admin']
			},
			'pool': this
		});
		this.add(lsi);
	}

}


//return Server_Resource_Pool;


//});
module.exports = Server_Resource_Pool;
