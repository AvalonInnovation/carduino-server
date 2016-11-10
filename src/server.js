var readline = require('readline');
var RaceController = require('./race_control');
var raceCtrl = new RaceController();
//Initialize the CLI
var cli = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

/* Commands from CLI */
function cli_handler(cmd) {
    console.log('Executing command %s', cmd);
    switch (cmd) {
        case 'status':
            raceCtrl.start();
            break;
        case 'start':
            raceCtrl.start();
            break;
        case 'stop':
            raceCtrl.stop();
            break;
        case 'reset':
            raceCtrl.reset();
            break;
        case 'enable':
            raceCtrl.enable();
            break;
        case 'disable':
            raceCtrl.disable();
            break;
        default:
            console.log('Unknown CLI command');
    }
}

function main() {

    cli.on('line', function(line) {
        if (line != '') {
            cli_handler(line);
        }
    });

    raceCtrl.init();
}

// Main application entry point
main();
