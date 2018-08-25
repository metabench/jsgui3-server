

var jsgui = require('../server/server');

var ctrl = new jsgui.Control({});
var ctrl2 = new jsgui.Control({});

ctrl.add(ctrl2);
ctrl.add_class('example');

ctrl2.add('Hello');
//ctrl2.add('World');

var html = ctrl.all_html_render();

console.log('ctrl', ctrl);
console.log('ctrl.content._arr', ctrl.content._arr);
console.log('ctrl.content._arr.length', ctrl.content._arr.length);
console.log('ctrl2.content._arr', ctrl2.content._arr);
console.log('ctrl2.content._arr.length', ctrl2.content._arr.length);
console.log('html', html);