# encoding: utf-8

from __future__ import division

import logging

from django.test import TestCase
import django.test

from django.core.urlresolvers import reverse
from sheet.models import Skill
from sheet.views import marshal
import sheet.models
import django.http
import sheet.factories as factories
import django.db
from django.conf import settings

logger = logging.getLogger(__name__)

class ImportExport(TestCase):
    def setUp(self):
        self.admin = factories.UserFactory(username='admin')

        self.assertTrue(self.client.login(username="admin", password="foobar"))
        factories.SkillFactory(name="Unarmed combat")
        factories.BaseFirearmFactory(name="Glock 19")

    def test_add_new_skill_with_required_skills(self):
        det_url = reverse("import")
        response = self.client.post(det_url, { 'import_data' :
        "Skill\n"
        "name,tech_level,description,notes,can_be_defaulted,"
        "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
        "skill_cost_3,type,stat,required_edges,required_skills\n"
        "Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat",
                                               })
        self.assertRedirects(response, reverse("import"))
        response = self.client.get(reverse("browse",
                                           args=["Skill"]))
        self.assertContains(response, "Unarmed combat")
        hdr = response.context['header']
        name_index = hdr.index("name")
        required_skills_index = hdr.index("required skills")
        for rr in response.context['rows']:
            if rr[name_index] == "Throw":
                self.assertEqual(rr[required_skills_index], "Unarmed combat")
                break

        # Missing a skill should be an error.
        response = self.client.post(det_url, {
            'import_data' :
            "Skill\n"
            "name,tech_level,description,notes,can_be_defaulted,"
            "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
            "skill_cost_3,type,stat,required_edges,required_skills\n"
            "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
            "Unarmed combat|Surgery",
            })
        self.assertContains(response, "Requirement `Surgery")

        factories.SkillFactory(name="Surgery")

        response = self.client.post(det_url, {
            'import_data' :
            "Skill\n"
            "name,tech_level,description,notes,can_be_defaulted,"
            "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
            "skill_cost_3,type,stat,required_edges,required_skills\n"
            "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
            "Unarmed combat|Surgery",
            })
        self.assertRedirects(response, reverse("import"))
        sk = Skill.objects.get(name="Surgical strike")
        self.assertTrue(sk.required_skills.filter(name="Unarmed combat"
                                                  ).exists())
        self.assertTrue(sk.required_skills.filter(name="Surgery").exists())

        # Try it again.
        response = self.client.post(det_url, {
            'import_data' :
                "Skill\n"
                "name,tech_level,description,notes,can_be_defaulted,"
                "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
                "skill_cost_3,type,stat,required_edges,required_skills\n"
                "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
                "Unarmed combat | Surgery",
            })
        self.assertRedirects(response, reverse("import"))

    def test_import_export_functions(self):
        # More data is needed for a meaningful test, for this and the following.
        # Whenever a new exported type is added, samples of it should be added
        # here, as well.
        for data_type in sheet.models.EXPORTABLE_MODELS:
            logger.info("Import test for %s", data_type)
            exported_data = marshal.csv_export(getattr(sheet.models, data_type))
            marshal.import_text(exported_data)

    def test_import_export_views(self):
        # This is a wider system test, testing the whole stack, contrary to the
        # previous test.
        data_type = "BaseFirearm"

        logger.info("Import test for %s", data_type)
        response = self.client.get(reverse("export", args=[data_type]))
        self.assertIn("attachment", response.get('Content-Disposition'))
        self.assertContains(response, data_type)
        def mangle(data):
            for index, ll in enumerate(data.splitlines()):
                if index >= 2:
                    yield ll + "," + "\n"
                elif index == 1:
                    yield ll + ",edgelevel" + "\n"
                else:
                    yield ll + "\n"

        post_response = self.client.post(reverse("import"),
                                    { "import_data":
                                      ''.join(mangle(response.content)) })
        self.assertRedirects(post_response, reverse("import"))

    def test_export_unicode(self):
        unicode_word = u'βαλλίζω'
        factories.SkillFactory(name="Ballet dancing",
                               description=u"This is ballet dancing, from the "
                                           u"greek root of '{uword}' (to "
                                           u"dance, to jump about).".format(
                                   uword=unicode_word
                               ))
        data = marshal.csv_export(sheet.models.Skill)
        self.assertTrue(data.startswith('Skill'),
                        msg="The data should start with the table name")
        self.assertIn(unicode_word, data.decode('utf-8'))

    def test_exported_data_types(self):
        """
        Verify that certain minimum set of tables are exportable.
        """
        self.assertNotIn('BaseWeaponTemplate', sheet.models.EXPORTABLE_MODELS,
                         msg="Abstract classes should not be exportable")
        for dt in ['ArmorTemplate',
            'Armor', 'ArmorQuality', 'ArmorSpecialQuality',
            'SpellEffect', 'WeaponTemplate', 'Weapon',
            'WeaponQuality', 'WeaponSpecialQuality', 'Skill', 'Edge',
            'EdgeLevel', 'EdgeSkillBonus',
            'RangedWeaponTemplate', 'RangedWeapon']:
            self.assertIn(dt, sheet.models.EXPORTABLE_MODELS)
        self.assertIn('TechLevel', sheet.models.EXPORTABLE_MODELS)


class ImportExportDependencies(TestCase):
    csv_data = """\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,
Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat
Unarmed combat,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Jackadeering
Jackadeering,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""

    self_loop = """\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""

    def setUp(self):
        factories.TechLevelFactory(name="all")

    def test_import_with_deps(self):
        marshal.import_text(self.csv_data)
        self.assertListEqual(
            sorted([sk.name for sk in sheet.models.Skill.objects.all()]),
            sorted(["Nutcasing", "Throw", "Unarmed combat", "Jackadeering"]))

    def test_import_with_self_loops(self):
        """
        Verify that importing with selfloops works.
        """
        marshal.import_text(self.self_loop)
        self.assertListEqual(
            [sk.name for sk in sheet.models.Skill.objects.all()],
            ["Nutcasing"])
        skill = sheet.models.Skill.objects.get(name="Nutcasing")
        self.assertEqual(len(skill.required_skills.all()), 0)


class ImportExportPostgresSupport(TestCase):

    def test_fix_sequence_after_import_in_postgres(self):
        """
        Note, this test only affects PostgreSQL installations.
        """

        new_value = 666
        sheet.models.TechLevel.objects.create(id=new_value, name="foobar")
        marshal.update_id_sequence(sheet.models.TechLevel)
        if (settings.DATABASES['default']['ENGINE'] ==
            "django.db.backends.postgresql_psycopg2"):
            cc = django.db.connection.cursor()
            cc.execute("""SELECT last_value FROM sheet_techlevel_id_seq""")
            last_value = cc.fetchall()[0][0]
            self.assertEqual(last_value, new_value)


