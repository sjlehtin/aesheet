# Generated by Django 5.0.6 on 2024-07-16 09:46

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0082_rename_basefirearmnew_basefirearm"),
    ]

    operations = [
        migrations.AlterField(
            model_name="characterskill",
            name="skill_new",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="sheet.skillnew"
            ),
        ),
    ]