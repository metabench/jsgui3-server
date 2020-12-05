const {each} = require('lang-mini');


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
        }, // The signature part should allow the node to be found relatively quickly, as the signatures can be loaded into a dict / map for rapid matching.
            // Meaning that there can be very many specialisations and it won't have to test for each one.
        confirm: [
            'nav("0/0/0").name === "Object"',   // Will be interpreted by JS AST. Only planning to interpret this js to run it. In its own tiny simple VM. May need longwinded code though.
            'nav("0/0/1").name === "assign"',
            'nav("0/1").name === nav("0/2/0").name',

            //['nav("0/0/0").name', '=', '"module"'],
            //['nav("0/0/1").name', '=', '"exports"'],
        ], // The confirm part should be unambiguous confirmation it's the node specialisation

        // extract it as?
        //  more of a result name?

        // Will do more

        // The interpretation will include the extraction

        extract: {
            object_name: 'nav("0/1").name',
            object_property_name: 'nav("0/2/1").name'
        }
    },

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