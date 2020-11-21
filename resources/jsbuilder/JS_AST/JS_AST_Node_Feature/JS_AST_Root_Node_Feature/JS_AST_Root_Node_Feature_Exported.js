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
        Object.defineProperty(this, 'keys', {
            get() { 

                if (!keys) {
                    // need to iterate back through the scope.

                    //  Lets do this here for the moment.

                    // Need to be able to iterate back through previous siblings.
                    //  So set up more code for that .siblings.previous.each
                    console.trace();

                    throw 'NYI';

                }

                return keys;
            },
            enumerable: true,
            configurable: false
        });
        





        
        
    }
}
module.exports = JS_AST_Root_Node_Feature_Exported;