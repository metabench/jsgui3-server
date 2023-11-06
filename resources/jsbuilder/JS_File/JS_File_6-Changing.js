const JS_File_Planning = require('./JS_File_5-Planning');
const Variable_Name_Provider = require('../Variable_Name_Provider');
const { each } = require('lang-tools');

const {transform} = require("@babel/core");
// import { transform } from "@babel/core";
const generate = require("@babel/generator").default;
//import generate from "@babel/generator";
//console.log('generate', generate);
//throw 'stop';

class JS_File_Changing extends JS_File_Planning {
    constructor(spec) {
        super(spec);

        

    }
}
JS_File_Changing.load_from_stream = (rs, path) => {
    const res = new JS_File_Changing({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Changing;
