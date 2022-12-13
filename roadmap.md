To fix:
CSS bundled from the JS.


Make it work as a stand-alone application.
  It's already quite a large codebase. Make use of existing code and expand somewhat further.
Start it, get it serving a directory easily.
Start it, access it through admin pages.
  Admin interface showing by default.

Admin web interfaces seem like a piece of progress that the groundwork is in place for.

node server start 80
node server stop 80

Command line interfaces to interact with a jsgui server

node server modify 80 upload \[path\] as index.html
  or similar?

node server get 80

node server 80
  starts it
  shows a cli for it...
  a cli app?
  a terminal app?


Server will start with a default holding page.
Server will be in a very simple configuration.
Single html response for all requests...?


Server with admin interface available, and admin interface allowing it to bundle / serve selected content.
Also want to make use of simple and stable API.

Want to make the server admin page(s) with panels.
Would be a nice place for a decent web ui.

More advanced and user-friendly functionality out-of-the-box.
A file manager interface would be cool.
Maybe would need to use file system resource
Could work on remote file system too.

Or make clear this is the core of the server?
jsgui3-server-core perhaps?

A Default server? Could also include file management.


jsgui3-website could be helpful
a .deploy function
possibly the website could be hosted over multiple different servers, deployment could work for that.
The website would not only be within the server.

Could have a deployment wizard.












