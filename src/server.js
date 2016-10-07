var WebSocketServer = require('ws').Server
var readline = require('readline');

var wss = new WebSocketServer({
    port: 8080
});

var track_info = []
var cars = []
var webclients = []
var tracks = []

var msg_request = {
    'type': 'command',
    'data': {
        'type': null
    },
    'version': 1.0
}

var lap_info = {
    "type": "lap-info",
    "data": {
        "track_id": null,
        "time": 0,
    },
    "version": 1.0
}

var Car = new function(ws, id) {
    this.ws = ws;
    this.id = id;
}

var Track = new function(ws, id) {
    this.ws = ws;
    this.id = id;
    this.car = null;
    this.state = null;
}

var RaceController = new function() {
    this.num_laps = 0;
    this.max_num_laps = 0;
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line) {
    if (line != "") {
        command_handler(line);
    }
});

function add_client(ws, type, id) {
    if (type == "car") {
        //cars.push(new Car(ws, id));
        cars.push(ws);
        console.log('Adding new CAR client');
    } else if (type == "track") {
        //tracks.push(new Track(ws, id, car-id));
        tracks.push(ws);
        console.log('Adding new TRACK client');
    } else if (type == "web") {
        webclients.push(ws);
        console.log('Adding new WEB client');
    } else {
        // Unknown type
        console.log('Unknown type');
    }
}

function remove_client(ws) {
    var index = -1;

    if ((index = webclients.indexOf(ws)) >= 0) {
        webclients.splice(index, 1);
        console.log('Remove WEB client');
    } else if ((index = cars.indexOf(ws)) >= 0) {
        //cars.forEach(function(item) {
        //            if (item.ws == ws)
        //  });
        cars.splice(index, 1);
        console.log('Remove CAR client');
    } else if ((index = tracks.indexOf(ws)) >= 0) {
        tracks.splice(index, 1);
        console.log('Remove TRACK client');
    } else {
        // Unknowm socket
        console.log('Could not remove client (Unkown client)');
    }
}

/* Commands from CLI */
function command_handler(cmd) {
    console.log('Send command %s to tracks', cmd);
    if (cmd == "START") {
        tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "start"
            ws.send(JSON.stringify(msg));
        });
    } else if (cmd == "STOP") {
        tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "stop"
            ws.send(JSON.stringify(msg));
        });
    } else if (cmd == "RESTART") {
        tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "restart"
            ws.send(JSON.stringify(msg));
        });
    } else {
        // Unknown command
    }
}

function broadcast_telemetrics(message) {
    webclients.forEach(function(ws) {
        ws.send(message);
    });
}

function message_handler(ws, message) {

    var msg = JSON.parse(message);

    switch (msg.type) {
        case "identity":
            add_client(ws, msg.data.type, msg.data.id);
            console.log('Identity: Type: %s, ID: %s', msg.data.type, msg.data.id);
            break;
        case "telemetry":
            broadcast_telemetrics(message);
            console.log('Telemetry: car_id: %s, speed: %s, rpm: %s, gforce ',
                msg.data.id, msg.data.speed, msg.data.rpm, msg.data.gforce);
            break;
        case "track-info":
            console.log('Track-info: track_id: %s, car_id: %s, status: %s',
                msg.data.track_id, msg.data.car_id, msg.data.status);
            break;
        case "lap-info":
            console.log('Lap-info: track #%s, lap time: %s',
                msg.data.track_id, msg.data.time);
            break;
        default:
            console.log('Unknown message!');
            break;
    }
}

wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(message) {
        message_handler(this, message);
    });

    ws.on('close', function close(code, message) {
        remove_client(this);
        console.log('Connection closed: %s', message);
    });
});
