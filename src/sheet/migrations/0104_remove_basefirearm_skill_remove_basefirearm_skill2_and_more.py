# Generated by Django 5.0.6 on 2024-07-18 14:36

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0103_weapon_required_skills"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="basefirearm",
            name="skill",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="skill2",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="skill",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="skill2",
        ),
        migrations.RemoveField(
            model_name="weapontemplate",
            name="skill",
        ),
        migrations.RemoveField(
            model_name="weapontemplate",
            name="skill2",
        ),
    ]
