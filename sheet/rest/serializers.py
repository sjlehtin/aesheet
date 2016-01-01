from rest_framework import serializers
import sheet.models

class AmmunitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Ammunition


class SheetSerializer(serializers.ModelSerializer):
    weight_carried = serializers.DecimalField(4, 2, read_only=True)
    mod_fit = serializers.IntegerField(read_only=True)
    mod_ref = serializers.IntegerField(read_only=True)
    mod_lrn = serializers.IntegerField(read_only=True)
    mod_int = serializers.IntegerField(read_only=True)
    mod_psy = serializers.IntegerField(read_only=True)
    mod_wil = serializers.IntegerField(read_only=True)
    mod_cha = serializers.IntegerField(read_only=True)
    mod_pos = serializers.IntegerField(read_only=True)
    mod_mov = serializers.IntegerField(read_only=True)
    mod_dex = serializers.IntegerField(read_only=True)
    mod_imm = serializers.IntegerField(read_only=True)

    class Meta:
        model = sheet.models.Sheet
        fields = "__all__"


class EdgeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.EdgeLevel
        fields = "__all__"


class CharacterSerializer(serializers.ModelSerializer):
    mod_fit = serializers.IntegerField(read_only=True)
    mod_ref = serializers.IntegerField(read_only=True)
    mod_lrn = serializers.IntegerField(read_only=True)
    mod_int = serializers.IntegerField(read_only=True)
    mod_psy = serializers.IntegerField(read_only=True)
    mod_wil = serializers.IntegerField(read_only=True)
    mod_cha = serializers.IntegerField(read_only=True)
    mod_pos = serializers.IntegerField(read_only=True)
    mod_mov = serializers.IntegerField(read_only=True)
    mod_dex = serializers.IntegerField(read_only=True)
    mod_imm = serializers.IntegerField(read_only=True)

    class Meta:
        model = sheet.models.Character
        fields = "__all__"
        read_only_fields = ("owner", )
