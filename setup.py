#!/usr/bin/env python
import setuptools

setuptools.setup(name='aesheet',
                 version='0.10',
                 install_requires=["Django==2.2",
                                   "django-widget-tweaks",
                                   "djangorestframework",
                                   "chardet",
                                   "Pillow",
                                   "psycopg2"],
                 extras_require={"dev": ["wheel", "pytest", "pytest-django",
                                         "django-webtest", "factory_boy"]},
                 packages=setuptools.find_packages(where="src"),
                 package_dir={"": "src"},
                 package_data={"": ["templates/*/*.html", "templates/*.html"]},
                 scripts=['manage.py'])
