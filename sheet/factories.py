import factory
import sheet.models as models
import django.contrib.auth as auth

class UserFactory(factory.DjangoModelFactory):
    FACTORY_FOR = auth.get_user_model()
    username = factory.Sequence(lambda n: "user-%03d" % n)
    password = factory.PostGenerationMethodCall('set_password',
                                                'foobar')


class CampaignFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Campaign
    FACTORY_DJANGO_GET_OR_CREATE = ('name', )
    name = factory.Sequence(lambda xx: "camp-{0}".format(xx))


class CharacterFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Character
    campaign = factory.SubFactory(CampaignFactory)
    owner = factory.SubFactory(UserFactory)


class SheetFactory(factory.DjangoModelFactory):
    FACTORY_FOR = models.Sheet
    character = factory.SubFactory(CharacterFactory)
    owner = factory.LazyAttribute(lambda o: o.character.owner)