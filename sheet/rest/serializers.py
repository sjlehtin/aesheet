from rest_framework import serializers
import sheet.models

class AmmunitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Ammunition


class SheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Sheet


class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Character

