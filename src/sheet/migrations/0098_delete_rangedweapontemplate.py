# Generated by Django 5.0.6 on 2024-07-17 16:51

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0097_rename_base_new_rangedweapon_base"),
    ]

    operations = [
        migrations.DeleteModel(
            name="RangedWeaponTemplate",
        ),
    ]
