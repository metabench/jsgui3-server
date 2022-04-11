const jsgui = require('jsgui3-html');

const Standard_Web_Page = jsgui.controls.Standard_Web_Page;

const Panel = jsgui.controls.Panel;

class Admin_Web_Page extends Standard_Web_Page {
    constructor(spec) {
        super(spec);

        // a .text property of h1 etc would help.

        const h1 = new jsgui.h1({
            context: this.context//,
            //text: 'jsgui3 Server Admin'
        })
        h1.add('jsgui3 Server Admin');
        this.body.add(h1);


        const main_panel = new Panel({
            context: this.context,
            class: 'main panel'
        });

        this.body.add(main_panel);


        // Add a panel where the work takes place.
        //  Perhaps do more work on Panel as some kind of example?

        // Want panels inside a panel, with them movable and resizable.
        //  A kind of snapping too, fitting some standard sizes.







        // Have some kinds of admin controls.
        //  Admin basic info panel.
        // Expandable windows would be nice
        //  status <> detiled info and control
        // Resources

        // Admin_Resources_Panel

        // Admin_Panel

        // Admin_Web_Panel ???

        // Want a flexible kind of web panel,
        //  Does not have to be server specific.
        //  Just have the things really only for the server here.

        // Add Flexi_Panel
        //  or Multi_Grid_Panel
        //   Whatever advanced panel system it is (for now).





        // Divide the screen / window into grid of 10 * 6 squares?
        //  Then could snap various components to those sizes.





    }
}

module.exports = Admin_Web_Page;