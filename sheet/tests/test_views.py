# encoding: utf-8

from __future__ import division

import logging

from django.test import TestCase
from sheet.models import Sheet, Character

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
        # Verify the headings are present.
        self.assertContains(response, 'FRP')
        self.assertContains(response, 'MR')

    def test_sheet_view(self):
        response = self.client.get(reverse('sheets_index'))

        # Verify the headings are present.
        self.assertContains(response, 'FRP')
        self.assertContains(response, 'MR')
