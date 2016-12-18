# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-12-15 17:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0023_auto_20161212_1207'),
    ]

    operations = [
        migrations.AddField(
            model_name='armorspecialquality',
            name='hear',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general hearing INT check'),
        ),
        migrations.AddField(
            model_name='armorspecialquality',
            name='smell',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general smell & taste INT check'),
        ),
        migrations.AddField(
            model_name='armorspecialquality',
            name='surprise',
            field=models.IntegerField(default=0, help_text=b'Modifier for the surprise check'),
        ),
        migrations.AddField(
            model_name='armorspecialquality',
            name='vision',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general vision INT check'),
        ),
        migrations.AddField(
            model_name='edgelevel',
            name='hear',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general hearing INT check'),
        ),
        migrations.AddField(
            model_name='edgelevel',
            name='smell',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general smell & taste INT check'),
        ),
        migrations.AddField(
            model_name='edgelevel',
            name='surprise',
            field=models.IntegerField(default=0, help_text=b'Modifier for the surprise check'),
        ),
        migrations.AddField(
            model_name='edgelevel',
            name='vision',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general vision INT check'),
        ),
        migrations.AddField(
            model_name='transienteffect',
            name='hear',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general hearing INT check'),
        ),
        migrations.AddField(
            model_name='transienteffect',
            name='smell',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general smell & taste INT check'),
        ),
        migrations.AddField(
            model_name='transienteffect',
            name='surprise',
            field=models.IntegerField(default=0, help_text=b'Modifier for the surprise check'),
        ),
        migrations.AddField(
            model_name='transienteffect',
            name='vision',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general vision INT check'),
        ),
        migrations.AddField(
            model_name='weaponspecialquality',
            name='hear',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general hearing INT check'),
        ),
        migrations.AddField(
            model_name='weaponspecialquality',
            name='smell',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general smell & taste INT check'),
        ),
        migrations.AddField(
            model_name='weaponspecialquality',
            name='surprise',
            field=models.IntegerField(default=0, help_text=b'Modifier for the surprise check'),
        ),
        migrations.AddField(
            model_name='weaponspecialquality',
            name='vision',
            field=models.IntegerField(default=0, help_text=b'Modifier for the general vision INT check'),
        ),
    ]
