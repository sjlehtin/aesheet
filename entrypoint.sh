#!/bin/bash

set -euo pipefail

python manage.py migrate

if [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_NAME" ]; then
  python manage.py createsuperuser --no-input --username "$DJANGO_SUPERUSER_NAME" || echo "Admin not created."
fi

exec "$@"
