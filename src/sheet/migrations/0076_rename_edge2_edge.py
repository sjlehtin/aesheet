# Generated by Django 5.0.6 on 2024-07-14 15:33

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0075_delete_edge"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="Edge2",
            new_name="Edge",
        ),
    ]
