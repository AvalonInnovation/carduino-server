var request = require('request');

function Backend(config) {
    this.host = config.host;
    this.url = config.url;
}

Backend.prototype.send = function(data) {
    request.post(
        'http://' + this.host + this.url, {
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
