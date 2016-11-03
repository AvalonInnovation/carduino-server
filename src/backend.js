var request = require('request');

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

function Backend(addr, url) {
    this.addr = addr;
    this.url = url;
}

Backend.prototype.lapevent_handler = function(track) {
    var msg = JSON.parse(JSON.stringify(lapinfo));
    msg.lane = track_id;
    msg.carID = car_id;
    msg.laptime = laptime;
    msg.programmerID = "test@example.com";
    msg.controlProgramRevision = "";
    msg.timestamp = Date.now();
    this.send(msg);
}

Backend.prototype.send_lapinfo = function(track_id, car_id, prog_id, revision, laptime) {
    var msg = JSON.parse(JSON.stringify(lapinfo));
    msg.lane = track_id;
    msg.carID = car_id;
    msg.laptime = laptime;
    msg.programmerID = prog_id;
    msg.controlProgramRevision = revision;
    msg.timestamp = Date.now();
    this.send(msg);
}

Backend.prototype.send = function(data) {
    request.post(
        this.addr + '/' + url, {
            json: JSON.stringify(data)
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
            }
        }
    );
}
