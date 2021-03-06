# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2015-12-27 02:53
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0002_character_notes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='edgelevel',
            name='skill_bonuses',
            field=models.ManyToManyField(blank=True, through='sheet.EdgeSkillBonus', to='sheet.Skill'),
        ),
        migrations.AlterField(
            model_name='skill',
            name='required_edges',
            field=models.ManyToManyField(blank=True, to='sheet.Edge'),
        ),
        migrations.AlterField(
            model_name='skill',
            name='required_skills',
            field=models.ManyToManyField(blank=True, to='sheet.Skill'),
        ),
    ]
