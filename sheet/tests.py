from django.test import TestCase
from django.core.urlresolvers import reverse
from sheet.models import Sheet, Character, Weapon, WeaponTemplate, Armor
from sheet.models import CharacterSkill, Skill, CharacterEdge, EdgeLevel
from sheet.models import CharacterLogEntry
from sheet.forms import AddSkillForm, AddXPForm
import sheet.forms as forms
import sheet.views, sheet.models
from django_webtest import WebTest
import django.contrib.auth as auth
import factories
import logging

logger = logging.getLogger(__name__)

class ItemHandling(TestCase):
    fixtures = ["user", "char", "skills", "sheet", "weapons", "armor", "spell",
                "ranged_weapons", "campaigns", "firearms"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def add_weapon_and_verify(self, weapon_template, quality, weapon,
                              prefix="add-weapon", accessor=None):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
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
            return [wpn.name for wpn in char.firearms]
        return self.add_weapon_and_verify(weapon_template, ammunition, weapon,
                                          prefix="add-firearm",
                                          accessor=get_weapons)

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

        factories.AmmunitionFactory(name='FMJ')
        self.add_firearm_and_verify("Glock 19", "FMJ", "Glock 19 w/ FMJ")


class FirearmTestCase(TestCase):
    def setUp(self):
        factories.CampaignFactory(name="MR", tech_levels=("all", "2k"))
        self.sheet = factories.SheetFactory(character__campaign__name="MR")
        self.ammo = factories.AmmunitionFactory(label="9x19", type='FMJ')
        factories.BaseFirearmFactory(name="Glock 19",
                                     ammunition_types=('9Pb', '9Pb+'))

    def test_basic(self):
        form = forms.AddFirearmForm(instance=self.sheet,
                                    data={'item_template': 'Glock 19',
                                          'item_quality': self.ammo.pk })
        self.assertTrue(form.is_valid())
        sheet = form.save()
        self.assertEqual(unicode(sheet.firearms.all()[0]),
                         "Glock 19 w/ 9x19 FMJ")

    def test_ammo_validation(self):
        """
        Verify that chosen ammo for the weapon is validated to be suitable.
        """

    def test_single_fire_skill_checks(self):
        pass

    def test_burst_fire_skill_checks(self):
        pass

    def test_sweep_fire_skill_checks(self):
        pass

    def test_fit_counter_for_rof_penalties(self):
        pass

    def test_autofire_penalty_for_burst_fire(self):
        pass


class FirearmImportExportTestcase(TestCase):
    pass

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


def get_fake_request(username):
    class FakeReq(object):
        pass
    req = FakeReq()
    req.user = auth.models.User.objects.get(username=username)
    return req


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
        form['cur_fit'].value = int(form['cur_fit'].value) - 2
        response = form.submit()
        self.assertRedirects(response, reverse('sheet.views.characters_index'))
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit - 2, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = int(form['cur_fit'].value) + 5
        response = form.submit()
        self.assertRedirects(response, reverse('sheet.views.characters_index'))
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit + 3, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 3)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = int(form['cur_fit'].value) - 2
        response = form.submit()
        self.assertRedirects(response, reverse('sheet.views.characters_index'))
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit + 1, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 1)


        form = self.app.get(det_url, user='admin').form
        form['free_edges'].value = 0
        response = form.submit()
        self.assertRedirects(response, reverse('sheet.views.characters_index'))
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(new_ch.free_edges, 0)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)

        form['deity'].value = "Tharizdun"
        response = form.submit()
        # XXX check the return value for a valid value.


class AddXpTestCase(TestCase):
    fixtures = ["campaigns", "user", "char"]

    def test_added_xp(self):

        ch = Character.objects.get(pk=1)
        form = AddXPForm({'add_xp': '15'},
                         request=get_fake_request(
                         username='admin'),
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

class Importing(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills", "campaigns",
                "armor"]

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_add_new_skill_with_required_skills(self):
        det_url = reverse(sheet.views.import_data)
        response = self.client.post(det_url, { 'import_data' :
        "Skill\n"
        "name,tech_level,description,notes,can_be_defaulted,"
        "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
        "skill_cost_3,type,stat,required_edges,required_skills\n"
        "Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat",
                                               })
        self.assertRedirects(response, reverse(sheet.views.import_data))
        response = self.client.get(reverse(sheet.views.browse,
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
        self.assertRedirects(response, reverse(sheet.views.import_data))
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
        self.assertRedirects(response, reverse(sheet.views.import_data))

    def test_import_export(self):
        for data_type in sheet.models.EXPORTABLE_MODELS:
            logger.info("Import test for %s", data_type)
            response = self.client.get(reverse(sheet.views.export_data,
                                       args=[data_type]))
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

            response = self.client.post(reverse(sheet.views.import_data),
                                        { "import_data":
                                          ''.join(mangle(response.content)) })
            self.assertRedirects(response, reverse(sheet.views.import_data))

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
        factories.UserFactory(username='admin')
        self.assertTrue(self.client.login(username='admin',
                                          password='foobar'))

    def test_sheet_organization(self):
        campaigns = Sheet.get_by_campaign()
        self.assertListEqual([u"FRP", u"MR"],
                             [campaign.name for campaign in campaigns])
        self.assertListEqual([u"Martel", u"Yukaghir", u"Asa"],
                             [sheet.character.name for campaign in campaigns
                              for sheet in campaign.objects])

    def test_character_organization(self):
        campaigns = Character.get_by_campaign()
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
    fixtures = ['user']

    def setUp(self):
        self.assertTrue(self.client.login(username="admin", password="admin"))

    def test_urls(self):
        from sheet.urls import CREATE_NAMES
        for name in CREATE_NAMES:
            url = reverse(name)
            logger.info("Trying {0}...".format(url))
            response = self.client.get(url)
            self.assertContains(response, "submit",
                                msg_prefix="{0} has errors".format(name))
