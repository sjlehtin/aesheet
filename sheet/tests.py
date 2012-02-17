from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse
import pdb
from sheet.forms import SheetForm

class SheetFormTestCase(TestCase):
    def test_create_form(self):
        f = SheetForm()
        self.assertTrue(f)

class ItemHandling(TestCase):
    fixtures = ["user", "char", "sheet", "wpns", "armor", "spell"]
    def test_add_remove_weapon(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-weapon-weapon' : 'Greatsword L1' }
        response = c.get(det_url)
        self.assertContains(response, "No weapons.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No weapons.")
        self.assertEquals(response.context['char'].weapons()[0].name,
                          'Greatsword L1')

        # Remove weapon.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Weapon',
                     'remove-item' : '1',
                     }
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertContains(response, "No weapons.")


    def test_add_remove_armor(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])

        # Add helmet.
        req_data = { 'add-helm-helm' : 'Basinet wfa L5' }
        response = c.get(det_url)
        self.assertContains(response, "No helmet.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No helmet.")
        self.assertEquals(response.context['char'].helm().name,
                          'Basinet wfa L5')
        # Remove helmet.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Helm',
                     }
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertContains(response, "No helmet.")

        # Add armor.
        req_data = { 'add-armor-armor' : 'Plate mail L5' }
        response = c.get(det_url)
        self.assertContains(response, "No armor.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No armor.")
        self.assertEquals(response.context['char'].armor().name,
                          'Plate mail L5')

        # Remove armor.
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'Armor',
                     }
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertContains(response, "No armor.")

    def test_add_remove_effect(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-spell-effect-effect' : 'Bull\'s strength L5' }
        response = c.get(det_url)

        self.assertContains(response, "No spell effects.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No spell effects.")
        self.assertEquals(response.context['char'].spell_effects()[0].name,
                          'Bull\'s strength L5')

        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'SpellEffect',
                     'remove-item' : 'Bull\'s strength L5' }
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertContains(response, "No spell effects.")

class SkillHandling(TestCase):
    fixtures = ["user", "char", "sheet", "basic_skills"]
    def test_adding_skill(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-skill-skill' : 'Weapon combat',
                     'add-skill-level' : '5'}
        response = c.get(det_url)
        self.assertContains(response, "No skills.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No skills.")
        self.assertEquals(response.context['char'].skills()[0].skill.name,
                          'Weapon combat')
        self.assertEquals(response.context['char'].skills()[0].level,
                          5)
