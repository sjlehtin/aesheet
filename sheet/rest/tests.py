from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.test import force_authenticate
from django.test import TestCase
from django.core.urlresolvers import reverse

import sheet.factories as factories
import views
import sheet.models as models
from serializers import SheetSerializer, CharacterSerializer

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

    def test_stat_modifications(self):
        serializer = SheetSerializer(self.sheet)
        for stat in models.ALL_STATS:
            self.assertIn('mod_' + stat.lower(), serializer.data)

    def test_weight(self):
        serializer = SheetSerializer(self.sheet)
        self.assertIn('weight_carried', serializer.data)


class SheetWeaponTestCase(TestCase):
    def setUp(self):
        self.update_view = views.SheetViewSet.as_view(
                {'patch': 'partial_update'})

        self.sword = factories.WeaponFactory(base__name="Sword")
        self.plate = factories.ArmorFactory(base__name="Plate mail")
        self.spear = factories.WeaponFactory(base__name="Spear")
        self.request_factory = APIRequestFactory()
        self.user = factories.UserFactory(username="leia")
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory(character__owner=self.owner,
                                            character__private=True)
        self.url = reverse('sheet-detail', kwargs={'pk': self.sheet.pk})

    def _make_verify_patch(self, query_data):
        req = self.request_factory.patch(self.url, query_data)
        force_authenticate(req, user=self.owner)
        response = self.update_view(req, pk=self.sheet.pk)
        self.assertEqual(response.status_code, 200)

    def test_remove_weapon(self):
        self.sheet.weapons.add(self.spear)
        self.sheet.weapons.add(self.sword)
        self.sheet.armor = self.plate
        self.sheet.save()

        updated_weapons = [self.spear.pk]
        self._make_verify_patch({'weapons': updated_weapons})

        sheet = models.Sheet.objects.get(pk=self.sheet.pk)
        self.assertEqual([wpn.pk for wpn in sheet.weapons.all()],
                         updated_weapons)
        self.assertEqual(sheet.armor, self.plate,
                         "Other aspects should not change")

    def test_add_armor(self):
        self.sheet.weapons.add(self.spear)
        armor = {'armor': self.plate.pk}
        self._make_verify_patch(armor)

        sheet = models.Sheet.objects.get(pk=self.sheet.pk)
        self.assertEqual([wpn.pk for wpn in sheet.weapons.all()],
                         [self.spear.pk], "Other aspects should not change")

    def test_add_weapon(self):
        self.sheet.weapons.add(self.spear)
        self.sheet.armor = self.plate
        self.sheet.save()

        updated_weapons = [self.spear.pk, self.sword.pk]
        self._make_verify_patch({'weapons': updated_weapons})

        sheet = models.Sheet.objects.get(pk=self.sheet.pk)
        self.assertEqual(sorted([wpn.pk for wpn in sheet.weapons.all()]),
                         sorted(updated_weapons))
        self.assertEqual(sheet.armor, self.plate,
                         "Other aspects should not change")


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
        # TODO: A log entry should be generated.
        self.assertEqual(char.times_wounded, 2,
                         "Other aspects should not change")

    def test_stat_modifications(self):
        serializer = CharacterSerializer(self.character)
        for stat in models.ALL_STATS:
            self.assertIn('mod_' + stat.lower(), serializer.data)

    def test_generated_log_entries(self):
        update_view = views.CharacterViewSet.as_view({
            'patch': 'partial_update'})
        req = self.request_factory.patch(self.url, {'gained_sp': 6,
                                                    'cur_fit': 50})
        force_authenticate(req, user=self.owner)
        response = update_view(req, pk=self.character.pk)
        self.assertEqual(response.status_code, 200)

        qs = models.CharacterLogEntry.objects.filter(character=self.character)
        self.assertEqual(len(qs), 2, "There should be two field changes.")

        fit_entry, sp_entry = sorted(qs, key=lambda xx:  xx.field)
        self.assertEqual(fit_entry.amount, 7)
        self.assertEqual(fit_entry.field, "cur_fit")

        self.assertEqual(sp_entry.amount, 6)
        self.assertEqual(sp_entry.field, "gained_sp")

    def test_generated_log_entries_non_integer(self):
        update_view = views.CharacterViewSet.as_view({
            'patch': 'partial_update'})
        req = self.request_factory.patch(self.url, {'deity': "Jahve"})
        force_authenticate(req, user=self.owner)
        response = update_view(req, pk=self.character.pk)
        self.assertEqual(response.status_code, 200)

        qs = models.CharacterLogEntry.objects.filter(character=self.character)
        self.assertEqual(len(qs), 1, "There should be one field change.")

        deity_entry = qs[0]
        self.assertEqual(deity_entry.amount, 0)
        self.assertEqual(deity_entry.field, "deity")


class EdgeTestCase(TestCase):
    def setUp(self):
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.edge_level = factories.EdgeLevelFactory(edge__name="Toughness")

    def test_url(self):
        client = APIClient()
        url = '/rest/edgelevels/{}/'.format(self.edge_level.pk)
        self.assertTrue(client.login(username="luke", password="foobar"))
        response = client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn("edge", response.data)
        self.assertEqual(response.data['edge'], "Toughness")


