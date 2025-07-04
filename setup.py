#!/usr/bin/env python
import setuptools

setuptools.setup(name='aesheet',
                 version='0.31.0a1',
                 python_requires=">=3.8",
                 install_requires=["Django",
                                   "django-widget-tweaks",
                                   "djangorestframework",
                                   "chardet",
                                   "Pillow",
                                   "psycopg2"],
                 extras_require={"dev": ["build", "pytest", "pytest-django",
                                         "django-webtest", "tox",
                                         "factory_boy"]},
                 packages=setuptools.find_packages(where="src"),
                 package_dir={"": "src"},
                 package_data={"": ["templates/*/*.html", "templates/*.html"]},
                 scripts=['manage.py'])
