module.exports = function (RED) {
    "use strict";

    var crypto = require("crypto");
	
	// Uses for the Cloud API
    var https = require('https');
	
	// Used for the Local (RestStreaming)
	var http = require('http');

    function savvyNode(n) {
        // Create a RED node
        RED.nodes.createNode(this, n);

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;
        this.endpoint = n.endpoint;
        this.returntype = n.returntype;
        this.apitype = n.apitype;
        this.port = n.port;
        this.key = n.key;
        this.secret = n.secret;
        this.target = n.target;
        this.locationid = n.locationid;
        this.machineid = n.machineid;
        this.groupid = n.groupid;
        this.cncmanufacturer = n.cncmanufacturer;

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        // respond to inputs....
        this.on('input', function (msg) {
			
            var method = computeEndpoint(node);

            sendGet(msg, method, node, function (res) {
				
		console.log("Callback sendGet");
                var msg = {};
		switch(node.returntype) {
			case "utf-8":
				msg.payload = res;
				break;
			case "json":
				msg.payload = JSON.parse(res);
				break;
		}
				
		// Send the CNC manufacturer as msg parameter
		msg.cncmanufacturer = node.cncmanufacturer;
                node.send(msg);
            });
        });

        this.on("close", function () {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }

    function computeEndpoint(node) {
        var ep = "";
		
		if (node.apitype === 'cloud')
		{
			switch(node.target)
			{
				case "stream":
					ep += "/v1/stream?track=" + node.machineid;
					break;
				case "machines":
					ep += "/v1/locations/" + node.locationid + "/machines";
					break;
				case "indicators":
					ep += "/v1/locations/" + node.locationid + "/machines/" + node.machineid + "/groups/" + node.groupid + "/indicators";
					break;
				case "groups":
					ep += "/v1/locations/" + node.locationid + "/machines/" + node.machineid + "/groups";
					break;
				default:
					ep += "/v1/locations/";
			}
		}
		else if (node.apitype === 'local')
		{
			ep += "/stream?machines=" + node.machineid;
		}
		
        return ep;
    }

    function sendGet(msg, path, node, callback) {
        var epoch = new Date().getTime();
        var auth = generateAuthorization(path, epoch, node.key, node.secret);

		switch(node.apitype) 
		{
			case "cloud":
				var options = {
					host: node.endpoint,
					path: path,
					method: "GET",
					"headers": {
						"Content-Type": "text/plain; charset=UTF-8",
						"X-M2C-Sequence": epoch,
						"Authorization": auth
					}
				};

				// Uses HTTPS
				var req = https.request(options, function (response) {

					var str = ''
					response.on('data', function (chunk) {

						// If we are streaming , we return the chunk itself as the full response is in one chunk
						if (node.target === "stream")
						{	
							// The '' + chunk is added to convert the buffer into a string, and 
							var chunkedData = '' + chunk;
							
							// The result is always on the pos [1] of the splitted chunk. 
							var responseString = chunkedData.split("\r\n")[1];
							
							callback(responseString);
						}					
						else
						{
							str += chunk;
						}					
					});

					response.on('end', function () {
						callback(str);
					});

					response.on('error', function (e) {
						console.log(e);
					});
				});
				break;
				
			// Local restStreaming requires a port and doesn't need extra headers
			case "local":
				var options = {
					host: node.endpoint,
					port: node.port,
					path: path,
					method: "GET",
					"headers": {
						"Content-Type": "text/plain; charset=UTF-8"
					}
				};
			
				// Uses HTTP
				var req = http.request(options, function (response) {

					var str = ''
					response.on('data', function (chunk) {
						console.log("response.on(data): Lanzado");
						try {
							// The '' + chunk is added to convert the buffer into a string
							var responseString = '' + chunk;
							
							// Modify the line breaks to get always a "\r\n"
							var responseArray = responseString.replace("\r", "").replace("\n", "\r\n").split("\r\n")
							
							// Send callback for each line
							responseArray.forEach(function(el) {
								callback(el);
							});
							
						} catch(ex) {
							// When an empty string comes
						}
			
					});

					response.on('end', function () {
						callback(str);
					});

					response.on('error', function (e) {
						console.log(e);
					});
				});
				break;
		}
		
        req.on('error', function (err) {
            console.log("Connection not open " + err);
        });

        req.end();
    }

    function generateAuthorization(loc, epoch, key, secret)
	{
        var Request = "GET" + "\n" + "text/plain; charset=UTF-8" + "\n" + epoch + "\n" + loc;
        var authorization = "M2C" + " " + key + ":" + generateHmac(Request, secret);

        return authorization;
    }

    function generateHmac(data, secret, algorithm, encoding)
	{
        var encoding = encoding || "base64";
        var algorithm = algorithm || "sha1";

        return crypto.createHmac(algorithm, secret).update(data).digest(encoding);
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("savvy", savvyNode);

}

    function computeEndpoint(node) {
        var ep = "";
		
		if (node.apitype === 'cloud')
		{
			switch(node.target)
			{
				case "stream":
					ep += "/v1/stream?track=" + node.machineid;
					break;
				case "machines":
					ep += "/v1/locations/" + node.locationid + "/machines";
					break;
				case "indicators":
					ep += "/v1/locations/" + node.locationid + "/machines/" + node.machineid + "/groups/" + node.groupid + "/indicators";
					break;
				case "groups":
					ep += "/v1/locations/" + node.locationid + "/machines/" + node.machineid + "/groups";
					break;
				default:
					ep += "/v1/locations/";
			}
		}
		else if (node.apitype === 'local')
		{
			ep += "/stream?machines=" + node.machineid;
		}
		
        return ep;
    }

    function sendGet(msg, path, node, callback) {
        var epoch = new Date().getTime();
        var auth = generateAuthorization(path, epoch, node.key, node.secret);

		switch(node.apitype) 
		{
			case "cloud":
				var options = {
					host: node.endpoint,
					path: path,
					method: "GET",
					"headers": {
						"Content-Type": "text/plain; charset=UTF-8",
						"X-M2C-Sequence": epoch,
						"Authorization": auth
					}
				};
				break;
				
			// Local restStreaming requires a port and doesn't need extra headers
			case "local":
				var options = {
					host: node.endpoint,
					port: node.port,
					path: path,
					method: "GET",
					"headers": {
						"Content-Type": "text/plain; charset=UTF-8"
					}
				};
				break;
		}

        var req = https.request(options, function (response) {
			
            var str = ''
            response.on('data', function (chunk) {
			
				// If we are streaming (cloud or local), we return the chunk itself as the full response is in one chunk
				if (node.target === "stream" || node.apitype === 'local')
				{	
					// The '' + chunk is added to convert the buffer into a string, and the result is always on the pos [1] of the splitted chunk. 
					callback(('' + chunk).split("\r\n")[1]);			
				}					
				else
				{
					str += chunk;
				}					
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

    function generateAuthorization(loc, epoch, key, secret)
	{
        var Request = "GET" + "\n" + "text/plain; charset=UTF-8" + "\n" + epoch + "\n" + loc;
        var authorization = "M2C" + " " + key + ":" + generateHmac(Request, secret);

        return authorization;
    }

    function generateHmac(data, secret, algorithm, encoding)
	{
        var encoding = encoding || "base64";
        var algorithm = algorithm || "sha1";

        return crypto.createHmac(algorithm, secret).update(data).digest(encoding);
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("savvy", savvyNode);

}
