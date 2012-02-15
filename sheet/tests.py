"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse

class WeaponAdd(TestCase):
    fixtures = ["user", "char", "sheet", "wpns"]
    def test_adding_weapon(self):
        c = Client()
        c.login(username="admin", password="admin")
        det_url = reverse('sheet.views.sheet_detail', args=[1])
        req_data = { 'form_id' : 'AddWeapon',
                     'add-weapon-form_id' : 'AddWeapon',
                     'add-weapon-item' : 'Greatsword L1' }
        response = c.get(det_url)
        self.assertContains(response, "No weapons.")
        response = c.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        response = c.get(det_url)
        self.assertNotContains(response, "No weapons.")
        self.assertEquals(response.context['char'].weapons()[0].name,
                          'Greatsword L1')
