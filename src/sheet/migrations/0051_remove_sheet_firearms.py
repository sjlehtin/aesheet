# Generated by Django 4.2.2 on 2023-07-12 00:20

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0050_populate_sheetfirearm"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="sheet",
            name="firearms",
        ),
    ]
