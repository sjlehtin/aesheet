from __future__ import division

import logging

import django.test

from django.core.urlresolvers import reverse
from sheet.models import Character, CharacterLogEntry
import sheet.forms as forms
from django_webtest import WebTest
import django.http
import sheet.factories as factories
import django.db

logger = logging.getLogger(__name__)


class LoggingTestCase(WebTest):

    def setUp(self):
        self.request_factory = django.test.RequestFactory()
        self.admin = factories.UserFactory(username="admin")
        self.assertTrue(self.client.login(username="admin", password="foobar"))
        self.sheet = factories.SheetFactory()
        factories.SkillFactory(name="Acting / Bluff")

    def _get_request(self):
        post = self.request_factory.post('/copy/')
        post.user = self.admin
        return post

    def test_log_stat_changes(self):
        forms.log_stat_change(self.sheet.character, self._get_request(),
                              "cur_fit", 1)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.user.username, "admin")
        self.assertEqual(entry.field, "cur_fit")
        self.assertEqual(entry.amount, 1)
        former_id = entry.id

        # If a stat is increased multiple times and perhaps
        # decreased within the time limit, there should be only a single
        # log entry per user.

        forms.log_stat_change(self.sheet.character, self._get_request(),
                              "cur_fit", 1)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.amount, 2)
        self.assertEqual(former_id, entry.id)

        forms.log_stat_change(self.sheet.character, self._get_request(),
                              "cur_fit", -1)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.amount, 1)
        self.assertEqual(former_id, entry.id)

        # If a stat is increased and then decreased within the time
        # limit, there shouldn't be a log entry.
        forms.log_stat_change(self.sheet.character, self._get_request(),
                              "cur_fit", -1)

        self.assertEqual(CharacterLogEntry.objects.count(), 0)

    def test_base_char_edit(self):
        old_ch = Character.objects.get(pk=self.sheet.character.pk)

        det_url = reverse('edit_character', args=[self.sheet.character.pk])
        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) - 2)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=self.sheet.character.pk)
        self.assertEqual(old_ch.cur_fit - 2, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) + 5)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=self.sheet.character.pk)
        self.assertEqual(old_ch.cur_fit + 3, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 3)

        form = self.app.get(det_url, user='admin').form
        form['cur_fit'].value = str(int(form['cur_fit'].value) - 2)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=self.sheet.character.pk)
        self.assertEqual(old_ch.cur_fit + 1, new_ch.cur_fit)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, 1)

        form = self.app.get(det_url, user='admin').form
        form['free_edges'].value = str(0)
        response = form.submit()
        self.assertRedirects(response, det_url)
        new_ch = Character.objects.get(pk=self.sheet.character.pk)
        self.assertEqual(new_ch.free_edges, 0)

        self.assertEqual(CharacterLogEntry.objects.latest().amount, -2)


