require(rmarkdown)
require(RJSONIO)

display <- function (symbol) {
    write(symbol, file = "data")
    result <- rmarkdown::render("data")
    rawHTML <- paste(readLines(result), collapse="\n")
    return(toJSON(rawHTML))
}
