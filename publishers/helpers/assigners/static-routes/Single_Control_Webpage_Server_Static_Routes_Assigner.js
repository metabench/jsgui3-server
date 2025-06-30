

const Assigner = require('../Assigner');
const {is_array} = require('lang-tools');

class Single_Control_Webpage_Server_Static_Routes_Assigner extends Assigner {

    constructor(spec = {}) {
        super(spec);
    }

    async assign(arr_bundled_items) {

        if (is_array(arr_bundled_items)) {

            for (const item of arr_bundled_items) {
                //console.log('item', item);
                const {type} = item;

                // Just very simple for the moment.
                //  Maybe will read it from the Ctrl?
                //  Better to have some kind of Standard_Resource_Path_Assignment_System

                if (type === 'JavaScript') {
                    item.route = '/js/js.js';

                } else if (type === 'CSS') {
                    item.route = '/css/css.css';

                } else if (type === 'HTML') {
                    item.route = '/';

                } else {
                    console.trace();
                    throw 'NYI - type: ' + type; 
                }

                //console.trace();
                //throw 'stop';
            }

        } else {
            console.trace();
            throw 'stop';
        }
    }
}


module.exports = Single_Control_Webpage_Server_Static_Routes_Assigner;