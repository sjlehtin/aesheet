# encoding: utf-8

from __future__ import division

import logging

from django.test import TestCase

from django.core.urlresolvers import reverse
import sheet.factories as factories

logger = logging.getLogger(__name__)

class CharactersViewTestCase(TestCase):
    def setUp(self):
        factories.CharacterFactory(name="Zäxxer", race="Örkki",
                                   occupation="Paskan kerääjä")

        self.admin = factories.UserFactory(username='admin')
        self.assertTrue(self.client.login(username='admin',
                                          password='foobar'))

    def test_view(self):
        response = self.client.get(reverse('characters_index'))
        self.assertIn("Örkki", response.content)