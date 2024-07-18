from rest_framework import serializers
import sheet.models


class CalibreSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Calibre
        fields = "__all__"


class AmmunitionSerializer(serializers.ModelSerializer):
    calibre = CalibreSerializer()

    class Meta:
        model = sheet.models.Ammunition
        fields = "__all__"


class SheetSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source='owner.username', read_only=True)
    campaign = serializers.IntegerField(source='character.campaign_id', read_only=True)
    character_name = serializers.CharField(source='character.name', read_only=True)
    character_total_xp = serializers.CharField(source='character.total_xp', read_only=True)

    class Meta:
        model = sheet.models.Sheet
        fields = "__all__"


class SheetSetSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = sheet.models.SheetSet
        fields = "__all__"


class SheetSetSheetCreateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        sheet = attrs.get('sheet')
        sheet_set = self.context['view'].containing_object

        if not self.instance:
            if not sheet:
                raise serializers.ValidationError("Required fields not passed")

            if sheet_set.sheets.filter(id=sheet.id).exists():
                raise serializers.ValidationError("Sheet already exists in the set")

        return attrs

    class Meta:
        model = sheet.models.SheetSetSheet
        fields = "__all__"


class SheetSetSheetListSerializer(serializers.ModelSerializer):
    sheet_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = sheet.models.SheetSetSheet
        exclude = ('sheet_set', )
        depth = 1


class EdgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Edge
        fields = "__all__"


class EdgeSkillBonusSerializer(serializers.ModelSerializer):
    skill__name = serializers.CharField(source='skill.name', read_only=True)

    class Meta:
        model = sheet.models.EdgeSkillBonus
        fields = ("id", "skill", "skill__name", "bonus")


class EdgeLevelSerializer(serializers.ModelSerializer):
    edge = EdgeSerializer()
    edge_skill_bonuses = EdgeSkillBonusSerializer(many=True)
    class Meta:
        model = sheet.models.EdgeLevel
        fields = "__all__"


class SkillMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Skill
        fields = ("id", "name")
        read_only_fields = ("id", "name")


class SkillSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    min_level = serializers.IntegerField(read_only=True,
                                         source='get_minimum_level')
    max_level = serializers.IntegerField(read_only=True,
                                         source='get_maximum_level')

    required_skills = SkillMinimalSerializer(many=True)

    class Meta:
        model = sheet.models.Skill
        fields = "__all__"


class CharacterEdgeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.CharacterEdge
        fields = "__all__"


class CharacterEdgeListSerializer(serializers.ModelSerializer):
    edge = EdgeLevelSerializer(read_only=True)
    character = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = sheet.models.CharacterEdge
        fields = "__all__"
        depth = 1


class BaseFirearmSerializer(serializers.ModelSerializer):
    base_skill = SkillMinimalSerializer(read_only=True)
    required_skills = SkillMinimalSerializer(many=True)

    class Meta:
        model = sheet.models.BaseFirearm
        fields = "__all__"


class WeaponTemplateSerializer(serializers.ModelSerializer):
    base_skill = SkillMinimalSerializer(read_only=True)
    required_skills = SkillMinimalSerializer(many=True)

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
    base_skill = SkillMinimalSerializer(read_only=True)
    required_skills = SkillMinimalSerializer(many=True)

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


class ArmorTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.ArmorTemplate
        fields = "__all__"


class ArmorQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.ArmorQuality
        fields = "__all__"


class ArmorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Armor
        fields = "__all__"


class ArmorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Armor
        fields = "__all__"
        depth = 1


class TransientEffectSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.TransientEffect
        fields = "__all__"


class SheetTransientEffectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.SheetTransientEffect
        fields = "__all__"


class SheetTransientEffectListSerializer(serializers.ModelSerializer):
    effect = TransientEffectSerializer()
    class Meta:
        model = sheet.models.SheetTransientEffect
        fields = "__all__"


class MiscellaneousItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.MiscellaneousItem
        fields = "__all__"


class MiscellaneousItemListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.MiscellaneousItem
        fields = "__all__"
        depth = 1


class FirearmAddOnCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.FirearmAddOn
        fields = "__all__"


class FirearmAddOnListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.FirearmAddOn
        fields = "__all__"
        depth = 1


class SheetFirearmMagazineCreateSerializer(serializers.ModelSerializer):
    capacity = serializers.IntegerField(min_value=0)
    current = serializers.IntegerField(min_value=0)

    def validate(self, attrs):
        if "capacity" not in attrs:
            capacity = self.instance.capacity
        else:
            capacity = attrs["capacity"]

        if "current" not in attrs:
            current = self.instance.current
        else:
            current = attrs["current"]

        if current > capacity:
            raise serializers.ValidationError("`current` needs to be lower than `capacity`")
        return attrs

    class Meta:
        model = sheet.models.SheetFirearmMagazine
        fields = "__all__"


class SheetFirearmMagazineListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.SheetFirearmMagazine
        fields = "__all__"
        depth = 1


class ScopeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Scope
        fields = "__all__"


class AmmunitionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Ammunition
        fields = "__all__"
        depth = 1


class ScopeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Scope
        fields = "__all__"
        depth = 1


class SheetMiscellaneousItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.SheetMiscellaneousItem
        fields = "__all__"


class SheetMiscellaneousItemListSerializer(serializers.ModelSerializer):
    item = MiscellaneousItemListSerializer()
    class Meta:
        model = sheet.models.SheetMiscellaneousItem
        fields = "__all__"


class CharacterSkillSerializer(serializers.ModelSerializer):

    skill__name = serializers.CharField(read_only=True, source="skill.name")

    def validate(self, data):
        if 'skill' in data:
            skill = data['skill']
        else:
            skill = self.instance.skill

        if not skill:
            raise serializers.ValidationError("Skill not available")

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
    owner = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = sheet.models.Character
        fields = "__all__"


class WoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Wound
        fields = "__all__"


class InventoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.InventoryEntry
        fields = "__all__"
        read_only_fields = ("sheet", )


class SheetFirearmListSerializer(serializers.ModelSerializer):
    scope = ScopeListSerializer()
    ammo = AmmunitionListSerializer()
    magazines = SheetFirearmMagazineListSerializer(many=True)
    base = BaseFirearmSerializer()

    class Meta:
        model = sheet.models.SheetFirearm
        exclude = ("sheet", )
        depth = 1


class SheetFirearmCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.SheetFirearm
        fields = "__all__"


class SheetWeaponListSerializer(serializers.ModelSerializer):

    base = WeaponTemplateSerializer()

    class Meta:
        model = sheet.models.Weapon
        fields = "__all__"
        depth = 1


class SheetWeaponCreateSerializer(serializers.ModelSerializer):
    item = serializers.IntegerField(required=False)

    base = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.WeaponTemplate.objects.all(),
            required=False)
    quality = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.WeaponQuality.objects.all(),
            required=False)

    def get_queryset(self):
        return sheet.models.Weapon.objects.all()

    def validate_item(self, value):
        return self.get_queryset().get(pk=value)

    def validate(self, attrs):
        if not attrs.get('item'):
            if 'base' not in attrs:
                raise serializers.ValidationError("item not passed, "
                                                  "base is required")
            if 'quality' not in attrs:
                raise serializers.ValidationError("item not passed, "
                                                  "quality is required")
                    
        return attrs

    def create(self, validated_data):
        if 'item' in validated_data:
            return validated_data['item']

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
    base = RangedWeaponTemplateSerializer()

    class Meta:
        model = sheet.models.RangedWeapon
        fields = "__all__"
        depth = 1


class SheetRangedWeaponCreateSerializer(SheetWeaponCreateSerializer):
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


class SheetArmorCreateSerializer(SheetWeaponCreateSerializer):
    is_helm = False

    base = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.ArmorTemplate.objects.all(),
            required=False)
    quality = serializers.PrimaryKeyRelatedField(
            queryset=sheet.models.ArmorQuality.objects.all(),
            required=False)

    def __init__(self, *args, **kwargs):
        super(SheetArmorCreateSerializer, self).__init__(*args, **kwargs)
        self.fields['base'].queryset = self.fields['base'].queryset.filter(
                                       is_helm=self.is_helm)

    def get_queryset(self):
        return sheet.models.Armor.objects.select_related(
            "base", "quality").filter(base__is_helm=self.is_helm)

    class Meta:
        model = sheet.models.Armor
        fields = "__all__"


class SheetArmorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = sheet.models.Armor
        fields = "__all__"
        depth = 1


class SheetHelmCreateSerializer(SheetArmorCreateSerializer):
    is_helm = True

    class Meta:
        model = sheet.models.Armor
        fields = "__all__"
