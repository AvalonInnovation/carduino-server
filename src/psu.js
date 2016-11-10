var SerialPort = require('serialport');

var SEND_INTERVAL = 50;

// PSUController, handling the PSU units in the system
function PSUController(identifier, baudRate) {
    this.psus = [];
    this.state = "NA"; //UNINITIALIZED;
    this.baudRate = baudRate;
    this.identity = identifier;
    this.event_handlers = [];
    this.ready_device = 0;
}

PSUController.prototype.init = function() {
    console.log("PSUController: Initializing...");
    SerialPort.list(this.probe_serial.bind(this));
}

PSUController.prototype.probe_serial = function(err, ports) {
    for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        if (port.manufacturer != null) {
            if (port.manufacturer.search(this.identity) >= 0) {
                var psu = new PSU();
                psu.comName = port.comName;
                psu.baudRate = this.baudRate;
                this.psus.push(psu);
            }
        }
    }

    if (this.psus.length > 0) {
        // Initilize psu communication
        console.log("PSUController: Found %d PSUs, initializing...", this.psus.length);
        for (var i = 0; i < this.psus.length; i++) {
            this.psus[i].init();
        }
    } else {
        console.log("PSUController: No PSUs found, please check serial ports!");
    }
}

PSUController.prototype.enable = function() {
    for (var i = 0; i < this.psus.length; i++) {
        this.psus[i].enable();
    }
}

PSUController.prototype.disable = function() {
    for (var i = 0; i < this.psus.length; i++) {
        this.psus[i].disable();
    }
}

PSUController.prototype.set_voltage = function(voltage) {
    for (var i = 0; i < this.psus.length; i++) {
        this.psus[i].set_voltage(voltage);
    }
}

PSUController.prototype.set_current = function(current) {
    for (var i = 0; i < this.psus.length; i++) {
        this.psus[i].set_current(current);
    }
}

PSUController.prototype.check_voltage = function(voltage) {
    var status = true;

    for (var i = 0; i < this.psus.length; i++) {
        if (this.psus[i].voltage != voltage)
            status = false;
    }

    return status;
}

PSUController.prototype.check_current = function(current) {
    var status = true;

    for (var i = 0; i < this.psus.length; i++) {
        if (this.psus[i].current != current)
            status = false;
    }

    return status;
}

// psu object holding information about a psu
function PSU() {
    this.comName = null;
    this.port = null;
    this.baudRate = 0;
    this.online = false;
    this.last_req = null;
    this.serial_busy = 0;
    this.current = 0.0;
    this.voltage = 0.0;
    this.enabled = false;
    this.send_queue = [];
}
//util.inherits(PSU, new require('events').EventEmitter);

// Open communication chanel and register event callbacks
PSU.prototype.init = function() {
    var self = this;
    if (this.comName == null) {
        console.log("PSU: Could not initialize psu communication, no port found.");
        return;
    }

    // Open serial port
    this.port = new SerialPort(this.comName, {
        baudRate: this.baudRate,
        parser: SerialPort.parsers.byteLength(5) //SerialPort.parsers.raw
    });

    // Register open callback
    this.port.on('open', function() {
        console.log("PSU: OPENED: %s @ %d", self.comName, self.baudRate);
        //self.disable();
        self.set_voltage(6.0);
        self.set_current(0.5);
        self.enable();
    });

    // Register data received callback
    this.port.on('data', this.receive.bind(this));
}

PSU.prototype.set_voltage = function(voltage) {
    if (voltage > 0.0 && voltage < 31.00) {
        this.send('VSET1:' + voltage.toFixed(2).toString());
        this.send('VSET1?');
    } else {
        console.log('Voltage out of range!');
    }
}

PSU.prototype.set_current = function(current) {
    if (current > 0.0 && current < 5.10) {
        this.send('ISET1:' + current.toFixed(2).toString());
        this.send('ISET1?');
    } else {
        console.log('Current out of range!');
    }
}

PSU.prototype.enable = function() {
    this.send('OUT1');
    this.enabled = true;
}

PSU.prototype.disable = function() {
    this.send('OUT0');
    this.enabled = false;
}

PSU.prototype.send = function(req) {
    var self = this;
    this.send_queue.push(req);
    if (!this.serial_busy) {
        this.serial_busy = true;
        setTimeout(this.send_worker.bind(this), 10);
    }
}

// Do not call this directly
PSU.prototype.send_worker = function() {
    var data = this.send_queue.shift();
    if (data != null) {
        this.last_req = data;
        console.log('DBG: Writing to PSU:%s', data);

        this.port.write(data, function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
        });

        setTimeout(this.send_worker.bind(this), SEND_INTERVAL);
    } else {
        this.serial_busy = false;
    }
}

// Receive calback function
PSU.prototype.receive = function(data) {
    //Validate input data
    var resp = String.fromCharCode(data[0], data[1], data[2], data[3], data[4]);
    switch (this.last_req) {
        case 'VSET1?': // Voltage response
            this.voltage = parseFloat(resp);
            break;
        case 'ISET1?': // Current response
            this.current = parseFloat(resp);
            break;
        default:
            console.log('Unknown PSU response');
            break;
    }
    this.online = true;
    console.log("DBG: Response: %s", resp);
}

/*
var psuCtrl = new PSUController("USB_Vir", 9600);

psuCtrl.init();
psuCtrl.register_handler(handler);

function handler() {
    psuCtrl.disable();
    psuCtrl.set_voltage(6.0);
    psuCtrl.set_current(0.5);
    psuCtrl.enable();
}
*/

module.exports = PSUController;
