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

TODO

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
 % npx webpack --mode production
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

TODO: rule dump to root

Create containers

```zsh
docker-compose -f docker-compose.yml up -d --build
```

Setup database

```zsh 
docker-compose -f docker-compose.yml exec web python manage.py migrate --noinput
```

Create the superuser

```zsh
docker-compose -f docker-compose.yml exec web python manage.py createsuperuser
```

Build web assets

```zsh
docker-compose -f docker-compose.yml exec web npm run build -- --mode=development
```

Collect static web assets

```zsh
docker-compose -f docker-compose.yml exec web python manage.py collectstatic --noinput --clear
```

Add standard rules package
```zsh
docker-compose -f docker-compose.yml exec web python manage.py loaddata basedata
```

The sheet is now usable in `http://localhost:8000/`.

### Starting over


```zsh
docker-compose down -v
```

### Running tests

```
 % python manage.py test
 % npm test
 % cd sheet/tests && pybot tests.robot  # not functional yet.
```
