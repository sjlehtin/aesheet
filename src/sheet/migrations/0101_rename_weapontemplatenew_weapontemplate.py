# Generated by Django 5.0.6 on 2024-07-17 17:19

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0100_rename_rangedweapontemplatenew_rangedweapontemplate"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="WeaponTemplateNew",
            new_name="WeaponTemplate",
        ),
    ]
