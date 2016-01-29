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
        self.sheet = factories.SheetFactory(character__owner=self.owner)
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
        self.assertEqual(response.status_code, 200)

    def test_authenticated_but_not_owner_sheet_private(self):
        self.sheet.character.private = True
        self.sheet.character.save()
        req = self.request_factory.get(self.url)
        force_authenticate(req, user=self.user)
        response = self.detail_view(req, pk=self.sheet.pk)
        self.assertEqual(response.status_code, 403)

    # TODO: Probably unnecessary, as these should be calculated in a React
    # component.
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


# class SheetWeaponTestCase(TestCase):
#     def setUp(self):
#         self.update_view = views.SheetViewSet.as_view(
#                 {'patch': 'partial_update'})
#
#         self.sword = factories.WeaponFactory(base__name="Sword")
#         self.plate = factories.ArmorFactory(base__name="Plate mail")
#         self.spear = factories.WeaponFactory(base__name="Spear")
#         self.request_factory = APIRequestFactory()
#         self.user = factories.UserFactory(username="leia")
#         self.owner = factories.UserFactory(username="luke")
#         self.sheet = factories.SheetFactory(character__owner=self.owner,
#                                             character__private=True)
#         self.url = reverse('sheet-detail', kwargs={'pk': self.sheet.pk})
#
#     def _make_verify_patch(self, query_data):
#         req = self.request_factory.patch(self.url, query_data)
#         force_authenticate(req, user=self.owner)
#         response = self.update_view(req, pk=self.sheet.pk)
#         self.assertEqual(response.status_code, 200)
#
#     def test_remove_weapon(self):
#         self.sheet.weapons.add(self.spear)
#         self.sheet.weapons.add(self.sword)
#         self.sheet.armor = self.plate
#         self.sheet.save()
#
#         updated_weapons = [self.spear.pk]
#         self._make_verify_patch({'weapons': updated_weapons})
#
#         sheet = models.Sheet.objects.get(pk=self.sheet.pk)
#         self.assertEqual([wpn.pk for wpn in sheet.weapons.all()],
#                          updated_weapons)
#         self.assertEqual(sheet.armor, self.plate,
#                          "Other aspects should not change")
#
#     def test_add_armor(self):
#         self.sheet.weapons.add(self.spear)
#         armor = {'armor': self.plate.pk}
#         self._make_verify_patch(armor)
#
#         sheet = models.Sheet.objects.get(pk=self.sheet.pk)
#         self.assertEqual([wpn.pk for wpn in sheet.weapons.all()],
#                          [self.spear.pk], "Other aspects should not change")
#
#     def test_add_weapon(self):
#         self.sheet.weapons.add(self.spear)
#         self.sheet.armor = self.plate
#         self.sheet.save()
#
#         updated_weapons = [self.spear.pk, self.sword.pk]
#         self._make_verify_patch({'weapons': updated_weapons})
#
#         sheet = models.Sheet.objects.get(pk=self.sheet.pk)
#         self.assertEqual(sorted([wpn.pk for wpn in sheet.weapons.all()]),
#                          sorted(updated_weapons))
#         self.assertEqual(sheet.armor, self.plate,
#                          "Other aspects should not change")


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
        self.url = reverse('character-detail',
                           kwargs={'pk': self.character.pk})
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

    def test_change_owner_should_be_prohibited(self):
        update_view = views.CharacterViewSet.as_view({
            'patch': 'partial_update'})
        self.assertEqual(self.character.owner.pk, self.owner.pk)
        req = self.request_factory.patch(self.url, {'owner': self.user.pk})
        force_authenticate(req, user=self.owner)
        response = update_view(req, pk=self.character.pk)
        # Read-only field is just ignored.
        self.assertEqual(response.status_code, 200)
        char = models.Character.objects.get(pk=self.character.pk)
        self.assertEqual(char.owner, self.owner)

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

# TODO: add test case to verify that private characters and sheets do not
# show to other users form the /rest/characters/ and /rest/sheets/ API
# endpoints.


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


class InventoryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory()
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))

    def test_url(self):
        url = '/rest/sheets/{}/inventory/'.format(self.sheet.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_items(self):
        factories.InventoryEntryFactory(description="long bow arrow",
                                        quantity=20,
                                        unit_weight=0.05,
                                        sheet=self.sheet,
                                        order=2)
        factories.InventoryEntryFactory(description="potion of flying",
                                        quantity=1,
                                        unit_weight=0.5,
                                        sheet=self.sheet,
                                        order=1)

        url = '/rest/sheets/{}/inventory/'.format(self.sheet.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        self.assertEqual(response.data[0]['description'], "potion of flying")
        self.assertEqual(response.data[1]['description'], "long bow arrow")

    def test_adding_items(self):
        url = '/rest/sheets/{}/inventory/'.format(self.sheet.pk)
        response = self.client.post(
                url,
                data={'description': "potion of flying",
                      'unit_weight': 0.5, }, format='json')
        self.assertEqual(response.status_code, 201)

        entries = models.InventoryEntry.objects.filter(sheet=self.sheet)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].unit_weight, 0.5)
        self.assertEqual(entries[0].quantity, 1)
        self.assertEqual(entries[0].description, "potion of flying")

    def test_modifying_items(self):
        entry = factories.InventoryEntryFactory(description="long bow arrow",
                                                quantity=20,
                                                unit_weight=0.05,
                                                sheet=self.sheet,
                                                order=2)
        url = '/rest/sheets/{}/inventory/{}/'.format(self.sheet.pk,
                                                     entry.pk)

        response = self.client.patch(url, data={'quantity': 19 },
                                     format='json')
        self.assertEqual(response.status_code, 200)
        entries = models.InventoryEntry.objects.filter(sheet=self.sheet)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].quantity, 19)
        self.assertEqual(entries[0].description, "long bow arrow")

    def test_deleting_items(self):
        entry = factories.InventoryEntryFactory(description="long bow arrow",
                                                quantity=20,
                                                unit_weight=0.05,
                                                sheet=self.sheet,
                                                order=2)
        url = '/rest/sheets/{}/inventory/{}/'.format(self.sheet.pk,
                                                     entry.pk)

        response = self.client.delete(url, data={'id': entry.pk },
                                      format='json')
        self.assertEqual(response.status_code, 204)
        entries = models.InventoryEntry.objects.filter(sheet=self.sheet)
        self.assertEqual(len(entries), 0)


class InventoryPrivateSheetTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.user = factories.UserFactory(username="leia")
        self.sheet = factories.SheetFactory(character__owner=self.owner,
                                            character__private=True)

    def test_url_valid_user(self):
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        url = '/rest/sheets/{}/inventory/'.format(self.sheet.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_url_invalid_user(self):
        self.assertTrue(
            self.client.login(username="leia", password="foobar"))
        url = '/rest/sheets/{}/inventory/'.format(self.sheet.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 403)


class InventoryMultipleSheetsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.user = factories.UserFactory(username="leia")
        self.sheet1 = factories.SheetFactory(character__owner=self.owner)
        self.sheet2 = factories.SheetFactory(character__owner=self.user)

        factories.InventoryEntryFactory(description="long bow arrow",
                                        quantity=20,
                                        unit_weight=0.05,
                                        sheet=self.sheet1,
                                        order=2)

        factories.InventoryEntryFactory(description="potion of flying",
                                        quantity=1,
                                        unit_weight=0.5,
                                        sheet=self.sheet2,
                                        order=2)

    def test_url_inventory_for_user1(self):
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        url = '/rest/sheets/{}/inventory/'.format(self.sheet1.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        self.assertEqual(response.data[0]['description'], "long bow arrow")

    def test_url_inventory_for_user2(self):
        self.assertTrue(
            self.client.login(username="leia", password="foobar"))
        url = '/rest/sheets/{}/inventory/'.format(self.sheet2.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        self.assertEqual(response.data[0]['description'], "potion of flying")


class CharacterSkillTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.other_user = factories.UserFactory(username="leia")
        self.char = factories.CharacterFactory(owner=self.owner, private=True)
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        factories.CharacterSkillFactory(character=self.char,
                                        skill__name="Ice Dancing",
                                        level=3)
        self.url = '/rest/characters/{}/characterskills/'.format(
                self.char.pk)

    def test_character_url(self):
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['skill'], 'Ice Dancing')
        self.assertEqual(response.data[0]['level'], 3)

    def test_url_invalid_user(self):
        self.assertTrue(
            self.client.login(username="leia", password="foobar"))
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 403)

    def test_verify_skill_level(self):
        factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                               skill_cost_1=2, skill_cost_2=3,
                               skill_cost_3=None)

        response = self.client.post(self.url, {"skill": "Lightsaber",
                                               "level": 0}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post(self.url, {"skill": "Lightsaber",
                                               "level": 3}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post(self.url, {"skill": "Lightsaber",
                                               "level": 2}, format="json")
        self.assertEqual(response.status_code, 201)
        cs = models.CharacterSkill.objects.get(character=self.char,
                                               skill="Lightsaber")
        self.assertEqual(cs.level, 2)

    def test_verify_skill_level_5(self):
        factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                               skill_cost_1=2, skill_cost_2=3,
                               skill_cost_3=4)

        response = self.client.post(self.url, {"skill": "Lightsaber",
                                               "level": 5}, format="json")
        self.assertEqual(response.status_code, 201)
        cs = models.CharacterSkill.objects.get(character=self.char,
                                               skill="Lightsaber")
        self.assertEqual(cs.level, 5)

    def test_verify_skill_level_modification_logged(self):
        skill = factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=4)
        cs = factories.CharacterSkillFactory(character=self.char,
                                             skill=skill, level=2)

        url = "{}{}/".format(self.url, cs.pk)

        response = self.client.patch(url, {"skill": "Lightsaber",
                                           "level": 5}, format="json")
        self.assertEqual(response.status_code, 200)

        cs = models.CharacterSkill.objects.get(character=self.char,
                                               skill="Lightsaber")
        self.assertEqual(cs.level, 5)

    def test_skill_remove_logged(self):
        skill = factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=4)
        cs = factories.CharacterSkillFactory(character=self.char, skill=skill,
                                             level=2)
        url = "{}{}/".format(self.url, cs.pk)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)

        log = models.CharacterLogEntry.objects.latest()
        self.assertIn("Removed skill Lightsaber 2", str(log))

    def test_skill_decrease_logged(self):
        skill = factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=4)
        cs = factories.CharacterSkillFactory(character=self.char, skill=skill,
                                             level=2)
        url = "{}{}/".format(self.url, cs.pk)
        response = self.client.patch(url, {'level': 1})
        self.assertEqual(response.status_code, 200)
        log = models.CharacterLogEntry.objects.latest()
        self.assertIn("Skill Lightsaber decreased to level 1",
                      str(log))

    def test_skill_add_logged(self):
        factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                               skill_cost_1=2, skill_cost_2=3,
                               skill_cost_3=4)

        response = self.client.post(self.url, {"skill": "Lightsaber",
                                               "level": 5}, format="json")
        self.assertEqual(response.status_code, 201)
        log = models.CharacterLogEntry.objects.latest()
        self.assertIn("Added skill Lightsaber 5",
                      str(log))

    def test_skill_invariant(self):
        factories.SkillFactory(name="Unarmed Combat",
                               skill_cost_0=None,
                               skill_cost_1=2, skill_cost_2=3,
                               skill_cost_3=4)

        skill = factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=4)

        cs = factories.CharacterSkillFactory(character=self.char, skill=skill,
                                             level=2)
        url = "{}{}/".format(self.url, cs.pk)
        response = self.client.patch(url, {'skill': "Unarmed Combat"})
        self.assertEqual(response.status_code, 400)
        response = self.client.patch(url, {'skill': "Unarmed Combat",
                                           'level': 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['skill'], "Lightsaber")


class SkillTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.tech_onek = factories.TechLevelFactory(name="OneK")
        self.tech_frp = factories.TechLevelFactory(name="Magic")
        self.onek = factories.CampaignFactory(name='1K',
                                              tech_levels=["OneK"])
        self.frp = factories.CampaignFactory(name='FRP',
                                             tech_levels=["OneK", "Magic"])

        factories.SkillFactory(name="Sword", tech_level=self.tech_onek)
        factories.SkillFactory(name="Kordism", tech_level=self.tech_frp)

    def test_main_url(self):
        url = '/rest/skills/'.format()
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_1k_campaign_url(self):
        url = '/rest/skills/campaign/{}/'.format(self.onek.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Sword")

    def test_frp_campaign_url(self):
        url = '/rest/skills/campaign/{}/'.format(self.frp.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(sorted([skill['name'] for skill in response.data]),
                         ["Kordism", "Sword"])

    def test_verify_skill_level_max_min(self):
        skill = factories.SkillFactory(name="Lightsaber", skill_cost_0=None,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=4)
        url = "/rest/skills/{}/".format(skill.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('max_level', response.data)
        self.assertIn('min_level', response.data)
        self.assertEqual(response.data['max_level'], 8)
        self.assertEqual(response.data['min_level'], 1)

    def test_verify_skill_level_max_min_2(self):
        skill = factories.SkillFactory(name="Gardening", skill_cost_0=1,
                                       skill_cost_1=2, skill_cost_2=3,
                                       skill_cost_3=None)
        url = "/rest/skills/{}/".format(skill.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('max_level', response.data)
        self.assertIn('min_level', response.data)
        self.assertEqual(response.data['max_level'], 2)
        self.assertEqual(response.data['min_level'], 0)


class FirearmTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.tech_onek = factories.TechLevelFactory(name="OneK")
        self.tech_frp = factories.TechLevelFactory(name="Magic")
        self.onek = factories.CampaignFactory(name='1K',
                                              tech_levels=["OneK"])
        self.frp = factories.CampaignFactory(name='FRP',
                                             tech_levels=["OneK", "Magic"])

        factories.BaseFirearmFactory(name="Catapult",
                                     tech_level=self.tech_onek)
        factories.BaseFirearmFactory(name="Magic Catapult",
                                     tech_level=self.tech_frp)

    def test_main_url(self):
        url = '/rest/firearms/'.format()
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_frp_campaign_url(self):
        url = '/rest/firearms/campaign/{}/'.format(self.frp.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(sorted([weapon['name']
                                 for weapon in response.data]),
                         ["Catapult", "Magic Catapult"])

    def test_1k_campaign_url(self):
        url = '/rest/firearms/campaign/{}/'.format(self.onek.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        weapon = response.data[0]
        self.assertEqual(weapon['name'], "Catapult"),


class SheetFirearmTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory()
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.url = '/rest/sheets/{}/sheetfirearms/'.format(self.sheet.pk)

    def test_url(self):
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_shows_firearms(self):
        self.sheet.firearms.add(factories.FirearmFactory())

        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        self.assertIsInstance(response.data[0]['base'], dict)
        self.assertIsInstance(response.data[0]['ammo'], dict)

    def test_adding_items(self):
        firearm = factories.BaseFirearmFactory(name="AK-47")
        ammo = factories.AmmunitionFactory(label="7.62x39")

        response = self.client.post(
                self.url,
                data={'ammo': ammo.pk,
                      'base': firearm.pk}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.sheet.firearms.all()[0].base.name, "AK-47")

    def test_deleting_items(self):
        firearm = factories.FirearmFactory()
        self.sheet.firearms.add(firearm)

        response = self.client.delete(
                "{}{}/".format(self.url, firearm.pk), format='json')
        self.assertEqual(response.status_code, 204)
        # Should still be found.
        models.Firearm.objects.get(pk=firearm.pk)
        self.assertEqual(len(self.sheet.firearms.all()), 0)

    # TODO: With SheetFirearms, modifications make sense.

# TODO: add test for checking private sheets restrict access to
# sheetfirearms correctly.


class SheetWeaponTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory()
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.url = '/rest/sheets/{}/sheetweapons/'.format(self.sheet.pk)

    def test_url(self):
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_shows_weapons(self):
        self.sheet.weapons.add(factories.WeaponFactory())

        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        self.assertIsInstance(response.data[0]['base'], dict)
        self.assertIsInstance(response.data[0]['quality'], dict)

    def test_adding_items(self):
        weapon = factories.WeaponTemplateFactory(name="Long sword")
        quality = factories.WeaponQualityFactory(name="L1")

        response = self.client.post(
                self.url,
                data={'base': weapon.pk,
                      'quality': quality.pk}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.sheet.weapons.all()[0].base.name, "Long sword")

    def test_deleting_items(self):
        weapon = factories.WeaponFactory()
        self.sheet.weapons.add(weapon)

        response = self.client.delete(
                "{}{}/".format(self.url, weapon.pk), format='json')
        self.assertEqual(response.status_code, 204)
        # Should still be found.
        models.Weapon.objects.get(pk=weapon.pk)
        self.assertEqual(len(self.sheet.weapons.all()), 0)

    # TODO: With SheetFirearms, modifications make sense.
