var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:80');

var identity = {
    "type": "identity",
    "data": {
        "type": "web",
        "id": "4529"
    },
    "version": 1.0
};

var command = {
    "command": {
        "type": "start", //start, stop, reset, status
    }
}

var telemetrics = {
    "type": "telemetrics",
    "data": {
        "speed": "231",
        "rpm": "7947",
        "gforce": "3.4"
    },
    "version": 1.0
};

var send_message = function() {
    if (ws.readyState == WebSocket.OPEN)
        ws.send(JSON.stringify(telemetrics), function ack(error) {
            if (error != null)
                console.log("Error sendig");
        });
    setTimeout(send_message, 2000);
};

ws.on('open', function open() {
    ws.send(JSON.stringify(identity));
});

ws.on('message', function message(data, flags) {
    if (flags.binary != true)
        console.log('received: %s', data);
});

ws.on('close', function close(code, message) {
    console.log('Connection closed: %s', message);
});
