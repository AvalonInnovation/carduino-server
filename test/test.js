var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({
    port: 8080
});

wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(message) {
        console.log('Message: %s', message);
        //message_handler(this, message);
    });

    ws.on('close', function close(code, message) {
        //remove_client(this);
        console.log('Connection closed: %s', message);
    });
});
