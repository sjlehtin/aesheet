from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse

class ItemHandling(TestCase):
    fixtures = ["user", "char", "sheet", "wpns", "armor", "spell"]
    def test_adding_weapon(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-weapon-form_id' : 'AddWeapon',
                     'add-weapon-item' : 'Greatsword L1' }
        response = c.get(det_url)
        self.assertContains(response, "No weapons.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No weapons.")
        self.assertEquals(response.context['char'].weapons()[0].name,
                          'Greatsword L1')

    def test_adding_armor(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-helm-form_id' : 'AddHelm',
                     'add-helm-item' : 'Basinet wfa L5' }
        response = c.get(det_url)
        self.assertContains(response, "No helmet.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No helmet.")
        self.assertEquals(response.context['char'].helm().name,
                          'Basinet wfa L5')

        req_data = { 'add-armor-form_id' : 'AddArmor',
                     'add-armor-item' : 'Plate mail L5' }
        response = c.get(det_url)
        self.assertContains(response, "No armor.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No armor.")
        self.assertEquals(response.context['char'].armor().name,
                          'Plate mail L5')

    def test_add_remove_effect(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'add-spell-effect-form_id' : 'AddSpellEffect',
                     'add-spell-effect-item' : 'Bull\'s strength L5' }
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
