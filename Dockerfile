# pull official base image
FROM python:3.11-alpine

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add postgresql-dev gcc python3-dev musl-dev \
    && apk add npm

COPY ./package*.json /tmp
RUN cd /tmp && npm install
RUN mkdir -p /opt/aesheet && cp -a /tmp/node_modules /opt/aesheet/

# set work directory
WORKDIR /opt/aesheet

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

# copy project
COPY . .

ENTRYPOINT ["/opt/aesheet/entrypoint.sh"]
