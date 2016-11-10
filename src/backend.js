var request = require('request');

function Backend(addr, url) {
    this.addr = addr;
    this.url = url;
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

module.exports = Backend;
