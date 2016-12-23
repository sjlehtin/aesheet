#!/bin/sh

set -e
set -x

. ve/bin/activate

python manage.py migrate

./node_modules/.bin/webpack

yes yes | python manage.py collectstatic --ignore node_modules

# sudo supervisorctl restart devsheet
