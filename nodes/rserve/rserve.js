/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// If you use this as a template, update the copyright with your own name.

// Sample Node-RED node file


module.exports = function (RED) {
    "use strict";
    // require any external libraries we may need....
    //var foo = require("foo-library");

    var rio = require("rio");
    var path = require("path");
    var Docker = require('dockerode');

    var args = {};

    args.prods = ["IBM", "MSFT"];
    args.referenceDate = "Sat, 06 Aug 2011 12:00:00 GMT";
    // args.targetReturn = undefined;
    args.lows = [0, 0];
    args.highs = [1, 1];

    // The main node definition - most things happen in here
    function rserveNode(n) {
        // Create a RED node
        RED.nodes.createNode(this, n);

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;



        buildAndDeploy(node);


        // respond to inputs....
        this.on('input', function (msg) {
            //node.warn("I saw a payload: "+msg.payload);
            // in this example just send it straight on... should process it here really
            //node.send(msg);

            getOptimalPortfolio(args, function (res) {
                var i;

                console.log(res.message);

                node.send(res);
            }, {
                host: "127.0.0.1"
            });

        });

        this.on("close", function () {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();


        });
    }


    function getOptimalPortfolio(params, callback, config) {
        var cfg = {
            filename: path.join(__dirname, "ex2.R"),
            entrypoint: "getOptimalPortfolio",
            data: params
        };

        if (config) {
            cfg.host = "127.0.0.1";
            cfg.port = "6311";
            cfg.user = config.user;
            cfg.password = config.password;
        }

        cfg.callback = function (err, res) {
            var mess, ans = {};

            if (!err) {
                ans = JSON.parse(res);
            } else {
                mess = "Rserve call failed";
                ans.message = mess;
            }

            callback(ans);
        };

        rio.e(cfg);
    }


    //Create docker client
    var docker;

    function buildAndDeploy(node) {
        docker = new Docker({
            host: "127.0.0.1",
            port: "2376"
        });
        docker.pull("gebele/rserve", function (err, stream) {
            if (stream !== null) {
                stream.pipe(process.stdout, {
                    end: true
                });
                stream.on('end', function () {
                    createContainerAndStart(node);
                });
            } else {
                createContainerAndStart(node);
            }
        });
    }


    function createContainerAndStart(node) {
        //Create a container from an image
        var port = '{ "6311/tcp" : [{ "HostIP":"0.0.0.0", "HostPort": "6311" }]}';

        var options = {
            Image: "gebele/rserve",
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/sh', '-c', ''],
            OpenStdin: false,
            StdinOnce: false,
            ExposedPorts: {
                "8000/tcp": {},
            }
        };
        options.HostConfig = {};
        options.HostConfig.PortBindings = JSON.parse(port);

        docker.createContainer(options).then(function (container) {

            return container.start({}, function (err, data) {
                runExec(container, 'echo "install.packages(\\"tseries\\", repos=\\"http://cran.us.r-project.org\\")" | R --save ; echo "install.packages(\\"RJSONIO\\", repos=\\"http://cran.us.r-project.org\\")" | R --save');
            });

        }).catch(function (err) {
            console.log(err);
        });


    }


    function runExec(container, command) {

        var options = {
            Cmd: ['sh', '-c', command],
            Env: ['VAR=ttslkfjsdalkfj'],
            AttachStdout: true,
            AttachStderr: true
        };

        container.exec(options, function (err, exec) {
            if (err) return;
            exec.start(function (err, stream) {
                if (err) return;

                container.modem.demuxStream(stream, process.stdout, process.stderr);

                exec.inspect(function (err, data) {
                    if (err) return;
                    console.log(data);
                });
            });
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("rserve", rserveNode);

}