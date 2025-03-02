FROM python:3.9.13

RUN apt update && apt upgrade -y
RUN apt-get update && apt-get install -y ffmpeg
RUN apt-get install iputils-ping -y

WORKDIR /syds_backend

COPY syds_backend/requirements.txt .
RUN pip uninstall -y -r requirements.txt --no-cache-dir
RUN pip install -r requirements.txt --no-cache-dir

ADD syds_backend/ ./src
ADD syds_backend/ ./tests