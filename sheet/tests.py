# encoding: utf-8

import csv
import StringIO
import logging
import itertools
from collections import namedtuple

from django.test import TestCase

from django.core.urlresolvers import reverse
from sheet.models import Sheet, Character, Weapon, WeaponTemplate, Armor
from sheet.models import CharacterSkill, Skill, CharacterEdge, EdgeLevel
from sheet.models import CharacterLogEntry
from sheet.forms import AddSkillForm, AddXPForm
import sheet.forms as forms
import sheet.views
from sheet.views import marshal
import sheet.models
from django_webtest import WebTest
from django.contrib import auth
import django.http
import factories
import django.db
from django.conf import settings

logger = logging.getLogger(__name__)


class PrivateSheetTestCase(TestCase):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe")
        self.sheet.character.owner = self.owner
        self.sheet.character.save()

        self.other_client = django.test.Client()
        self.assertTrue(self.client.login(username=self.owner.username,
                                        password="foobar"))
        self.assertTrue(self.other_client.login(username=self.other.username,
                                              password="foobar"))

    def check_view_access(self, url, others_restricted):
        response = self.client.get(url)
        self.assertContains(response, self.sheet.character.name)
        response = self.other_client.get(url)
        if others_restricted:
            self.assertIsInstance(response, django.http.HttpResponseForbidden,
                          msg="Access to other users should be restricted.")
        else:
            self.assertContains(response, self.sheet.character.name)

    def test_character_view_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        self.check_view_access(character_url, others_restricted)

    def test_character_view_others_allowed(self):
        self.test_character_view_others_denied(others_restricted=False)

    def test_sheet_view_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        sheet_url = reverse('edit_sheet', args=(self.sheet.character.id, ))
        self.check_view_access(url=sheet_url,
                               others_restricted=others_restricted)

    def test_sheet_view_others_allowed(self):
        self.test_sheet_view_others_denied(others_restricted=False)

    def test_sheet_detail_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()
        sheet_url = reverse('sheet_detail', args=(self.sheet.character.id, ))
        self.check_view_access(url=sheet_url,
                               others_restricted=others_restricted)

    def test_sheet_detail_others_allowed(self):
        self.test_sheet_detail_others_denied(others_restricted=False)


class SetOwnerTestCase(WebTest):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_client = django.test.Client()
        self.assertTrue(self.other_client.login(username=self.other.username,
                                                password="foobar"))
        self.assertTrue(self.client.login(username=self.owner.username,
                                          password="foobar"))

    def test_character_owner_is_retained_in_edit(self):
        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        form = self.app.get(character_url, user=self.owner.username).form
        request_dict = dict(form.submit_fields())
        response = self.other_client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        # Owner should be the same as before.
        self.assertEqual(char.owner, self.owner)

    def test_sheet_owner_is_retained_in_edit(self):
        sheet_url = reverse('edit_sheet',
                            args=(self.sheet.id, ))
        form = self.app.get(sheet_url, user=self.owner.username).form
        request_dict = dict(form.submit_fields())
        response = self.other_client.post(sheet_url, request_dict)
        self.assertRedirects(response, reverse("sheet_detail",
                                               args=(self.sheet.id, )))
        sheet = Sheet.objects.get(character=self.sheet.character)
        # Owner should be the same as before.
        self.assertEqual(sheet.owner, self.owner)


class MarkPrivateTestCase(WebTest):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_client = django.test.Client()
        self.assertTrue(self.other_client.login(username=self.other.username,
                                                password="foobar"))
        self.assertTrue(self.client.login(username=self.owner.username,
                                          password="foobar"))

    def test_only_owner_can_mark_private(self):
        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        form = self.app.get(character_url, user=self.owner.username).form
        request_dict = dict(form.submit_fields())
        request_dict['private'] = True

        # For other users, the edit should be a success, but should not
        # do anything.
        response = self.other_client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        self.assertFalse(char.private)

        # For the owner, the private field should be updated.
        response = self.client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        self.assertTrue(char.private)

    def test_create_character_private_checked(self):
        character_url = reverse('add_char')
        form = self.app.get(character_url, user=self.owner.username).form
        request_dict = dict(form.submit_fields())
        request_dict['name'] = "Foobar"
        request_dict['race'] = "Tsapdai"
        request_dict['occupation'] = "Polaus"
        request_dict['private'] = True
        request_dict['campaign'] = factories.CampaignFactory(name="Foo").id
        response = self.other_client.post(character_url, request_dict)

        character = Character.objects.get(name="Foobar")
        sheet = Sheet.objects.get(
            character=character)
        self.assertRedirects(response, reverse("sheet_detail",
                                               args=(sheet.id, )))
        self.assertTrue(character.private)


class PrivateSheetListTestCase(TestCase):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_sheet = factories.SheetFactory.create(
            character__name="Jane Doe",
            character__owner=self.other)

        self.other_client = django.test.Client()
        self.assertTrue(self.client.login(username=self.owner.username,
                                        password="foobar"))
        self.assertTrue(self.other_client.login(username=self.other.username,
                                              password="foobar"))

    def get_objects(self, response):
        objects = [obj for campaign in response.context['campaigns']
                   for obj in campaign.objects]
        return objects

    def test_sheet_list_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        # For the owner, both sheets should be present.
        response = self.client.get(reverse('sheets_index'))
        objects = self.get_objects(response)
        self.assertIn(self.sheet, objects)
        self.assertIn(self.other_sheet, objects)

        # For the other, only the other sheet should be present if the primary
        # character has been marked private.
        response = self.other_client.get(reverse('sheets_index'))
        objects = self.get_objects(response)
        self.assertIn(self.other_sheet, objects)
        if others_restricted:
            self.assertNotIn(self.sheet, objects)
        else:
            self.assertIn(self.sheet, objects)

    def test_sheet_list_others_allowed(self):
        return self.test_sheet_list_others_denied(others_restricted=False)

    def test_character_list_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        # For the owner, both sheets should be present.
        response = self.client.get(reverse('characters_index'))
        objects = self.get_objects(response)
        self.assertIn(self.sheet.character, objects)
        self.assertIn(self.other_sheet.character, objects)

        # For the other, only the other sheet should be present if the primary
        # character has been marked private.
        response = self.other_client.get(reverse('characters_index'))
        objects = self.get_objects(response)
        self.assertIn(self.other_sheet.character, objects)
        if others_restricted:
            self.assertNotIn(self.sheet.character, objects)
        else:
            self.assertIn(self.sheet.character, objects)

    def test_character_list_others_allowed(self):
        return self.test_character_list_others_denied(others_restricted=False)


class ItemHandlingTestCase(TestCase):
    fixtures = ["user", "char", "skills", "sheet", "weapons", "armor", "spell",
                "ranged_weapons", "campaigns"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def add_weapon_and_verify(self, weapon_template, quality, weapon,
                              prefix="add-weapon", accessor=None,
                              sheet_id=1):
        det_url = reverse('sheet.views.sheet_detail', args=[sheet_id])
        req_data = {'%s-item_template' % prefix: weapon_template,
                    '%s-item_quality' % prefix: quality}
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        def get_weapons(char):
            return [wpn.name for wpn in char.weapons]
        if not accessor:
            accessor = get_weapons
        self.assertIn(weapon, accessor(response.context['char']))
        return response

    def add_ranged_weapon_and_verify(self, weapon_template, quality, weapon):
        def get_weapons(char):
            return [wpn.name for wpn in char.ranged_weapons]
        return self.add_weapon_and_verify(weapon_template, quality, weapon,
                                          prefix="add-ranged-weapon",
                                          accessor=get_weapons)

    def add_firearm_and_verify(self, weapon_template, ammunition, weapon):
        def get_weapons(char):
            return [unicode(wpn) for wpn in char.firearms]
        return self.add_weapon_and_verify(weapon_template, ammunition, weapon,
                                          prefix="add-firearm",
                                          accessor=get_weapons,
                                          sheet_id=3)

    def test_add_weapon(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        self.assertContains(self.client.get(det_url), "No weapons")
        response = self.add_weapon_and_verify("Greatsword, 2h", "L1",
                                              "Greatsword L1")
        self.assertNotContains(response, "No weapons.")
        self.add_weapon_and_verify("Whip", "L1", "Whip L1")
        self.add_weapon_and_verify("Whip", "normal", "Whip")

    def test_add_ranged_weapon(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        self.assertContains(self.client.get(det_url), "No ranged weapons")
        response = self.add_ranged_weapon_and_verify("Javelin", "L1",
                                                     "Javelin L1")
        self.assertNotContains(response, "No ranged weapons.")
        self.add_ranged_weapon_and_verify("Longbow w/ broadhead", "L1",
                                          "Longbow w/ broadhead L1")

    def add_armor_and_verify(self, template, quality, item):
        return self.add_weapon_and_verify(template, quality, item,
                                          prefix="add-armor",
                                          accessor=lambda char:
                                          [char.armor.name])

    def add_helm_and_verify(self, template, quality, item):
        return self.add_weapon_and_verify(template, quality, item,
                                          prefix="add-helm",
                                          accessor=lambda char:
                                          [char.helm.name])

    def test_add_armor(self):
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[1]))
        self.assertContains(response, "No armor.")
        self.assertContains(response, "No helmet.")
        response = self.add_armor_and_verify("Plate mail", "L5",
                                             "Plate mail L5")
        self.assertNotContains(response, "No armor.")
        self.add_armor_and_verify("Plate mail", "L3",
                                  "Plate mail L3")
        response = self.add_helm_and_verify("Basinet wfa", "L5",
                                            "Basinet wfa L5")
        self.assertNotContains(response, "No helmet.")
        self.add_helm_and_verify("Basinet wfa", "L3",
                                 "Basinet wfa L3")

    def test_add_remove_weapon(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        response = self.client.get(det_url)
        self.assertContains(response, "No weapons.")
        req_data = { 'add-existing-weapon-item' :
                     Weapon.objects.get(name="Greatsword L1").pk }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No weapons.")
        wpn = response.context['char'].weapons[0]
        self.assertEquals(wpn.name, 'Greatsword L1')

        tmpl = WeaponTemplate.objects.get(name='Greatsword, 2h')

        self.assertEquals(tmpl.name, 'Greatsword, 2h')
        self.assertEquals(wpn.base.name, 'Greatsword, 2h')

        checks = wpn.full.skill_checks()
        self.assertTrue(checks)

        # Remove weapon.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Weapon',
                     'remove-item' : '1',
                     }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No weapons.")


    def test_add_remove_armor(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])

        hh = Armor.objects.get(name='Basinet wfa L5')
        # Add helmet.
        req_data = { 'add-existing-helm-item' : hh.pk }
        response = self.client.get(det_url)
        self.assertContains(response, "No helmet.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No helmet.")
        self.assertEquals(response.context['char'].helm.name,
                          'Basinet wfa L5')
        # Remove helmet.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Helm',
                     }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No helmet.")

        # Add armor.
        aa = Armor.objects.get(name='Plate mail L5')
        req_data = { 'add-existing-armor-item' : aa.pk }
        response = self.client.get(det_url)
        self.assertContains(response, "No armor.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No armor.")
        self.assertEquals(response.context['char'].armor.name,
                          'Plate mail L5')

        # Remove armor.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Armor',
                     }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No armor.")

    def test_add_remove_effect(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-spell-effect-effect' : 'Bull\'s strength L5' }
        response = self.client.get(det_url)

        self.assertContains(response, "No spell effects.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No spell effects.")
        self.assertEquals(response.context['char'].spell_effects[0].name,
                          'Bull\'s strength L5')

        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'SpellEffect',
                     'remove-item' : 'Bull\'s strength L5' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No spell effects.")

    def test_weapon_properties(self):
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                   args=[2]))
        weapon = response.context['char'].weapons[0]

        self.assertEqual(weapon.name, "Voulge")
        self.assertTrue(unicode(weapon.full.damage()).endswith("+1"))
        self.assertEqual(weapon.bypass, -3)

        weapon = response.context['char'].ranged_weapons[0]

        self.assertEqual(weapon.name, "Javelin L1")
        self.assertEqual(weapon.bypass, -2)

    def test_armor_protection_level(self):
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[2]))
        self.assertEqual(response.context['char'].armor.armor_t_pl, 3)
        self.assertEqual(response.context['char'].helm.armor_h_pl, 2)

    def test_add_firearm(self):
        ammo = factories.AmmunitionFactory(label="9Pb",
                                           weight=7.5,
                                           velocity=440,
                                           bullet_type='FMJ')
        factories.BaseFirearmFactory(name="Glock 19",
                                     ammunition_types=('9Pb', '9Pb+'))

        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[1]))
        self.assertNotContains(response, "No firearms.",
                               msg_prefix="FRP character sheets should not "
                                          "contain firearms.")

        sheet = Sheet.objects.get(pk=1)
        self.assertFalse(sheet.character.campaign.has_firearms)

        sheet = Sheet.objects.get(pk=3)
        self.assertTrue(sheet.character.campaign.has_firearms)

        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[3]))
        self.assertContains(response, "No firearms.")

        self.add_firearm_and_verify("Glock 19", ammo.pk,
                                    "Glock 19 w/ 9Pb FMJ (3.30)")


class FirearmTestCase(TestCase):
    def setUp(self):
        factories.CampaignFactory(name="MR", tech_levels=("all", "2K"))
        self.sheet = factories.SheetFactory(character__campaign__name="MR")
        self.ammo = factories.AmmunitionFactory(label="9Pb",
                                                weight=7.5,
                                                velocity=440,
                                                bullet_type='FMJ')
        self.unsuitable_ammo = factories.AmmunitionFactory(label="7.62x39",
                                                           weight=8,
                                                           velocity=715,
                                                           bullet_type='FMJ')
        factories.AmmunitionFactory(label="5.56Nto",
                                    weight=3.6,
                                    velocity=913,
                                    bullet_type='FMJ')
        factories.BaseFirearmFactory(name="Glock 19",
                                     duration=0.11,
                                     stock=1,
                                     weight=0.6,
                                     ammunition_types=('9Pb', '9Pb+'))


    def _add_skill(self, skill_name, level=0):
        return factories.CharacterSkillFactory(
                    character=self.sheet.character,
                    skill=factories.SkillFactory(name=skill_name),
                    level=level)

    def test_basic(self):
        form = forms.AddFirearmForm(instance=self.sheet,
                                    data={'item_template': 'Glock 19',
                                          'item_quality': self.ammo.pk })
        self.assertTrue(form.is_valid())
        sheet = form.save()
        self.assertTrue(unicode(sheet.firearms.all()[0]).startswith(
            "Glock 19 w/ 9Pb FMJ"))

    def test_ammo_validation(self):
        """
        Verify that chosen ammo for the weapon is validated to be suitable.
        """
        form = forms.AddFirearmForm(instance=self.sheet,
                                    data={'item_template': 'Glock 19',
                                          'item_quality':
                                              self.unsuitable_ammo.pk })
        self.assertFalse(form.is_valid())

    def test_single_fire_skill_checks_unskilled(
            self, level=None,
            expected=None,
            expected_rof=None):
        # default case for unskilled.
        if expected is None:
            expected = [(0.5, 32), (1, 24), (2, 22), (3, 15), (4, 8), (5, 1)]

        firearm = factories.FirearmFactory(base__name="Glock 19",
                                           ammo__label='9Pb',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        if level is not None:
            cs = self._add_skill("Pistol", level)
            self.assertEqual(cs.level, level)

        if expected_rof is not None:
            self.assertAlmostEqual(self.sheet.rof(firearm), expected_rof,
                                   places=2)

        for (cc, exp) in zip(self.sheet.firearm_skill_checks(firearm),
                             expected):
            self.assertEqual(cc.action, exp[0])
            self.assertEqual(cc.check, exp[1])

    def test_single_fire_skill_checks_level_0(self):
        self.test_single_fire_skill_checks_unskilled(
            level=0,
            expected=[(0.5, 53), (1, 46), (2, 43), (3, 37), (4, 30), (5, 23)])

    def test_single_fire_skill_checks_level_5(self):
        self.test_single_fire_skill_checks_unskilled(
            level=5,
            expected=[(0.5, 78), (1, 72), (2, 70), (3, 68), (4, 68), (5, 60),
                      (6, 55), (7, 50), (8, 46)],
            expected_rof=4.267)

    def test_fit_counter_for_rof_penalties_single_fire(self):
        self.sheet.character.cur_fit = 90
        self.sheet.character.save()
        self.test_single_fire_skill_checks_unskilled(
            level=0,
            expected=[(0.5, 53), (1, 46), (2, 43), (3, 43), (4, 43), (5, 38)])

    def test_weapon_class_matters(self):
        factories.BaseFirearmFactory(name="Foo",
                                            duration=0.11,
                                            stock=1,
                                            weight=0.6,
                                            weapon_class_modifier=6,
                                            ammunition_types=('9Pb', '9Pb+'))
        factories.BaseFirearmFactory(name="Bar",
                                            duration=0.11,
                                            stock=1,
                                            weight=0.6,
                                            weapon_class_modifier=15,
                                            ammunition_types=('9Pb', '9Pb+'))
        wpn1 = factories.FirearmFactory(base__name="Foo",
                                        ammo__label='9Pb',
                                        ammo__bullet_type='FMJ')
        wpn2 = factories.FirearmFactory(base__name="Bar",
                                        ammo__label='9Pb',
                                        ammo__bullet_type='FMJ')
        checks = filter(lambda check: check.check,
                        self.sheet.firearm_skill_checks(wpn1))
        idx = len(checks) - 1
        self.assertNotEqual(checks[idx].check,
                            self.sheet.firearm_skill_checks(wpn2)[idx].check)


class AutofireTestCase(TestCase):
    def setUp(self):
        factories.CampaignFactory(name="MR", tech_levels=("all", "2K"))
        self.sheet = factories.SheetFactory(character__campaign__name="MR")
        # Note, stats are made to match classic sheet for cross-checking
        # purposes.  Some things might be different in up-to-date weapon
        # sheets.
        factories.BaseFirearmFactory(name="SAKO RK95",
                                     target_initiative=-4,
                                     draw_initiative=-5,
                                     range_s=50,
                                     range_m=150,
                                     range_l=300,
                                     duration=0.1,
                                     stock=1.2,
                                     weight=3.7,
                                     autofire_rpm=650,
                                     autofire_class="C",
                                     base_skill__name="Long guns",
                                     ammunition_types=('5.56Nto',))

        factories.BaseFirearmFactory(name="M29 (OICW)",
                                     target_initiative=-4,
                                     draw_initiative=-5,
                                     range_s=85,
                                     range_m=200,
                                     range_l=350,
                                     duration=0.1,
                                     stock=1.25,
                                     weight=6.3,
                                     autofire_rpm=800,
                                     autofire_class="A",
                                     base_skill__name="Long guns",
                                     ammunition_types=('7.62x39',))

        factories.BaseFirearmFactory(name="Pancor Jackhammer",
                                     target_initiative=-2,
                                     draw_initiative=-5,
                                     range_s=40,
                                     range_m=75,
                                     range_l=110,
                                     duration=0.1,
                                     stock=1.25,
                                     weight=4.6,
                                     autofire_rpm=240,
                                     autofire_class="E",
                                     base_skill__name="Long guns",
                                     ammunition_types=('12ga.',))

        factories.AmmunitionFactory(label="7.62x39",
                                    weight=8,
                                    velocity=715,
                                    bullet_type='FMJ')

        factories.AmmunitionFactory(label="12ga.",
                                    weight=41.3,
                                    velocity=381,
                                    bullet_type='1Buck')

    def _add_skill(self, skill_name, level=0):
        return factories.CharacterSkillFactory(
                    character=self.sheet.character,
                    skill=factories.SkillFactory(name=skill_name),
                    level=level)

    def verify_burst_checks(self, firearm, expected):
        for (burst, exc) in zip(
                self.sheet.firearm_burst_fire_skill_checks(firearm),
                expected):
            expected_action = exc[0]
            expected_init = exc[1]
            expected_checks = exc[2]

            self.assertEqual(burst.initiative, expected_init)
            self.assertEqual(burst.action, expected_action)

            self.assertListEqual(burst.checks, expected_checks)

        self.assertEqual(
            len(self.sheet.firearm_burst_fire_skill_checks(firearm)),
            len(expected))

    def test_burst_fire_skill_checks(self):
        self._add_skill("Long guns")
        self._add_skill("Autofire")

        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        expected = [[0.5, +7, [53, 50, 44, 35, 23]],
                    [1, +3 , [46, 43, 37, 28, 16]],
                    [2, -8, [36, 33, 27, 18 , 6]],
                    [3, -4, [22, 19, 13, 4, -8]],
                    [4, None, [None]*5]]

        self.verify_burst_checks(firearm, expected)

    def test_autofire_penalty_for_burst_fire(self):
        """
        There should be -10 penalty for burst fire without the autofire skill.
        """
        self._add_skill("Long guns")

        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        expected = [[0.5, +7, [43, 40, 34, 25, 13]],
                    [1, +3, [36, 33, 27, 18, 6]],
                    [2, -8, [26, 23, 17, 8, -4]],
                    [3, -4, [12, 9, 3, -6, -18]],
                    [4, None, [None]*5]]

        self.verify_burst_checks(firearm, expected)

    def test_low_rpm_burst_fire_check(self):
        """
        There should be less checks per "column" with a low-RPM gun.
        Also differs in autofire class.
        """
        self._add_skill("Long guns")
        self._add_skill("Autofire")

        firearm = factories.FirearmFactory(base__name="Pancor Jackhammer",
                                           ammo__label='12ga.',
                                           ammo__bullet_type='1Buck')
        self.sheet.firearms.add(firearm)

        expected = [[0.5, +8, [53, 48, None, None, None]],
                    [1, +4 , [43, 38, None, None, None]],
                    [2, -14, [22, 17, None, None, None]],
                    [3, None, [None]*5],
                    [4, None, [None]*5]]

        self.verify_burst_checks(firearm, expected)

    Expected = namedtuple("Exp", ["length", "first", "last"])

    def verify_sweep_fire_checks(self, af_class, check, firearm, fit_counter=0):
        # There should be 4 different categories of sweeps.
        self.assertEqual(
            len(self.sheet.firearm_sweep_fire_skill_checks(firearm)),
            4)
        check_5 = check + 5 - 10
        check_10 = check + 10 - 10
        check_15 = check + 15 - 10
        check_20 = check + 20 - 10
        expected = [self.Expected(length=4, first=check_5,
                                  last=check_5 + 17 * af_class + fit_counter),
                    self.Expected(length=8, first=check_10,
                                  last=check_10 + 35 * af_class + fit_counter),
                    self.Expected(length=12, first=check_15,
                                  last=check_15 + 53 * af_class + fit_counter),
                    self.Expected(length=16, first=check_20,
                                  last=check_20 + 71 * af_class + fit_counter),
        ]
        for exp, sweep in itertools.izip_longest(
                expected,
                self.sheet.firearm_sweep_fire_skill_checks(firearm)):
            self.assertEqual(exp.length, len(sweep.checks))
            self.assertEqual(exp.first, sweep.checks[0])
            self.assertEqual(exp.last, sweep.checks[-1])

    def test_sweep_fire_skill_checks(self):
        """
        There should be -10 penalty for sweep fire with the autofire skill.
        """
        self._add_skill("Long guns")
        self._add_skill("Autofire")

        check = self.sheet.eff_dex
        af_class = -3 # C
        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        self.verify_sweep_fire_checks(af_class, check, firearm)

    def test_autofire_penalty_for_sweep_fire(self):
        """
        There should be -20 penalty for sweep fire without the autofire skill.
        """
        self._add_skill("Long guns")

        check = self.sheet.eff_dex - 10
        af_class = -3 # C
        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        self.verify_sweep_fire_checks(af_class, check, firearm)

    def test_fit_counter_for_rof_penalties_burst_fire(self):
        self._add_skill("Long guns")
        self._add_skill("Autofire")
        self.sheet.character.cur_fit = 90
        self.sheet.character.save()

        check = self.sheet.eff_dex
        af_class = -3 # C
        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        self.verify_sweep_fire_checks(af_class, check, firearm,
                                      fit_counter=15)

    def test_sweep_fire_skill_checks_class_a(self):
        """
        There should be -10 penalty for sweep fire with the autofire skill.
        """
        self._add_skill("Long guns")
        self._add_skill("Autofire")

        check = self.sheet.eff_dex
        af_class = -1 # A
        firearm = factories.FirearmFactory(base__name="M29 (OICW)",
                                           ammo__label='5.56Nto',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)

        self.verify_sweep_fire_checks(af_class, check, firearm)

    def test_autofire_sweep_disabled(self):
        """
        There should be -10 penalty for burst fire without the autofire skill.
        """
        self._add_skill("Long guns")

        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)
        firearm.base.sweep_fire_disabled = True
        self.assertFalse(firearm.has_sweep_fire())

    def test_autofire_restricted_burst(self):
        """
        There should be -10 penalty for burst fire without the autofire skill.
        """
        self._add_skill("Long guns")

        firearm = factories.FirearmFactory(base__name="SAKO RK95",
                                           ammo__label='7.62x39',
                                           ammo__bullet_type='FMJ')
        self.sheet.firearms.add(firearm)
        firearm.base.restricted_burst_rounds = 2

        expected = [[0.5, +7, [43, 40, None, None, None]],
                    [1, +3, [36, 33, None, None, None]],
                    [2, -8, [26, 23, None, None, None]],
                    [3, -4, [12, 9, None, None, None]],
                    [4, None, [None]*5]]

        self.verify_burst_checks(firearm, expected)


class BaseFirearmFormTestCase(TestCase):
    def setUp(self):
        self.tech_level = factories.TechLevelFactory(name='2K')
        self.pistol = factories.SkillFactory(name="Pistol")

    def _get_form(self, ammo_type, **extra):
        form_kwargs = {'name': 'Glock 19', 'range_s': 15, 'range_m': 30,
                       'range_l': 45, 'tech_level': self.tech_level.pk,
                       'weight': 0.6, 'base_skill': self.pistol, 'bypass': -1,
                       'dp': 10, 'durability': 5, 'duration': 0.1, 'stock': 1,
                       'target_initiative': -1, 'weapon_class_modifier': 6,
                       'restricted_burst_rounds': 0,
                       'sweep_fire_disabled': False,
                       'ammo_types': ammo_type}

        form = forms.CreateBaseFirearmForm(
            data=form_kwargs, **extra)
        return form

    def test_invalid_ammo_types(self):

        for ammo_type in ["9Pb,", "9Pb!", "[guug]"]:
            form = self._get_form(ammo_type)
            self.assertFalse(form.is_valid())

    def test_ammo_types_saved(self):
        """
        Check that ammo_types field works.
        """
        form = self._get_form("9Pb+|9Pb")
        self.assertTrue(form.is_valid())
        firearm = form.save()
        self.assertListEqual(sorted(firearm.get_ammunition_types()),
                             [u"9Pb", u"9Pb+"])

    def test_valid_ammo_types(self):

        for ammo_type in ["12ga.", "12/70", "112LAW", "25-06", "7.62x53R"]:
            form = self._get_form(ammo_type)
            self.assertTrue(form.is_valid(),
                            msg="{ammo_type} should be valid".format(
                                ammo_type=ammo_type))

    def test_changing_ammo_type(self):
        firearm = factories.FirearmFactory(base__name="M29 (OICW)",
                                           ammo__label='5.56Nto',
                                           ammo__bullet_type='FMJ')
        self.assertEqual(firearm.base.get_ammunition_types(), [u"5.56Nto"])

        form = self._get_form('7.62x39', instance=firearm.base)
        new_firearm = form.save()

        self.assertEqual(firearm.base.pk, new_firearm.pk)
        self.assertEqual(new_firearm.get_ammunition_types(), [u"7.62x39"])


class FirearmImportExportTestcase(TestCase):
    firearm_csv_data = """\
"BaseFirearm",,,,,,,,,,,,,,,,,,,,
"name","description","notes","tech_level","draw_initiative","durability","dp","weight","duration","stock","base_skill","skill","skill2","type","target_initiative","ammo_weight","range_s","range_m","range_l","ammunition_types"
"Glock 19",,,"2K",-3,5,10,1,0.11,1,"Handguns",,,"P",-2,0.1,20,40,60,"9Pb|9Pb+"

"""

    ammo_csv_data = """\
"Ammunition",,,,,,,,,,
"id","num_dice","dice","extra_damage","leth","plus_leth","label","bullet_type","tech_level","weight","velocity","bypass"
,1,6,1,6,2,"9Pb+","FMJ","2K",7.5,400,0

"""

    def setUp(self):
        factories.TechLevelFactory(name="2K")
        factories.SkillFactory(name="Handguns", tech_level__name="2K")

    def test_import_firearms(self):
        marshal.import_text(self.firearm_csv_data)
        firearm = sheet.models.BaseFirearm.objects.get(name="Glock 19")
        # Import should create the ammunition types.
        self.assertListEqual(sorted(["9Pb", "9Pb+"]),
                             sorted(firearm.get_ammunition_types()))

    def test_export_firearms(self):
        marshal.import_text(self.firearm_csv_data)

        csv_data = marshal.csv_export(sheet.models.BaseFirearm)
        reader = csv.reader(StringIO.StringIO(csv_data))
        data_type = reader.next()
        self.assertEqual(data_type[0], "BaseFirearm")

        header = reader.next()
        data_row = reader.next()
        idx = header.index("ammunition_types")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "9Pb|9Pb+")

    def test_import_ammunition(self):
        marshal.import_text(self.ammo_csv_data)
        ammo = sheet.models.Ammunition.objects.filter(label='9Pb+')
        self.assertEqual(ammo[0].label, "9Pb+")

    def test_export_ammunition(self):
        marshal.import_text(self.ammo_csv_data)

        csv_data = marshal.csv_export(sheet.models.Ammunition)
        reader = csv.reader(StringIO.StringIO(csv_data))
        data_type = reader.next()
        self.assertEqual(data_type[0], "Ammunition")

        header = reader.next()
        data_row = reader.next()

        idx = header.index("label")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "9Pb+")

        idx = header.index("id")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "1")


class EdgeAndSkillHandling(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "test_skills", "campaigns", "armor"]

    def setUp(self):
        self.client.login(username="admin", password="admin")

    def test_adding_skill(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-skill-skill' : 'Weapon combat',
                     'add-skill-level' : '5'}
        response = self.client.get(det_url)
        self.assertContains(response, "No skills.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No skills.")
        skills = response.context['char'].skills[0]
        self.assertEquals(skills.skill.name, 'Weapon combat')
        self.assertEquals(skills.level, 5)

    def test_required_skills_present(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-skill-skill' : 'Weapon combat',
                     'add-skill-level' : '5'}
        response = self.client.get(det_url)
        self.assertContains(response, "No skills.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No skills.")
        req_data = { 'add-skill-skill' : 'Sword',
                     'add-skill-level' : '1'}
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "Required skill Weapon "
                               "combat missing.")

    def test_required_skills_missing(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-skill-skill' : 'Martial arts expertise',
                     'add-skill-level' : '4'}
        response = self.client.get(det_url)
        self.assertContains(response, "No skills.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No skills.")
        self.assertTrue('Unarmed combat' in
                        response.context['char'].missing_skills.values())

        skills = response.context['char'].skills
        self.assertEquals(skills[0].skill.name, 'Martial arts expertise')
        self.assertEquals(skills[0].level, 4)

        req_data = { 'add-skill-skill' : 'Unarmed combat',
                     'add-skill-level' : '4'}
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertTrue('Unarmed combat' not in
                        response.context['char'].missing_skills.values())
        unarmed = filter(lambda xx: xx.skill.name == "Unarmed combat",
                    response.context['char'].skills)
        self.assertEqual([sk.skill.name for sk in unarmed],
                         ["Unarmed combat"])

    def test_add_remove_edge(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-edge-edge' : '2'}
        response = self.client.get(det_url)
        self.assertContains(response, "No edges.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No edges.")
        ce = response.context['char'].edges[0]
        self.assertEquals(ce.edge.edge.name, 'Toughness')
        self.assertEquals(ce.edge.level, 2)

        self.assertEqual(response.context['char'].character
                         .edge_level("Toughness"), 2)

        # Remove edge.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'CharacterEdge',
                     'remove-item' : ce.pk }
        response = self.client.post(det_url, req_data)

        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No edges.")

    def add_edge(self, character, edge_name, level=1):
        ce = CharacterEdge()
        ce.character = character
        edge = EdgeLevel.objects.get(edge__name=edge_name, level=level)
        ce.edge = edge
        ce.save()

    def add_skill(self, character, skill_name, level):
        cs = CharacterSkill()
        cs.character = character
        skill = Skill.objects.get(name=skill_name)
        cs.skill = skill
        cs.level = level
        cs.save()

    def test_acute_touch_edge_skill_mod(self):
        sheet = Sheet.objects.get(pk=1)

        self.add_skill(sheet.character, "Surgery", 0)
        self.add_edge(sheet.character, "Acute Touch")

        sheet = Sheet.objects.get(pk=1)
        # Verify Acute Touch has an effect.
        self.assertEqual(sheet.eff_dex + 15,
                         sheet.skills.get(skill__name="Surgery").check(sheet))

    def test_childhood_eduction_skill_mod(self):
        sheet = Sheet.objects.get(pk=2)
        original = sheet.character.total_sp
        self.add_edge(sheet.character, "Childhood Education", 1)
        sheet = Sheet.objects.get(pk=2)
        self.assertEqual(sheet.edge_sp, 8)
        self.assertEqual(original + 8, sheet.character.total_sp)

    def test_specialist_training1_skill_mod(self):
        sheet = Sheet.objects.get(pk=2)
        original = sheet.character.total_sp
        self.add_edge(sheet.character, "Specialist Training", 1)
        sheet = Sheet.objects.get(pk=2)
        self.assertEqual(sheet.edge_sp, 6)
        self.assertEqual(original + 6, sheet.character.total_sp)

    def test_specialist_training2_skill_mod(self):
        sheet = Sheet.objects.get(pk=2)
        original = sheet.character.total_sp
        self.add_edge(sheet.character, "Specialist Training", 2)
        sheet = Sheet.objects.get(pk=2)
        self.assertEqual(sheet.edge_sp, 10)
        self.assertEqual(original + 10, sheet.character.total_sp)

    def test_flaw_notes(self):
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[2]))
        self.assertNotContains(response, "Reduced tolerance to cold.")

        sheet = Sheet.objects.get(pk=2)
        self.add_edge(sheet.character, "Cold Sensitivity", 1)
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[2]))
        self.assertContains(response, "Reduced tolerance to cold.")

    def test_edge_notes(self):
        sheet = Sheet.objects.get(pk=2)
        self.add_edge(sheet.character, "Superior Endurance", 1)
        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[2]))
        self.assertContains(response, "Recover AC penalty")

    def test_increase_skill_level(self):
        cs = CharacterSkill.objects.get(skill__name="Unarmed combat",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 4)
        det_url = reverse('sheet.views.sheet_detail', args=[2])
        req_data = { 'skill-level-modify-skill_id' : cs.pk,
                     'skill-level-modify-function' : 'add' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        cs = CharacterSkill.objects.get(skill__name="Unarmed combat",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 5)

    def test_decrease_skill_level(self):
        cs = CharacterSkill.objects.get(skill__name="Unarmed combat",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 4)
        det_url = reverse('sheet.views.sheet_detail', args=[2])
        req_data = { 'skill-level-modify-skill_id' : cs.pk,
                     'skill-level-modify-function' : 'dec' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        cs = CharacterSkill.objects.get(skill__name="Unarmed combat",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 3)

    def test_decreasing_skill_level_for_specializations(self):
        """
        Skill level should not decrease if the lower skill levels do not have
        a cost (like Sword: -/2/-/-).
        """
        cs = CharacterSkill.objects.get(skill__name="Sword",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 1)
        det_url = reverse('sheet.views.sheet_detail', args=[2])
        req_data = { 'skill-level-modify-skill_id' : cs.pk,
                     'skill-level-modify-function' : 'dec' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url) # XXX
        cs = CharacterSkill.objects.get(skill__name="Sword",
                                        character__name="Yukaghir")
        self.assertEqual(cs.level, 1)

    def test_obsoleted_skill_level(self):
        # Add a skill with a known invalid level.
        cs = CharacterSkill()
        cs.character = Character.objects.get(pk=1)
        cs.skill = Skill.objects.get(pk="Sword")
        cs.level = 2
        cs.save()

        response = self.client.get(reverse('sheet.views.sheet_detail',
                                           args=[1]))
        self.assertContains(response, "invalid skill level")


    def test_duplicated_skill_level(self):
        form = AddSkillForm(
            instance=Character.objects.get(pk=1),
            data={ 'skill': Skill.objects.get(name="Sword"),
                   'level': 1 })
        self.assertTrue(form.is_valid(),
                        "Adding a new skill should be ok")
        form.save()
        form = AddSkillForm(
            instance=Character.objects.get(pk=1),
            data={ 'skill': Skill.objects.get(name="Sword"),
                   'level': 1 })
        self.assertFalse(form.is_valid(),
                        "Adding an existing skill should result in an error")
        self.assertIn("__all__", form.errors)


class Logging(WebTest):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "assigned_edges", "armor", "campaigns"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_stat_changes(self):
        det_url = reverse('sheet.views.sheet_detail', args=[2])
        req_data = { 'stat-modify-function' : 'add',
                     'stat-modify-stat' : 'cur_fit' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.user.username, "admin")
        self.assertEqual(entry.character.pk, 2)
        self.assertEqual(entry.field, "cur_fit")
        self.assertEqual(entry.amount, 1)
        former_id = entry.id

        # If a stat is increased multiple times and perhaps
        # decreased within the time limit, there should be only a single
        # log entry per user.

        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.amount, 2)
        self.assertEqual(former_id, entry.id)

        req_data = { 'stat-modify-function' : 'dec',
                     'stat-modify-stat' : 'cur_fit' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.amount, 1)
        self.assertEqual(former_id, entry.id)

        # If a stat is increased and then decreased within the time
        # limit, there shouldn't be a log entry.
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        self.assertEqual(CharacterLogEntry.objects.count(), 0)

    def test_base_char_edit(self):
        old_ch = Character.objects.get(pk=2)

        det_url = reverse('edit_character', args=[2])
        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) - 2)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit - 2, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) + 5)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit + 3, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 3)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) - 2)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit + 1, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 1)

        form = self.app.get(det_url, user='admin').form
        form['free_edges'].value = str(0)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(new_ch.free_edges, 0)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)

        form['deity'].value = "Tharizdun"
        response = form.submit()
        self.assertRedirects(response, det_url)


class AddXpTestCase(TestCase):
    def setUp(self):
        self.request_factory = django.test.RequestFactory()
        self.admin = factories.UserFactory(username="admin")

    def _get_request(self):
        get = self.request_factory.post('/copy/')
        get.user = self.admin
        return get

    def test_added_xp(self):
        ch = factories.CharacterFactory(name="John Doe",
                                        owner=self.admin)
        form = AddXPForm({'add_xp': '15'},
                         request=self._get_request(),
                         instance=ch)
        self.assertTrue(form.is_valid())
        form.save()
        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.amount, 15)
        self.assertEqual(entry.field, "total_xp")


class ModelBasics(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "assigned_edges", "armor", "campaigns"]

    def test_basic_stats(self):
        ss = Sheet.objects.get(pk=1)
        self.assertEqual(ss.character.edge_level('Toughness'), 2)
        sta = ss.stamina
        body = ss.body
        mana = ss.mana
        # XXX the above just checks that accessing the values does not cause
        # exceptions in the property handling.


class Views(TestCase):
    fixtures = ["campaigns", "user", "char", "sheet", "armor",
                "edges", "basic_skills"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def testViewCharacter(self):
        response = self.client.get("/characters/edit_char/2/")
        self.assertContains(response, "Priest")

    def testNewSpellEffect(self):
        det_url = reverse('add_spell_effect')
        response = self.client.get(det_url)
        self.assertContains(response, "Fit")

        response = self.client.post(det_url, { 'fit' : 40,
                                               'name' : 'MyEffect',
                                               'type' : 'enhancement',
                                               'cc_skill_levels' : 0,
                                               'ref' : 0,
                                               'lrn' : 0,
                                               'int' : 0,
                                               'psy' : 0,
                                               'wil' : 0,
                                               'cha' : 0,
                                               'pos' : 0,
                                               'mov' : 0,
                                               'dex' : 0,
                                               'imm' : 0,
                                               'saves_vs_fire' : 0,
                                               'saves_vs_cold' : 0,
                                               'saves_vs_lightning' : 0,
                                               'saves_vs_poison' : 0,
                                               'saves_vs_all' : 0,
                                               })
        self.assertRedirects(response,
                             reverse(sheet.views.sheets_index))
        eff = sheet.models.SpellEffect.objects.get(name='MyEffect')
        self.assertEqual(eff.fit, 40)


class ImportExport(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills", "campaigns",
                "armor"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_add_new_skill_with_required_skills(self):
        det_url = reverse("import")
        response = self.client.post(det_url, { 'import_data' :
        "Skill\n"
        "name,tech_level,description,notes,can_be_defaulted,"
        "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
        "skill_cost_3,type,stat,required_edges,required_skills\n"
        "Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat",
                                               })
        self.assertRedirects(response, reverse("import"))
        response = self.client.get(reverse("browse",
                                           args=["Skill"]))
        self.assertContains(response, "Unarmed combat")
        hdr = response.context['header']
        name_index = hdr.index("name")
        required_skills_index = hdr.index("required skills")
        for rr in response.context['rows']:
            if rr[name_index] == "Throw":
                self.assertEqual(rr[required_skills_index], "Unarmed combat")
                break

        response = self.client.post(det_url, {
            'import_data' :
            "Skill\n"
            "name,tech_level,description,notes,can_be_defaulted,"
            "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
            "skill_cost_3,type,stat,required_edges,required_skills\n"
            "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
            "Unarmed combat|Surgery",
            })
        self.assertRedirects(response, reverse("import"))
        sk = Skill.objects.get(name="Surgical strike")
        self.assertTrue(sk.required_skills.filter(name="Unarmed combat"
                                                  ).exists())
        self.assertTrue(sk.required_skills.filter(name="Surgery").exists())

        # Try it again.
        response = self.client.post(det_url, {
            'import_data' :
                "Skill\n"
                "name,tech_level,description,notes,can_be_defaulted,"
                "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
                "skill_cost_3,type,stat,required_edges,required_skills\n"
                "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
                "Unarmed combat | Surgery",
            })
        self.assertRedirects(response, reverse("import"))

    def test_import_export(self):
        for data_type in sheet.models.EXPORTABLE_MODELS:
            logger.info("Import test for %s", data_type)
            response = self.client.get(reverse("export", args=[data_type]))
            self.assertIn("attachment", response.get('Content-Disposition'))
            self.assertContains(response, data_type)
            def mangle(data):
                for index, ll in enumerate(data.splitlines()):
                    if index >= 2:
                        yield ll + "," + "\n"
                    elif index == 1:
                        yield ll + ",edgelevel" + "\n"
                    else:
                        yield ll + "\n"

            response = self.client.post(reverse("import"),
                                        { "import_data":
                                          ''.join(mangle(response.content)) })
            self.assertRedirects(response, reverse("import"))

    def test_export_unicode(self):
        unicode_word = u'βαλλίζω'
        factories.SkillFactory(name="Ballet dancing",
                               description=u"This is ballet dancing, from the "
                                           u"greek root of '{uword}' (to "
                                           u"dance, to jump about).".format(
                                   uword=unicode_word
                               ))
        data = marshal.csv_export(sheet.models.Skill)
        self.assertTrue(data.startswith('Skill'),
                        msg="The data should start with the table name")
        self.assertIn(unicode_word, data.decode('utf-8'))

    def test_exported_data_types(self):
        """
        Verify that certain minimum set of tables are exportable.
        """
        self.assertNotIn('BaseWeaponTemplate', sheet.models.EXPORTABLE_MODELS,
                         msg="Abstract classes should not be exportable")
        for dt in ['ArmorTemplate',
            'Armor', 'ArmorQuality', 'ArmorSpecialQuality',
            'SpellEffect', 'WeaponTemplate', 'Weapon',
            'WeaponQuality', 'WeaponSpecialQuality', 'Skill', 'Edge',
            'EdgeLevel', 'EdgeSkillBonus',
            'RangedWeaponTemplate', 'RangedWeapon']:
            self.assertIn(dt, sheet.models.EXPORTABLE_MODELS)
        self.assertIn('TechLevel', sheet.models.EXPORTABLE_MODELS)


class ImportExportDependencies(TestCase):
    csv_data = """\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,
Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat
Unarmed combat,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Jackadeering
Jackadeering,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""

    self_loop = """\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""

    def setUp(self):
        factories.TechLevelFactory(name="all")

    def test_import_with_deps(self):
        marshal.import_text(self.csv_data)
        self.assertListEqual(
            sorted([sk.name for sk in sheet.models.Skill.objects.all()]),
            sorted(["Nutcasing", "Throw", "Unarmed combat", "Jackadeering"]))

    def test_import_with_self_loops(self):
        """
        Verify that importing with selfloops works.
        """
        marshal.import_text(self.self_loop)
        self.assertListEqual(
            [sk.name for sk in sheet.models.Skill.objects.all()],
            ["Nutcasing"])
        skill = sheet.models.Skill.objects.get(name="Nutcasing")
        self.assertEqual(len(skill.required_skills.all()), 0)


class ImportExportPostgresSupport(TestCase):

    def test_fix_sequence_after_import_in_postgres(self):
        """
        Note, this test only affects PostgreSQL installations.
        """

        new_value = 666
        sheet.models.TechLevel.objects.create(id=new_value, name="foobar")
        marshal.update_id_sequence(sheet.models.TechLevel)
        if (settings.DATABASES['default']['ENGINE'] ==
            "django.db.backends.postgresql_psycopg2"):
            cc = django.db.connection.cursor()
            cc.execute("""
            SELECT last_value FROM sheet_techlevel_id_seq""")
            last_value = cc.fetchall()[0][0]
            self.assertEqual(last_value, new_value)


class TechLevelTestCase(TestCase):
    fixtures = ["armor", "user", "char", "sheet", "ranged_weapons",
                "weapons", "skills", "edges", "campaigns"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def verify_character(self, sheet_id, frp_items, onek_items,
                         twok_items, threek_items):
        response = self.client.get(reverse(sheet.views.sheet_detail,
                                           args=[sheet_id]))
        add_skill = response.context['add_skill_form']
        self.assertEqual(add_skill.fields['skill'].queryset.filter(
            name="Active priest").exists(), frp_items)
        self.assertEqual(add_skill.fields['skill'].queryset.filter(
            name="Electronics").exists(), twok_items)
        self.assertEqual(add_skill.fields['skill'].queryset.filter(
            name="Machine empathy").exists(), threek_items)

        add_weapon = response.context['add_weapon_form']
        self.assertEqual(add_weapon.fields['item_template'].queryset.filter(
            name="Voulge, 2h").exists(), onek_items)
        self.assertEqual(add_weapon.fields['item_quality'].queryset.filter(
            name="L1").exists(), frp_items)

        add_armor = response.context['add_armor_form']
        self.assertEqual(add_armor.fields['item_template'].queryset.filter(
            name="Plate mail").exists(), onek_items)
        self.assertEqual(add_armor.fields['item_quality'].queryset.filter(
            name="L1").exists(), frp_items)

        add_helm = response.context['add_helm_form']
        self.assertEqual(add_helm.fields['item_template'].queryset.filter(
            name="Basinet wfa").exists(), onek_items)
        self.assertEqual(add_helm.fields['item_quality'].queryset.filter(
            name="L1").exists(), frp_items)

        add_existing_weapon = response.context['add_existing_weapon_form']
        self.assertEqual(add_existing_weapon.fields['item'].queryset
                         .filter(name="Greatsword L1").exists(), frp_items)
        add_existing_ranged_weapon = response.context[
                                     'add_existing_ranged_weapon_form']
        self.assertEqual(add_existing_ranged_weapon.fields['item'].queryset
                         .filter(name="Javelin L1").exists(), frp_items)
        add_existing_helm = response.context['add_existing_helm_form']
        self.assertEqual(add_existing_helm.fields['item'].queryset
                         .filter(name="Basinet wfa L5").exists(), frp_items)
        add_existing_armor = response.context['add_existing_armor_form']
        self.assertEqual(add_existing_armor.fields['item'].queryset
                         .filter(name="Plate mail L5").exists(), frp_items)

    def test_tech_levels(self):
        # Martel (FRP)
        self.verify_character(1, True, True, False, False)
        # Asa (MR)
        self.verify_character(3, False, False, True, False)
        # Atlas (3K)
        self.verify_character(4, False, False, True, True)
        # Jan (GZ)
        self.verify_character(5, False, True, False, True)


class SheetOrganization(TestCase):
    def setUp(self):
        factories.SheetFactory(character__name="Martel",
                               character__campaign__name="FRP")
        factories.SheetFactory(character__name="Yukaghir",
                               character__campaign__name="FRP")
        factories.SheetFactory(character__name="Asa",
                               character__campaign__name="MR")
        self.admin = factories.UserFactory(username='admin')
        self.assertTrue(self.client.login(username='admin',
                                          password='foobar'))

    def test_sheet_organization(self):
        campaigns = Sheet.get_by_campaign(self.admin)
        self.assertListEqual([u"FRP", u"MR"],
                             [campaign.name for campaign in campaigns])
        self.assertListEqual([u"Martel", u"Yukaghir", u"Asa"],
                             [sheet.character.name for campaign in campaigns
                              for sheet in campaign.objects])

    def test_character_organization(self):
        campaigns = Character.get_by_campaign(self.admin)
        self.assertListEqual(["FRP", "MR"],
                             [campaign.name for campaign in campaigns])
        self.assertListEqual(["Martel", "Yukaghir", "Asa"],
                             [character.name for campaign in campaigns
                              for character in campaign.objects])

    def test_character_view(self):
        response = self.client.get(reverse('characters_index'))
        self.assertIsInstance(response.context['campaigns'][0],
                              sheet.models.CampaignItem)
        # Verify the headings are present.
        self.assertContains(response, 'FRP')
        self.assertContains(response, 'MR')

    def test_sheet_view(self):
        response = self.client.get(reverse('sheets_index'))
        self.assertIsInstance(response.context['campaigns'][0],
                              sheet.models.CampaignItem)
        # Verify the headings are present.
        self.assertContains(response, 'FRP')
        self.assertContains(response, 'MR')


class CreateURLTestCase(TestCase):
    def setUp(self):
        factories.UserFactory(username="admin")
        self.assertTrue(self.client.login(username="admin", password="foobar"))

    def test_urls(self):
        from sheet.urls import CREATE_NAMES
        for name in CREATE_NAMES:
            url = reverse(name)
            logger.info("Trying {0}...".format(url))
            response = self.client.get(url)
            self.assertContains(response, "submit",
                                msg_prefix="{0} has errors".format(name))


class TestHelperMixin(object):
    def assertInMessages(self, response, message):
        self.assertIn('messages', response.context)
        for msg in response.context['messages']:
            if message in msg.message:
                return
        self.fail("Message {msg} not found among messages.".format(msg=message))


class AddCharacterTestCase(TestHelperMixin, WebTest):
    """
    Verify that after creating a character a
    new sheet for the character has been created, a message about the
    successful operation is displayed, and the user is redirected to the sheet
    edit page.
    """

    def setUp(self):
        self.campaign = factories.CampaignFactory(name='2K')
        self.admin = factories.UserFactory(username="admin", password="admin")
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_add_character(self):
        add_char_url = reverse('add_char')
        form = self.app.get(add_char_url, user='admin').form
        form['name'] = "John Doe"
        form['occupation'] = "adventurer"
        form['campaign'] = self.campaign.pk
        form['race'] = 'human'
        post_response = self.client.post(add_char_url,
                                         dict(form.submit_fields()))
        last_id = sheet.models.Sheet.objects.order_by('-id')[0].pk
        sheet_url = reverse('sheet_detail', args=(last_id, ))

        response = self.client.get(sheet_url)
        self.assertInMessages(response, 'Character added successfully.')
        self.assertRedirects(post_response, sheet_url)


class AddSheetTestCase(TestHelperMixin, WebTest):
    def setUp(self):
        self.campaign = factories.CampaignFactory(name='2K')
        self.admin = factories.UserFactory(username="admin", password="admin")
        self.character = factories.CharacterFactory(name="John Doe",
                                                    owner=self.admin,
                                                    campaign=self.campaign,
                                                    occupation="adventurer")

        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_add_sheet(self):
        add_sheet_url = reverse('add_sheet')
        form = self.app.get(add_sheet_url, user='admin').form
        form['character'] = self.character.pk
        form.submit()
        post_response = self.client.post(add_sheet_url,
                                         dict(form.submit_fields()))
        last_id = sheet.models.Sheet.objects.order_by('-id')[0].pk
        sheet_url = reverse('sheet_detail', args=(last_id, ))
        response = self.client.get(sheet_url)
        self.assertRedirects(post_response, sheet_url)
        self.assertInMessages(response, "Sheet added successfully.")


class EditCharacterTestCase(TestHelperMixin, WebTest):
    """
    Verify that the user is redirected to the editing page and a message is
    displayed about the operation's success.
    """

    def setUp(self):
        factories.UserFactory(username="admin", password="admin")
        self.character = factories.CharacterFactory(campaign__name="2k",
                                                    name="John Doe")
        self.url = reverse('edit_character', args=(self.character.pk, ))
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_edit_character(self):
        form = self.app.get(self.url, user='admin').form
        form['cur_fit'].value = "50"
        post_response = self.client.post(self.url, dict(form.submit_fields()))
        response = self.client.get(self.url)
        self.assertInMessages(response, 'Character edit successful.')
        self.assertRedirects(post_response, self.url)


class CharacterFormTestCase(TestCase):
    def test_fields(self):
        form = sheet.forms.AddCharacterForm()
        # Combined, the two field sets should hold all the fields.
        self.assertSetEqual(set([field.name
                                 for field in form.visible_fields()]),
                            set([field.name for row in form.base_stat_fields()
                                 for field in row.fields]) |
                            set([field.name
                                 for field in form.derived_stat_fields()]) |
                            set([field.name
                                 for field in form.non_stat_fields()]))


class SheetCopyTestCase(TestCase):
    def setUp(self):
        self.request_factory = django.test.RequestFactory()
        self.admin = factories.UserFactory(username="admin")
        self.original_owner = factories.UserFactory(username="leia")
        self.original_sheet = factories.SheetFactory(
            character__name="John Doe",
            character__campaign__name="3K",
            character__owner=self.original_owner,

            armor=factories.ArmorFactory(base__name="Hard Leather"),
            helm=factories.HelmFactory(base__name="Leather hood"),
            weapons=[factories.WeaponFactory(base__name="Short sword"),
                     factories.WeaponFactory(base__name="Baton")],
            ranged_weapons=[
                factories.RangedWeaponFactory(base__name="Short bow"),
                factories.RangedWeaponFactory(base__name="Javelin")],
            firearms=[factories.FirearmFactory(base__name="M29 (OICW)",
                                           ammo__label='5.56Nto',
                                           ammo__bullet_type='FMJ'),
                      factories.FirearmFactory(base__name="RK95",
                                           ammo__label='5.56Nto',
                                           ammo__bullet_type='FMJ')],
            miscellaneous_items=[
                factories.MiscellaneousItemFactory(name="Geiger counter"),
                factories.MiscellaneousItemFactory(name="Bandolier")],
            spell_effects=[
                factories.SpellEffectFactory(name="Bless of templars"),
                factories.SpellEffectFactory(name="Courage of ancients")],
            character__skills=[("Shooting", 3),
                               ("Heckling", 2),
                               ("Drunken boxing", 4)],
            character__edges=[("Toughness", 3),
                               ("Athletic ability", 2),
                               ("Bad eyesight", 4)])
        self.original_character = self.original_sheet.character

    def _get_request(self):
        get = self.request_factory.post('/copy/')
        get.user = self.admin
        return get

    def _post_request(self):
        post = self.request_factory.post('/copy/')
        post.user = self.admin
        return post

    def get_skill_list(self, character):
        return ["{skill} {level}".format(skill=skill.skill.name,
                                         level=skill.level)
                for skill in character.skills.all()]

    def get_edge_list(self, character):
        return ["{edge} {level}".format(edge=ce.edge.edge.name,
                                        level=ce.edge.level)
                for ce in character.edges.all()]

    def get_item_list(self, sheet, accessor):
        return ["{item}".format(item=unicode(item))
                for item in getattr(sheet, accessor).all()]

    def test_copy_sheet(self):
        data = {'sheet': self.original_sheet.pk,
                'to_name': 'Foo Johnson'}
        form = sheet.forms.CopySheetForm(request=self._post_request(),
                                         data=data)
        self.assertTrue(form.is_valid())
        new_sheet = form.save()

        # Verify the old sheet is still there.
        self.assertEqual(sheet.models.Sheet.objects.get(
            character__name='John Doe'), self.original_sheet)
        orig = sheet.models.Character.objects.get(name='John Doe')
        self.assertEqual(orig, self.original_character)
        self.assertEqual(orig.owner, self.original_owner)

        self.assertEqual(new_sheet.character.owner, self.admin)

        self.assertEqual(sheet.models.Sheet.objects.get(
            character__name='John Doe'), self.original_sheet)

        self.assertEqual(new_sheet.character.campaign,
                         self.original_sheet.campaign)
        self.assertNotEqual(new_sheet, self.original_sheet)

        # Skills should match.
        self.assertListEqual(
            self.get_skill_list(new_sheet.character),
            self.get_skill_list(self.original_character))

        self.assertTrue(CharacterSkill.objects.filter(
            character=new_sheet.character).exists())

        # Edges should match.
        self.assertListEqual(
            self.get_edge_list(new_sheet.character),
            self.get_edge_list(self.original_character))

        self.assertTrue(CharacterEdge.objects.filter(
            character=new_sheet.character).exists())

        self.assertEqual(self.original_sheet.helm,
                         new_sheet.helm)
        self.assertIsNotNone(new_sheet.helm)
        self.assertEqual(self.original_sheet.armor,
                         new_sheet.armor)
        self.assertIsNotNone(new_sheet.armor)

        for accessor in ["weapons", "firearms", "ranged_weapons",
                         "miscellaneous_items", "spell_effects"]:
            logger.debug("Checking {acc}...".format(acc=accessor))
            self.assertListEqual(self.get_item_list(new_sheet,
                                                    accessor),
                                 self.get_item_list(self.original_sheet,
                                                    accessor))
            self.assertTrue(getattr(self.original_sheet,
                                    accessor).exists())

        self.assertEqual(new_sheet.owner, self.admin)

    def test_copied_character_has_log_entry(self):
        data = {'sheet': self.original_sheet.pk,
                'to_name': 'Foo Johnson'}
        form = sheet.forms.CopySheetForm(request=self._post_request(),
                                         data=data)
        self.assertTrue(form.is_valid())
        new_sheet = form.save()

        log = "/".join([unicode(e) for e in
                        new_sheet.character.characterlogentry_set.all()])
        self.assertIn("Copied from {original_name}.".format(
            original_name=self.original_character.name), log)

    def test_copy_fails_if_target_exists(self):
        factories.SheetFactory(character__name="Jane Doe")

        form = sheet.forms.CopySheetForm(request=self._post_request(),
                                         data={'sheet': self.original_sheet.pk,
                                               'to_name': 'Jane Doe'})
        self.assertFalse(form.is_valid())
        self.assertIn("already exists", '/'.join(form.errors['to_name']))

    def test_copy_sheet_choices_exclude_private_sheets(self):
        private_sheet = factories.SheetFactory(
            character__name="Johnny Mnemonic",
            character__owner=self.original_owner,
            character__private=True)
        form = sheet.forms.CopySheetForm(request=self._get_request())
        sheet_ids = [pair[0] for pair in form.fields['sheet'].choices]
        self.assertNotIn(private_sheet.id, sheet_ids)


class CopySheetViewTestCase(TestCase):
    def setUp(self):
        self.admin = factories.UserFactory(username="admin")
        factories.SheetFactory(character__name="Foo")
        self.middle_sheet = factories.SheetFactory(character__name="Bar")
        factories.SheetFactory(character__name="Qux")
        self.assertTrue(self.client.login(username="admin", password="foobar"))

    def test_initial_choice(self):
        response = self.client.get(reverse('copy_sheet',
                                           kwargs={'sheet_id':
                                                       self.middle_sheet.id}))
        # Check that the form is rendered.
        self.assertContains(response, 'to_name')
        form = response.context['form']
        # Sheet id should be selected with the given URL.
        self.assertIn('sheet', form.initial)
        self.assertEqual(int(form['sheet'].value()), self.middle_sheet.id)


class DamageMixin(object):
    def assertDamageEqual(self, damage, num_dice=1, dice=6, extra_damage=0,
                          leth=5, plus_leth=0):
        self.assertEqual(damage.num_dice, num_dice)
        self.assertEqual(damage.dice, dice)
        self.assertEqual(damage.extra_damage, extra_damage)
        self.assertEqual(damage.leth, leth)
        self.assertEqual(damage.plus_leth, plus_leth)


class DamageTestCase(DamageMixin, TestCase):
    def setUp(self):
        sword = factories.WeaponTemplateFactory(name="Bastard sword",
                                                num_dice=2, dice=6,
                                                extra_damage=-1, leth=6,
                                                durability=7, bypass=-2)
        normal_quality = factories.WeaponQualityFactory(name="normal")
        magic_quality = factories.WeaponQualityFactory(name="L5", damage=5,
                                                       leth=3,
                                                       durability=5)
        self.normal_weapon = factories.WeaponFactory(base=sword,
                                                     quality=normal_quality)
        self.magic_weapon = factories.WeaponFactory(base=sword,
                                                    quality=magic_quality)
        self.strong_man = factories.SheetFactory(character__cur_fit=250)

    def test_damage_normal(self):
        self.normal_man = factories.SheetFactory()
        self.assertDamageEqual(self.normal_man.damage(
            self.normal_weapon,
            use_type=self.normal_man.FULL),
            num_dice=2, dice=6, extra_damage=-1, leth=6)
        self.assertDamageEqual(self.normal_man.damage(
            self.magic_weapon,
            use_type=self.normal_man.FULL),
            num_dice=2, dice=6, extra_damage=4, leth=9)

    def test_damage_capped(self):
        # Extra damage for FIT cannot exceed base maximum damage from weapon.
        # Maximum lethality of the weapon cannot be more than
        # weapon durability + 1.
        self.assertDamageEqual(self.strong_man.damage(
            self.normal_weapon,
            use_type=self.strong_man.FULL),
            num_dice=2, dice=6, extra_damage=10, leth=8)
        self.assertDamageEqual(self.strong_man.damage(
            self.magic_weapon,
            use_type=self.strong_man.FULL),
            num_dice=2, dice=6, extra_damage=20, leth=13)

    def test_crossbow_damage(self):
        """
        Crossbows receive no FIT bonuses.
        """
        weapon = factories.RangedWeaponFactory(
            base__name="Heavy crossbow",
            base__weapon_type=sheet.models.RangedWeaponTemplate.CROSSBOW,
            base__num_dice=1,
            base__dice=6,
            base__extra_damage=3,
            base__leth=5,
            base__plus_leth=2,
            quality__name="normal")
        self.assertDamageEqual(self.strong_man.damage(weapon),
            num_dice=1, dice=6, extra_damage=3, leth=5, plus_leth=2)

    def test_bow_damage(self):
        """
        Bows have maximum FIT, based on what pull they are created.
        """
        weapon = factories.RangedWeaponFactory(
            base__name="Composite shortbow",
            base__weapon_type=sheet.models.RangedWeaponTemplate.BOW,
            base__num_dice=1,
            base__dice=6,
            base__extra_damage=1,
            base__leth=5,
            base__plus_leth=-1,
            quality__name="normal")
        # Assume pull for FIT 90.
        # Max FIT 90: PRI dmg: (FIT-45)/10, leth: (FIT-45)/40
        # dmg = 5, leth = 1
        self.assertDamageEqual(self.strong_man.damage(weapon),
            num_dice=1, dice=6, extra_damage=6, leth=6, plus_leth=-1)

        weapon = factories.RangedWeaponFactory(
            base__name="Composite shortbow",
            base__weapon_type=sheet.models.RangedWeaponTemplate.BOW,
            quality__name="normal75",
            quality__max_fit=75)

        # Max FIT 75: PRI dmg: (FIT-45)/10, leth: (FIT-45)/40
        # dmg = 3, leth = 1
        self.assertDamageEqual(self.strong_man.damage(weapon),
            num_dice=1, dice=6, extra_damage=4, leth=6, plus_leth=-1)

    def test_javelin_damage(self):
        weapon = factories.RangedWeaponFactory(
            base__name="Special javelin",
            base__num_dice=2,
            base__dice=6,
            base__leth=4,
            quality__name="normal")

        self.assertDamageEqual(self.strong_man.damage(weapon),
            num_dice=2, dice=6, extra_damage=12, leth=6)

    def test_shield_damage(self):
        """
        Totally different damages on attack and defense.
        """
        pass

    # XXX firearms receive no FIT bonuses (this is handled already by the
    # separation of the damage to ammo)


class WeaponSizeTestCase(DamageMixin, TestCase):
    def setUp(self):
        self.sword_template = factories.WeaponTemplateFactory(name="Bastard sword",
                                                num_dice=2, dice=6,
                                                extra_damage=-1, leth=5,
                                                durability=7, bypass=-2,
                                                dp=12,
                                                weight=2.4,
                                                draw_initiative=-5,
                                                ccv=12,
                                                roa=0.85)
        self.normal_quality = factories.WeaponQualityFactory(name="normal")
        self.strong_man = factories.SheetFactory(character__cur_fit=250)

    def test_large_weapon_damage(self):
        normal_weapon = factories.WeaponFactory(base=self.sword_template,
                                                quality=self.normal_quality,
                                                size=2)

        damage = normal_weapon.damage()
        self.assertDamageEqual(damage, num_dice=4,
                               extra_damage=-2, leth=6)
        self.assertEqual(normal_weapon.durability, 9)
        self.assertEqual(normal_weapon.bypass, -3)
        self.assertEqual(normal_weapon.dp, 24)
        self.assertEqual(normal_weapon.ccv, 17)
        self.assertEqual(normal_weapon.roa(), 0.70)
        self.assertEqual(normal_weapon.draw_initiative, -7)
        self.assertEqual(normal_weapon.weight, 7.2)

    def test_huge_weapon_damage(self):
        normal_weapon = factories.WeaponFactory(base=self.sword_template,
                                                quality=self.normal_quality,
                                                size=3)

        damage = normal_weapon.damage()
        self.assertDamageEqual(damage, num_dice=6,
                               extra_damage=-3, leth=7)
        self.assertEqual(normal_weapon.durability, 11)
        self.assertEqual(normal_weapon.bypass, -4)
        self.assertEqual(normal_weapon.dp, 48)
        self.assertEqual(normal_weapon.ccv, 22)
        self.assertEqual(normal_weapon.roa(), 0.55)
        self.assertEqual(normal_weapon.draw_initiative, -9)
        self.assertEqual(normal_weapon.weight, 21.6)

    def test_gargantuan_weapon_damage(self):
        normal_weapon = factories.WeaponFactory(base=self.sword_template,
                                                quality=self.normal_quality,
                                                size=4)

        damage = normal_weapon.damage()
        self.assertDamageEqual(damage, num_dice=8,
                               extra_damage=-4, leth=8)
        self.assertEqual(normal_weapon.durability, 13)
        self.assertEqual(normal_weapon.bypass, -5)
        self.assertEqual(normal_weapon.dp, 96)
        self.assertEqual(normal_weapon.ccv, 27)
        self.assertEqual(normal_weapon.roa(), 0.40)
        self.assertEqual(normal_weapon.draw_initiative, -11)
        self.assertEqual(normal_weapon.weight, 64.8)

    def test_weapon_roa_decimal_field_bug(self):
        """
        There was a bug in roa calculation, where the decimal field was not
        cast to float properly.
        """
        factories.WeaponQualityFactory(name="L3", roa=0.03)
        weapon = factories.WeaponFactory(base=self.sword_template,
                                                quality__name="L3",
                                                size=2)
        self.assertEqual(weapon.roa(), 0.73)

class SheetViewTestCase(TestCase):
    def test_sheet_view(self):
        char_sheet = factories.SheetFactory()
        factories.CharacterSkillFactory(character=char_sheet.character,
                                        skill__name="Endurance / run",
                                        skill__skill_cost_0=0,
                                        level=2)
        factories.SkillFactory(name="Balance", skill_cost_0=0)

        factories.CharacterSkillFactory(character=char_sheet.character,
                                        skill__name="Concealment")
        factories.CharacterSkillFactory(character=char_sheet.character,
                                        skill__name="Handguns")
        factories.CharacterSkillFactory(character=char_sheet.character,
                                        skill__name="Liberal arts")
        sheet_view = sheet.views.SheetView(char_sheet)

        costs = sum([skill.cost() for skill in sheet_view.skills()])
        costs += sum([skill.cost() for skill in sheet_view.physical_skills()])
        costs += sheet_view.endurance().cost()
        costs += sheet_view.balance().cost()

        # Skill lists should have skills with total cost equal to the total
        # amount of skill points used.
        self.assertEqual(sheet_view.used_sp(), costs)

        skills = dict([(sk.skill_name, sk)
                       for sk in sheet_view.physical_skills()])

        self.assertEqual(skills['Stealth'].check(), 22)
        self.assertEqual(skills['Stealth'].level(), "B")
        self.assertEqual(skills['Stealth'].cost(), 0)

        self.assertEqual(skills['Concealment'].check(), 43)
        self.assertEqual(skills['Concealment'].level(), 0)
        self.assertEqual(skills['Concealment'].cost(), 2)
        self.assertIsInstance(skills['Concealment'].remove_form(),
                              sheet.forms.RemoveGenericForm)
        self.assertIsInstance(skills['Concealment'].add_level_form(),
                              sheet.forms.CharacterSkillLevelModifyForm)
        self.assertIsInstance(skills['Concealment'].dec_level_form(),
                              sheet.forms.CharacterSkillLevelModifyForm)

        endurance = sheet_view.endurance()
        self.assertEqual(endurance.check()['wil'], 53)
        self.assertEqual(endurance.check()['fit'], 53)
        self.assertEqual(endurance.level(), 2)
        self.assertEqual(endurance.cost(), 3)
        self.assertIsInstance(endurance.remove_form(),
                              sheet.forms.RemoveGenericForm)
        self.assertIsInstance(endurance.add_level_form(),
                              sheet.forms.CharacterSkillLevelModifyForm)
        self.assertIsInstance(endurance.dec_level_form(),
                              sheet.forms.CharacterSkillLevelModifyForm)

        balance = sheet_view.balance()
        self.assertEqual(balance.check()['ref'], 43)
        self.assertEqual(balance.check()['mov'], 43)
        self.assertEqual(balance.level(), 0)
        self.assertEqual(balance.cost(), 0)
