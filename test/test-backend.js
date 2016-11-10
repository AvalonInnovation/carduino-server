var request = require('request');

function Backend(addr, url) {
    this.addr = addr;
    this.url = url;
}

Backend.prototype.send = function(data) {
    request.post(
        'http://' + this.addr + this.url, {
            json: true,
            body: data,
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        }
    );
}

var backend = new Backend('192.168.0.111', '/api/lap');
var msg = JSON.parse(JSON.stringify(lapinfo));
var ts = 23874/1000;
msg.lane = "1";
msg.carID = "23"
msg.laptime = ts.toFixed(3).toString();;
msg.programmerID = "test@example.com";
msg.controlProgramRevision = "7";
msg.timestamp = new Date().toISOString();

console.log(JSON.stringify(msg));
backend.send(msg);

module.exports = Backend;
