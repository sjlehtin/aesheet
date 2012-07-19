from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse
import pdb
from sheet.models import Sheet, Character, Weapon, WeaponTemplate, Armor
from sheet.models import CharacterSkill, Skill, CharacterEdge, EdgeLevel
from sheet.models import CharacterLogEntry
from sheet.models import roundup
import sheet.views
from django_webtest import WebTest

class ItemHandling(TestCase):
    fixtures = ["user", "char", "skills", "sheet", "wpns", "armor", "spell"]

    def setUp(self):
        self.client = Client()
        self.client.login(username="admin", password="admin")

    def test_add_remove_weapon(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        response = self.client.get(det_url)
        self.assertContains(response, "No weapons.")
        req_data = { 'add-weapon-weapon' :
                     Weapon.objects.get(name="Greatsword L1").pk }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No weapons.")
        wpn = response.context['char'].weapons()[0]
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
        req_data = { 'add-helm-helm' : hh.pk }
        response = self.client.get(det_url)
        self.assertContains(response, "No helmet.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No helmet.")
        self.assertEquals(response.context['char'].helm().name,
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
        req_data = { 'add-armor-armor' : aa.pk }
        response = self.client.get(det_url)
        self.assertContains(response, "No armor.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No armor.")
        self.assertEquals(response.context['char'].armor().name,
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
        self.assertEquals(response.context['char'].spell_effects()[0].name,
                          'Bull\'s strength L5')

        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'SpellEffect',
                     'remove-item' : 'Bull\'s strength L5' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertContains(response, "No spell effects.")

class EdgeAndSkillHandling(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "test_skills"]

    def setUp(self):
        self.client = Client()
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
        self.assertEquals(response.context['char'].skills()[0].skill.name,
                          'Weapon combat')
        self.assertEquals(response.context['char'].skills()[0].level,
                          5)

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
        self.assertEquals(response.context['char'].skills()[0].skill.name,
                          'Martial arts expertise')
        self.assertEquals(response.context['char'].skills()[0].level,
                          4)
        req_data = { 'add-skill-skill' : 'Unarmed combat',
                     'add-skill-level' : '4'}
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertTrue('Unarmed combat' not in
                        response.context['char'].missing_skills.values())
        sk = filter(lambda xx: xx.skill.name == 'Unarmed combat',
                    response.context['char'].skills())
        self.assertTrue(sk)

    def test_add_remove_edge(self):
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-edge-edge' : '2'}
        response = self.client.get(det_url)
        self.assertContains(response, "No edges.")
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = self.client.get(det_url)
        self.assertNotContains(response, "No edges.")
        ce = response.context['char'].edges()[0]
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

    def test_edge_skill_mod(self):
        sheet = Sheet.objects.get(pk=1)
        cs = CharacterSkill()
        cs.character = sheet.character
        skill = Skill.objects.get(name="Surgery")
        cs.skill = skill
        cs.level = 0
        cs.save()

        ce = CharacterEdge()
        ce.character = sheet.character
        edge = EdgeLevel.objects.get(edge__name="Acute Touch", level=1)
        ce.edge = edge
        ce.save()

        sheet = Sheet.objects.get(pk=1)
        # Verify Acute Touch has an effect.
        self.assertEqual(sheet.eff_dex + 15,
                         sheet.skills.get(skill__name="Surgery").check(sheet))

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

class Logging(WebTest):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "assigned_edges"]

    def setUp(self):
        self.client = Client()
        self.client.login(username="admin", password="admin")

    def test_logging_stat_changes(self):
        det_url = reverse('sheet.views.sheet_detail', args=[2])
        req_data = { 'stat-modify-function' : 'add',
                     'stat-modify-stat' : 'cur_fit' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.user.username, "admin")
        self.assertEqual(entry.character.pk, 2)
        self.assertEqual(entry.stat, "cur_fit")
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

    def test_logging_base_char_edit(self):
        old_ch = Character.objects.get(pk=2)

        det_url = reverse('edit_character', args=[2])
        form = self.app.get(det_url, user='admin').form

        form['cur_fit'].value = int(form['cur_fit'].value) + 5
        response = form.submit()
        self.assertRedirects(response, reverse('sheet.views.characters_index'))
        new_ch = Character.objects.get(pk=2)
        self.assertEqual(old_ch.cur_fit + 5, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 5)

        form['deity'].value = "Tharizdun"
        response = form.submit()


class ModelBasics(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills",
                "assigned_edges"]

    def test_basic_stats(self):
        ss = Sheet.objects.get(pk=1)
        self.assertEqual(ss.character.edge_level('Toughness'), 2)
        sta = ss.stamina
        body = ss.body
        mana = ss.mana

class Views(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills"]

    def setUp(self):
        self.client = Client()
        self.client.login(username="admin", password="admin")

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
        self.assertRedirects(response, reverse(sheet.views.sheets_index))
        eff = sheet.models.SpellEffect.objects.get(name='MyEffect')
        self.assertEqual(eff.fit, 40)

class Importing(TestCase):
    fixtures = ["user", "char", "sheet", "edges", "basic_skills"]

    def setUp(self):
        self.client = Client()
        self.client.login(username="admin", password="admin")

    def testAddNewSkillWithRequiredSkills(self):
        det_url = reverse(sheet.views.import_data)
        response = self.client.post(det_url, { 'import_data' :
                                                   """Skill
name,description,notes,can_be_defaulted,is_specialization,skill_cost_0,\
skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Throw,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat""",
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
