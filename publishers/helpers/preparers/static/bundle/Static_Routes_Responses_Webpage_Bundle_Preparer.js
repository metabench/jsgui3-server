const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../../../assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');
const Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner = require('../../../assigners/static-uncompressed-response-buffers/Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner');

const Single_Control_Webpage_Server_Static_Headers_Assigner = require('../../../assigners/static-headers/Single_Control_Webpage_Server_Static_Headers_Assigner');

const Single_Control_Webpage_Server_Static_Routes_Assigner = require('../../../assigners/static-routes/Single_Control_Webpage_Server_Static_Routes_Assigner');


class Static_Routes_Responses_Webpage_Bundle_Preparer {

    constructor(spec = {}) {

        this.routes_assigner = new Single_Control_Webpage_Server_Static_Routes_Assigner();

        // And the uncompressed response buffer(s) assigner....?

        this.uncompressed_response_buffers_assigner = new Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner();
        this.compressed_response_buffers_assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner();
        this.headers_assigner = new Single_Control_Webpage_Server_Static_Headers_Assigner();


    }
    async prepare(bundle) {
        const {routes_assigner, uncompressed_response_buffers_assigner, compressed_response_buffers_assigner, headers_assigner} = this;

        const arr_bundle_items = bundle._arr;

        await routes_assigner.assign(arr_bundle_items);
        await uncompressed_response_buffers_assigner.assign(arr_bundle_items);
        await compressed_response_buffers_assigner.assign(arr_bundle_items);
        await headers_assigner.assign(arr_bundle_items);

        return bundle;

    }
}

module.exports = Static_Routes_Responses_Webpage_Bundle_Preparer;