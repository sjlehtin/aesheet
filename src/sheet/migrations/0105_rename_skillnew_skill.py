# Generated by Django 5.0.6 on 2024-07-18 14:43

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0104_remove_basefirearm_skill_remove_basefirearm_skill2_and_more"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="SkillNew",
            new_name="Skill",
        ),
    ]