FROM node:22.13.0 as build

USER root

RUN apt-get update

WORKDIR /syds_frontend

COPY syds_frontend/package.json ./package.json
COPY syds_frontend/package-lock.json ./package-lock.json

RUN npm install