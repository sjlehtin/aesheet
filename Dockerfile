FROM node:22-slim as react
WORKDIR /usr/src/app
COPY react ./react
COPY package*.json ./
COPY webpack.config.js ./

RUN mkdir -p ./npmbuild/react/static

RUN npm install
RUN npm run build -- --mode production


FROM python:3.12-slim-bookworm as python-build

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /opt/aesheet

RUN apt update && apt install -y libpq-dev gcc
RUN python -m venv /opt/aesheet/venv

ENV PATH="/opt/aesheet/venv/bin:$PATH"

COPY src ./src
COPY manage.py .
COPY settings.py .
COPY setup.py .
COPY Manifest.in .

RUN pip install --upgrade pip
RUN pip install -e .


FROM python:3.12-slim-bookworm

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# set work directory
WORKDIR /opt/aesheet

RUN apt update && apt install -y libpq-dev

RUN mkdir -p ./npmbuild/static/react

COPY --from=react /usr/src/app/npmbuild/static/react ./npmbuild/static/react
COPY --from=python-build /opt/aesheet/venv /opt/aesheet/venv

# copy project
COPY src ./src
COPY manage.py .
COPY settings.py .
COPY setup.py .
COPY Manifest.in .

ENV PATH="/opt/aesheet/venv/bin:$PATH"

COPY entrypoint.sh .

ENTRYPOINT ["/opt/aesheet/entrypoint.sh"]
