

// sibling.next
// sibling.all

// Sibling relationship
//  And the index is the index within the parent.


const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_All = require('./JS_AST_Node_2.3-All');

const JS_AST_Ordered_Relationship_Node_To_Group = require('./JS_AST_Ordered_Relationship_Node_To_Group');

class JS_AST_Node_Sibling extends JS_AST_Node_All {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;


        /*
        let index;
        Object.defineProperty(this, 'index', {
            get() { 

                if (index === undefined) {
                    //console.log('this.path', this.path);

                    const s_path = this.path.split('/').filter(s => s.length > 0).map(s => parseInt(s));
                    //console.log('s_path', s_path);

                    index = s_path[s_path.length - 1];

                    //throw 'NYI';
                }

                return index;
            },
            enumerable: true,
            configurable: false
        });
        */

        // sibling.all?

        // .siblings
        // .siblings.next

        // could say it's an ordinal relationship.

        // Ordered_Relationship_Node_To_Group

        //  with an index property.

        const sibling = new JS_AST_Ordered_Relationship_Node_To_Group({
            origin: this,
            name: 'sibling',
            //index: this.index//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        sibling.previous = new JS_AST_Ordered_Relationship_Node_To_Group({
            origin: this,
            name: 'previous-sibling'
        });
        sibling.post = new JS_AST_Ordered_Relationship_Node_To_Group({
            origin: this,
            name: 'post-sibling'
        });

        this.sibling = sibling;

        //.previous .next
        //.pre .post

        // Need to know the position / index within the parent.


        // this.sibling.number
        //  .own_number?




        

    }
}

module.exports = JS_AST_Node_Sibling;