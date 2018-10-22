var jsgui = require('jsgui3-html');

// This should be running in node.js

var stringify = jsgui.stringify, each = jsgui.each, arrayify = jsgui.arrayify, tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class, Data_Object = jsgui.Data_Object;
var fp = jsgui.fp, is_defined = jsgui.is_defined;

var get_a_sig = jsgui.get_a_sig;

// Need to find out what this one requires to put it in its own module.
class Server_Page_Context extends jsgui.Page_Context {
	constructor(spec) {
		spec = spec || {};
		super(spec);
		if (spec.req) {
			this.req = spec.req;
			this.request = spec.req;
		} else if (spec.request) {
			this.req = spec.request;
			this.request = spec.request;
		};

		if (this.req.auth) {
			this.auth = this.req.auth;
		}
		if (spec.res) {
			this.res = spec.res;
			this.response = spec.res;
		} else if (spec.response) {
			this.res = spec.response;
			this.response = spec.response;
		};

		if (spec.server) {
			this.server = spec.server;
		}

		this.selection_scope_count = 0;
		// Perhaps things could be more sandboxed, so that controls don't get access to the resource pool by default.
		//  Maybe only a small number of controls should have access to this.
		if (spec.pool) {
			this.pool = spec.pool;
		}
		if (spec.rendering_mode) {
			this.rendering_mode = spec.rendering_mode;
		}

		// The item IDs could be handled here... use the local variable closure here.
		var map_new_ids = {};
		// and have the objects registered within the context too.

		var map_objects = {};

		var _get_new_typed_object_id = function(type_name) {
			if (!is_defined(map_new_ids[type_name])) {
				map_new_ids[type_name] = 0;
			}
			//if (!is_defined(map_new_ids[type_name]) {
			//	map_new_ids[type_name] = 0;
			//}
			var res = type_name + '_' + map_new_ids[type_name];
			map_new_ids[type_name]++;
			return res;
		}

		this.new_id = _get_new_typed_object_id;

	}
	'get_dtd'() {
		if (this.rendering_mode == 'html5') {
			return '<!DOCTYPE html>';
		}
	}

	'new_selection_scope'(ctrl) {
		let res = super.new_selection_scope(ctrl);
		//var num = this.selection_scope_count++;
		//ctrl.selection_scope = num;
		ctrl._fields = ctrl._fields || {};
		ctrl._fields.selection_scope = res.id;
		return res;
	}
};

module.exports = Server_Page_Context;
