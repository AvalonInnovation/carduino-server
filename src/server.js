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
        case 'STATUS':
            raceCtrl.start();
            break;
        case 'START':
            raceCtrl.start();
            break;
        case 'STOP':
            raceCtrl.stop();
            break;
        case 'RESET':
            raceCtrl.reset();
            break;
        case 'ENABLE':
            raceCtrl.enable();
            break;
        case 'DISABEL':
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
