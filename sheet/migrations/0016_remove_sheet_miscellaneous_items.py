# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-11-07 23:27
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0015_miscellaneous_items_to_sheetmiscellaneousitems'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sheet',
            name='miscellaneous_items',
        ),
    ]
