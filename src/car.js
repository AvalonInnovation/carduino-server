var util = require('util');
var SerialPort = require('serialport');

var POLL_INTERVAL = 100; // ms
var CAR_TIMEOUT = 1000; //ms

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

// CarController object, handling the cars in the system
function CarController(identifier, baudRate) {
    this.cars = [];
    this.baudRate = baudRate;
    this.identity = identifier;
}
util.inherits(CarController, new require('events').EventEmitter);

CarController.prototype.init = function() {
    console.log("CarController: Initializing...");
    SerialPort.list(this.probe_serial.bind(this));
}

CarController.prototype.probe_serial = function(err, ports) {
    var self = this;
    for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        if (port.manufacturer != null) {
            if (port.manufacturer.search(this.identity) >= 0) {
                var car = new Car();
                car.comName = port.comName;
                car.baudRate = self.baudRate;
                car.on("message", self.message_handler.bind(self));
                self.cars.push(car);
            }
        }
    }

    if (self.cars.length > 0) {
        // Initilize car communication
        console.log("CarController: Found %d cars, initializing...", self.cars.length);
        for (var i = 0; i < self.cars.length; i++) {
            self.cars[i].init();
        }
    } else {
        console.log("CarController: No cars found, please check serial ports!");
    }
}

// Relay event to higher levels
CarController.prototype.message_handler = function(message) {
    this.emit("message", message);
}

// Car object, interface to a car
function Car() {
    this.comName = null;
    this.port = null;
    this.baudRate = 38400;
    this.prev_data = [];
    this.car_id = 0;
    this.carState = 0;
    this.timestamp = 0;
}
util.inherits(Car, new require('events').EventEmitter);

Car.prototype.reset = function() {
    this.car_id = 0;
    this.prog_id = "";
    this.prog_rev = 0;
    this.conState = 0;
    this.carState = 0;
    this.timestamp = 0;
    this.prev_data = [];
}

// Open communication chanel and register event callbacks
Car.prototype.init = function() {
    var self = this;

    if (this.comName == null) {
        console.log("Car: Could not initialize Car communication, no port found.");
        return;
    }
    // Open serial port
    this.port = new SerialPort(this.comName, {
        baudRate: this.baudRate,
        parser: SerialPort.parsers.readline('\r\n') //SerialPort.parsers.raw
    });

    // Register open callback
    this.port.on('open', function() {
        console.log("Car: OPENED: %s @ %d", self.comName, self.baudRate);
        self.conState = 1;
        setInterval(self.check_status.bind(self), POLL_INTERVAL);
    });

    // Register data received callback
    this.port.on('data', this.receive.bind(this));
}

// Continously checks that car is online
Car.prototype.check_status = function() {
    if (this.carState == 1) {
        if (Date.now() - this.timestamp > CAR_TIMEOUT) {
            this.carState = 0;
            console.log('Car#%d: Offline', this.prev_data['#']);
        }
    }
}

// Send function
Car.prototype.send = function(data) {
    this.port.write(data, function(err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    });
}

// Receive callback function
Car.prototype.receive = function(data) {
    if(data[0] == '#' && data[data.length - 1] == '!') {
        this.timestamp = Date.now();
        this.handle_raw(data);
        if(this.carState == 0) {
            console.log('Car#%d: Online', this.prev_data['#']);
            this.carState = 1;
            //this.send('b'); //DBG
        }
    }
}

// Convert raw message data to json
Car.prototype.handle_raw = function(message) {
    var data = [];
    var raw = message.match(/([A-Z#]-?\d+)/g);

    // Convert raw string message into associative array
    for(var i = 0; i < raw.length; i++) {
        data[raw[i][0]] = raw[i].substring(1);
    }

    var msg = JSON.parse(JSON.stringify(telemetry));
    msg.data.id = data['#'];
    msg.data.time = Date.now();
    msg.data.acc_x = translate_acc(data['X']);
    msg.data.acc_y = translate_acc(data['Y']);
    msg.data.gyro = translate_gyro(data['W']);

    msg.data.speed = calc_speed(data['R'] - this.prev_data['R'], this.prev_data['T'], data['T']);

    // Fire new message event
    this.emit('message', msg);

    // Store values for future processing
    this.prev_data = data;
}

function translate_acc(coord) {
    return coord / 100;
}

function translate_gyro(angle) {
    return angle / 100;
}

// returns speed in cm/s
function calc_speed(dr, t1, t2) {
    var dt = 0;
    var speed = 0;
    if(t1 > t2) {
        dt = (4294967295/8000) - (t1 - t2);
    } else {
        dt = t2 - t1;
    }

    speed = (dt == 0) ? 0:(((dr * 6.72)/10) / (dt * 0.001));

    return speed;
}

module.exports = CarController;
