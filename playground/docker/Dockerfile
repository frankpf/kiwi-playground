FROM nimlang/nim:1.2.0-ubuntu

RUN apt-get install -y curl git
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

WORKDIR /build
ADD https://api.github.com/repos/frankpf/kiwi/git/refs/heads/main /tmp/bustcache
RUN git clone --single-branch --branch main https://github.com/frankpf/kiwi.git
RUN cd kiwi
WORKDIR /build/kiwi
RUN npm i && npm run-script tsc || true
RUN cd vm && nimble build --y

WORKDIR /playground
RUN mkdir /usercode

