var TelemetryServer = require('./telemetry');
var TrackController = require('./track');
var PSUController = require('./psu');
var Backend = require('./backend');

var RC_STATE_UNINITIALIZED = 1;
var RC_STATE_INITIALIZED = 2;
var RC_STATE_RACE_STARTED = 3;
var RC_STATE_RACE_STOPPED = 4;

var LOW_VOLTAGE = 5.0;
var HIGH_VOLTAGE = 12.0;
var CURRENT_LIMIT = 0.5;

var lapinfo = {
    "protocolVersion": 1.0,
    "lane": 0,
    "timestamp": 0,
    "laptime": 0,
    "carID": 0,
    "programmerID": 0,
    "controlProgramRevision": 0,
    /*        "maxSpeed":0,
            "maxAccel":0,
            "maxDecel":0,
            "maxLateral":0,
            "maxTurn":0,
            "inttime":0,*/
}

function RaceController() {
    this.state = RC_STATE_UNINITIALIZED;
    this.current_laps = 0;
    this.max_laps = 0;

    this.psuCtrl = new PSUController("USB_Vir", 9600);
    this.trackCtrl = new TrackController("Arduino_LLC", 38400);
    this.telemetryServer = new TelemetryServer("localhost", 80);
    this.backend = new Backend('carduino-webserver.local', '/api/lap');
}

RaceController.prototype.init = function() {
    //if (this.state == RC_STATE_UNINITIALIZED || this.state = RC_STATE_RACE_STOPPED) {
        this.psuCtrl.init();
        this.trackCtrl.init();
        this.telemetryServer.init();
        //this.backend.init();
        this.trackCtrl.on("lapevent", this.lapevent_handler.bind(this));
        this.telemetryServer.on("message", this.telemetry_handler.bind(this));
        // Enable low voltage on PSU
        this.state = RC_STATE_INITIALIZED;
    //}
}

RaceController.prototype.telemetry_handler = function(message) {
    // Convert car id to track id
    message.data.id = this.trackCtrl.get_track_id(message.data.id);
    //broadcast message
    this.telemetryServer.broadcast(message);
}

RaceController.prototype.lapevent_handler = function(track) {
    var msg = JSON.parse(JSON.stringify(lapinfo));

    msg.lane = track.track_id;
    msg.carID = track.car_id;
    msg.laptime = track.laptime;
    msg.programmerID = track.prog_id;
    msg.controlProgramRevision = track.prog_rev;
    msg.timestamp = Date.now();

    this.backend.send(msg);
}

RaceController.prototype.reset = function() {
    if (this.state == RC_STATE_UNINITIALIZED ||
        this.state == RC_STATE_INITIALIZED ||
        this.state == RC_STATE_RACE_STOPPED) {
        trackCtrl.reset();
        // Enable low voltage on PSU
        this.state = RC_STATE_INITIALIZED;
    }
}

RaceController.prototype.start = function() {
    if (this.state == RC_STATE_INITIALIZED) {
        if (this.check_precond()) {
            this.psuCtrl.set_current(CURRENT_LIMIT);
            this.psuCtrl.set_voltage(HIGH_VOLTAGE);
            this.state = RC_STATE_RACE_STARTED;
        }
    } else {
        console.log("Could not start race");
    }
}

RaceController.prototype.stop = function() {
    if (this.state == RC_STATE_RACE_STARTED) {
        if (this.check_precond()) {
            this.psuCtrl.set_current(CURRENT_LIMIT);
            this.psuCtrl.set_voltage(LOW_VOLTAGE);
            this.state = RC_STATE_RACE_STARTED;
        }
    } else {
        console.log("Could not stop race, race has not started");
    }
}

RaceController.prototype.enable = function() {
    if (this.state == RC_STATE_INITIALIZED) {
        if (this.check_precond()) {
            this.psuCtrl.set_current(CURRENT_LIMIT);
            this.psuCtrl.set_voltage(HIGH_VOLTAGE);
            this.state = RC_STATE_RACE_STARTED;
        }
    } else {
        console.log("Could not start race");
    }
}

RaceController.prototype.disable = function() {
    if (this.state == RC_STATE_INITIALIZED) {
        if (this.check_precond()) {
            this.psuCtrl.set_current(CURRENT_LIMIT);
            this.psuCtrl.set_voltage(HIGH_VOLTAGE);
            this.state = RC_STATE_RACE_STARTED;
        }
    } else {
        console.log("Could not start race");
    }
}

RaceController.prototype.status = function() {
    //this.trackCtrl
    //this.


    if (this.state == RC_STATE_RACE_STARTED) {
        if (this.check_precond()) {
            this.psuCtrl.set_current(CURRENT_LIMIT);
            this.psuCtrl.set_voltage(LOW_VOLTAGE);
            this.state = RC_STATE_RACE_STARTED;
        }
    } else {
        console.log("Could not stop race, race has not started");
    }
}

RaceController.prototype.check_precond = function() {
    // Check that PSU:s are online @ low voltage
    if (!PSUController.check_voltage(LOW_VOLTAGE)) {
        console.log("Pre-check failed: PSU not att correct voltage");
        return false;
    }

    // Check that the tracks are online
    if (!trackCtrl.check_tracks()) {
        console.log("Pre-check failed: Tracks are not online");
        return false;
    }

    // Check that the cars are online
    if (!trackCtrl.check_cars()) {
        console.log("Pre-check failed: Cars are not online");
        return false;
    }

    console.log("Pre-check OK!");
    return true;
}

module.exports = RaceController;
