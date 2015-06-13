FROM node:onbuild

ENV CONSUELA=enabled
ENV CROWD_GROUPS=true
ENV CROWD_PASSWORD=PaYJEHQQnDuZ8FdgN6fv
ENV CROWD_URL=https://crowd.goonfleet.com/crowd/
ENV CROWD_USERNAME=standingfleet
ENV NODE_ENV=development
ENV PORT=5000
ENV SESSION_SECRET=bowlsofdick
ENV MONGODB_URL=mongodb://db/standing-fleet
ENV MEMCACHE_SERVERS=cache:11211

EXPOSE 5000
