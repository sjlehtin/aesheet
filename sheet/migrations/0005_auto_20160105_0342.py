# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-01-05 03:42
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0004_auto_20160101_0317'),
    ]

    operations = [
        migrations.CreateModel(
            name='InventoryEntry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('description', models.CharField(max_length=100)),
                ('location', models.CharField(blank=True, help_text=b'Indicate where the item(s) is stored', max_length=30)),
                ('unit_weight', models.DecimalField(decimal_places=3, default=1, help_text=b'Item weight in kilograms', max_digits=6)),
                ('order', models.IntegerField(default=0, help_text=b'explicit ordering for the entries')),
                ('sheet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_entries', to='sheet.Sheet')),
            ],
            options={
                'ordering': ('order',),
            },
        ),
        migrations.AlterField(
            model_name='character',
            name='private',
            field=models.BooleanField(default=False, help_text=b'If set, access to the character will be denied for other users. The character will also be hidden in lists.  As a rule of thumb, only the GM should mark characters as private.'),
        ),
    ]
