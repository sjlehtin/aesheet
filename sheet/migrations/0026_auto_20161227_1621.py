# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2016-12-27 16:21
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0025_auto_20161226_2206'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ammunition',
            name='bullet_type',
            field=models.CharField(help_text='Make of the ammo, such as full metal jacket.', max_length=20),
        ),
    ]
