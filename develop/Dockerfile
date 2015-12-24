FROM node
MAINTAINER Ryan Creasey "tarei@goonfleet.com"

ADD . /src
WORKDIR /src

RUN npm install

ENV NODE_ENV staging
ENV PORT 5000
ENV COOKIE_SECRET changeme
ENV SESSION_SECRET changeme

ENV CROWD_AUTHTOKEN changeme
ENV CROWD_PASSWORD changeme
ENV CROWD_USERNAME changeme

ENV MONGO_URL changeme

EXPOSE 5000

CMD ["$PORT"]
ENTRYPOINT ["node", "server", "$PORT"]
