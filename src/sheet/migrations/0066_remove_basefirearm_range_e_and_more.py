# Generated by Django 5.0.6 on 2024-07-11 13:14

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0065_alter_skill_powered_fit_mod_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_e",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_l",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_m",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_pb",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_s",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_vs",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_xl",
        ),
        migrations.RemoveField(
            model_name="basefirearm",
            name="range_xs",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="range_e",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="range_pb",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="range_vs",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="range_xl",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="range_xs",
        ),
        migrations.RemoveField(
            model_name="rangedweapontemplate",
            name="weapon_type",
        ),
    ]