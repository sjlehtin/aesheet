from __future__ import division

import logging

import django.test

from django.core.urlresolvers import reverse
from sheet.models import Character, CharacterLogEntry
from sheet.forms import AddSkillForm
import sheet.forms as forms
import sheet.views as views
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

    def test_stat_changes(self):
        det_url = reverse(views.sheet_detail, args=[self.sheet.pk])
        req_data = { 'stat-modify-function' : 'add',
                     'stat-modify-stat' : 'cur_fit' }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)
        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.user.username, "admin")
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

        form['deity'].value = "Tharizdun"
        response = form.submit()
        self.assertRedirects(response, det_url)

    def test_added_skill(self):

        ch = Character.objects.get(pk=self.sheet.character.pk)
        req = { 'skill' : "Acting / Bluff", 'level' : 2 }
        form = AddSkillForm(req,
                            request=self._get_request(),
                            instance=ch)
        self.assertTrue(form.is_valid())
        form.save()
        ch = Character.objects.get(pk=self.sheet.character.pk)
        sk = ch.skills.filter(skill="Acting / Bluff")[0]
        self.assertEqual(sk.level, 2)

        entry = CharacterLogEntry.objects.latest()
        self.assertEqual(entry.entry_type, CharacterLogEntry.SKILL)
        self.assertEqual(entry.skill.pk, "Acting / Bluff")
        self.assertEqual(entry.skill_level, 2)
        self.assertEqual(u"Added skill Acting / Bluff 2.", unicode(entry))

    def test_removed_skill(self):
        det_url = reverse(views.sheet_detail, args=[self.sheet.pk])

        cs = factories.CharacterSkillFactory(skill__name="Fencing",
                                             level=2)
        req_data = { 'remove-form_id' : 'RemoveGeneric',
                     'remove-item_type' : 'CharacterSkill',
                     'remove-item' : cs.pk,
                     }
        response = self.client.post(det_url, req_data)
        self.assertRedirects(response, det_url)

        entry = CharacterLogEntry.objects.latest()
        self.assertIn(u"Removed skill Fencing 2.", unicode(entry))

    def test_change_skill_level(self):
        # "Weapon combat increased to level 3"
        # "Weapon combat decreased to level 2"
        cs = factories.CharacterSkillFactory(skill__name="Fencing",
                                             level=2)
        mod_form = forms.CharacterSkillLevelModifyForm(
            {'function': 'add',
            'skill_id': cs.pk},
            request=self._get_request(),
            instance=cs)
        self.assertTrue(mod_form.is_valid())
        mod_form.save()
        entry = CharacterLogEntry.objects.latest()
        self.assertIn(u"Skill Fencing increased to level 3", unicode(entry))

        # Could do bundling of messages, if same skill touched many times during fifteen
        # minutes.
        mod_form = forms.CharacterSkillLevelModifyForm(
            {'function': 'dec',
            'skill_id': cs.pk},
            request=self._get_request(),
            instance=cs)
        self.assertTrue(mod_form.is_valid())
        mod_form.save()

        entry = CharacterLogEntry.objects.latest()
        self.assertIn(u"Skill Fencing decreased to level 2", unicode(entry))

    def test_added_edge(self):
        pass

    def test_removed_edge(self):
        pass

    def test_change_edge_level(self):
        pass


