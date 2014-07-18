FROM phusion/baseimage
MAINTAINER Ryan Creasey "ryan@infern.al"

RUN apt-get update && apt-get clean
RUN apt-get install -q -y nodejs npm git && apt-get clean

ADD . /src
RUN cd /src; npm install

ENV PORT 5000
ENV COOKIE_SECRET dongues
ENV SESSION_SECRET buttes
ENV STORAGE_MODE memory

WORKDIR /src
CMD ["$PORT"]
ENTRYPOINT ["nodejs", "server.js"]

EXPOSE 5000
