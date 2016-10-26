var SerialPort = require('serialport');

// TrackController object, handling the different tracks in the system
function TrackController() {
    this.tracks = [];
    this.state = 66; //UNINITIALIZED;
}

TrackController.prototype.init = function() {
    SerialPort.list(this.probe_serial.bind(this));
}

TrackController.prototype.probe_serial = function(err, ports) {
    console.log("Probing serial ports.. Found %d ports", ports.length);

    for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        if (port.manufacturer != null) {
            if (port.manufacturer.search("Arduino_LLC") >= 0) {
                var track = new Track()
                track.comName = port.comName;
                this.tracks.push(track);
                console.log("Added track comport: %s (%s)", port.comName, port.manufacturer);
            }
        }
    }

    if (this.tracks.length != 2) {
        console.log("Could not find two tracks, please check serialports..");
    } else {
        // Initilize track communication
        for (var i = 0; i < this.tracks.length; i++) {
            this.tracks[i].init();
        }
    }
}

// Track object holding information about a track
function Track() {
    this.comName = null;
    this.port = null;
    this.baudRate = 38400;
    this.track_id = 0;
    this.car_id = 0;
    this.conState = 0;
    this.raceState = 0;
    this.timer = 0;
    this.laptime = [];
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
        parser: SerialPort.parsers.readline('\n') //SerialPort.parsers.raw
    });
    console.log("OPEN: %s @ %d", this.comName, this.baudRate);
    // Register open callback
    this.port.on('open', function() {
        self.send('#ID!');
    });

    // Register data received callback
    this.port.on('data', this.receive.bind(this));
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

// Receive calback function
Track.prototype.receive = function(data) {
    var msg = data.match(/(-?\d+)/g);
    switch (msg[1]) {
        case '1': // Info/Status message #1C1I32843S2!
            this.track_id = msg[0];
            this.car_id = msg[2];
            this.status = msg[3];
            break;
        case '2': // Laptime message #1C2I32843!
            var time = Date.now()
            this.laptimes.push(time);
            this.report_laptime(time);
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
var trackCtrl = new TrackController();
trackCtrl.init();
