# Generated by Django 5.0.6 on 2025-07-03 21:08

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0117_edgelevel_all_checks_mod"),
    ]

    operations = [
        migrations.AddField(
            model_name="armorquality",
            name="mod_hear",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="armorquality",
            name="mod_smell",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="armorquality",
            name="mod_surprise",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="armorquality",
            name="mod_swim",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="armorquality",
            name="mod_vision",
            field=models.IntegerField(default=0),
        ),
    ]
