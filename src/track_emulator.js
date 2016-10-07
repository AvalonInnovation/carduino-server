var WebSocket = require('ws');

var ADDR = 'ws://localhost:8080';
var INTERVAL = 1000;

var CAR_ID_1 = 0xBEEF;
var CAR_ID_2 = 0xBABE;

var TRACK_ID_1 = 1;
var TRACK_ID_2 = 2;

var identity = {
    "type": "identity",
    "data": {
        "type": "track",
        "id": 0
    },
    "version": 1.0
};

var command = {
    "command": {
        "type": "start", //start, stop, reset, status
    }
}

var track_info = {
    "type": "track-info",
    "data": {
        "track_id": 0,
        "car_id": 0,
    },
    "version": 1.0
}

var lap_info = {
    "type": "lap-info",
    "data": {
        "track_id": null,
        "time": 0,
    },
    "version": 1.0
}

var Track = function(id, car_id) {
    this.ws = null;
    this.id = id;
    this.car_id = car_id;
    this.state = null;
    this.emu_timeout = null;
    this.laptimer = null;

    this.start_session = function() {
        this.state = "ready";
        send_identity(this);
        send_trackinfo(this);
    }

    this.command_handler = function(data) {
        var msg = JSON.parse(data);
        switch (msg.data.type) {
            case "status":
                send_trackinfo(this);
                break;
            case "start":
                this.state = "running";
                emulate_race(this);
                console.log('race started');
                break;
            case "stop":
                this.state = "stop";
                if (this.emu_timeout != null) {
                    clearTimeout(this.emu_timeout);
                    this.emu_timeout = null;
                }
                console.log('race stopped');
                break;
            case "restart":
                this.state = "restart"
                break;
            default:
                console.log("Unknown command");
                break;
        }
    }
}

var tracks = [new Track(TRACK_ID_1, CAR_ID_1), new Track(TRACK_ID_2, CAR_ID_2)];

///----------STATIC FUNCTIONS------------///
function emulate_race(track) {
    if (track.emu_timeout == null) {
        track.laptimer = Date.now();
        track.emu_timeout = setTimeout(emulate_race, (5000 + 5000 * Math.random()), track);
    } else {
        if (track.state == "running") {
            var laptime = Date.now() - track.laptimer;
            console.log('Laptime for car on track #%s: %s', track.id, laptime);
            send_laptime(track, laptime);
            track.laptimer = Date.now();
            track.emu_timeout = setTimeout(emulate_race, (5000 + 5000 * Math.random()), track);
        }
    }
}

function send_identity(track) {
    if (track.ws.readyState == WebSocket.OPEN) {
        var msg = identity;

        msg.type = "identity";
        msg.data.type = "track";
        msg.data.id = track.id;

        track.ws.send(JSON.stringify(msg), function ack(error) {
            if (error != null)
                console.log("Error sendig");
        });
    }
}

function send_trackinfo(track) {
    if (track.ws.readyState == WebSocket.OPEN) {
        var msg = track_info;

        msg.type = "track-info";
        msg.data.track_id = track.id;
        msg.data.car_id = track.car_id;
        msg.data.status = track.state;

        track.ws.send(JSON.stringify(msg), function ack(error) {
            if (error != null)
                console.log("Error sendig");
        });
    }
}

function send_laptime(track, laptime) {
    var msg = lap_info;

    msg.data.track_id = track.id;
    msg.data.time = laptime;

    track.ws.send(JSON.stringify(msg), function ack(error) {
        if (error != null)
            console.log("Error sendig");
    });
}

function find_track(ws) {
    for (var i = 0; i < tracks.length; i++) {
        if (ws == tracks[i].ws) {
            return tracks[i];
        }
    }
    return null;
}
/*
for (var i = 0; i < tracks.length; i++) {
    var ws = new WebSocket(ADDR);

    ws.on('open', function open() {
        var track = find_track(this);

        if (track != null)
            track.start_session();
    });

    ws.on('message', function message(data, flags) {
        if (flags.binary != true) {
            var track = find_track(this);
            if (track != null)
                track.command_handler(data);
        }
    });

    ws.on('close', function close(code, message) {
        console.log('Connection closed: %s', message);
    });

    tracks[i].ws = ws;
}*/

tracks.forEach(function(track) {
    var ws = new WebSocket(ADDR);

    ws.on('open', function open() {
        var track = find_track(this);

        if (track != null)
            track.start_session();
    });

    ws.on('message', function message(data, flags) {
        if (flags.binary != true) {
            var track = find_track(this);
            if (track != null)
                track.command_handler(data);
        }
    });

    ws.on('close', function close(code, message) {
        console.log('Connection closed: %s', message);
    });

    track.ws = ws;
});
