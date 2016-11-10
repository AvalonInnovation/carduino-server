var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({
    port: 80
});

/*
BLACK - GND
BROWN - TXD
ORANGE - GPIO2
RED - CH_PD
GREEN - GPIO0
YELLOW - RESET
PURPLE - RXD
BLUE - VCC
*/
var prev_local = Date.now();
var prev_remote = 0;
var str = "";

wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(msg) {
        var c;
        for(var i=0; i< msg.length; i++) {
            c = String.fromCharCode(msg[i]);
            str += c;
            if(c == '!') {
                console.log('RAW: %s', str);
                str = "";
            } else if (c == '#'){
                str = c;
            }
        }

        /*
        var msg = str.concat(message);
        console.log('msg: %s', msg);
        if(msg.search("!")) {
            if(msg.search("#")) {
                console.log('Complete message: %s', msg);
            }
            str = "";
            msg = "";
        }*/

        /*var array = message.match( /(\d+)/g );
        var current = array[2];
        var local = Date.now() - prev_local;
        var remote = current - prev_remote;
        console.log('%s: [+%s ms] [+%s ms] [%s] Message: %s', array[3], local, remote, remote - local, message);
        prev_local = Date.now();
        prev_remote = current;*/
        //message_handler(this, message);
    });

    ws.on('close', function close(code, message) {
        //remove_client(this);
        console.log('Connection closed: %s', message);
    });
});
