#!/bin/sh

npm run build -- --mode=production
python setup.py bdist_wheel
python manage.py collectstatic --noinput --clear

version=$(jq -r .version package.json)

gtar zcv --transform='s|^|'"aesheet-${version}"'/|' -f "aesheet-${version}-full.tar.xz" static/ -C  dist "aesheet-${version}-py3-none-any.whl"

