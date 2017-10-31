var TelemetryServer = require('./telemetry');
var TrackController = require('./track');
var CarController = require('./car');
var PSUController = require('./psu');
var Backend = require('./backend');

var RC_STATE_UNINITIALIZED = 1;
var RC_STATE_INITIALIZED = 2;
var RC_STATE_RACE_STARTED = 3;
var RC_STATE_RACE_STOPPED = 4;

var LOW_VOLTAGE = 0.0;
var HIGH_VOLTAGE = 12.0;
var CURRENT_LIMIT = 1.0;

var lapinfo = {
    "protocolVersion": "0.0.1",
    "lane": "0",
    "timestamp": "0",
    "laptime": "0",
    "carID": "0",
    "programmerID": "0",
    "controlProgramRevision": "0",
/*  "maxSpeed":0,
    "maxAccel":0,
    "maxDecel":0,
    "maxLateral":0,
    "maxTurn":0,
    "inttime":0 */
}

function RaceController(config) {
    this.state = RC_STATE_UNINITIALIZED;
    this.current_laps = 0;
    this.max_laps = 0;

    this.psuCtrl = new PSUController(config.psu);
    this.trackCtrl = new TrackController(config.track);
    this.carCtrl = new CarController(config.car);
    this.telemetry = new TelemetryServer(config.websocket);
    this.backend = new Backend(config.backend);
}

RaceController.prototype.init = function() {
    //if (this.state == RC_STATE_UNINITIALIZED || this.state = RC_STATE_RACE_STOPPED) {
        this.psuCtrl.init();
        this.trackCtrl.init();
       // this.carCtrl.init();
        //this.telemetry.init();

        this.trackCtrl.on("laptime", this.laptime_handler.bind(this));
        //this.telemetry.on("message", this.telemetry_handler.bind(this));
        //this.carCtrl.on("message", this.telemetry_handler.bind(this));

        this.state = RC_STATE_INITIALIZED;
    //}
}

RaceController.prototype.telemetry_handler = function(message) {
    // Convert car id to track id
    message.data.id = this.trackCtrl.get_track_id(message.data.id);
    // Broadcast message
    this.telemetry.broadcast(message);
}

RaceController.prototype.laptime_handler = function(track) {
    var msg = JSON.parse(JSON.stringify(lapinfo));

    msg.lane = track.track_id.toString();
    msg.carID = track.car_id.toString();
    msg.laptime = (track.laptime/1000).toFixed(3).toString();
    msg.programmerID = track.prog_id.toString();
    msg.controlProgramRevision = track.prog_rev.toString();
    msg.timestamp = new Date().toISOString();

    this.backend.send(msg);
}

RaceController.prototype.reset = function() {
    if (this.state == RC_STATE_UNINITIALIZED ||
        this.state == RC_STATE_INITIALIZED ||
        this.state == RC_STATE_RACE_STOPPED) {
        this.trackCtrl.reset();
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
        console.log("RaceController: Could not start race");
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
        console.log("RaceController: Could not stop race, race has not started");
    }
}

RaceController.prototype.enable = function() {
    this.psuCtrl.set_current(CURRENT_LIMIT);
    this.psuCtrl.set_voltage(HIGH_VOLTAGE);
    this.psuCtrl.enable();
    console.log("RaceController: Power enabled");
}

RaceController.prototype.enable_lane = function(lane) {
    this.psuCtrl.set_current_lane(CURRENT_LIMIT, lane);
    this.psuCtrl.set_voltage_lane(HIGH_VOLTAGE, lane);
    this.psuCtrl.enable_lane(lane);
    console.log("RaceController: Power enabled");
}

RaceController.prototype.disable = function() {
    this.psuCtrl.disable();
    this.trackCtrl.reset();
    console.log("RaceController: Power disabled");

    this.state = RC_STATE_INITIALIZED;
}

RaceController.prototype.disable_lane = function(lane) {
    this.psuCtrl.disable_lane(lane);
    this.trackCtrl.reset_lane(lane);
//    this.trackCtrl.reset();
    console.log("RaceController: Power1 disabled");

//    this.state = RC_STATE_INITIALIZED;
}


RaceController.prototype.status = function() {

}

RaceController.prototype.check_precond = function() {
    // Check that PSU:s are online @ low voltage
    if (!this.psuCtrl.check_voltage(LOW_VOLTAGE)) {
        console.log("RaceController: Pre-check failed: PSU not att correct voltage");
        return false;
    }

	/*
    // Check that the tracks are online
    if (!this.trackCtrl.check_tracks()) {
        console.log("RaceController: Pre-check failed: Tracks are not online");
        return false;
    }

    // Check that the cars are online
    if (!this.trackCtrl.check_cars()) {
        console.log("RaceController: Pre-check failed: Cars are not online");
        return false;
    }
	*/

    console.log("RaceController: Pre-check OK!");
    return true;
}

module.exports = RaceController;
