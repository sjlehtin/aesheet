import factory
import sheet.models as models
import django.contrib.auth as auth

class UserFactory(factory.DjangoModelFactory):
    username = factory.Sequence(lambda n: "user-%03d" % n)
    password = factory.PostGenerationMethodCall('set_password',
                                                'foobar')
    class Meta:
        model = auth.get_user_model()


class TechLevelFactory(factory.DjangoModelFactory):
    name = "all"

    class Meta:
        model = models.TechLevel
        django_get_or_create = ('name', )


class CampaignFactory(factory.DjangoModelFactory):
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


class SkillFactory(factory.DjangoModelFactory):
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


class EdgeFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.Edge
        django_get_or_create = ('name', )


class EdgeSkillBonusFactory(factory.DjangoModelFactory):
    edge_level = factory.SubFactory('sheet.factories.EdgeLevelFactory')
    skill = factory.SubFactory(SkillFactory)
    bonus = 15

    class Meta:
        model = models.EdgeSkillBonus


class EdgeLevelFactory(factory.DjangoModelFactory):
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


class CharacterEdgeFactory(factory.DjangoModelFactory):
    edge = factory.SubFactory(EdgeLevelFactory)

    class Meta:
        model = models.CharacterEdge


class CharacterFactory(factory.DjangoModelFactory):
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


class CharacterSkillFactory(factory.DjangoModelFactory):
    character = factory.SubFactory(CharacterFactory)
    skill = factory.SubFactory(SkillFactory)
    level = 0

    class Meta:
        model = models.CharacterSkill


class SheetFactory(factory.DjangoModelFactory):
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
    def spell_effects(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of groups were passed in, use them
            for effect in extracted:
                self.spell_effects.add(effect)


class AmmunitionFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    weight = 5
    velocity = 600

    class Meta:
        model = models.Ammunition
        django_get_or_create = ('label', )


class FirearmAmmunitionTypeFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.FirearmAmmunitionType


class BaseFirearmFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    base_skill = factory.SubFactory(SkillFactory)

    base_skill__name = "Pistol"
    tech_level__name = "2K"

    range_s = 15
    range_m = 30
    range_l = 100

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
                FirearmAmmunitionTypeFactory(firearm=self,
                                             short_label=ammo_type)


class FirearmFactory(factory.DjangoModelFactory):
    base = factory.SubFactory(BaseFirearmFactory)
    ammo = factory.SubFactory(AmmunitionFactory)

    class Meta:
        model = models.Firearm

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
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.ArmorTemplate
        django_get_or_create = ('name', )


class ArmorQualityFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.ArmorQuality
        django_get_or_create = ('name', )


class ArmorSpecialQualityFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.ArmorSpecialQuality
        django_get_or_create = ('name', )


class ArmorFactory(factory.DjangoModelFactory):
    base = factory.SubFactory(ArmorTemplateFactory)
    quality = factory.SubFactory(ArmorQualityFactory)
    quality__name = "normal"
    class Meta:
        model = models.Armor


class HelmFactory(ArmorFactory):
    base__is_helm = True


class WeaponTemplateFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"
    base_skill = factory.SubFactory(SkillFactory)
    base_skill__name = "Weapon combat"

    class Meta:
        model = models.WeaponTemplate
        django_get_or_create = ('name', )


class WeaponQualityFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.WeaponQuality
        django_get_or_create = ('name', )


class WeaponFactory(factory.DjangoModelFactory):
    base = factory.SubFactory(WeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"

    class Meta:
        model = models.Weapon


class RangedWeaponTemplateFactory(WeaponTemplateFactory):
    range_s = 20
    range_m = 40
    range_l = 60

    class Meta:
        model = models.RangedWeaponTemplate


class RangedWeaponFactory(factory.DjangoModelFactory):
    base = factory.SubFactory(RangedWeaponTemplateFactory)
    quality = factory.SubFactory(WeaponQualityFactory)
    quality__name = "normal"

    class Meta:
        model = models.RangedWeapon


class MiscellaneousItemFactory(factory.DjangoModelFactory):
    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    class Meta:
        model = models.MiscellaneousItem
        django_get_or_create = ('name', )


class SpellEffectFactory(factory.DjangoModelFactory):
    class Meta:
        model = models.SpellEffect
        django_get_or_create = ('name', )
