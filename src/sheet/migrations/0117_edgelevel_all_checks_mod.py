# Generated by Django 5.0.6 on 2025-06-30 20:10

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0116_armorspecialquality_mana_armorspecialquality_stamina_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="edgelevel",
            name="all_checks_mod",
            field=models.IntegerField(default=0),
        ),
    ]
