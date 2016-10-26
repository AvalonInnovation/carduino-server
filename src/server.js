var WebSocketServer = require('ws').Server
var readline = require('readline');

var wss = new WebSocketServer({
    port: 80
});

var track_info = []
var cars = []
var webclients = []
var tracks = []

var RAW_CMD_TELEMETRY = 1;
var prev_raw = telemetry_raw;
var raw_str = "";

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

var telemetry_raw = {
    "type": "telemetry_raw",
    "data": {
        "id": 0,
        "time": 0,
        "enc_f": 0,
        "enc_r": 0,
        "acc_x": 0,
        "acc_y": 0,
        "acc_z": 0,
        "gyro_u": 0,
        "gyro_v": 0,
        "gyro_w": 0,
        "current": 0,
        "speed": 0,
    },
    "version": 1.0
}

var telemetry = {
    "type": "telemetry",
    "data": {
        "id": 0,
        "time": 0,
        "acc_x": 0,
        "acc_y": 0,
        "gyro": 0,
        "current": 0,
        "speed": 0,
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
        cli_handler(line);
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
function cli_handler(cmd) {
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

function serial_handler(){

}

function broadcast_telemetrics(message) {
    if (webclients.length > 0) {
        var json = JSON.stringify(message)
        console.log('Broadcast: %s', json);
        webclients.forEach(function(ws) {
            ws.send(json);
        });
    }
}

function translate_acc(coord) {
    return coord / 10;
}

function translate_gyro(angle) {
    return angle / 10;
}

function calc_speed(dr, dt) {
    // return speed in cm/s
    console.log('dr: %d(%d), dt: %d(%d), s: %d', dr,dr * 0.0672, dt, dt*0.000000125, (dr * 0.0672) / (dt*0.000000125));
    return ((dr * 0.0672) / (dt*0.000000125));
}

function assemble_raw(msg) {
    var c;

    for (var i = 0; i < msg.length; i++) {
        c = String.fromCharCode(msg[i]);
        raw_str += c;
        if (c == '!') {
            handle_raw(raw_str);
            raw_str = "";
        } else if (c == '#') {
            raw_str = c;
        }
    }
}

function handle_raw(message) {
    console.log('RAW: %s', message);

    var data = message.match(/(-?\d+)/g);
    var raw = JSON.parse(JSON.stringify(telemetry_raw));
    var msg = telemetry;

    if (data.length == 12) {
        //console.log('RAW: %s', data);
        raw.data.id = data[0];
        raw.data.time = data[1];
        raw.data.enc_f = data[2];
        raw.data.enc_r = data[3];
        raw.data.acc_x = data[4];
        raw.data.acc_y = data[5];
        raw.data.acc_z = data[6];
        raw.data.gyro_u = data[7];
        raw.data.gyro_v = data[8];
        raw.data.gyro_w = data[9];
        raw.data.current = data[10];
        raw.data.speed = data[11];

        /*console.log('id:%d, t:%d, ef:%d, er:%d, x:%d, y:%d, z:%d, u:%d, v:%d, w:%d, c:%d, s:%d', data[0],
            raw.data.time,
            raw.data.enc_f,
            raw.data.enc_r,
            raw.data.acc_x,
            raw.data.acc_y,
            raw.data.acc_z,
            raw.data.gyro_u,
            raw.data.gyro_v,
            raw.data.gyro_w,
            raw.data.current,
            raw.data.speed);*/

        msg.data.id = raw.data.id; //Should be translated
        msg.data.time = Date.now();
        msg.data.acc_x = translate_acc(raw.data.acc_x);
        msg.data.acc_y = translate_acc(raw.data.acc_y);
        msg.data.gyro = translate_gyro(raw.data.gyro_w);

        msg.data.speed = calc_speed(raw.data.enc_r - prev_raw.data.enc_r, raw.data.time - prev_raw.data.time);

        broadcast_telemetrics(msg);
        prev_raw = raw;
    }
}

function message_handler(ws, message) {

    if (message[0] != '{') {
        assemble_raw(message);
    } else {
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
