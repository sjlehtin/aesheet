# encoding: utf-8

from __future__ import division

import logging
import itertools
from collections import namedtuple

from django.test import TestCase
import django.test

from django.core.urlresolvers import reverse
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


class ItemHandlingTestCase(TestCase):
    fixtures = ["user", "char", "skills", "sheet", "weapons", "armor", "spell",
                "ranged_weapons", "campaigns"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def add_weapon_and_verify(self, weapon_template, quality, weapon,
                              prefix="add-weapon", accessor=None,
                              sheet_id=1):
        det_url = reverse(views.sheet_detail, args=[sheet_id])
        req_data = {'%s-item_template' % prefix: weapon_template,
                    '%s-item_quality' % prefix: quality}
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        def get_weapons(char):
            return [wpn.name for wpn in char.weapons()]
        if not accessor:
            accessor = get_weapons
        self.assertIn(weapon, accessor(response.context['sheet']))
        return response

    def add_ranged_weapon_and_verify(self, weapon_template, quality, weapon):
        def get_weapons(char):
            return [wpn.name for wpn in char.ranged_weapons()]
        return self.add_weapon_and_verify(weapon_template, quality, weapon,
                                          prefix="add-ranged-weapon",
                                          accessor=get_weapons)

    def add_firearm_and_verify(self, weapon_template, ammunition, weapon):
        def get_weapons(char):
            return [unicode(wpn) for wpn in char.firearms()]
        return self.add_weapon_and_verify(weapon_template, ammunition, weapon,
                                          prefix="add-firearm",
                                          accessor=get_weapons,
                                          sheet_id=3)

    def add_armor_and_verify(self, template, quality, item):
        return self.add_weapon_and_verify(template, quality, item,
                                          prefix="add-armor",
                                          accessor=lambda char:
                                          [char.armor().name])

    def add_helm_and_verify(self, template, quality, item):
        return self.add_weapon_and_verify(template, quality, item,
                                          prefix="add-helm",
                                          accessor=lambda char:
                                          [char.helm().name])

    def test_add_armor(self):
        response = self.client.get(reverse(views.sheet_detail,
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

    def test_add_remove_armor(self):
        det_url = reverse(views.sheet_detail, args=[1])

        hh = Armor.objects.get(name='Basinet wfa L5')
        # Add helmet.
        req_data = { 'add-existing-helm-item' : hh.pk }
        response = self.client.get(det_url)
        self.assertContains(response, "No helmet.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No helmet.")
        self.assertEquals(response.context['sheet'].helm().name,
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
        self.assertEquals(response.context['sheet'].armor().name,
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
        det_url = reverse(views.sheet_detail, args=[1])
        req_data = { 'add-spell-effect-effect' : 'Bull\'s strength L5' }
        response = self.client.get(det_url)

        self.assertContains(response, "No spell effects.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No spell effects.")
        self.assertEquals(response.context['sheet'].spell_effects()[0].name,
                          'Bull\'s strength L5')

        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'SpellEffect',
                     'remove-item' : 'Bull\'s strength L5' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No spell effects.")


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


class MovementRateTestCase(TestCase):
    def setUp(self):
        self.sheet = factories.SheetFactory()
        self.boots_of_speed = factories.MiscellaneousItemFactory(
            name="Boots of Speed")
        # These boots are special, they increase all speeds.
        speed = factories.ArmorSpecialQualityFactory(name="speed",
                                                     run_multiplier=2,
                                                     climb_multiplier=2,
                                                     swim_multiplier=2)
        self.boots_of_speed.armor_qualities.add(speed)

    def test_climbing_speed_unskilled(self):
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.climbing(), 43/60)

    def test_climbing_speed_skilled(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Climbing")
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.climbing(), 43/30)

    def test_climbing_speed_skilled_level_3(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Climbing",
                                        level=3)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.climbing(), 43/30 + 3)

    def test_natural_climber(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Climbing",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural climber",
                                       edge__level=1,
                                       edge__climb_multiplier=2)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.climbing(), (43/30 + 3) * 2)

    def test_munckin_climber(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Climbing",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural climber",
                                       edge__level=1,
                                       edge__climb_multiplier=2)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.climbing(), 2* 2 *(43/30 + 3))

    def test_swimming_speed_unskilled(self):
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.swimming(), 43/10)

    def test_swimming_speed_skilled(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Swimming")
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.swimming(), 43/5)

    def test_swimming_speed_skilled_level_3(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Swimming",
                                        level=3)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.swimming(), 43/5 + 3*5)

    def test_natural_swimmer(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Swimming",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural swimmer",
                                       edge__level=1,
                                       edge__swim_multiplier=2)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.swimming(), 2*(43/5 + 3*5))

    def test_munchkin_swimmer(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Swimming",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural swimmer",
                                       edge__level=1,
                                       edge__swim_multiplier=2)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.swimming(), 2 * 2 * ((43/5) + 3*5))

    def test_jumping_distance_unskilled(self):
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.jumping_distance(), 43/12)

    def test_jumping_distance_skilled_level_3(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Jumping",
                                        level=3)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.jumping_distance(), 43/12 + 3*0.75)

    def test_natural_jumper(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Jumping",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural Jumper",
                                       edge__level=1)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.jumping_distance(), 2*(43/12 + 3*0.75))

    def test_munchkin_jumper(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Jumping",
                                        level=3)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Natural Jumper",
                                       edge__level=1)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.jumping_distance(),
                               2 * 2 * (43/12 + 3*0.75))

    def test_jumping_height_skilled_level_3(self):
        factories.CharacterSkillFactory(character=self.sheet.character,
                                        skill__name="Jumping",
                                        level=3)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.jumping_height(), 43/36 + 3*0.25)

    def test_stealth_speed(self):
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.stealth(), 43/5)

    def test_increased_stealth_speed(self):
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Increased land speed",
                                       edge__level=2,
                                       edge__run_multiplier=1.5)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.stealth(), 43/5 * 1.5)

    def test_stealth_speed_should_not_increase_with_boots_of_speed(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.stealth(), 43/5)

    def test_running_speed(self):
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.running(), 43)

    def test_increased_running_speed(self):
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Increased land speed",
                                       edge__level=2,
                                       edge__run_multiplier=1.5)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.running(), 43 * 1.5)

    def test_enchanced_running_speed(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.running(), 43 * 2)

    def test_munchkin_running_speed(self):
        self.sheet.miscellaneous_items.add(self.boots_of_speed)
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Increased land speed",
                                       edge__level=2,
                                       edge__run_multiplier=1.5)
        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.running(), 43 * 2 * 1.5)

    def test_fly_speed(self):

        item = factories.MiscellaneousItemFactory(
            name="Wings of flying")
        # These boots are special, they increase all speeds.
        fly = factories.ArmorSpecialQualityFactory(name="fly",
                                                   fly_multiplier=6)
        item.armor_qualities.add(fly)

        self.sheet.miscellaneous_items.add(item)

        rates = self.sheet.movement_rates()
        self.assertAlmostEqual(rates.flying(), 6*43)
        # Verify that the speed stays constant with multiple calls.
        self.assertAlmostEqual(rates.flying(), 6*43)


class EdgeAndSkillHandlingTestCase(TestCase):
    def setUp(self):
        self.sword_skill = factories.SkillFactory(name="Sword",
                                                  skill_cost_2=None,
                                                  skill_cost_3=None)
        factories.SkillFactory(name="Unarmed combat")
        factories.SkillFactory(name="Martial arts expertise",
                               required_skills=("Unarmed combat", ))
        self.request_factory = django.test.RequestFactory()
        self.admin = factories.UserFactory(username="admin")
        self.sheet = factories.SheetFactory()
        self.assertTrue(self.client.login(username="admin", password="foobar"))
        self.sheet_url = reverse(views.sheet_detail,
                                 args=[self.sheet.pk])

    def _get_request(self):
        post = self.request_factory.post('/copy/')
        post.user = self.admin
        return post

    def test_add_remove_edge(self):
        edge_level = factories.EdgeLevelFactory(edge__name="Toughness",
                                                level=2)
        req_data = { 'add-edge-edge' : edge_level.pk}
        response = self.client.get(self.sheet_url)
        self.assertContains(response, "No edges.")
        response = self.client.post(self.sheet_url, req_data)
        self.assertRedirects(response, self.sheet_url)
        response = self.client.get(self.sheet_url)
        self.assertNotContains(response, "No edges.")
        edge_level = response.context['sheet'].edges()[0]
        self.assertEquals(edge_level.edge.name, 'Toughness')
        self.assertEquals(edge_level.level, 2)

        self.assertEqual(response.context['sheet'].character
                         .edge_level("Toughness"), 2)

        # Remove edge.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'CharacterEdge',
                     'remove-item' : edge_level.pk }
        response = self.client.post(self.sheet_url, req_data)

        self.assertRedirects(response, self.sheet_url)
        response = self.client.get(self.sheet_url)
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
        factories.EdgeLevelFactory(edge__name="Acute Touch", level=1,
                                   edge_skill_bonuses=(("Surgery", 13),))
        factories.SkillFactory(name="Surgery")

        self.add_skill(self.sheet.character, "Surgery", 0)
        self.add_edge(self.sheet.character, "Acute Touch")

        sheet = Sheet.objects.get(pk=self.sheet.pk)
        # Verify Acute Touch has an effect.
        self.assertEqual(sheet.eff_dex + 13,
                         sheet.skills.get(skill__name="Surgery")
                         .skill_check(sheet))


class Views(WebTest):
    def setUp(self):
        factories.UserFactory(username="admin")
        self.character = factories.CharacterFactory(occupation="Priest")
        self.assertTrue(self.client.login(username="admin", password="foobar"))

    def testViewCharacter(self):
        response = self.client.get("/characters/edit_char/{}/".format(
                self.character.pk))
        self.assertContains(response, "Priest")

    def testNewSpellEffect(self):
        det_url = reverse('add_spell_effect')
        form = self.app.get(det_url, user="admin").form
        form['fit'] = 40
        form['name'] = "MyEffect"
        form['type'] = "enhancement"

        response = self.client.post(det_url, dict(form.submit_fields()))
        self.assertRedirects(response, reverse(views.sheets_index))
        eff = sheet.models.SpellEffect.objects.get(name='MyEffect')
        self.assertEqual(eff.fit, 40)


class SheetOrganizationTestCase(TestCase):
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
        return ["{edge} {level}".format(edge=edge.edge.name,
                                        level=edge.level)
                for edge in character.edges.all()]

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
