# encoding: utf-8

from __future__ import division

import logging
import itertools
from collections import namedtuple

from django.test import TestCase
import django.test

from django.urls import reverse
from sheet.models import Sheet, Character, Weapon, WeaponTemplate, Armor
from sheet.models import CharacterSkill, Skill, CharacterEdge, EdgeLevel
import sheet.forms as forms
import sheet.views as views
import sheet.models
from django_webtest import WebTest
import django.http
import sheet.factories as factories
import django.db

logger = logging.getLogger(__name__)


class SkillTestCase(TestCase):
    def test_specialized_minimum_level(self):
        """
        Current data in sheet has specialization skills in the following
        format, which the cost for the 0 level as 0.

        It should be changed to None (null) in the future, to underline
        that the skill cannot be purchased at that level.
        """
        skill = factories.SkillFactory(name="Sword", skill_cost_0=0,
                                       skill_cost_1=2,
                                       is_specialization=True)
        self.assertEqual(skill.get_minimum_level(), 1)


class BaseFirearmFormTestCase(TestCase):
    def setUp(self):
        self.tech_level = factories.TechLevelFactory(name='2K')
        self.pistol = factories.SkillFactory(name="Pistol")

    def _get_form(self, ammo_type, **extra):
        form_kwargs = {'name': 'Glock 19', 'range_s': 15, 'range_m': 30,
                       'range_l': 45, 'tech_level': self.tech_level.pk,
                       'weight': 0.6, 'base_skill': self.pistol, 'bypass': -1,
                       'dp': 10, 'durability': 5, 'duration': 0.1, 'stock': 1,
                       'accuracy': 1.0, 'barrel_length': 100, 'sight': 100,
                       'target_initiative': -1, 'weapon_class_modifier': 6,
                       'restricted_burst_rounds': 0,
                       'sweep_fire_disabled': False,
                       'magazine_size': 8,
                       'magazine_weight': 0.35,
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
        firearm = factories.BaseFirearmFactory(name="M29 (OICW)",
                                               ammunition_types=["5.56Nto"])

        self.assertEqual(firearm.get_ammunition_types(), [u"5.56Nto"])

        form = self._get_form('7.62x39', instance=firearm)
        new_firearm = form.save()

        self.assertEqual(firearm.pk, new_firearm.pk)
        self.assertEqual(new_firearm.get_ammunition_types(), [u"7.62x39"])


class Views(WebTest):
    def setUp(self):
        factories.UserFactory(username="admin")
        self.character = factories.CharacterFactory(occupation="Priest")
        self.assertTrue(self.client.login(username="admin", password="foobar"))

    def testViewCharacter(self):
        response = self.client.get("/characters/edit_char/{}/".format(
                self.character.pk))
        self.assertContains(response, "Priest")


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
            weapons=[
                factories.WeaponFactory(base__name="Short sword"),
                factories.WeaponFactory(base__name="Baton"),
            ],
            ranged_weapons=[
                factories.RangedWeaponFactory(base__name="Short bow"),
                factories.RangedWeaponFactory(base__name="Javelin"),
            ],
            transient_effects=[
                factories.TransientEffectFactory(name="Bless of templars"),
                factories.TransientEffectFactory(name="Courage of ancients"),
            ],
            character__skills=[
                ("Shooting", 3),
                ("Heckling", 2),
                ("Drunken boxing", 4),
            ],
            character__edges=[
                ("Toughness", 3),
                ("Athletic ability", 2),
                ("Bad eyesight", 4),
            ],
        )
        ammo = factories.AmmunitionFactory(calibre__name="5.56Nto", bullet_type="FMJ")
        self.original_sheet.firearms.add(factories.BaseFirearmFactory(name="M29 (OICW)"), through_defaults={"ammo": ammo})
        self.original_sheet.firearms.add(factories.BaseFirearmFactory(name="RK95"), through_defaults={"ammo": ammo})

        self.original_character = self.original_sheet.character
        factories.SheetMiscellaneousItemFactory(item__name="Geiger counter",
                                                sheet=self.original_sheet)

        factories.SheetMiscellaneousItemFactory(item__name="Bandolier",
                                                sheet=self.original_sheet)

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
        return ["{edge} {level}".format(edge=edge.edge.name,
                                        level=edge.level)
                for edge in character.edges.all()]

    def get_item_list(self, sheet, accessor):
        return ["{item}".format(item=str(item))
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
                         self.original_sheet.character.campaign)
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
                         "miscellaneous_items", "transient_effects"]:
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

        log = "/".join([str(e) for e in
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
