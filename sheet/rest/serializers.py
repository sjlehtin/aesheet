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


class SkillSerializer(serializers.ModelSerializer):
    min_level = serializers.IntegerField(read_only=True,
                                         source='get_minimum_level')
    max_level = serializers.IntegerField(read_only=True,
                                         source='get_maximum_level')
    class Meta:
        model = sheet.models.Skill
        fields = "__all__"


class CharacterSkillSerializer(serializers.ModelSerializer):

    def validate(self, data):
        skill = data['skill']
        minimum = skill.get_minimum_level()
        maximum = skill.get_maximum_level()
        if 'level' not in data:
            raise serializers.ValidationError("Level is required")
        level = data['level']
        if level < minimum:
            raise serializers.ValidationError("Skill {skill} has minimum "
                                              "level {minimum}".format(
                    skill=skill, minimum=minimum))
        if level > maximum:
            raise serializers.ValidationError("Skill {skill} has maximum "
                                              "level {maximum}".format(
                    skill=skill, maximum=maximum))
        return data

    class Meta:
        model = sheet.models.CharacterSkill
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


class InventoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.InventoryEntry
        fields = "__all__"
        read_only_fields = ("sheet", )
