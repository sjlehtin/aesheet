#!/usr/bin/env python
import os
import sys

project_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(project_dir)
sys.path.append(os.path.dirname(project_dir))

os.environ['DJANGO_SETTINGS_MODULE'] = 'aesheet.settings'
os.environ['ROOT_URL'] = '/ae/sheet/'
os.environ['PRODUCTION'] = '1'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
