from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.test import force_authenticate
from django.test import TestCase
from django.core.urlresolvers import reverse

import sheet.factories as factories
import views
import sheet.models as models

class SheetTestCase(TestCase):
    def setUp(self):
        self.request_factory = APIRequestFactory()
        self.user = factories.UserFactory(username="leia")
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory(character__owner=self.owner,
                                            character__private=True)
        self.detail_view = views.SheetViewSet.as_view({'get': 'retrieve'})
        self.url = reverse('sheet-detail', kwargs={'pk': self.sheet.pk})

    def test_unauthenticated(self):
        req = self.request_factory.get(self.url)
        response = self.detail_view(req, pk=self.sheet.pk)
        self.assertEqual(response.status_code, 403)

    def test_authenticated(self):
        req = self.request_factory.get(self.url)
        force_authenticate(req, user=self.owner)
        response = self.detail_view(req, pk=self.sheet.pk)
        self.assertEqual(response.status_code, 200)

    def test_authenticated_but_not_owner(self):
        req = self.request_factory.get(self.url)
        force_authenticate(req, user=self.user)
        response = self.detail_view(req, pk=self.sheet.pk)
        self.assertEqual(response.status_code, 403)

    def test_url(self):
        client = APIClient()
        url = '/rest/sheets/{}/movement_rates/'.format(self.sheet.pk)
        self.assertTrue(client.login(username="luke", password="foobar"))
        response = client.get(url, format='json')
        self.assertEqual(response.status_code, 200)

    def test_movement_rates(self):
        pass

    def test_remove_weapon(self):
        pass

    def test_remove_armor(self):
        pass

    def test_add_weapon(self):
        pass


class CharacterTestCase(TestCase):
    def setUp(self):
        self.request_factory = APIRequestFactory()
        self.user = factories.UserFactory(username="leia")
        self.owner = factories.UserFactory(username="luke")
        self.character = factories.CharacterFactory(owner=self.owner,
                                                    private=True,
                                                    gained_sp=0,
                                                    times_wounded=2)
        self.detail_view = views.CharacterViewSet.as_view({'get': 'retrieve'})
        self.url = reverse('character-detail', kwargs={'pk': self.character.pk})
        self.request = self.request_factory.get(self.url)

    def test_unauthenticated(self):
        response = self.detail_view(self.request, pk=self.character.pk)
        self.assertEqual(response.status_code, 403)

    def test_authenticated(self):
        force_authenticate(self.request, user=self.owner)
        response = self.detail_view(self.request, pk=self.character.pk)
        self.assertEqual(response.status_code, 200)

    def test_authenticated_but_not_owner(self):
        force_authenticate(self.request, user=self.user)
        response = self.detail_view(self.request, pk=self.character.pk)
        self.assertEqual(response.status_code, 403)

    def test_url(self):
        client = APIClient()
        url = '/rest/characters/{}/'.format(self.character.pk)
        self.assertTrue(client.login(username="luke", password="foobar"))
        response = client.get(url, format='json')
        self.assertEqual(response.status_code, 200)

    def test_add_gained_sp(self):
        update_view = views.CharacterViewSet.as_view({
            'patch': 'partial_update'})
        req = self.request_factory.patch(self.url, {'gained_sp': 6})
        force_authenticate(req, user=self.owner)
        response = update_view(req, pk=self.character.pk)
        self.assertEqual(response.status_code, 200)

        char = models.Character.objects.get(pk=self.character.pk)
        self.assertEqual(char.gained_sp, 6, "Gained SP should get updated")
        self.assertEqual(char.times_wounded, 2,
                         "Other aspects should not change")