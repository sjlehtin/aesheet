# Generated by Django 5.0.6 on 2024-07-16 02:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0078_primary_key_schema_change"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="basefirearm",
            name="ammunition_types",
        ),
        migrations.RemoveField(
            model_name="firearmammunitiontype",
            name="firearm",
        ),
        migrations.RemoveField(
            model_name="sheet",
            name="firearms",
        ),
        migrations.AlterField(
            model_name="firearmammunitiontype",
            name="firearm_new",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="sheet.basefirearmnew"
            ),
        ),
        migrations.AlterField(
            model_name="sheetfirearm",
            name="base_new",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="sheet.basefirearmnew"
            ),
        ),
        migrations.RemoveField(
            model_name="sheetfirearm",
            name="base",
        ),
    ]
