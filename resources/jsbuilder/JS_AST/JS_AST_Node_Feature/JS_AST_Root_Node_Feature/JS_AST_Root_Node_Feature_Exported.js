
const {each} = require('lang-mini');

//const find_object_keys = require('../../query/find_object_keys');

// Not itself a feature?
//  A feature of a feature?

// Exported keys is an important thing to be on the lookout for.
//  However, trying to get it working shows some need for improved querying, as well as going into more detail on Object objects.
//  Could make a .keys feature on those in particular.
//  Indexing will help to find the referred to objects quickly.
//  Queries would enable quick finding with a nice API too.





class JS_AST_Root_Node_Feature_Exported {
    constructor(spec = {}) {
        let node;
        if (spec.node !== undefined) node = spec.node;
        
        
        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            enumerable: true,
            configurable: false
        });

        // but an exported keys property as well.
        //  if necessary, look back at the object declaration.

        // Keys property.
        //  A bit harder to calculate the keys of an object.

        // May be worth having another query or similar part.
        //  Obtaining keys of an object will need to be somewhat in-depth.

        let keys;

        // Want this to go further in terms of finding out what keys that object has.

        Object.defineProperty(this, 'keys', {
            get() { 

                if (!keys) {
                    // call the find_object_keys query.
                    //  will go through the code seeing which keys the object is declared with / have been added to it.
                    //  worth trying with a variety of objects / classes in codebases.
                    //   try separately to see that the keys correctly get identified where possible.

                    //console.log('node', node);
                    //console.log('node.name', node.name);
                    //console.log('node.type', node.type);

                    if (node.is_identifier) {

                        //keys = find_object_keys(node);
                        //console.log('keys', keys);
                        //return found_keys;
                        console.trace();
                        throw 'NYI';

                        

                        
                    } else {
                        throw 'NYI';
                    }

                    // need to iterate back through the scope.

                    //  Lets do this here for the moment.

                    // Need to be able to iterate back through previous siblings.
                    //  So set up more code for that .siblings.previous.each
                    //console.trace();

                    //throw 'NYI';

                }

                return keys;
            },
            enumerable: true,
            configurable: false
        });
        





        
        
    }
}
module.exports = JS_AST_Root_Node_Feature_Exported;