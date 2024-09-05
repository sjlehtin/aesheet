# Generated by Django 5.0.6 on 2024-09-05 13:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sheet", "0111_alter_weaponquality_damage_alter_weaponquality_leth"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="edgeskillbonus",
            options={"verbose_name_plural": "Edge skill bonuses"},
        ),
        migrations.AddField(
            model_name="basefirearm",
            name="autofire_only",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="basefirearm",
            name="duration",
            field=models.DecimalField(
                decimal_places=3,
                default=0.1,
                help_text="Modifier for recoil.  In principle, time in seconds from the muzzle break. Bigger is better.",
                max_digits=5,
            ),
        ),
    ]
