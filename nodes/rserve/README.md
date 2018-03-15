# RServe

This node can be used to execute R scripts on a remote container (using RServe).

The node is responsible for:
* creating and starting a docker container (using the docker remote api) with RServe and pandoc set up
* Installing the dependencies required to run the R script
* Executing the R script and retrieve the result

![alt text](https://raw.github.com/SINTEF-9012/mc-suite_node-red/master/documents/rserve.png "RServe")

The node has the following properties:
* Name:
* Endpoint:
* Path to R script:
* Path to inputs for R script:
* Inputs for R script as text:
* Entrypoint:
