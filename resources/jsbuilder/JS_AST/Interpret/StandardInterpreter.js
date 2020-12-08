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

// Providing relatively comprehensive interpretation for any node is necessary.
//  Want to extract keys of objects in various places. Method names of classes too.
//   Don't want to go the recursive route for this (quite yet).











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

    // Object assign from an object that is defined there.

    // May be worth getting recursive for extraction from an inner objectexpression.

    // ES(AsE(ME(ID,ID),ID))
    //  assign object property to variable (given by identifier)

    {
        name: '<Identifier1>.<Identifier2> = <Identifier3>',
        sig: {
            mid: {
                type: 'ES(AsE(ME(2ID),ID))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: 'mod_res.arr_sample = arr_sample;',
        confirm: [
            //'nav("0/1/1/0").name === "require"'
        ],
        extract: {
            object_name: 'nav("0/0/0").name',
            object_property_name: 'nav("0/0/1").name',
            assigned_object_name: 'nav("0/1").name'
            //require_path: 'nav("0/1/1").value'
        }
    },

    // ES(CaE(ID,ID,AFE(ID,BS)))

    {
        name: '<Identifier1>(<Identifier2>, <Identifier3> => {...})',
        sig: {
            mid: {
                type: 'ES(CaE(2ID,AFE(ID,BS)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: `each(arr_sample, item => {
            str_sample.push(item + '');
        })`,
        confirm: [
            //'nav("0/1/1/0").name === "require"'
        ],
        extract: {
            called_function_name: 'nav("0/0").name',
            called_function_parameter_object_name: 'nav("0/1").name',
            inner_function_parameter_object_name: 'nav("0/2/0").name'
            //require_path: 'nav("0/1/1").value'
        }
    },

    {
        name: 'declare <Identifier1> = <StringLiteral1>)',
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,SL))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: `const astring = 'hello';`,
        confirm: [
            //'nav("0/1/1/0").name === "require"'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name',
            assigned_value: 'nav("0/1").value'
            //require_path: 'nav("0/1/1").value'
        }
    },

    {
        name: 'declare <Identifier1> = [...])',
        sig: {
            shallow: {
                type: 'VDn(VDr(ID,ArE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example: `const samples = [arr_sample, ['a', 'b', 'c', 'd', 'e']];`,
        confirm: [
            //'nav("0/1/1/0").name === "require"'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'
            //require_path: 'nav("0/1/1").value'
        }
    },

    // VDn(VDr(ID,ArE))
    // VDn(VDr(ID,SL))


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
        name: 'Object.assign(<Identifier1>, {...})',
        sig: {
            mid: {
                gtype: 'ES(CaE(ME(1+ID),ID,OE(1+OPr)))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        confirm: [
            'nav("0/0").child.count === 2',
            'nav("0/0/0").name === "Object"',
            'nav("0/0/1").name === "assign"'
        ],
        extract: {
            object_name: 'nav("0/1").name',
            assigned_keys: 'nav("0/2").query.collect.child.exe().query.collect.first.child.name.exe().flat()'

            // then can extract the keys that have been assigned at lest.

            //object_property_name: 'nav("0/1/1").name',
            //require_path: 'nav("0/2/1").value'
        }
    },


    // ES(CaE(ME(1+ID),ID,OE(1+OPr)))


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

            // get the method names

            // node.nav('1').query.
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
        name: 'declare <Identifier> = {all["key": identifier]}',
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

            // get the keys and values from the object expression
            //  some kind of recursive (or at least 1 level recursion) look at the OPr would help
            //  



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
            declared_object_name: 'nav("0/0").name',//,

            // 0/1 all child node identifiers
            function_identifier_names: 'nav("0/1").query.collect.child.identifier.name.exe()',



            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    {
        name: 'declare <Identifier> = (1+identifier) => {...}',
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
            declared_object_name: 'nav("0/0").name',
            function_identifier_names: 'nav("0/1").query.collect.child.identifier.name.exe()',

            // but extraction query to get the assignments would be the best here.
            //  can add it later on.


            //class_name: 'nav("0/1/0").name'
            //object_assigned_property_name: 'nav("0/0/1").name',
            //object_source_property_name: 'nav("0/1/1").name'
        }
    },

    


    {
        name: 'declare <Identifier> = (*) => {*}',
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

            identifier_names: 'query.collect.each.child.exe().query.collect.first.child.name.exe().flat()'

            // query.collect.each.child.exe().query.collect.first.child.name.exe()

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
            assigned_value: 'nav("0/1").value'
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
            'node.child.count > 1'
        ],
        extract: {

            //'collect_from_each_child(cn => cn.nav("0").name)',

            //declared_variable_names: 'node.query.collect.child.first.child.name.exe()'
            declared_variable_names: 'query.collect.child.exe().query.collect.first.child.name.exe().flat()' // and will turn it into a normal array too... ???
            //  probably best by far that way. This part of the API will only use plain JS objects.

            //declared_object_name: 'nav("0/0").name',
            //called_function_name: 'nav("0/1/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },

    // VDn(VDr(ID,OE))


    {
        // naming could be clearer - but this is explicit and unambiguous at least. Maybe it could be automated from it's name...???
        name: 'declare <Identifier1> = {};', // want to make it the same function
        sig: {
            mid: {
                type: 'VDn(VDr(ID,OE))' // specialisation and interpretation will always use compressed signatures. not always generalised
            }
        },
        example:
`const mod_res = {};`, // will need to differentiate between declaration types. Could do that in 'confirm'. Or make this for general declarations...?
        confirm: [
            // Will need to be more specific.
            //'nav("0/0").name === nav("1/1").name'
        ],
        extract: {
            declared_object_name: 'nav("0/0").name'
            //called_function_name: 'nav("0/1/0").name'
        }
    },


    // ES(CaE(2ID,AFE))

    // ES(CaE(ME(1+ID),ID,OE(1+OPr))


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