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
            if (error) {
                console.log('Backend: Error ' + body)
            }
        }
    );
}

module.exports = Backend;
