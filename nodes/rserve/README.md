# RServe

This node can be used to execute R scripts on a remote container (using RServe).

The node is responsible for:
* creating and starting a docker container (using the docker remote api) with RServe and pandoc set up
* Installing the dependencies required to run the R script
* Executing the R script and retrieve the result

![alt text](https://raw.github.com/SINTEF-9012/mc-suite_node-red/master/documents/rserve.png "RServe")

The node has the following properties:
* Name: the name of the node
* Endpoint: the IP of the docker engine
* Path to R script: the path to the R script to be executed in the docker container
* Path to inputs for R script: the path to a file containing the inputs for the R script
* Inputs for R script as text: the inputs for the R script
* Entrypoint: the method to be called in the R script
