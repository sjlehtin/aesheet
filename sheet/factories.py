import factory
import sheet.models as models
import django.contrib.auth as auth

class UserFactory(factory.DjangoModelFactory):
    FACTORY_FOR = auth.get_user_model()
    username = factory.Sequence(lambda n: "user-%03d" % n)
    password = factory.PostGenerationMethodCall('set_password',
                                                'foobar')


class TechLevelFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.TechLevel
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )

    name = "all"


class CampaignFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Campaign
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )
    name = factory.Sequence(lambda xx: "camp-{0}".format(xx))

    @factory.post_generation
    def tech_levels(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for tech_level in extracted:
                self.tech_levels.add(TechLevelFactory(name=tech_level))


class SkillFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Skill
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )

    tech_level = factory.SubFactory(TechLevelFactory)

    skill_cost_0 = 2
    skill_cost_1 = 1
    skill_cost_2 = 2
    skill_cost_3 = 3

    type = "Combat"
    stat = "fit"

    @factory.post_generation
    def required_skills(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for skill in extracted:
                self.required_skills.add(SkillFactory(name=skill))


class EdgeFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Edge
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )


class EdgeSkillBonusFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.EdgeSkillBonus

    edge_level = factory.SubFactory('sheet.factories.EdgeLevelFactory')
    skill = factory.SubFactory(SkillFactory)
    bonus = 15


class EdgeLevelFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.EdgeLevel

    edge = factory.SubFactory(EdgeFactory)
    level = 0
    cost = level * .5 + 1

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


class CharacterEdgeFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.CharacterEdge

    edge = factory.SubFactory(EdgeLevelFactory)


class CharacterFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Character
    campaign = factory.SubFactory(CampaignFactory, tech_levels=("all", ))
    owner = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda xx: "char-{0}".format(xx))
    occupation = "Adventurer"
    race = "Human"

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


class CharacterSkillFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.CharacterSkill

    character = factory.SubFactory(CharacterFactory)
    skill = factory.SubFactory(SkillFactory)
    level = 0


class SheetFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Sheet
    character = factory.SubFactory(CharacterFactory)
    owner = factory.LazyAttribute(lambda o: o.character.owner)

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
    def spell_effects(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for effect in extracted:
                self.spell_effects.add(effect)


class AmmunitionFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Ammunition
    FACTORY_DJANGO_GET_OR_CREATE = ('label', )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    weight = 5
    velocity = 600


class FirearmAmmunitionTypeFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.FirearmAmmunitionType


class BaseFirearmFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.BaseFirearm
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )

    tech_level = factory.SubFactory(TechLevelFactory)
    base_skill = factory.SubFactory(SkillFactory)

    base_skill__name = "Pistol"
    tech_level__name = "2K"

    range_s = 15
    range_m = 30
    range_l = 100

    @factory.post_generation
    def ammunition_types(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for ammo_type in extracted:
                FirearmAmmunitionTypeFactory(firearm=self,
                                             short_label=ammo_type)


class FirearmFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Firearm

    base = factory.SubFactory(BaseFirearmFactory)
    ammo = factory.SubFactory(AmmunitionFactory)

    @factory.post_generation
    def ammunition_types(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return
        if extracted:
            for ammo_type in extracted:
                FirearmAmmunitionTypeFactory(firearm=self.base,
                                             short_label=ammo_type)
        else:
            FirearmAmmunitionTypeFactory(firearm=self.base,
                                         short_label=self.ammo.label)


class ArmorTemplateFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.ArmorTemplate
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"


class ArmorQualityFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.ArmorQuality
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"


class ArmorSpecialQualityFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.ArmorSpecialQuality
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )


class ArmorFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Armor

    base = factory.SubFactory(ArmorTemplateFactory)
    quality = factory.SubFactory(ArmorQualityFactory)
    quality__name = "normal"


class HelmFactory(ArmorFactory):
    base__is_helm = True


class WeaponTemplateFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.WeaponTemplate
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    base_skill = factory.SubFactory(SkillFactory)
    base_skill__name = "Weapon combat"


class WeaponQualityFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.WeaponQuality
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"


class WeaponFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Weapon

    base = factory.SubFactory(WeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"


class RangedWeaponTemplateFactory(WeaponTemplateFactory):
    FACTORY_FOR = models.RangedWeaponTemplate

    range_s = 20
    range_m = 40
    range_l = 60


class RangedWeaponFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.RangedWeapon

    base = factory.SubFactory(RangedWeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"


class MiscellaneousItemFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.MiscellaneousItem
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"


class SpellEffectFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.SpellEffect
    FACTORY_DJANGO_GET_OR_CREATE = ("name", )
