/**
 * Created by James on 02/10/2016.
 */

const jsgui = require('jsgui3-html');
const Server = require('../single-control-server');
//const File_Tree = jsgui.File_Tree;
//const Month_View = require('../controls/month-view');
//const Arrow_Button = require('../controls/arrow-button');
const Left_Right_Arrows_Selector = jsgui.Left_Right_Arrows_Selector;
//const Date_Picker = require('../controls/date-picker');
const Grid = jsgui.Grid;

// Make a version for Grid.
//  Try for user-configurable column widths.
//   optional
//  row headers
//  column headers
//  

// .rows['*']
// .rows.all.width
// .columns.all.width = 100px
// .columns[6].width = 
// columns[-1]?
// .all_columns < seems easiest right now.



//var Server = jsgui.Server;

// Want to give it the js to include?
//  Include jsgui client js as default.
//  Would maybe want to substitute that with a different client build that includes jsgui3 (client) and custom controls and logic.

// Give it a live Control?
//  Would want to give that Control access to a server-side resource too.

// We should be able to give that single control params too.

// Body_Server

// Provides page bodies that go along with routes.
//  Need to be able to activate clients too.

// A pluggable activation function?

requirements = () => {
	// const x = require x
}


let activate_app = (() => {
	// Context variable will be available within the scope on the client.
	let context;

	return () => {
		console.log('activate app function');
	
		// Should be able to access the app's main control.
	
		// nice to have a few local variables.
		
		console.log('Object.keys(context)', Object.keys(context));
		console.log('Object.keys(context.map_controls)', Object.keys(context.map_controls));

		console.log('(context.map_controls)', (context.map_controls));


		// replica ones that are used for effects...
		//  discount them by default?
		//  eg a Month_View that the system makes automatically as part of tiles?

		/*
		let as = context.ctrl_document.$('left_right_arrows_selector')[0];
		console.log('as', as);

		as.on('loop', dir => {
			console.log('as loop dir', dir);
		})
		*/


		/*
		let month_view = context.map_controls['month_view_0'];
		
		setTimeout(() => {
			month_view.next_month();
		}, 4000);

		*/

		// Seems like too many items were added to the map.
		//  Must be created accidently on start.

		// Seems like the control gets constructed twice, or registered with s different id.#
		//  At least the mainscs control.

		// Could do with some control querying / searching capabilities.

		// control selectors

		// may want to search for all controls that match a particular set of points.




	}
})();

// Set the data for the grid
//  Could just give it an array
//  Could give it a data resource.
//  Could give it CSV.

let grid_data = [
	['0, 0', '1, 0', '2, 0', '3, 0', '4, 0', '5, 0'],
	['0, 1', '1, 1', '2, 1', '3, 1', '4, 1', '5, 1'],
	['0, 2', '1, 2', '2, 2', '3, 2', '4, 2', '5, 2'],
	['0, 3', '1, 3', '2, 3', '3, 3', '4, 3', '5, 3'],
	['0, 4', '1, 4', '2, 4', '3, 4', '4, 4', '5, 4']
];

//const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

var server = new Server({
	'port': 80,
	//'ctrl': [Month_View.Tiled, {


	// Left_Right_Arrows_Selector
	'ctrl': [Grid, {
		'data': grid_data,
		cell_size: [80, 22],
		column_headers: true,
		row_headers: {
			width: 32
		}
	}],
	/*
	'ctrl': [Month_View, {
			//'rotation': 180
		'direction': 'left'
	}],*/
	'activate_app': activate_app
});

// sending app client JS.
//  activation JS here that gets sent to the file would be useful.
//  allows the main parts of an entire app to be contained within one file.

server.start(function(err, cb_start) {
	if (err) {
		throw err;
	} else {
		
		console.log('server started');
	}
});