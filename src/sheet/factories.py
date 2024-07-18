import factory
import sheet.models as models
import django.contrib.auth as auth
from factory.django import DjangoModelFactory


class UserFactory(DjangoModelFactory):
    username = factory.Sequence(lambda n: "user-%03d" % n)
    password = factory.PostGenerationMethodCall('set_password',
                                                'foobar')
    class Meta:
        model = auth.get_user_model()


class TechLevelFactory(DjangoModelFactory):
    name = "all"

    class Meta:
        model = models.TechLevel
        django_get_or_create = ('name', )


class CampaignFactory(DjangoModelFactory):
    name = factory.Sequence(lambda xx: "camp-{0}".format(xx))

    class Meta:
        model = models.Campaign
        django_get_or_create = ('name', )

    @factory.post_generation
    def tech_levels(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for tech_level in extracted:
                self.tech_levels.add(TechLevelFactory(name=tech_level))


class SkillFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)

    skill_cost_0 = 2
    skill_cost_1 = 1
    skill_cost_2 = 2
    skill_cost_3 = 3

    type = "Combat"
    stat = "fit"

    class Meta:
        model = models.Skill
        django_get_or_create = ('name', )

    @factory.post_generation
    def required_skills(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for skill in extracted:
                self.required_skills.add(SkillFactory(name=skill))


class EdgeFactory(DjangoModelFactory):
    name = factory.Sequence(lambda xx: "edge-{0}".format(xx))

    class Meta:
        model = models.Edge
        django_get_or_create = ('name', )


class EdgeSkillBonusFactory(DjangoModelFactory):
    edge_level = factory.SubFactory('sheet.factories.EdgeLevelFactory')
    skill = factory.SubFactory(SkillFactory)
    bonus = 15

    class Meta:
        model = models.EdgeSkillBonus


class EdgeLevelFactory(DjangoModelFactory):
    edge = factory.SubFactory(EdgeFactory)
    level = 0
    cost = level * .5 + 1

    class Meta:
        model = models.EdgeLevel

    @factory.post_generation
    def edge_skill_bonuses(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            for skill, bonus in extracted:
                EdgeSkillBonusFactory(edge_level=self,
                                      skill=SkillFactory(name=skill),
                                      bonus=bonus)


class CharacterEdgeFactory(DjangoModelFactory):
    edge = factory.SubFactory(EdgeLevelFactory)

    class Meta:
        model = models.CharacterEdge


class WoundFactory(DjangoModelFactory):
    class Meta:
        model = models.Wound


class CharacterFactory(DjangoModelFactory):
    campaign = factory.SubFactory(CampaignFactory, tech_levels=("all", ))
    owner = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda xx: "char-{0}".format(xx))
    occupation = "Adventurer"
    race = "Human"

    class Meta:
        model = models.Character
        django_get_or_create = ('name', )

    @factory.post_generation
    def skills(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for (skill, level) in extracted:
                CharacterSkillFactory(character=self,
                                      skill=SkillFactory(name=skill),
                                      level=level)

    @factory.post_generation
    def edges(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for (edge, level) in extracted:
                CharacterEdgeFactory(
                    character=self,
                    edge=EdgeLevelFactory(edge=EdgeFactory(name=edge),
                                          level=level))


class CharacterSkillFactory(DjangoModelFactory):
    character = factory.SubFactory(CharacterFactory)
    skill = factory.SubFactory(SkillFactory)
    level = 0

    class Meta:
        model = models.CharacterSkill


class SheetFactory(DjangoModelFactory):
    character = factory.SubFactory(CharacterFactory)
    owner = factory.LazyAttribute(lambda o: o.character.owner)

    class Meta:
        model = models.Sheet

    @factory.post_generation
    def firearms(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for firearm in extracted:
                self.firearms.add(firearm)

    @factory.post_generation
    def weapons(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for weapon in extracted:
                self.weapons.add(weapon)

    @factory.post_generation
    def ranged_weapons(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for weapon in extracted:
                self.ranged_weapons.add(weapon)

    @factory.post_generation
    def miscellaneous_items(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for item in extracted:
                self.miscellaneous_items.add(item)

    @factory.post_generation
    def transient_effects(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for effect in extracted:
                SheetTransientEffectFactory(sheet=self, effect=effect)


class SheetSetFactory(DjangoModelFactory):
    campaign = factory.SubFactory(CampaignFactory, tech_levels=("all", ))
    name = factory.Sequence(lambda n: "sheetset-%03d" % n)
    owner = factory.SubFactory(UserFactory)

    class Meta:
        model = models.SheetSet

    @factory.post_generation
    def sheets(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for sheet in extracted:
                self.sheet_set.add(sheet)


class CalibreFactory(DjangoModelFactory):
    class Meta:
        model = models.Calibre
        django_get_or_create = ('name', )


class AmmunitionFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    weight = 5
    velocity = 600

    calibre = factory.SubFactory(CalibreFactory)

    bullet_type = "FMJ"

    class Meta:
        model = models.Ammunition


class FirearmAmmunitionTypeFactory(DjangoModelFactory):
    calibre = factory.SubFactory(CalibreFactory)

    class Meta:
        model = models.FirearmAmmunitionType


class BaseFirearmFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    base_skill = factory.SubFactory(SkillFactory)

    base_skill__name = "Pistol"
    tech_level__name = "2K"

    class Meta:
        model = models.BaseFirearm
        django_get_or_create = ('name', )

    @factory.post_generation
    def ammunition_types(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for ammo_type in extracted:
                FirearmAmmunitionTypeFactory(
                    firearm=self, calibre=CalibreFactory(name=ammo_type)
                )


class FirearmAddOnFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    name = factory.Sequence(lambda n: "firearm-addon-%03d" % n)

    class Meta:
        model = models.FirearmAddOn
        django_get_or_create = ('name', )


class ScopeFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    name = factory.Sequence(lambda n: "scope-%03d" % n)

    class Meta:
        model = models.Scope
        django_get_or_create = ('name', )


class FirearmFactory(DjangoModelFactory):
    base = factory.SubFactory(BaseFirearmFactory, name="Glock 19")
    ammo = factory.SubFactory(AmmunitionFactory, calibre__name="9x19+")
    scope = None

    class Meta:
        model = models.SheetFirearm

    @factory.post_generation
    def ammunition_types(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            for ammo_type in extracted:
                FirearmAmmunitionTypeFactory(firearm=self.base,
                                             calibre=CalibreFactory(name=ammo_type))
        else:
            FirearmAmmunitionTypeFactory(firearm=self.base,
                                         calibre=self.ammo.calibre)


class ArmorTemplateFactory(DjangoModelFactory):
    name = factory.Sequence(lambda n: "armor-%03d" % n)
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.ArmorTemplate
        django_get_or_create = ('name', )


class ArmorQualityFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.ArmorQuality
        django_get_or_create = ('name', )


class ArmorSpecialQualityFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.ArmorSpecialQuality
        django_get_or_create = ('name', )


class ArmorFactory(DjangoModelFactory):
    base = factory.SubFactory(ArmorTemplateFactory)
    quality = factory.SubFactory(ArmorQualityFactory)
    quality__name = "normal"

    class Meta:
        model = models.Armor

    @factory.post_generation
    def special_qualities(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            # A list of groups were passed in, use them
            for sq in extracted:
                self.special_qualities.add(
                        ArmorSpecialQualityFactory(name=sq))


class HelmFactory(ArmorFactory):
    base__is_helm = True


class WeaponTemplateFactory(DjangoModelFactory):
    name = factory.Sequence(lambda n: "weapon-%03d" % n)
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    base_skill = factory.SubFactory(SkillFactory)
    base_skill__name = "Weapon combat"

    class Meta:
        model = models.WeaponTemplate
        django_get_or_create = ('name', )


class WeaponQualityFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.WeaponQuality
        django_get_or_create = ('name', )


class WeaponSpecialQualityFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.WeaponSpecialQuality
        django_get_or_create = ('name', )


class WeaponFactory(DjangoModelFactory):
    base = factory.SubFactory(WeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"

    class Meta:
        model = models.Weapon

    @factory.post_generation
    def special_qualities(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            # A list of groups were passed in, use them
            for sq in extracted:
                self.special_qualities.add(
                        WeaponSpecialQualityFactory(name=sq))


class RangedWeaponTemplateFactory(WeaponTemplateFactory):
    range_s = 20
    range_m = 40
    range_l = 60

    class Meta:
        model = models.RangedWeaponTemplate


class RangedWeaponFactory(DjangoModelFactory):
    base = factory.SubFactory(RangedWeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"

    class Meta:
        model = models.RangedWeapon

    @factory.post_generation
    def special_qualities(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            # A list of groups were passed in, use them
            for sq in extracted:
                self.special_qualities.add(
                        WeaponSpecialQualityFactory(name=sq))


class MiscellaneousItemFactory(DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    name = factory.Sequence(lambda n: "item-%03d" % n)

    class Meta:
        model = models.MiscellaneousItem
        django_get_or_create = ('name', )


class SheetMiscellaneousItemFactory(DjangoModelFactory):
    sheet = factory.SubFactory(SheetFactory)
    item = factory.SubFactory(MiscellaneousItemFactory)
    item__tech_level = factory.SubFactory(TechLevelFactory)
    item__tech_level__name = "2K"

    class Meta:
        model = models.SheetMiscellaneousItem


class TransientEffectFactory(DjangoModelFactory):
    name = factory.Sequence(lambda n: "effect-%03d" % n)
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.TransientEffect
        django_get_or_create = ('name', )


class SheetTransientEffectFactory(DjangoModelFactory):
    sheet = factory.SubFactory(SheetFactory)
    effect = factory.SubFactory(TransientEffectFactory)
    effect__tech_level = factory.SubFactory(TechLevelFactory)
    effect__tech_level__name = "2K"

    class Meta:
        model = models.SheetTransientEffect


class InventoryEntryFactory(DjangoModelFactory):
    description = factory.Sequence(lambda n: "inventory entry %03d" % n)

    class Meta:
        model = models.InventoryEntry
