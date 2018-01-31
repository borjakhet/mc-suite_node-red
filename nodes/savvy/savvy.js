module.exports = function (RED) {
    "use strict";


    var crypto = require("crypto");
    var http = require('https');

    function savvyNode(n) {
        // Create a RED node
        RED.nodes.createNode(this, n);

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;
        this.endpoint = n.endpoint;

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        // respond to inputs....
        this.on('input', function (msg) {

            sendGet(this.endpoint, function (res) {
                var msg = {};
                msg.payload = res;
                node.send(msg);
            });

        });

        this.on("close", function () {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }


    function sendGet(path, callback) {
        var epoch = new Date().getTime();
        var auth = generateAuthorization(path, epoch);

	//TODO: get host from configuration
        var options = {
            host: "XXXX",
            path: path,
            method: "GET",
            "headers": {
                "Content-Type": "text/plain; charset=UTF-8",
                "X-M2C-Sequence": epoch,
                "Authorization": auth
            }
        };

        var req = http.request(options, function (response) {
            var str = ''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                callback(str);
            });

            response.on('error', function (e) {
                console.log(e);
            });

        });

        req.on('error', function (err) {
            console.log("Connection not open " + err);

        });

        req.end();
    }



    function generateAuthorization(loc, epoch) {
        var Request = "GET" + "\n" + "text/plain; charset=UTF-8" + "\n" + epoch + "\n" + loc;

	//TODO: get credentials from configuration
        var authorization = "M2C" + " " + "XXX" + ":" + generateHmac(Request, "XXX");

        return authorization;
    }


    function generateHmac(data, key, algorithm, encoding) {
        var encoding = encoding || "base64";
        var algorithm = algorithm || "sha1";
        return crypto.createHmac(algorithm, key).update(data).digest(encoding);
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("savvy", savvyNode);

}
