# Generated by Django 5.0.6 on 2024-07-20 09:59

from django.db import migrations

def skills(apps, schema_editor):
    Skill = apps.get_model('sheet', "Skill")

    for skill in Skill.objects.all():
        if skill.name == "Climbing":
            skill.affected_by_armor_mod_climb = True
            skill.save()
        elif skill.name == "Stealth":
            skill.affected_by_armor_mod_stealth = True
            skill.save()
        elif skill.name == "Concealment":
            skill.affected_by_armor_mod_conceal = True
            skill.save()
        elif skill.name == "Swimming":
            skill.affected_by_armor_mod_swim = True
            skill.save()


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0109_armortemplate_mod_swim"),
    ]

    operations = [
        migrations.RunPython(skills,
                             reverse_code=migrations.RunPython.noop),
    ]