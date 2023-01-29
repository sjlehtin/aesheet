# pull official base image
FROM python:3.11-alpine

# set work directory
WORKDIR /usr/src/aesheet

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add postgresql-dev gcc python3-dev musl-dev \
    && apk add npm

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

# copy project
COPY . .
