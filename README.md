## What is this?

[![Build Status](https://travis-ci.org/sjlehtin/aesheet.svg?branch=master)](https://travis-ci.org/sjlehtin/aesheet)

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

#### Using with supervisor

Using the supervisor.conf.tmpl in the package, generate a
`/etc/supervisor/conf.d/${program}` config by running

```
 % cat supervisor.conf.template | PROGRAM=sheet WORKDIR=$PWD envsubst \
    > /etc/supervisor/conf.d/sheet
```

## Administering

*out of date, update update.sh and instructions for pipenv usage*

Regenerate `requirements.txt` and `dev-requirements.txt`

```
 % pipenv lock -r > requirements.txt
 % pipenv lock --dev -r > dev-requirements.txt
```

## Using the docker images

Nuke traces of old containers:

```
docker-compose down --remove-orphans --volumes
```

### On update

After updating sources, run

```
 % ./update.sh
 % supervisorctl reload (sheet|devsheet)
```

#### Updating python packages

```
 % pip install -U -r requirements.txt
```

and run update.sh as above.

#### Updating npm packages

```
 % npm install
```

and run update.sh as above.

## Developing
### Running tests

```
 % python manage.py test
 % npm test
 % cd sheet/tests && pybot tests.robot  # not functional yet.
```
