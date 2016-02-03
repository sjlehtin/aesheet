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


class BaseFirearmSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.BaseFirearm
        fields = "__all__"


class WeaponTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.WeaponTemplate
        fields = "__all__"


class WeaponQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.WeaponQuality
        fields = "__all__"


class WeaponCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Weapon
        fields = "__all__"


class WeaponListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Weapon
        fields = "__all__"
        depth = 1


class RangedWeaponTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.RangedWeaponTemplate
        fields = "__all__"


class RangedWeaponCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.RangedWeapon
        fields = "__all__"


class RangedWeaponListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.RangedWeapon
        fields = "__all__"
        depth = 1


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


class SheetFirearmListSerializer(serializers.ModelSerializer):

    class Meta:
        model = sheet.models.Firearm
        fields = "__all__"
        depth = 1


class SheetFirearmCreateSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        if set(validated_data.keys()) == {'base', 'ammo'}:
            objs = sheet.models.Firearm.objects.filter(
                    base=validated_data['base'],
                    ammo=validated_data['ammo'])
            if objs:
                return objs[0]

        return super(SheetFirearmCreateSerializer, self).create(
                validated_data)

    class Meta:
        model = sheet.models.Firearm
        fields = "__all__"


class SheetWeaponListSerializer(serializers.ModelSerializer):

    class Meta:
        model = sheet.models.Weapon
        fields = "__all__"
        depth = 1


class SheetWeaponCreateSerializer(serializers.ModelSerializer):
    weapon = serializers.IntegerField(
            required=False)

    base = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.WeaponTemplate.objects.all(),
            required=False)
    quality = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.WeaponQuality.objects.all(),
            required=False)

    def get_queryset(self):
        return sheet.models.Weapon.objects.all()

    def validate_weapon(self, value):
        return self.get_queryset().get(pk=value)

    def validate(self, attrs):
        if not attrs.get('weapon'):
            if 'base' not in attrs:
                raise serializers.ValidationError("weapon not passed, "
                                                  "base is required")
            if 'quality' not in attrs:
                raise serializers.ValidationError("weapon not passed, "
                                                  "quality is required")
                    
        return attrs

    def create(self, validated_data):
        if 'weapon' in validated_data:
            return validated_data['weapon']

        if set(validated_data.keys()) == {'base', 'quality'}:
            objs = self.get_queryset().filter(
                    base=validated_data['base'],
                    quality=validated_data['quality'],
                    special_qualities=None)
            if objs:
                return objs[0]

            if 'name' not in validated_data:
                if validated_data['quality'].name != "normal":
                    validated_data['name'] = "{} {}".format(
                            validated_data['base'].name,
                            validated_data['quality'].short_name)
                else:
                    validated_data['name'] = validated_data['base'].name
            
        return super(SheetWeaponCreateSerializer, self).create(
                validated_data)

    class Meta:
        model = sheet.models.Weapon
        fields = "__all__"


class SheetRangedWeaponListSerializer(serializers.ModelSerializer):

    class Meta:
        model = sheet.models.RangedWeapon
        fields = "__all__"
        depth = 1


class SheetRangedWeaponCreateSerializer(SheetWeaponCreateSerializer):
    weapon = serializers.IntegerField(
            required=False)

    base = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.RangedWeaponTemplate.objects.all(),
            required=False)
    quality = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.WeaponQuality.objects.all(),
            required=False)

    def get_queryset(self):
        return sheet.models.RangedWeapon.objects.all()

    class Meta:
        model = sheet.models.RangedWeapon
        fields = "__all__"
