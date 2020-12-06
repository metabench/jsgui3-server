const {each} = require('lang-mini');


// Thought - every single JS_AST_Node accross various files can be given a GUID.
//  Then the central part can have the GUIDs of every or probably much better, a variety of nodes that get interpreted, or possibly
//   could be interpreted deeper.

// If an interpretation refers to nodes, eg child nodes, it could list their GUIDs.
//   The central part would also be notified of those child node GUIDs, but it would prevent these interpretations from having really long JSON in a way that repeats info.

// Assigning GUIDs to JS_AST_Nodes definitely makes sense from the point of view of the central process understanding the structure

// or CUID for Compilation Unique Id

// 2-8-3200


// <Index of process>-<Index of file within process>-<Index of JS_AST_Node within file>
//  Or could possibly do the GUIDS by path from the root node?
//   Could have the node type abbreviation in the guid too. Possibly its sibling index. 20 bytes of string is fine for this.

// Would need to sort out the CUID system before some queries could be answered.
//  Or some queries could just say how many child nodes it has?
//   But specifically identifying those nodes in a way that they can then have JS_AST_Node queries done on them will be useful.










const Interpreter = require('./Interpreter');

// Likely would need a signature, but then also some kind of verification query.
//  Probably to check that some things are the same value.

// Ie want a module.exports specialisation
//  Then I think it would need to get into different ways it could work?

// Or maybe better have a variety of module exports specialisations to cover them all.
//  Right now these specialisations are about noting what goes on within a JS file.

// Signature, then further checks
//  Those check should be describable as strings / json. Should be relatively simple if possible.

// So when a node is encountered, it will be possible to use the 'specialisation' system to find out what the node does, and extract relevant
//  information from it.


// Maybe give each node an ordinal in the document as its unique id.
//  Will send a fair bit of information about the nodes around as plain objects.
//  Will make it so that child processes can easily run and load the information about a JS file.
//  I anticipate that with something like 10 child processes the results would come into the main thread thick and fast.
//   Could see about any CPU manufacturers sponsoring this work if many threads get the js built even quicker.


// generalised_compressed_mid_type_category_signature
// generalised_compressed_mid_type_signature


// May be better to always go for the compressed signatures anyway, but not the generalised ones.
//  Maybe stop saying they are compressed, make them the standard.
//   (later on)


// compressed_mid_type_signature
// compressed_mid_type_category_signature

// generalised or not
// type or type category

// 


// mid_type_signature
// mid_type_category_signature


// Should move towards using signature compression as standard.
//  Repeating items get denoted with the number

/*

node.compressed_mid_type_signature ES(CaE(ME(2ID),ID,ME(2ID)))
node.generalised_compressed_mid_type_signature ES(CaE(ME(1+ID),ID,ME(1+ID)))
node.compressed_mid_type_category_signature St(Ex(Ex(2I),I,Ex(2I)))
node.generalised_compressed_mid_type_category_signature St(Ex(Ex(1+I),I,Ex(1+I)))
node.source Object.assign(jsgui, jsgui.controls);
no matching node specialisation found for node ES(CaE(ME(ID,ID),ID,ME(ID,ID)))

*/

// Will probably need quite a lot to get a good enough understanding of a program?
//  Seems like the right way to track & discover object lifecycle events.

// A better way to capture the values from the mid signature would be of use

// Could make the signature parser able to handle extraction syntax?
//  Would prefer these interpretations to be fast to write.


// .signav(...)


const standard_specialisation_specs = [
    {
        name: 'module.exports = <Identifier>',
        sig: {
            mid: {
                type: 'ES(AsE(ME(2ID),ID))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        }, // The signature part should allow the node to be found relatively quickly, as the signatures can be loaded into a dict / map for rapid matching.
            // Meaning that there can be very many specialisations and it won't have to test for each one.
        confirm: [
            'nav("0/0/0").name === "module"',   // Will be interpreted by JS AST. Only planning to interpret this js to run it. In its own tiny simple VM. May need longwinded code though.
            'nav("0/0/1").name === "exports"'
            //['nav("0/0/0").name', '=', '"module"'],
            //['nav("0/0/1").name', '=', '"exports"'],
        ], // The confirm part should be unambiguous confirmation it's the node specialisation

        // extract it as?
        //  more of a result name?

        // Will do more

        // The interpretation will include the extraction

        extract: 'nav("0/1").name'
    },
    {
        name: 'Object.assign(<Identifier1>, <Identifier1>.<Identifier2>)',
        sig: {
            mid: {
                type: 'ES(CaE(ME(2ID),ID,ME(2ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            'nav("0/0/0").name === "Object"',   // Will be interpreted by JS AST. Only planning to interpret this js to run it. In its own tiny simple VM. May need longwinded code though.
            'nav("0/0/1").name === "assign"',
            'nav("0/1").name === nav("0/2/0").name'
        ],
        extract: {
            object_name: 'nav("0/1").name',
            object_property_name: 'nav("0/2/1").name'
        }
    },
    {
        name: 'declare <Identifier> = require(<StringLiteral>)',
        sig: {
            mid: {
                type: 'VDn(VDr(ID,CaE(ID,SL)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/0/0").name === "Object"',   // Will be interpreted by JS AST. Only planning to interpret this js to run it. In its own tiny simple VM. May need longwinded code though.
            //'nav("0/0/1").name === "assign"',
            'nav("0/1/0").name === "require"'
        ], //node.generalised_compressed_deep_type_signature === "..."
        extract: {
            object_name: 'nav("0/0").name',
            require_path: 'nav("0/1/1").value'
        }
    },
    {
        name: '<Identifier1>.<Identifier2> = require(<StringLiteral>)',
        sig: {
            mid: {
                type: 'ES(AsE(ME(2ID),CaE(ID,SL)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/0/0").name === "Object"',   // Will be interpreted by JS AST. Only planning to interpret this js to run it. In its own tiny simple VM. May need longwinded code though.
            //'nav("0/0/1").name === "assign"',
            'nav("0/1/0").name === "require"'
        ],
        extract: {
            object_name: 'nav("0/0/0").name',
            object_property_name: 'nav("0/0/1").name',
            require_path: 'nav("0/1/1").value'
        }
    },
    {
        name: '<Identifier1>.<Identifier2> = <Identifier1>.<Identifier3> = require(<StringLiteral>)',
        sig: {
            mid: {
                type: 'ES(AsE(ME(2ID),AsE(ME,CaE)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            'nav("0/1/1/0").name === "require"'
        ],
        extract: {
            object_name: 'nav("0/0/0").name',
            object_property_name_1: 'nav("0/0/1").name',
            object_property_name_2: 'nav("0/1/0/1").name',
            //require_path: 'nav("0/1/1").value'
        }
    },
    {
        name: 'Object.assign(<Identifier1>.<Identifier2>, require(<StringLiteral>))',
        sig: {
            mid: {
                type: 'ES(CaE(2ME(2ID),CaE(ID,SL)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            'nav("0/0/0").name === "Object"',
            'nav("0/0/1").name === "assign"',
            'nav("0/2/0").name === "require"'
        ],
        extract: {
            object_name: 'nav("0/1/0").name',
            object_property_name: 'nav("0/1/1").name',
            require_path: 'nav("0/2/1").value'
        }
    },
    {
        name: '<Identifier1>.<Identifier2> = <Identifier1>.<Identifier2> || {}',
        sig: {
            mid: {
                type: 'ES(AsE(ME(2ID),LE(ME,OE)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            'nav("0/1/1").child.count === 0', // And matching identifiers
            'nav("0/0/0").name === nav("0/1/0/0").name',
            'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            object_name: 'nav("0/0/0").name',
            object_property_name: 'nav("0/0/1").name'
        }
    },

    {
        name: '<Identifier1>.<Identifier2> = <Identifier1>.<Identifier3>',
        sig: {
            mid: {
                type: 'ES(AsE(2ME(2ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/0/0").name === nav("0/1/0/0").name',
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            object_name: 'nav("0/0/0").name',
            object_assigned_property_name: 'nav("0/0/1").name',
            object_source_property_name: 'nav("0/1/1").name'
        }
    },

    // CD(ID,CB(1+CM))

    {
        name: 'declare class <Identifier1> {methods}',
        sig: {
            shallow: {
                gtype: 'CD(ID,CB(1+CM))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/0/0").name === nav("0/1/0/0").name',
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            object_name: 'nav("0").name',
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },


    {
        name: 'declare <Identifier> = function() {...}', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                type: 'VDn(VDr(ID,FE(BS)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/0/0").name === nav("0/1/0/0").name',
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            object_name: 'nav("0/0").name',
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    // const p = Evented_Class.prototype;


    // What about a non-prototype checking version?
    //  Multiple items would need to share a signature.
    //  
    
    {
        name: 'declare <Identifier> = <Identifier2>.<Identifier3>', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                type: 'VDn(VDr(ID,ME(2ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            assigned_object_name: 'nav("0/1/0").name',
            assigned_object_property_name: 'nav("0/1/1").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },


    {
        name: 'declare <Identifier> = <Identifier2>.prototype', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                type: 'VDn(VDr(ID,ME(2ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    {
        name: 'declare <Identifier> = {all["key": identifier]}', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            middeep: {
                gtype: 'VDn(VDr(ID,OE(1+OPr(SL,ID))))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'//,

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    // VDn(VDr(ID,FE(1+ID,BS)))

    {
        name: 'declare <Identifier> = function(1+identifier) {...}', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                gtype: 'VDn(VDr(ID,FE(1+ID,BS)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'//,

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    {
        name: 'declare <Identifier> = (1+identifier) => {...}', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                gtype: 'VDn(VDr(ID,AFE(1+ID,BS)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'//,

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },


    {
        name: 'declare <Identifier> = (*) => {*}', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            shallow: {
                gtype: 'VDn(VDr(ID,AFE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'//,

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    {
        name: 'declare <Identifier1> = <Identifier2>()', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            mid: {
                gtype: 'VDn(VDr(ID,CaE(ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: 'const stream = get_stream();',
        confirm: [
            //'nav("0/1/1").child.count === 0', // And matching identifiers
            //'nav("0/1/1").name === "prototype"'
            //'nav("0/0/1").name === nav("0/1/0/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            called_function_name: 'nav("0/1/0").name'

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    {
        name: 'declare a, b...;', // declaration of parameterless non-arrow function, prob not async either.
        sig: {
            shallow: {
                gtype: 'VDn(1+VDr(ID))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: 'let Readable_Stream, Writable_Stream, Transform_Stream;',
        confirm: [
        ],
        extract: {
        }
    },
    
    // VDn(1+VDr(ID,CaE(1+ID)))
    //  but where they call the same function?
    //   would be nice to make that a special case.

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <IdentifierFN>(<Identifier2>), <Identifier3> = <IdentifierFN>(<Identifier4>), ...;', // want to make it the same function
        sig: {
            mid: {
                gtype: 'VDn(1+VDr(ID,CaE(1+ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const v_add = vectorify(n_add),
v_subtract = vectorify(n_subtract),
v_multiply = vectorify(n_multiply),
v_divide = vectorify(n_divide);`,
        confirm: [

            // confirm the function names are the same.

            // TODO: the confirmation process

            // 'node.query.collect.child.exe().query.collect.second.child.collect.exe().query.collect.first.child.name.exe()'
            //  looks like generalised signature extraction will be more useful instead.

            // so for the moment, not node.query...

            // may use app interpreted JS for this.
            //  or a more direct string system, similar to the signatures.

            // with extract as syntax.
            //  intermitting extraction queries within the signature perhaps.

            // 'VDn(1+VDr(ID,CaE(1+ID)))'
            // 'VDn(1+VDr(ID,CaE(1+ID).query.collect.first.child.name))'
            // 'VDn(1+VDr(ID,CaE(1+ID).query('collect first child name as fn_name')))'


            // node.extract(str_extraction_query)




        ],
        extract: {

            // More advanced extraction query would be useful.

            // However, it may be much simpler to do recursive interpretation.
            //  We interpret the child nodes, and use that info nicely and programatically here.





        }
    },


    

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = (*) => ?, <Identifier2> = (*) => ?, ...;', // want to make it the same function
        sig: {
            shallow: {
                gtype: 'VDn(1+VDr(ID,AFE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const n_add = (n1, n2) => n1 + n2,
n_subtract = (n1, n2) => n1 - n2,
n_multiply = (n1, n2) => n1 * n2,
n_divide = (n1, n2) => n1 / n2;`,
        confirm: [
        ],
        extract: {
        }
    },
    

    
    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <Identifier2>;', // want to make it the same function
        sig: {
            shallow: {
                type: 'VDn(VDr(2ID))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`let call_multi = call_multiple_callback_functions;`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            assigned_object_name: 'nav("0/1").name',
        }
    },
    

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <Identifier2>(arrowfunctionexpression);', // want to make it the same function
        sig: {
            mid: {
                type: 'VDn(VDr(ID,CaE(ID,AFE)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`let clone = fp((a, sig) => {...});`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            called_function_name: 'nav("0/1/0").name'
        }
    },

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <Identifier2>(functionexpression);', // want to make it the same function
        sig: {
            mid: {
                type: 'VDn(VDr(ID,CaE(ID,FE)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`let call_multiple_callback_functions = fp(...`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            called_function_name: 'nav("0/1/0").name'
        }
    },

    
    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = {...};', // want to make it the same function
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,OE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const map_native_types = {
    'string': true,
    'boolean': true,
    'number': true
}`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            //called_function_name: 'nav("0/1/0").name'
        }
    },


    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = bool;', // want to make it the same function
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,BL))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const using_type_plugins = false;`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            //called_function_name: 'nav("0/1/0").name'
        }
    },


    // Very specific case here I think.
    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = typeof window !== "undefined";', // want to make it the same function
        sig: {
            middeep: {
                type: 'VDn(VDr(ID,BE(UnE(ID),SL)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const running_in_browser = typeof window !== 'undefined';`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            //'nav("0/1/0/1").name === "window"' // probably use improved checking queries on this.
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            //called_function_name: 'nav("0/1/0").name'
        }
    },

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = (*) => {*}, <Identifier2> = <Identifier1>;', // want to make it the same function
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,AFE),VDr(2ID))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const is_defined = (value) => {
    return typeof (value) !== 'undefined';
},
isdef = is_defined;`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            'nav("0/0").name === nav("1/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            alias_declared_object_name: 'nav("1/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <Identifier2>(*);', // want to make it the same function
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,CaE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const mfp_not_sigs = get_truth_map_from_arr(['pre', 'default', 'post']);`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            //'nav("0/0").name === nav("1/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            called_function_name: 'nav("0/1/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = !<Identifier2>;', // want to make it the same function
        sig: {
            mid: {
                type: 'VDn(VDr(ID,UnE(ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const running_in_node = !running_in_browser;`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            //'nav("0/0").name === nav("1/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            called_function_name: 'nav("0/1/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },


    // And let's have a simple one for multiple declared object expressions.

    // VDn(2VDr(ID,OE))

    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare obj1 = {*}, obj2 = {*}, ...;', // want to make it the same function
        sig: {
            shallow: {
                gtype: 'VDn(1+VDr(ID,OE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const map_loaded_type_fn_checks = {}, map_loaded_type_abbreviations = {...}`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            //'nav("0/0").name === nav("1/1").name'
        ],
        extract: {
            //declared_object_name: 'nav("0/0").name',
            //called_function_name: 'nav("0/1/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },



    // const running_in_node = !running_in_browser;

    // just do the very general VDn(VDr(ID,CaE))
    //  declare variable = fn(*);

    // declare variable to be result of function call taking an array of strings.
    // 


    // VDn(VDr(ID,CaE(ID,ArE(1+SL))))




    // shallow: VDn(VDr(ID,AFE),VDr(2ID))



    /*
    const is_defined = (value) => {
                // tof or typeof

                return typeof (value) != 'undefined';
        },
        isdef = is_defined;

    */



















    // VDn(VDr(ID,BE(UnE(ID),SL)))





    // const using_type_plugins = false;


/*
    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = <Identifier2>.<Identifier3>;', // want to make it the same function
        sig: {
            mid: {
                type: 'VDn(VDr(ID,ME(2ID)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const is_array = Array.isArray;`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            assigned_object_name: 'nav("0/1/0").name',
            assigned_object_property_name: 'nav("0/1/1").name',
            //called_function_name: 'nav("0/1/0").name'
        }
    },
*/
    
    // VDn(VDr(ID,ME(2ID)))



    // const is_array = Array.isArray;


    // VDn(VDr(ID,OE))
    // An object expression where they are all set to a boolean literal (true)
    //  Will be able to make use of multiple interpretations when:
    //    Assigning globally indexed values.

    // Workspace_Global_Index makes a lot of sense as an object, with an API to be developed.
    // Workspace_Global maybe
    //  find all occurrances of any specific node (index by source hash)
    //   should get back into calculating and making available source hashes.

    // Worth having a place that brings it all together.
    //  Workspace will get the child processes to carry out the loading and interpretation, and recieve and process interpretation messages as that takes place.







    /*

    // VDn(VDr(ID,CaE(ID,FE)))
    // A declaration of an object, assigned to a function call with a function declared inside as its only parameter.

    // let clone = fp((a, sig) => { ... }




    let multi = call_multiple_callback_functions;
    node.compressed_shallow_type_signature VDn(VDr(2ID))
node.compressed_mid_type_signature VDn(VDr(2ID))
node.generalised_compressed_shallow_type_signature VDn(VDr(1+ID))
node.generalised_compressed_mid_type_signature VDn(VDr(1+ID))
node.generalised_compressed_middeep_type_signature VDn(VDr(1+ID))







    node.compressed_mid_type_signature VDn(4VDr(ID,AFE(2ID,BE)))
node.generalised_compressed_shallow_type_signature VDn(1+VDr(ID,AFE))
node.generalised_compressed_mid_type_signature VDn(1+VDr(ID,AFE(1+ID,BE)))
node.generalised_compressed_middeep_type_signature VDn(1+VDr(ID,AFE(1+ID,BE(1+ID))))

    const n_add = (n1, n2) => n1 + n2,
        n_subtract = (n1, n2) => n1 - n2,
        n_multiply = (n1, n2) => n1 * n2,
        n_divide = (n1, n2) => n1 / n2;

    */





    // const running_in_browser = typeof window !== 'undefined';
    // node.generalised_compressed_middeep_type_signature VDn(VDr(ID,BE(UnE(ID),SL)))

    // can particularly be on the lookout for browser detection statements.
    //  and for the client builds can use that info as necessary
    //  this stage here is about making info available.
    //   so there may be various specific statement interpretations which the system will be programmed with, rather than (only) the general case.

    // About 16 of these specialisations so far - was not so hard to make
    //  However, they don't yet have advanced extractions to get the data that is expressed within its pattern.




    // const stream = get_stream();

    // simplest interpretation for an arrow function as a single declared item.
    //  it could be useful for dealing with the various combinations of assignment patterns of default parameters.
    //   could have a more in-depth extraction query that finds out about the parameters, including assignments.

    // maybe it will be worth writing various specific pieces of code that won't handle everything.
    //  handling important general cases is important!






    // VDn(VDr(ID,AFE(1+ID,BS)))


    // VDn(VDr(ID,OE(1+OPr(SL,ID))))


    // Will need to get into extracting from multiple items.
    //  Possibility of using queries as strings as well.

    // May be worth instead using recursive interpretation.
    //  so with class methods, would use the interpretation (the right interpretation) to get the method name.
    //   then get the argument names too.

    // Will get relatively simply formatted and concise queries working here (possibly)
    //  Could see what shortcuts there are for better doing / defining extracting repeated items.


    // Could write the interpreter so that it understands these are multi-level collect queries, interprets the query text, then runs the queries.
    //  optional .flat at the end, could see about supporting that.





    //  extract: {method_names: 'node.query.collect.child.exe().query.collect.first.child.name.exe()'}








    // or shallow:
    //  VDn(VDr(ID,OE))

    // It is worth looking at the special case for assigning all from signle word names (identifiers)
    //  However, that could take looking at deeper signatures.

    // middeep sig level of 5 could be of use.
    //  does look like indexing signatures of up to level 5 will be useful for recognising / interpreting things.



    

    // VDn(VDr(ID,OE(1+OPr)))  // declaration of object expression with object properties


    // variable declaration of a parameterless function.

    // mid ts VDn(VDr(ID,FE(BS)))

    // const get_typed_array = function() { ...

    // nav('0/1').query.each.child.exe().query.collect.first.child.value.exe();
    //           .query.collect.child.exe().query.collect.first.child.value.exe();

    // Nested interpretation could be very useful here.
    //  May save trouble.
    //  Program in the interpretation system for ClassMethod nodes.
    //  


    // think we need shallow / level 3 type signatures to properly identify some things.
    //  Classes that get declared are better spotted by looking at their shallow type signatures, depth 3.
    //   Would not go into the parameters for the methods.
    //    Though the extractor could do so.
    //   Let's handle some basic things, then when that is more set up could see about recursive interpretation.
    //    For the moment, getting the interpretations that can build object lifecycle info is enough.
    //     No harm in getting some inner info, such as the parameter names for methods
    //      Later on could recursively look at inner lifecycles, inside methods / constructors.
    //      For the moment, want to get a relatively comprehensive and thorough interpretation of the JS Program.
    //      Then could work on giving Workspace multithreaded capabilities.
    //       Redoing it?
    //      Maybe a Multithreaded_Workspace that sets up child Workspace_Thread instances.
    //       Would make sense to start up a number of different thread / process objects, and load them up with data as necessary.
    //      Should use an event-driven system.
    //       Would be able to get interpretations as they come in.
    //       Interpreted import event - so as it finds import statements, it will tell the main thread.
    //   Main thread, upon getting a new import, would allocate loading the file to the thread which has least work queued.
    //    So when loading the JS files, see how large they are.
    //    bytes_js_queued will be the basic metric that determines how much work a thread has on its plate.
    //   Looking forward to 10 or so threads making short work of loading and interpreting (including lifecycle info?? optionally I think), and sending the interpretations to the central thread.

    // The main thread will be able to work out the lifecycles of variables both within and accross JS files.
    

    // Query a child process to get a file's inner JS
    //  Stripping out the require and exports
    //   A virtual exports?
    //    Where we know what the variable is called at least, associate it with the file, and use it elsewhere

    // Be able to position a JS file / program within a sequence of others according to imports and exports. (That's the essential idea of Platform)

























    // Declaration that assigns a class prototype.
    //  Just by being specific with the interpreted events, another part of the system will / may be able to make sense of it.




    // const p = Evented_Class.prototype



    /*

    node.compressed_mid_type_signature VDn(VDr(ID,CaE(ID,SL)))
    node.source var jsgui = require('./html-core/html-core');
    no matching node specialisation found for node VDn(VDr(ID,CaE(ID,SL)))

    node.compressed_mid_type_signature ES(AsE(ME(2ID),LE(ME,OE)))
    node.generalised_compressed_mid_type_signature ES(AsE(ME(1+ID),LE(ME,OE)))
    node.compressed_mid_type_category_signature St(Ex(Ex(2I),Ex(2Ex)))
    node.generalised_compressed_mid_type_category_signature St(Ex(Ex(1+I),Ex(1+Ex)))
    node.source jsgui.controls = jsgui.controls || {};
    no matching node specialisation found for node ES(AsE(ME(ID,ID),LE(ME,OE)))


    node.compressed_mid_type_signature ES(CaE(2ME(2ID),CaE(ID,SL)))
    node.generalised_compressed_mid_type_signature ES(CaE(1+ME(1+ID),CaE(ID,SL)))
    node.compressed_mid_type_category_signature St(Ex(2Ex(2I),Ex(I,L)))
    node.generalised_compressed_mid_type_category_signature St(Ex(1+Ex(1+I),Ex(I,L)))
    node.source Object.assign(jsgui.controls, require('./controls/controls'));
    no matching node specialisation found for node ES(CaE(ME(ID,ID),ME(ID,ID),CaE(ID,SL)))





    node.compressed_mid_type_signature ES(AsE(ME(2ID),CaE(ID,SL)))
node.generalised_compressed_mid_type_signature ES(AsE(ME(1+ID),CaE(ID,SL)))
node.compressed_mid_type_category_signature St(Ex(Ex(2I),Ex(I,L)))
node.generalised_compressed_mid_type_category_signature St(Ex(Ex(1+I),Ex(I,L)))
node.source jsgui.Resource_Pool = require('./resource/pool');
no matching node specialisation found for node ES(AsE(ME(ID,ID),CaE(ID,SL)))


    */

    // Object.assign(jsgui, jsgui.controls);
    // {
    //     name: 'module.exports = <ObjectExpression>'
    // }
];

// ObjectExpression

const add_standard_specialisations = (interpreter) => {

    each(standard_specialisation_specs, spec_spec => {
        const {name, sig, confirm, extract} = spec_spec;

        interpreter.specialisations.add(spec_spec);

    })

}


// Interpretations of programs and block statements...
//  It's not a specialisation that gets detected.

// Running the interpreter on a program or block statement...
//  Will have the interpreter make an object representing object lifecycle throughout that block / scope level.





class StandardInterpreter extends Interpreter {
    constructor(spec = {}) {
        super(spec);

        add_standard_specialisations(this);

    }
}

module.exports = StandardInterpreter;