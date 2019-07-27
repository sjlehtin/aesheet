## What is this?

[![Build Status](https://travis-ci.org/sjlehtin/aesheet.svg?branch=master)](https://travis-ci.org/sjlehtin/aesheet)

## Installing

### In production use

requires "auth" file with the database access credentials.
requires "secret" file with the secret key used for Django sessions etc.

Directories 
 
* logs/
* devlogs/

need to exist and be owned by www-data.

## Administering

*out of date, update update.sh and instructions for pipenv usage*

Regenerate `requirements.txt` and `dev-requirements.txt`

```
 % pipenv lock -r > requirements.txt
 % pipenv lock --dev -r > dev-requirements.txt
```

## Using the docker images

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
