var readline = require('readline');
var RaceController = require('./race_control');
var raceCtrl = new RaceController();

//Initialize the CLI
var cli = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

cli.on('line', function(line) {
    if (line != "") {
        cli_handler(line);
    }
});

/* Commands from CLI */
function cli_handler(cmd) {
    console.log('Executing command %s', cmd);
    if (cmd == "START") {
        /*tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "start"
            ws.send(JSON.stringify(msg));
        });*/
        raceCtrl.start();
    } else if (cmd == "STOP") {
        /*tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "stop"
            ws.send(JSON.stringify(msg));
        });*/
        raceCtrl.stop();
    } else if (cmd == "RESET") {
        /*tracks.forEach(function(ws) {
            var msg = msg_request;
            msg.data.type = "restart"
            ws.send(JSON.stringify(msg));
        });*/
        raceCtrl.reset();
    } else {
        // Unknown command
    }
}
