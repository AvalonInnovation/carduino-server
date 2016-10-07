var WebSocket = require('ws');

var ADDR = 'ws://localhost:8080';
var INTERVAL = 1000;

var CAR_ID_1 = 0xBEEF;
var CAR_ID_2 = 0xBABE;

var cars = [CAR_ID_1, CAR_ID_2];

var identity = {
    "type": "identity",
    "data": {
        "type": "car",
        "id": 0
    },
    "version": 1.0
};

var command = {
    "command": {
        "type": "start", //start, stop, reset, status
    }
}

var telemetry = {
    "type": "telemetry",
    "data": {
        "id": 0,
        "speed": 0,
        "rpm": 0,
        "gforce": 0
    },
    "version": 1.0
};

function send_telemetry(ws, id) {
    if (ws.readyState == WebSocket.OPEN) {
        var msg = telemetry;

        msg.data.id = id;
        msg.data.speed = 100 * Math.random();
        msg.data.rpm = 100 * Math.random();
        msg.data.gforce = 10 * Math.random();

        ws.send(JSON.stringify(msg), function ack(error) {
            if (error != null)
                console.log("Error sendig");
        });
    }
};

function send_identity(ws, id) {
    if (ws.readyState == WebSocket.OPEN) {
        var msg = identity;

        msg.type = "identity";
        msg.data.type = "car";
        msg.data.id = id;

        ws.send(JSON.stringify(msg), function ack(error) {
            if (error != null)
                console.log("Error sendig");
        });
    }
}

function start_session(ws, id) {
    send_identity(ws, id);
    setInterval(function() {
        send_telemetry(ws, id)
    }, INTERVAL);
}

cars.forEach(function(id) {
    var ws = new WebSocket(ADDR);
    ws.on('open', function open() {
        start_session(this, id);
    });

    ws.on('message', function message(data, flags) {
        if (flags.binary != true)
            console.log('received: %s', data);
    });

    ws.on('close', function close(code, message) {
        console.log('Connection closed: %s', message);
    });
});
