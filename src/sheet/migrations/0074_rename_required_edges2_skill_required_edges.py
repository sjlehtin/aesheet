# Generated by Django 5.0.6 on 2024-07-14 15:29

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0073_remove_skill_required_edges"),
    ]

    operations = [
        migrations.RenameField(
            model_name="skill",
            old_name="required_edges2",
            new_name="required_edges",
        ),
    ]
