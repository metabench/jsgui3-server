class JS_File_Imported_Object_Info {
    constructor(spec = {}) {

        // local name
        //  does not necessarily have one, could be imported into a numbered array
        //   but if that happens can throw exception.

        /*
            The ast_statement node where the import is done
            declared local (imported) variable name: the name, or false if it does not have one

            Lookup: the AST for the file it was imported from
                Then information about what was exported from that.


            So, focus on obtaining great export information, as that will be used in the process of understanding the imports.

            



        */

    }
}
module.exports = JS_File_Imported_Object_Info;