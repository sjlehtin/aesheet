## What is this?

[![Build Status](https://travis-ci.org/sjlehtin/aesheet.svg?branch=master)](https://travis-ci.org/sjlehtin/aesheet)

## Features

Calculates effects from stats, edges, flaws, encumbrance, armor and
wounding to skill and weapon checks.

See new features from the Changelog.

### Implementation

The most intensive page or the character sheet, is pretty much
completely written with the React JS framework, allowing for a fairly
responsive page. The backend for the sheet are REST APIs written with
Django Rest Framework.

### Rules

The ruleset is pretty much fully homegrown fork of the Amazing Engine.
Nowadays only thing left is the stat names and some concepts, with
skills being brought into the system either from house rules or
or the d20 system, adapted here. Licensing situation of the rules is
not entirely clear, but the data should be ok to use for non-commercial
purposes.

## In the roadmap

Full list of all todo items in the TODO.

## Installing

### In production use

#### Deploying

Add an `auth` file with the database access credentials as
whitespace-separated pair.

Generate a "secret" file with the secret key used for Django sessions and
the like. Do not checkin to version control or disclose.

#### pipenv in production

Create virtualenv in project directory

```
 % PIPENV_VENV_IN_PROJECT=1 pipenv --python python3.5 install
```

#### nginx configuration

Using the supervisor.conf.tmpl in the package, generate a
`/etc/nginx/sites-available/${program}` config by running

```
 % cat nginx.conf.template | \
    SERVERNAME=devsheet.liskot.org TAG=dev PROJECTDIR=$PWD \
    envsubst '${PROJECTDIR},${TAG},${SERVERNAME}' \
    > /etc/nginx/sites-available/devsheet
```

#### Using with supervisor

Using the supervisor.conf.tmpl in the package, generate a
`/etc/supervisor/conf.d/${program}` config by running

```
 % cat supervisor.conf.template | PROGRAM=sheet WORKDIR=$PWD envsubst \
    > /etc/supervisor/conf.d/sheet
```

## Administering

### On update

After updating sources, run

```
 % npm install
 % . .venv/bin/activate
 % pipenv install
 % ./node_modules/.bin/webpack --mode production
 % python manage.py migrate
 % python manage.py collectstatic -l -i node_modules
 % sudo supervisorctl reload sheet
```

If nginx configuration needed to be updated, you also need to reload nginx configuration.


```
 % sudo systemctl reload nginx
```

After updating sources, run

```
 % ./update.sh
 % supervisorctl reload (sheet|devsheet)
```

## Using the Docker images

Nuke traces of old containers:

```
docker-compose down --remove-orphans --volumes
```

## Developing
### Running tests

```
 % python manage.py test
 % npm test
 % cd sheet/tests && pybot tests.robot  # not functional yet.
```
