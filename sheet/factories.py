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


class SkillFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Skill
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )

    tech_level = factory.SubFactory(TechLevelFactory)


