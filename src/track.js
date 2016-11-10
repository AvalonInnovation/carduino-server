var util = require('util');
var SerialPort = require('serialport');

var POLL_INTERVAL = 1000; // ms
var CAR_TIMEOUT = 10000; //ms

/*
 1. Open serial port to tracks
 2. Register receive handler and start check_car interval
 3. Await car or track info message
 4. Receive info message
    4a. Receive car info, write info to track instance and set track state.
    4b. Receive track info.
 5.
*/

// TrackController object, handling the different tracks in the system
function TrackController(identifier, baudRate) {
    this.tracks = [];
    this.state = 66; //UNINITIALIZED;
    this.baudRate = baudRate;
    this.identity = identifier;
}
util.inherits(TrackController, new require('events').EventEmitter);

TrackController.prototype.get_track_id = function(car_id) {
    for (var i = 0; i < this.tracks.length; i++) {
        if (this.tracks[i].car_id == car_id) {
            return this.tracks[i].track_id;
        }
    }
    return 0;
}

TrackController.prototype.start_race = function() {
    for (var i = 0; i < this.tracks.length; i++) {
        this.tracks[i].raceState = 1;
    }
}

TrackController.prototype.reset = function() {
    for (var i = 0; i < this.tracks.length; i++) {
        this.tracks[i].reset();
    }
}

TrackController.prototype.init = function() {
    console.log("TrackController: Initializing...");
    SerialPort.list(this.probe_serial.bind(this));
}

TrackController.prototype.probe_serial = function(err, ports) {
    for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        if (port.manufacturer != null) {
            if (port.manufacturer.search(this.identity) >= 0) {
                var track = new Track();
                track.comName = port.comName;
                track.baudRate = this.baudRate;
                track.on("laptime", this.laptime_handler);
                this.tracks.push(track);
            }
        }
    }

    if (this.tracks.length > 0) {
        // Initilize track communication
        console.log("TrackController: Found %d tracks, initializing...");
        for (var i = 0; i < this.tracks.length; i++) {
            this.tracks[i].init();
        }
    } else {
        console.log("TrackController: No tracks found, please check serial ports!");
    }
}

// Relay event to higher levels
TrackController.prototype.laptime_handler = function(track) {
    this.emit("laptime", track);
}

// Track object holding information about a track
function Track() {
    this.comName = null;
    this.port = null;
    this.baudRate = 38400;
    this.track_id = 0;
    this.car_id = 0;
    this.prog_id = "";
    this.prog_rev = 0;
    this.carState = 0;
    this.raceState = 0;
    this.timestamp = 0;
    this.prev_timestamp = 0;
    this.laptime = 0;
    this.laptimes = [];
    this.laphandlers = [];
}
util.inherits(Track, new require('events').EventEmitter);

Track.prototype.reset = function() {
    this.track_id = 0;
    this.car_id = 0;
    this.prog_id = "";
    this.prog_rev = 0;
    this.conState = 0;
    this.carState = 0;
    this.raceState = 0;
    this.timestamp = 0;
    this.prev_timestamp = 0;
    this.laptime = 0;
    this.laptimes = [];
}

// Open communication chanel and register event callbacks
Track.prototype.init = function() {
    var self = this;

    if (this.comName == null) {
        console.log("Could not initialize Track communication, no port found.");
        return;
    }
    // Open serial port
    this.port = new SerialPort(this.comName, {
        baudRate: this.baudRate,
        parser: SerialPort.parsers.readline('\r') //SerialPort.parsers.raw
    });

    // Register open callback
    this.port.on('open', function() {
        console.log("OPENED: %s @ %d", self.comName, self.baudRate);
        self.conState = 1;
        setInterval(self.check_status.bind(self), POLL_INTERVAL);
    });

    // Register data received callback
    this.port.on('data', this.receive.bind(this));
}

Track.prototype.check_status = function() {
    if (this.raceState != 1 && this.carState == 1) {
        if (Date.now() - this.timestamp > CAR_TIMEOUT) {
            this.carState = 0;
            console.log("LOST CAR");
        }
    }
    //console.log("STATUS - TRACK: %s, CAR: %s", this.track_id, this.carState ? "OK" : "NOK");
}

// Send function
Track.prototype.send = function(data) {
    this.port.write(data, function(err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        console.log('message written');
    });
}

Track.prototype.laptime_event = function(time) {
    if (this.prev_timestamp != 0) {
        // Calculate laptime in ms
        this.laptime = time - this.prev_timestamp;
        this.laptimes.push(this.laptime);
        console.log("Laptime: %d", this.laptime);
        //Fire laptime event
        this.emit("laptime", this);
    }
    this.prev_timestamp = time;
}

// Receive callback function
Track.prototype.receive = function(data) {
    var msg = data.split(':');
    switch (msg[0]) {
        case 'CID': // Car Info CID:23:test@example.com:7
            if (msg.length == 4) {
                // TODO: Validate data ??
                this.car_id = msg[1];
                this.prog_id = msg[2];
                this.prog_rev = msg[3];
                this.carState = 1;
                this.timestamp = Date.now();
            } else {
                console.log('Malformed CID command');
            }
            break;
        case 'TID': // Track Info TID:2
            if (msg.length == 2) {
                // Check if valid ID
                if (!isNaN(parseFloat(msg[1])) && isFinite(msg[1])) {
                    this.track_id = msg[1];
                }
            } else {
                console.log('Malformed TID command');
            }
            break;
        case 'LAP': // Laptime event LAP:2
            // TODO: Check track id?
            //if(this.track_id == msg[])
            if (msg.length == 2) {
                this.laptime_event(Date.now());
            } else {
                console.log('Malformed LAP command');
            }
            break;
        default:
            console.log('Unknown track command');
            break;
    }
    console.log(data);
}

/*
/dev/ttyACM0
usb-Arduino_LLC_HoodLoader2_16u2-if00
Arduino_LLC

/dev/ttyUSB0
usb-FTDI_FT232R_USB_UART_A104VBY7-if00-port0
FTDI
*/
//var trackCtrl = new TrackController();
//trackCtrl.init();

module.exports = TrackController;
