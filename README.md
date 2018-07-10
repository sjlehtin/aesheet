## What is this?

## Installing

### In production use

requires "auth" file with the database access credentials.
requires "secret" file with the secret key used for Django sessions etc.

Directories 
 
* logs/
* devlogs/

need to exist and be owned by www-data.

## Administering

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
