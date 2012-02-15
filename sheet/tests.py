"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse

class WeaponAdd(TestCase):
    fixtures = ["user", "char", "sheet", "wpns", "armor"]
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
        self.assertEquals(response.context['char'].helm()[0].name,
                          'Basinet wfa L5')

        req_data = { 'add-armor-form_id' : 'AddArmor',
                     'add-armor-item' : 'Plate mail L5' }
        response = c.get(det_url)
        self.assertContains(response, "No armor.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No armor.")
        self.assertEquals(response.context['char'].armor()[0].name,
                          'Plate mail L5')
