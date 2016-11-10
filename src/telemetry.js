var util = require('util');
var WebSocketServer = require('ws').Server;

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

function WSClient(ws) {
    this.ws = ws;
    this.id = "";
    this.type = ""; // car, frontend
    this.prev_raw = JSON.parse(JSON.stringify(telemetry_raw));
    this.raw_str = "";
}
util.inherits(WSClient, new require('events').EventEmitter);

function TelemetryServer(host, port) {
    this.host = host;
    this.port = port;
    this.wss = null;
    this.clients = [];
}
util.inherits(TelemetryServer, new require('events').EventEmitter);

TelemetryServer.prototype.init = function() {
    console.log("TelemetryServer: Initializing...");
    // Initialize websocket server and add callbacks
    var self = this;
    self.wss = new WebSocketServer({
        host: this.host,
        port: this.port
    });

    this.wss.on('connection', function connection(ws) {
        var client = new WSClient(ws);
        client.on("message", self.handle_message.bind(self));
        self.clients.push(client);

        ws.on('message', function incoming(message) {
            client.message_handler(message);
        });

        ws.on('close', function close(code, message) {
            self.remove_client(client);
        });

    });
}

// Relay event to higher levels
TelemetryServer.prototype.handle_message = function(message) {
        this.emit("message", message);
}

// Broadcast message to all frontend clients
TelemetryServer.prototype.broadcast = function(message) {
    if (this.clients.length > 0) {
        var json = JSON.stringify(message);
        console.log('Broadcast: %s', json);
        this.clients.forEach(function(client) {
            if(client.type == 'frontend') {
                client.ws.send(json);
            }
        });
    }
}

TelemetryServer.prototype.remove_client = function(client) {
    var index = -1;

    // Check if client exists
    if ((index = this.clients.indexOf(client)) >= 0) {
        this.clients.splice(index, 1);
        console.log('TelemetryServer: Connection closed');
    } else {
        // Unknown client
        console.log('TelemetryServer: Error, could not remove unkown client');
    }
}

WSClient.prototype.message_handler = function(message) {

    if (message[0] != '{' && message[message.length - 1] != '}') {
        this.type = "car";
        this.assemble_raw(message);
    } else {
        var msg = JSON.parse(message);

        switch (msg.type) {
            case "identity":
                //add_client(ws, msg.data.type, msg.data.id);
                this.type = "frontend";
                this.id = msg.data.id;
                console.log('WSClient: New fontend connection');
                break;
                /*case "telemetry":
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
                      break;*/
            default:
                console.log('Unknown message!');
                break;
        }
    }
}

WSClient.prototype.assemble_raw = function(msg) {
    var c;

    for (var i = 0; i < msg.length; i++) {
        //c = String.fromCharCode(msg[i]);
        c = msg[i]; //DBG ONLY!
        this.raw_str += c;
        if (c == '!') {
            this.handle_raw(this.raw_str);
            this.raw_str = "";
        } else if (c == '#') {
            this.raw_str = c;
        }
    }
}

WSClient.prototype.handle_raw = function(message) {

    var data = message.match(/(-?\d+)/g);

    var raw = JSON.parse(JSON.stringify(telemetry_raw));
    var msg = JSON.parse(JSON.stringify(telemetry));

    if (data.length == 12) {
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

        msg.data.id = raw.data.id;
        msg.data.time = Date.now();
        msg.data.acc_x = translate_acc(raw.data.acc_x);
        msg.data.acc_y = translate_acc(raw.data.acc_y);
        msg.data.gyro = translate_gyro(raw.data.gyro_w);

        msg.data.speed = calc_speed(raw.data.enc_r - this.prev_raw.data.enc_r, raw.data.time - this.prev_raw.data.time);
        // Fire new message event
        this.emit('message', msg);
        //broadcast_telemetrics(msg);
        this.prev_raw = raw;
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
    return dt == 0 ? 0:(10 * (dr * 0.0672) / (dt * 0.000000125));
}

//var ts = new TelemetryServer(null, 80);
//ts.init();

module.exports = TelemetryServer;
