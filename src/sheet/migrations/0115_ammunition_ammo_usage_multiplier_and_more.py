# Generated by Django 5.0.6 on 2025-04-07 18:56

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0114_alter_ammunition_cartridge_weight"),
    ]

    operations = [
        migrations.AddField(
            model_name="ammunition",
            name="ammo_usage_multiplier",
            field=models.IntegerField(
                default=1,
                help_text="Firing the weapon with this ammo will actually spend this amount of ammunition.",
            ),
        ),
        migrations.AddField(
            model_name="ammunition",
            name="weapon_class_modifier_multiplier",
            field=models.DecimalField(
                decimal_places=3,
                default=1.0,
                help_text="Weapon class modifier multiplier from ammo, for example from charged weapons.",
                max_digits=5,
            ),
        ),
    ]
