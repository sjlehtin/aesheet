# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):

        # Deleting field 'WeaponSpecialQuality.id'
        db.delete_column('sheet_weaponspecialquality', 'id')

        # Adding field 'WeaponSpecialQuality.name'
        db.add_column('sheet_weaponspecialquality', 'name', self.gf('django.db.models.fields.CharField')(default='amphibianbane', max_length=32, primary_key=True), keep_default=False)

        # Changing field 'WeaponSpecialQuality.short_description'
        db.alter_column('sheet_weaponspecialquality', 'short_description', self.gf('django.db.models.fields.CharField')(max_length=16))

        # Deleting field 'Skill.id'
        db.delete_column('sheet_skill', 'id')

        # Changing field 'Skill.name'
        db.alter_column('sheet_skill', 'name', self.gf('django.db.models.fields.CharField')(max_length=256, primary_key=True))

        # Removing index on 'Skill', fields ['name']
        # XXX db.delete_index('sheet_skill', ['name'])

        # Deleting field 'ArmorSpecialQuality.id'
        db.delete_column('sheet_armorspecialquality', 'id')

        # Adding field 'ArmorSpecialQuality.name'
        db.add_column('sheet_armorspecialquality', 'name', self.gf('django.db.models.fields.CharField')(default='n/a', max_length=32, primary_key=True), keep_default=False)

        # Changing field 'ArmorSpecialQuality.short_description'
        db.alter_column('sheet_armorspecialquality', 'short_description', self.gf('django.db.models.fields.CharField')(max_length=16))


    def backwards(self, orm):

        # Adding index on 'Skill', fields ['name']
        # XXX db.create_index('sheet_skill', ['name'])

        # User chose to not deal with backwards NULL issues for 'WeaponSpecialQuality.id'
        raise RuntimeError("Cannot reverse this migration. 'WeaponSpecialQuality.id' and its values cannot be restored.")

        # Deleting field 'WeaponSpecialQuality.name'
        db.delete_column('sheet_weaponspecialquality', 'name')

        # Changing field 'WeaponSpecialQuality.short_description'
        db.alter_column('sheet_weaponspecialquality', 'short_description', self.gf('django.db.models.fields.CharField')(max_length=256))

        # User chose to not deal with backwards NULL issues for 'Skill.id'
        raise RuntimeError("Cannot reverse this migration. 'Skill.id' and its values cannot be restored.")

        # Changing field 'Skill.name'
        db.alter_column('sheet_skill', 'name', self.gf('django.db.models.fields.CharField')(max_length=256, unique=True))

        # User chose to not deal with backwards NULL issues for 'ArmorSpecialQuality.id'
        raise RuntimeError("Cannot reverse this migration. 'ArmorSpecialQuality.id' and its values cannot be restored.")

        # Deleting field 'ArmorSpecialQuality.name'
        db.delete_column('sheet_armorspecialquality', 'name')

        # Changing field 'ArmorSpecialQuality.short_description'
        db.alter_column('sheet_armorspecialquality', 'short_description', self.gf('django.db.models.fields.CharField')(max_length=256))


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'sheet.armor': {
            'Meta': {'object_name': 'Armor'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.ArmorTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.ArmorQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'sheet.armoreffect': {
            'Meta': {'object_name': 'ArmorEffect'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': "orm['sheet.ArmorSpecialQuality']"}),
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.armorquality': {
            'Meta': {'object_name': 'ArmorQuality'},
            'armor_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'mod_climb': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_conceal': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_encumbrance_class': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_sensory': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_stealth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'})
        },
        'sheet.armorspecialquality': {
            'Meta': {'object_name': 'ArmorSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'}),
            'short_description': ('django.db.models.fields.CharField', [], {'max_length': '16'})
        },
        'sheet.armortemplate': {
            'Meta': {'object_name': 'ArmorTemplate'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'encumbrance_class': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'is_helm': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'mod_climb': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_conceal': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_hear': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_smell': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_stealth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_surprise': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_tumble': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_vision': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        'sheet.character': {
            'Meta': {'object_name': 'Character'},
            'adventures': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'age': ('django.db.models.fields.IntegerField', [], {'default': '20'}),
            'base_mod_cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_wil': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'bought_mana': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'bought_stamina': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cur_cha': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_fit': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_int': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_lrn': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_pos': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_psy': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_ref': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_wil': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'deity': ('django.db.models.fields.CharField', [], {'default': "'Kord'", 'max_length': '256'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'edges_bougth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'free_edges': ('django.db.models.fields.IntegerField', [], {'default': '2'}),
            'gained_sp': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '175'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'occupation': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'characters'", 'to': "orm['auth.User']"}),
            'race': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'start_cha': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_fit': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_int': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_lrn': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_pos': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_psy': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_ref': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_wil': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'times_wounded': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'total_xp': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'unnatural_aging': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weigth': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'xp_used_ingame': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.characteredge': {
            'Meta': {'object_name': 'CharacterEdge'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edges'", 'to': "orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.EdgeLevel']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'sheet.characterskill': {
            'Meta': {'object_name': 'CharacterSkill'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'skills'", 'to': "orm['sheet.Character']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Skill']"})
        },
        'sheet.edge': {
            'Meta': {'object_name': 'Edge'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'sheet.edgelevel': {
            'Meta': {'object_name': 'EdgeLevel'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cost': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Edge']"}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'requires_hero': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.sheet': {
            'Meta': {'object_name': 'Sheet'},
            'armor': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.Armor']", 'symmetrical': 'False', 'blank': 'True'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Character']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'helm': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'helm_for'", 'blank': 'True', 'to': "orm['sheet.Armor']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sheets'", 'to': "orm['auth.User']"}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'spell_effects': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.SpellEffect']", 'symmetrical': 'False', 'blank': 'True'}),
            'weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.Weapon']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'sheet.skill': {
            'Meta': {'object_name': 'Skill'},
            'can_be_defaulted': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'is_specialization': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'required_edges': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['sheet.Edge']", 'null': 'True', 'blank': 'True'}),
            'required_skills': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_cost_0': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_1': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_2': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_3': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '64'})
        },
        'sheet.spelleffect': {
            'Meta': {'object_name': 'SpellEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.weapon': {
            'Meta': {'object_name': 'Weapon'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.WeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.WeaponQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'sheet.weaponeffect': {
            'Meta': {'object_name': 'WeaponEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'weapon': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': "orm['sheet.WeaponSpecialQuality']"}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.weaponquality': {
            'Meta': {'ordering': "['roa', 'ccv']", 'object_name': 'WeaponQuality'},
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '6', 'decimal_places': '4'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'}),
            'versus_area_save_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'versus_missile_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'})
        },
        'sheet.weaponspecialquality': {
            'Meta': {'object_name': 'WeaponSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'}),
            'short_description': ('django.db.models.fields.CharField', [], {'max_length': '16'})
        },
        'sheet.weapontemplate': {
            'Meta': {'object_name': 'WeaponTemplate'},
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_weapons'", 'to': "orm['sheet.Skill']"}),
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'ccv_unskilled_modifier': ('django.db.models.fields.IntegerField', [], {'default': '-10'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_lance': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_shield': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_weapons'", 'null': 'True', 'to': "orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_weapons'", 'null': 'True', 'to': "orm['sheet.Skill']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'})
        }
    }

    complete_apps = ['sheet']
