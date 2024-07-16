# Generated by Django 5.0.6 on 2024-07-16 10:03

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0084_alter_characterskill_options_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="characterskill",
            options={"ordering": ("skill__name",)},
        ),
        migrations.RenameField(
            model_name="characterskill",
            old_name="skill_new",
            new_name="skill",
        ),
        migrations.AlterUniqueTogether(
            name="characterskill",
            unique_together={("character", "skill")},
        ),
    ]