# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-02-07 23:00
from __future__ import unicode_literals

from django.db import migrations

def forwards(apps, schema_editor):
    SpellEffect = apps.get_model('sheet', 'SpellEffect')
    TransientEffect = apps.get_model('sheet', 'TransientEffect')
    TechLevel = apps.get_model('sheet', 'TechLevel')

    frp = TechLevel.objects.filter(name='FRP')
    if not frp:
        return
    frp = frp[0]

    for sp in SpellEffect.objects.all():
        te = TransientEffect()
        for field in  sp._meta.concrete_fields:
            setattr(te, field.name, getattr(sp, field.name))
        te.tech_level = frp
        te.save()
        sp.delete()
        print("Updated spell {} to transient effect".format(te.name))


class Migration(migrations.Migration):

    dependencies = [
        ('sheet', '0010_auto_20160207_1647'),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=migrations.RunPython.noop)
    ]
