
const Server = require('../../server');



if (require.main === module) {

    const server = new Server({
        'port': 8088
        
    });
    console.log('server.resource_names', server.resource_names);

    /*
    server.website.api.publish('time', () => {
        return new Date().toISOString();
    });
    */

    server.publish('time', () => {
        return new Date().toISOString();
    });

    server.publish('user', () => {
        return { id: 1, name: 'John Doe' };
    });

    server.start(8088);
    
}