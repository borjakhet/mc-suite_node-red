# precompiled pandoc required glibc
FROM frolvlad/alpine-glibc:alpine-3.4
MAINTAINER  Nicolas Ferry

# enable edge repos
RUN sed -i -e 's/v3\.4/edge/g' /etc/apk/repositories
# enable testing
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories

RUN apk update\
    && apk add tar\
    libarchive-tools\
    gmp\
    curl\
    musl-utils\
    build-base\
    R\
    R-dev\
    cairo-dev\
    grep

# install pandoc
RUN curl -Lsf 'https://github.com/jgm/pandoc/releases/download/1.17.2/pandoc-1.17.2-1-amd64.deb'\
    | bsdtar xOf - data.tar.gz\
    | tar xvz --strip-components 2 -C /usr/local

RUN R -e 'install.packages("caret", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("pls", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("randomForest", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("gridExtra", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("doMC", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("Rserve", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("stringi", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("iterators", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("foreach", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'
RUN R -e 'install.packages("ggplot2", repos="https://stat.ethz.ch/CRAN/",dependencies=TRUE)'

EXPOSE 6311
ENTRYPOINT R -e "Rserve::run.Rserve(remote=TRUE)"
#CMD ["R", "CMD", "Rserve"]