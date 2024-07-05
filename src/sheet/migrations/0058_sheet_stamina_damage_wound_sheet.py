# Generated by Django 5.0.6 on 2024-07-01 20:32

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0057_edgelevel_armor_dr_edgelevel_armor_l"),
    ]

    operations = [
        migrations.AddField(
            model_name="sheet",
            name="stamina_damage",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="wound",
            name="sheet",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="wounds",
                to="sheet.sheet",
            ),
        ),
    ]