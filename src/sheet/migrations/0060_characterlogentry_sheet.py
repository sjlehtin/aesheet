# Generated by Django 5.0.6 on 2024-07-01 23:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0059_wounds_to_sheet"),
    ]

    operations = [
        migrations.AddField(
            model_name="characterlogentry",
            name="sheet",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="sheet.sheet",
            ),
        ),
    ]
