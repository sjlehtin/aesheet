import logging
import os

from django.test import TestCase
import django.test

from django.urls import reverse
from sheet.models import SkillNew as Skill
from sheet.views import marshal
import sheet.models
import django.http
import sheet.factories as factories
import django.db
from django.conf import settings
import csv
from io import StringIO
import sys

logger = logging.getLogger(__name__)


class ImportExportTestCase(TestCase):
    def setUp(self):
        self.admin = factories.UserFactory(username='admin')

        self.assertTrue(self.client.login(username="admin", password="foobar"))
        factories.SkillFactory(name="Unarmed combat")
        factories.BaseFirearmFactory(name="Glock 19", ammunition_types=["9Pb"])

    def test_exported_fields(self):
        fields = sheet.models.BaseFirearm.get_exported_fields()
        self.assertIn("stock", fields)
        self.assertIn("autofire_class", fields)
        self.assertIn("ammunition_types", fields)

    def test_add_new_skill_with_required_skills(self):
        det_url = reverse("import")
        response = self.client.post(det_url, { 'import_data' :
                                                   ("Skill\n"
        "name,tech_level,description,notes,can_be_defaulted,"
        "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
        "skill_cost_3,type,stat,required_edges,required_skills\n"
        "Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat"),
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
                ("Skill\n"
            "name,tech_level,description,notes,can_be_defaulted,"
            "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
            "skill_cost_3,type,stat,required_edges,required_skills\n"
            "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
            "Unarmed combat|Surgery"),
            })
        self.assertContains(response, "Requirement `Surgery")

        factories.SkillFactory(name="Surgery")

        response = self.client.post(det_url, {
            'import_data' :
                ("Skill\n"
            "name,tech_level,description,notes,can_be_defaulted,"
            "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
            "skill_cost_3,type,stat,required_edges,required_skills\n"
            "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
            "Unarmed combat|Surgery"),
            })
        self.assertRedirects(response, reverse("import"))
        sk = Skill.objects.get(name="Surgical strike")
        self.assertTrue(sk.required_skills.filter(name="Unarmed combat"
                                                  ).exists())
        self.assertTrue(sk.required_skills.filter(name="Surgery").exists())

        # Try it again.
        response = self.client.post(det_url, {
            'import_data' :
                ("Skill\n"
                "name,tech_level,description,notes,can_be_defaulted,"
                "is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,"
                "skill_cost_3,type,stat,required_edges,required_skills\n"
                "Surgical strike,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,"
                "Unarmed combat | Surgery"),
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
                    yield ll + ",\n"
                elif index == 1:
                    yield ll + ",edgelevel\n"
                else:
                    yield ll + "\n"

        post_data = ''.join(mangle(response.content.decode('utf-8')))
        post_response = self.client.post(
            reverse("import"),{"import_data": post_data})
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
        if sys.version_info < (3,):
            data = data.decode('utf-8')
        self.assertTrue(data.startswith('Skill'),
                        msg="The data should start with the table name")
        self.assertIn(unicode_word, data)

    def test_exported_data_types(self):
        """
        Verify that certain minimum set of tables are exportable.
        """
        self.assertNotIn('BaseWeaponTemplate', sheet.models.EXPORTABLE_MODELS,
                         msg="Abstract classes should not be exportable")
        for dt in ['ArmorTemplate',
            'Armor', 'ArmorQuality', 'ArmorSpecialQuality',
            'TransientEffect', 'WeaponTemplate', 'Weapon',
            'WeaponQuality', 'WeaponSpecialQuality', 'Skill', 'Edge',
            'EdgeLevel', 'EdgeSkillBonus',
            'RangedWeaponTemplate', 'RangedWeapon']:
            self.assertIn(dt, sheet.models.EXPORTABLE_MODELS)
        self.assertIn('TechLevel', sheet.models.EXPORTABLE_MODELS)


class ImportExportDependencies(TestCase):

    def setUp(self):
        factories.TechLevelFactory(name="all")

    def test_import_with_deps(self):
        csv_data = u"""\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Jackadeering,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat
Unarmed combat,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Jackadeering
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,
"""
        marshal.import_text(csv_data.encode('utf-8'))
        self.assertListEqual(
            sorted([sk.name for sk in sheet.models.Skill.objects.all()]),
            sorted(["Nutcasing", "Throw", "Unarmed combat", "Jackadeering"]))

    def test_import_with_self_loops(self):
        """
        Verify that importing with selfloops works.
        """
        self_loop = u"""\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""
        marshal.import_text(self_loop.encode('utf-8'))
        self.assertListEqual(
            [sk.name for sk in sheet.models.Skill.objects.all()],
            ["Nutcasing"])
        skill = sheet.models.Skill.objects.get(name="Nutcasing")
        self.assertEqual(len(skill.required_skills.all()), 0)

    def test_import_with_deps_with_self_loops(self):
        csv_data = u"""\
Skill
name,tech_level,description,notes,can_be_defaulted,is_specialization,skill_cost_0,skill_cost_1,skill_cost_2,skill_cost_3,type,stat,required_edges,required_skills
Jackadeering,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
Throw,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Unarmed combat
Unarmed combat,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Jackadeering
Nutcasing,all,,,TRUE,TRUE,0,2,,,Combat,MOV,,Nutcasing
"""
        marshal.import_text(csv_data.encode('utf-8'))
        self.assertListEqual(
            sorted([sk.name for sk in sheet.models.Skill.objects.all()]),
            sorted(["Nutcasing", "Throw", "Unarmed combat", "Jackadeering"]))
        skill = sheet.models.Skill.objects.get(name="Nutcasing")
        self.assertEqual(len(skill.required_skills.all()), 0)
        skill = sheet.models.Skill.objects.get(name="Jackadeering")
        required = skill.required_skills.all()
        self.assertEqual([sk.name for sk in required], ["Nutcasing"])


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
    firearm_csv_data = u"""\
"BaseFirearm",,,,,,,,,,,,,,,,,,,,
"name","description","notes","tech_level","draw_initiative","durability","dp","weight","magazine_weight","duration","stock","base_skill","skill","skill2","type","target_initiative","ammo_weight","range_s","range_m","range_l","ammunition_types"
"Glock 19",,,"2K",-3,5,10,1,0.35,0.11,1,"Handguns",,,"P",-2,0.1,20,40,60,"9Pb|9Pb+"

""".encode('utf-8')

    ammo_csv_data = u"""\
"Ammunition",,,,,,,,,,
"id","num_dice","dice","extra_damage","leth","plus_leth","calibre","bullet_type","tech_level","weight","velocity","bypass"
,1,6,1,6,2,"9Pb+","FMJ","2K",7.5,400,0

""".encode('utf-8')

    def setUp(self):
        factories.TechLevelFactory(name="2K")
        factories.SkillFactory(name="Handguns", tech_level__name="2K")
        factories.CalibreFactory(name="9Pb+")

    def test_import_firearms(self):
        marshal.import_text(self.firearm_csv_data)
        firearm = sheet.models.BaseFirearm.objects.get(name="Glock 19")
        # Import should create the ammunition types.
        self.assertListEqual(sorted(["9Pb", "9Pb+"]),
                             sorted(firearm.get_ammunition_types()))

    def test_export_firearms(self):
        factories.BaseFirearmFactory(name="Glock 19", ammunition_types=['9Pb', '9Pb+'])
        csv_data = marshal.csv_export(sheet.models.BaseFirearm)

        reader = csv.reader(StringIO(csv_data))
        data_type = next(reader)
        self.assertEqual(data_type[0], "BaseFirearm")

        header = next(reader)
        data_row = next(reader)
        idx = header.index("ammunition_types")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        # "9Pb|9Pb+" or "9Pb+|9Pb"
        self.assertListEqual(sorted(["9Pb", "9Pb+"]),
                             sorted(data_row[idx].split('|')))

    def test_import_ammunition(self):
        marshal.import_text(self.ammo_csv_data)
        ammo = sheet.models.Ammunition.objects.filter(calibre__name='9Pb+')
        self.assertEqual(ammo[0].calibre.name, "9Pb+")

    def test_export_ammunition(self):
        marshal.import_text(self.ammo_csv_data)

        csv_data = marshal.csv_export(sheet.models.Ammunition)
        reader = csv.reader(StringIO(csv_data))
        data_type = next(reader)
        self.assertEqual(data_type[0], "Ammunition")

        header = next(reader)
        data_row = next(reader)

        idx = header.index("calibre")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")
        # Correct ammunition_types should be available.
        self.assertEqual(data_row[idx], "9Pb+")

        idx = header.index("id")
        self.assertGreaterEqual(idx, 0, msg="Required column should be found")


class FirearmImportFromExcelTestcase(TestCase):
    def setUp(self):
        factories.SkillFactory(name="Handguns", tech_level__name="2K")

    def test_import_handgun_weight_gives_good_error_message(self):
        self.admin = factories.UserFactory(username='admin')

        self.assertTrue(self.client.login(username="admin", password="foobar"))

        det_url = reverse("import")
        response = self.client.post(det_url, { 'import_data' :
                                                   ("BaseFirearm\n"
        "name,description,notes,tech_level,draw_initiative,durability,dp,weight,magazine_weight,base_skill,skill,skill2,target_initiative,range_s,range_m,range_l,autofire_rpm,autofire_class,sweep_fire_disabled,restricted_burst_rounds,stock,duration,weapon_class_modifier,accuracy,sight,barrel_length,ammunition_types\n"
        "Colt SA Army 1873 4.8\",,,2K,-3,4,4,1.021,0.35,Handguns,,,-1,12,24,36,,,FALSE,0,1,0.08,10,0.85,170,121,45Clt"),
                                               })
        self.assertRedirects(response, reverse("import"))

    def test_import_semicolon_csv_should_work(self):
        marshal.import_text(open(os.path.join(os.path.dirname(__file__), 'win-excel-with-semicolons-utf8.csv'), 'rb').read())


class ScopeImportTestCase(TestCase):
    def setUp(self):
        factories.TechLevelFactory(name="2K")
        self.edge_level = factories.EdgeLevelFactory(edge__name="Night vision", level=1)

        self.scope_csv_data = """\
Scope
name,id,target_i_mod,to_hit_mod,tech_level,weight,notes,sight,perks
Optical sight,1,0,0,2K,0.10,,750,
Scope 2x,2,-1,0,2K,0.50,+1L to acute vision,1000,
Night-vision sight I,3,-1,0,2K,1.00,+1L to Night Vision,500,{edge_level}
""".format(edge_level=self.edge_level.id)

    def test_import_scope_csv(self):
        marshal.import_text(self.scope_csv_data)
        scope = sheet.models.Scope.objects.get(name="Night-vision sight I")
        perks = scope.perks.all()
        assert len(perks) == 1
        assert perks[0].id == self.edge_level.id
