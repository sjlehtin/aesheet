#!/bin/sh

sourcedir=$1

if [ -z "$sourcedir" ]; then
  echo "Provide sourcedir"
fi

sudo cp -a "$sourcedir"/static .
sudo ve/bin/pip install -U "$sourcedir"/aesheet-*-py3-none-any.whl
sudo -u www-data bash -c "source ./env && django-admin migrate"
[ -x ./restart.sh ] && sudo ./restart.sh
