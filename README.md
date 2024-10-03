## What is this?

AESheet renders a character sheet for the Advanced Engine (house rules system based originally on TSR's Amazing Engine).

## Features

Calculates effects from stats, edges, flaws, encumbrance, armor and
wounding to skill and weapon checks.

See new features from the Changelog.

### Implementation

The most intensive page or the character sheet, is pretty much
completely written with the React JS framework, allowing for a
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

##### On build host

```bash
tox
npm test
npm run build -- --mode=production
python setup.py bdist_wheel
python manage.py collectstatic --noinput --clear
gtar zcvf aesheet-0.11-full.tar.xz static/ dist/aesheet-0.11-py3-none-any.whl
```

##### On application server

Take a backup of your database, e.g.,

```shell
sudo -i -u postgres pg_dump -F c -b -v sheetdb > dump.dump
```

Check `settings.py` for need of changes due to upgrades or configuration changes.

Update outdated python packages `pip list --outdated` 

```sh
sudo cp -a ~/aesheet-0.11.0/static .
sudo ve/bin/pip install -U ~sjl/aesheet-0.11.0/aesheet-0.11.0-py3-none-any.whl
sudo -u www-data bash -c "source ./env && django-admin migrate"
```

```shell
sudo systemctl restart aesheet.<env>
```

## Using the Docker images

Create containers

```zsh
docker-compose build
docker-compose up -d
```

Create the superuser

```zsh
docker-compose -f docker-compose.yml exec web python manage.py createsuperuser
```


Add standard rules package
```zsh
docker-compose -f docker-compose.yml exec web python manage.py loaddata basedata
```

Alternately, setup database from a previous dump

```zsh 
docker compose exec -T db pg_restore -c --no-owner -d $POSTGRES_DB --role $POSTGRES_USER -U $POSTGRES_USER -v <  dump.dump
```

Run migrations manually

```zsh
docker compose exec -e DJANGO_SETTINGS_MODULE=settings -e PYTHONPATH=/opt/aesheet web  django-admin migrate
```

The sheet is now usable in `http://localhost:8001/`.

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
