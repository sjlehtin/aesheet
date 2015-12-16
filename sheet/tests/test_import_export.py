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
import csv
import StringIO

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


class FirearmImportExportTestcase(TestCase):
    firearm_csv_data = """\
"BaseFirearm",,,,,,,,,,,,,,,,,,,,
"name","description","notes","tech_level","draw_initiative","durability","dp","weight","duration","stock","base_skill","skill","skill2","type","target_initiative","ammo_weight","range_s","range_m","range_l","ammunition_types"
"Glock 19",,,"2K",-3,5,10,1,0.11,1,"Handguns",,,"P",-2,0.1,20,40,60,"9Pb|9Pb+"

"""

    ammo_csv_data = """\
"Ammunition",,,,,,,,,,
"id","num_dice","dice","extra_damage","leth","plus_leth","label","bullet_type","tech_level","weight","velocity","bypass"
,1,6,1,6,2,"9Pb+","FMJ","2K",7.5,400,0

"""

    def setUp(self):
        factories.TechLevelFactory(name="2K")
        factories.SkillFactory(name="Handguns", tech_level__name="2K")

    def test_import_firearms(self):
        marshal.import_text(self.firearm_csv_data)
        firearm = sheet.models.BaseFirearm.objects.get(name="Glock 19")
        # Import should create the ammunition types.
        self.assertListEqual(sorted(["9Pb", "9Pb+"]),
                             sorted(firearm.get_ammunition_types()))

    def test_export_firearms(self):
        marshal.import_text(self.firearm_csv_data)

        csv_data = marshal.csv_export(sheet.models.BaseFirearm)
        reader = csv.reader(StringIO.StringIO(csv_data))
        data_type = reader.next()
        self.assertEqual(data_type[0], "BaseFirearm")

        header = reader.next()
        data_row = reader.next()
        idx = header.index("ammunition_types")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        # "9Pb|9Pb+" or "9Pb+|9Pb"
        self.assertListEqual(sorted(["9Pb", "9Pb+"]),
                             sorted(data_row[idx].split('|')))

    def test_import_ammunition(self):
        marshal.import_text(self.ammo_csv_data)
        ammo = sheet.models.Ammunition.objects.filter(label='9Pb+')
        self.assertEqual(ammo[0].label, "9Pb+")

    def test_export_ammunition(self):
        marshal.import_text(self.ammo_csv_data)

        csv_data = marshal.csv_export(sheet.models.Ammunition)
        reader = csv.reader(StringIO.StringIO(csv_data))
        data_type = reader.next()
        self.assertEqual(data_type[0], "Ammunition")

        header = reader.next()
        data_row = reader.next()

        idx = header.index("label")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "9Pb+")

        idx = header.index("id")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "1")
