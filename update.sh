#!/bin/sh

set -e

. ve/bin/activate

python manage.py migrate
(cd sheet/static/react && ./node_modules/.bin/webpack)
yes | python manage.py collectstatic --ignore node_modules

# sudo supervisorctl restart devsheet
