class JS_AST_Group_Shared {
    constructor(spec = {}) {
        
        let group_iterator;

        if (spec.group_iterator) group_iterator = spec.group_iterator;
        

        let shared_type;
        Object.defineProperty(this, 'type', {
            get() { 
                if (shared_type === undefined) {
                    group_iterator((cn, idx, stop) => {
                        if (shared_type === undefined) {
                            shared_type = cn.type;
                        } else {
                            if (cn.type === shared_type) {
                                // all good
                            } else {
                                shared_type = false;
                                stop();
                            }
                        }

                    })
                }
                return shared_type;
                //return child_nodes.length;
            },
            enumerable: true,
            configurable: false
        });

        let shared_type_category;
        Object.defineProperty(this, 'type_category', {
            get() { 
                if (shared_type_category === undefined) {
                    group_iterator((cn, idx, stop) => {
                        if (shared_type_category === undefined) {
                            shared_type_category = cn.type_category;
                        } else {
                            if (cn.type_category === shared_type_category) {
                                // all good
                            } else {
                                shared_type_category = false;
                                stop();
                            }
                        }

                    })
                }
                return shared_type_category;
                //return child_nodes.length;
            },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_AST_Group_Shared;