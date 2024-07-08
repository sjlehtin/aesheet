from __future__ import division

import logging

from django.test import TestCase
import django.test

from django.urls import reverse
from sheet.models import Sheet, Character
from django_webtest import WebTest
import django.http
import sheet.factories as factories
import django.db

logger = logging.getLogger(__name__)

class PrivateSheetTestCase(TestCase):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe")
        self.sheet.character.owner = self.owner
        self.sheet.character.save()

        self.other_client = django.test.Client()
        self.assertTrue(self.client.login(username=self.owner.username,
                                        password="foobar"))
        self.assertTrue(self.other_client.login(username=self.other.username,
                                              password="foobar"))

    def check_view_access(self, url, others_restricted):
        response = self.client.get(url)
        self.assertContains(response, self.sheet.character.name)
        response = self.other_client.get(url)
        if others_restricted:
            self.assertIsInstance(response, django.http.HttpResponseForbidden,
                          msg="Access to other users should be restricted.")
        else:
            self.assertContains(response, self.sheet.character.name)

    def test_character_view_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        self.check_view_access(character_url, others_restricted)

    def test_character_view_others_allowed(self):
        self.test_character_view_others_denied(others_restricted=False)

    def test_sheet_view_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        sheet_url = reverse('edit_sheet', args=(self.sheet.id, ))
        self.check_view_access(url=sheet_url,
                               others_restricted=others_restricted)

    def test_sheet_view_others_allowed(self):
        self.test_sheet_view_others_denied(others_restricted=False)

    def test_sheet_detail_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()
        sheet_url = reverse('sheet_detail', args=(self.sheet.id, ))
        self.check_view_access(url=sheet_url,
                               others_restricted=others_restricted)

    def test_sheet_detail_others_allowed(self):
        self.test_sheet_detail_others_denied(others_restricted=False)


class SetOwnerTestCase(WebTest):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_client = django.test.Client()
        self.assertTrue(self.other_client.login(username=self.other.username,
                                                password="foobar"))
        self.assertTrue(self.client.login(username=self.owner.username,
                                          password="foobar"))

    def test_character_owner_is_retained_in_edit(self):
        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        form = self.app.get(character_url, user=self.owner.username).forms[1]
        request_dict = dict(form.submit_fields())
        response = self.other_client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        # Owner should be the same as before.
        self.assertEqual(char.owner, self.owner)

    def test_sheet_owner_is_retained_in_edit(self):
        sheet_url = reverse('edit_sheet',
                            args=(self.sheet.id, ))
        form = self.app.get(sheet_url, user=self.owner.username).forms[1]
        request_dict = dict(form.submit_fields())
        response = self.other_client.post(sheet_url, request_dict)
        self.assertRedirects(response, reverse("sheet_detail",
                                               args=(self.sheet.id, )))
        sheet = Sheet.objects.get(character=self.sheet.character)
        # Owner should be the same as before.
        self.assertEqual(sheet.owner, self.owner)


class MarkPrivateTestCase(WebTest):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_client = django.test.Client()
        self.assertTrue(self.other_client.login(username=self.other.username,
                                                password="foobar"))
        self.assertTrue(self.client.login(username=self.owner.username,
                                          password="foobar"))

    def test_only_owner_can_mark_private(self):
        character_url = reverse('edit_character',
                                args=(self.sheet.character.id, ))
        form = self.app.get(character_url, user=self.owner.username).forms[1]
        request_dict = dict(form.submit_fields())
        request_dict['private'] = True

        # For other users, the edit should be a success, but should not
        # do anything.
        response = self.other_client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        self.assertFalse(char.private)

        # For the owner, the private field should be updated.
        response = self.client.post(character_url, request_dict)
        self.assertRedirects(response, character_url)
        char = Character.objects.get(name=self.sheet.character.name)
        self.assertTrue(char.private)

    def test_create_character_private_checked(self):
        character_url = reverse('add_char')
        form = self.app.get(character_url, user=self.owner.username).forms[1]
        request_dict = dict(form.submit_fields())
        request_dict['name'] = "Foobar"
        request_dict['race'] = "Tsapdai"
        request_dict['occupation'] = "Polaus"
        request_dict['private'] = True
        request_dict['campaign'] = factories.CampaignFactory(name="Foo").id
        response = self.other_client.post(character_url, request_dict)

        character = Character.objects.get(name="Foobar")
        sheet = Sheet.objects.get(
            character=character)
        self.assertRedirects(response, reverse("sheet_detail",
                                               args=(sheet.id, )))
        self.assertTrue(character.private)


class PrivateSheetListTestCase(TestCase):
    def setUp(self):
        self.owner = factories.UserFactory.create(username="luke")
        self.other = factories.UserFactory.create(username="leia")
        self.sheet = factories.SheetFactory.create(character__name="John Doe",
                                                   character__owner=self.owner)
        self.other_sheet = factories.SheetFactory.create(
            character__name="Jane Doe",
            character__owner=self.other)

        self.other_client = django.test.Client()
        self.assertTrue(self.client.login(username=self.owner.username,
                                        password="foobar"))
        self.assertTrue(self.other_client.login(username=self.other.username,
                                              password="foobar"))

    def get_objects(self, response):
        objects = [obj for campaign in response.context['campaigns']
                   for obj in campaign.objects]
        return objects

    def test_sheet_list_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        # For the owner, both sheets should be present.
        response = self.client.get(reverse('sheets_index'))
        objects = self.get_objects(response)
        self.assertIn(self.sheet, objects)
        self.assertIn(self.other_sheet, objects)

        # For the other, only the other sheet should be present if the primary
        # character has been marked private.
        response = self.other_client.get(reverse('sheets_index'))
        objects = self.get_objects(response)
        self.assertIn(self.other_sheet, objects)
        if others_restricted:
            self.assertNotIn(self.sheet, objects)
        else:
            self.assertIn(self.sheet, objects)

    def test_sheet_list_others_allowed(self):
        return self.test_sheet_list_others_denied(others_restricted=False)

    def test_character_list_others_denied(self, others_restricted=True):
        if others_restricted:
            self.sheet.character.private = True
            self.sheet.character.save()

        # For the owner, both sheets should be present.
        response = self.client.get(reverse('characters_index'))
        objects = self.get_objects(response)
        self.assertIn(self.sheet.character, objects)
        self.assertIn(self.other_sheet.character, objects)

        # For the other, only the other sheet should be present if the primary
        # character has been marked private.
        response = self.other_client.get(reverse('characters_index'))
        objects = self.get_objects(response)
        self.assertIn(self.other_sheet.character, objects)
        if others_restricted:
            self.assertNotIn(self.sheet.character, objects)
        else:
            self.assertIn(self.sheet.character, objects)

    def test_character_list_others_allowed(self):
        return self.test_character_list_others_denied(others_restricted=False)


