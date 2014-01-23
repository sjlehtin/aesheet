from rest_framework import serializers
import sheet.models

class AmmunitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Ammunition
