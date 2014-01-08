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


class CharacterFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Character
    campaign = factory.SubFactory(CampaignFactory)
    owner = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda xx: "char-{0}".format(xx))


class SheetFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Sheet
    character = factory.SubFactory(CharacterFactory)
    owner = factory.LazyAttribute(lambda o: o.character.owner)


class AmmunitionFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Ammunition
    FACTORY_DJANGO_GET_OR_CREATE = ('label', )

    tech_level = factory.SubFactory(TechLevelFactory)
    tech_level__name = "2K"

    weight = 5
    velocity = 600


class FirearmAmmunitionTypeFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.FirearmAmmunitionType


class SkillFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Skill
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )

    tech_level = factory.SubFactory(TechLevelFactory)


class CharacterSkillFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.CharacterSkill

    skill = factory.SubFactory(SkillFactory)
    level = 0


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
