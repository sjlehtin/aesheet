# Generated by Django 5.0.6 on 2024-07-20 09:29

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0108_skill_affected_by_armor_mod_climb_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="armortemplate",
            name="mod_swim",
            field=models.IntegerField(default=0),
        ),
    ]