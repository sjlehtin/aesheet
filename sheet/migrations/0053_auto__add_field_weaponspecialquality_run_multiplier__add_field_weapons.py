# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'WeaponSpecialQuality.run_multiplier'
        db.add_column(u'sheet_weaponspecialquality', 'run_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'WeaponSpecialQuality.swim_multiplier'
        db.add_column(u'sheet_weaponspecialquality', 'swim_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'WeaponSpecialQuality.climb_multiplier'
        db.add_column(u'sheet_weaponspecialquality', 'climb_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'WeaponSpecialQuality.fly_multiplier'
        db.add_column(u'sheet_weaponspecialquality', 'fly_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'EdgeLevel.run_multiplier'
        db.add_column(u'sheet_edgelevel', 'run_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'EdgeLevel.swim_multiplier'
        db.add_column(u'sheet_edgelevel', 'swim_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'EdgeLevel.climb_multiplier'
        db.add_column(u'sheet_edgelevel', 'climb_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'EdgeLevel.fly_multiplier'
        db.add_column(u'sheet_edgelevel', 'fly_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'SpellEffect.run_multiplier'
        db.add_column(u'sheet_spelleffect', 'run_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'SpellEffect.swim_multiplier'
        db.add_column(u'sheet_spelleffect', 'swim_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'SpellEffect.climb_multiplier'
        db.add_column(u'sheet_spelleffect', 'climb_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'SpellEffect.fly_multiplier'
        db.add_column(u'sheet_spelleffect', 'fly_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'ArmorSpecialQuality.run_multiplier'
        db.add_column(u'sheet_armorspecialquality', 'run_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'ArmorSpecialQuality.swim_multiplier'
        db.add_column(u'sheet_armorspecialquality', 'swim_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'ArmorSpecialQuality.climb_multiplier'
        db.add_column(u'sheet_armorspecialquality', 'climb_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)

        # Adding field 'ArmorSpecialQuality.fly_multiplier'
        db.add_column(u'sheet_armorspecialquality', 'fly_multiplier',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=2),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'WeaponSpecialQuality.run_multiplier'
        db.delete_column(u'sheet_weaponspecialquality', 'run_multiplier')

        # Deleting field 'WeaponSpecialQuality.swim_multiplier'
        db.delete_column(u'sheet_weaponspecialquality', 'swim_multiplier')

        # Deleting field 'WeaponSpecialQuality.climb_multiplier'
        db.delete_column(u'sheet_weaponspecialquality', 'climb_multiplier')

        # Deleting field 'WeaponSpecialQuality.fly_multiplier'
        db.delete_column(u'sheet_weaponspecialquality', 'fly_multiplier')

        # Deleting field 'EdgeLevel.run_multiplier'
        db.delete_column(u'sheet_edgelevel', 'run_multiplier')

        # Deleting field 'EdgeLevel.swim_multiplier'
        db.delete_column(u'sheet_edgelevel', 'swim_multiplier')

        # Deleting field 'EdgeLevel.climb_multiplier'
        db.delete_column(u'sheet_edgelevel', 'climb_multiplier')

        # Deleting field 'EdgeLevel.fly_multiplier'
        db.delete_column(u'sheet_edgelevel', 'fly_multiplier')

        # Deleting field 'SpellEffect.run_multiplier'
        db.delete_column(u'sheet_spelleffect', 'run_multiplier')

        # Deleting field 'SpellEffect.swim_multiplier'
        db.delete_column(u'sheet_spelleffect', 'swim_multiplier')

        # Deleting field 'SpellEffect.climb_multiplier'
        db.delete_column(u'sheet_spelleffect', 'climb_multiplier')

        # Deleting field 'SpellEffect.fly_multiplier'
        db.delete_column(u'sheet_spelleffect', 'fly_multiplier')

        # Deleting field 'ArmorSpecialQuality.run_multiplier'
        db.delete_column(u'sheet_armorspecialquality', 'run_multiplier')

        # Deleting field 'ArmorSpecialQuality.swim_multiplier'
        db.delete_column(u'sheet_armorspecialquality', 'swim_multiplier')

        # Deleting field 'ArmorSpecialQuality.climb_multiplier'
        db.delete_column(u'sheet_armorspecialquality', 'climb_multiplier')

        # Deleting field 'ArmorSpecialQuality.fly_multiplier'
        db.delete_column(u'sheet_armorspecialquality', 'fly_multiplier')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Permission']"}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'sheet.ammunition': {
            'Meta': {'object_name': 'Ammunition'},
            'bullet_type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'P'", 'max_length': '10'}),
            'velocity': ('django.db.models.fields.IntegerField', [], {}),
            'weight': ('django.db.models.fields.DecimalField', [], {'max_digits': '7', 'decimal_places': '3'})
        },
        u'sheet.armor': {
            'Meta': {'object_name': 'Armor'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.ArmorTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.ArmorQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.armorquality': {
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
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"})
        },
        u'sheet.armorspecialquality': {
            'Meta': {'object_name': 'ArmorSpecialQuality'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'climb_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fly_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'run_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'swim_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.armortemplate': {
            'Meta': {'object_name': 'ArmorTemplate'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
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
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        u'sheet.basefirearm': {
            'Meta': {'ordering': "['name']", 'object_name': 'BaseFirearm'},
            'autofire_class': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'autofire_rpm': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_basefirearm'", 'to': u"orm['sheet.Skill']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'duration': ('django.db.models.fields.DecimalField', [], {'default': '0.1', 'max_digits': '5', 'decimal_places': '3'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'range_e': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_l': ('django.db.models.fields.IntegerField', [], {}),
            'range_m': ('django.db.models.fields.IntegerField', [], {}),
            'range_pb': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_s': ('django.db.models.fields.IntegerField', [], {}),
            'range_vs': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_xl': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_xs': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'restricted_burst_rounds': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_basefirearm'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_basefirearm'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'stock': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '4', 'decimal_places': '2'}),
            'sweep_fire_disabled': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'target_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-2'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'weapon_class_modifier': ('django.db.models.fields.DecimalField', [], {'default': '6', 'max_digits': '4', 'decimal_places': '2'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        u'sheet.campaign': {
            'Meta': {'object_name': 'Campaign'},
            'has_firearms': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'has_spells': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '10'}),
            'tech_levels': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.TechLevel']", 'symmetrical': 'False'})
        },
        u'sheet.character': {
            'Meta': {'ordering': "['campaign', 'name']", 'object_name': 'Character'},
            'adventures': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'age': ('django.db.models.fields.PositiveIntegerField', [], {'default': '20'}),
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
            'bought_mana': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'bought_stamina': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'campaign': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Campaign']"}),
            'cur_cha': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_fit': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_int': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_lrn': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_pos': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_psy': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_ref': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_wil': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'deity': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'edges_bought': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'free_edges': ('django.db.models.fields.IntegerField', [], {'default': '2'}),
            'gained_sp': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '175'}),
            'hero': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_update_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'occupation': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'characters'", 'to': u"orm['auth.User']"}),
            'portrait': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'private': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'race': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'start_cha': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_fit': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_int': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_lrn': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_pos': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_psy': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_ref': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_wil': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'times_wounded': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'total_xp': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'unnatural_aging': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weigth': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'xp_used_ingame': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'})
        },
        u'sheet.characteredge': {
            'Meta': {'object_name': 'CharacterEdge'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edges'", 'to': u"orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'sheet.characterlogentry': {
            'Meta': {'ordering': "['-timestamp']", 'object_name': 'CharacterLogEntry'},
            'amount': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']", 'null': 'True', 'blank': 'True'}),
            'edge_level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'entry': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'entry_type': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'field': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'removed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_level': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'sheet.characterskill': {
            'Meta': {'ordering': "('skill__name',)", 'unique_together': "(('character', 'skill'),)", 'object_name': 'CharacterSkill'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'skills'", 'to': u"orm['sheet.Character']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']"})
        },
        u'sheet.edge': {
            'Meta': {'object_name': 'Edge'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        u'sheet.edgelevel': {
            'Meta': {'ordering': "('edge', 'level')", 'object_name': 'EdgeLevel'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'climb_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'cost': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Edge']"}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fly_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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
            'run_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill_bonuses': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Skill']", 'null': 'True', 'through': u"orm['sheet.EdgeSkillBonus']", 'blank': 'True'}),
            'swim_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.edgeskillbonus': {
            'Meta': {'object_name': 'EdgeSkillBonus'},
            'bonus': ('django.db.models.fields.IntegerField', [], {'default': '15'}),
            'edge_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']"})
        },
        u'sheet.firearm': {
            'Meta': {'object_name': 'Firearm'},
            'ammo': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Ammunition']"}),
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.BaseFirearm']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'sheet.firearmammunitiontype': {
            'Meta': {'object_name': 'FirearmAmmunitionType'},
            'firearm': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ammunition_types'", 'to': u"orm['sheet.BaseFirearm']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'short_label': ('django.db.models.fields.CharField', [], {'max_length': '20'})
        },
        u'sheet.miscellaneousitem': {
            'Meta': {'object_name': 'MiscellaneousItem'},
            'armor_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'weapon_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.rangedweapon': {
            'Meta': {'ordering': "['name']", 'object_name': 'RangedWeapon'},
            'ammo_quality': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'rangedweaponammo_set'", 'null': 'True', 'to': u"orm['sheet.WeaponQuality']"}),
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.RangedWeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponQuality']"}),
            'size': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '1'}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.rangedweapontemplate': {
            'Meta': {'ordering': "['name']", 'object_name': 'RangedWeaponTemplate'},
            'ammo_weight': ('django.db.models.fields.DecimalField', [], {'default': '0.1', 'max_digits': '4', 'decimal_places': '1'}),
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_rangedweapontemplate'", 'to': u"orm['sheet.Skill']"}),
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'range_e': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_l': ('django.db.models.fields.IntegerField', [], {}),
            'range_m': ('django.db.models.fields.IntegerField', [], {}),
            'range_pb': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_s': ('django.db.models.fields.IntegerField', [], {}),
            'range_vs': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_xl': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_xs': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_rangedweapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_rangedweapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'target_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-2'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'P'", 'max_length': '5'}),
            'weapon_type': ('django.db.models.fields.CharField', [], {'default': "'thrown'", 'max_length': '10'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        u'sheet.sheet': {
            'Meta': {'ordering': "('character__name',)", 'object_name': 'Sheet'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Armor']", 'null': 'True', 'on_delete': 'models.SET_NULL', 'blank': 'True'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Character']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'extra_weight_carried': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'firearms': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.Firearm']", 'symmetrical': 'False', 'blank': 'True'}),
            'helm': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'helm_for'", 'null': 'True', 'on_delete': 'models.SET_NULL', 'to': u"orm['sheet.Armor']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_update_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'miscellaneous_items': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.MiscellaneousItem']", 'symmetrical': 'False', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sheets'", 'to': u"orm['auth.User']"}),
            'ranged_weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.RangedWeapon']", 'symmetrical': 'False', 'blank': 'True'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'spell_effects': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.SpellEffect']", 'symmetrical': 'False', 'blank': 'True'}),
            'weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.Weapon']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.skill': {
            'Meta': {'ordering': "['name']", 'object_name': 'Skill'},
            'can_be_defaulted': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'is_specialization': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'required_edges': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Edge']", 'null': 'True', 'blank': 'True'}),
            'required_skills': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_cost_0': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_1': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_2': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_3': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'stat': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '64'})
        },
        u'sheet.spelleffect': {
            'Meta': {'object_name': 'SpellEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'climb_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fly_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'run_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'swim_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.techlevel': {
            'Meta': {'object_name': 'TechLevel'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '10'})
        },
        u'sheet.weapon': {
            'Meta': {'ordering': "['name']", 'object_name': 'Weapon'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponQuality']"}),
            'size': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '1'}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.weaponquality': {
            'Meta': {'ordering': "['roa', 'ccv']", 'object_name': 'WeaponQuality'},
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'max_fit': ('django.db.models.fields.IntegerField', [], {'default': '90'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '6', 'decimal_places': '4'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'versus_area_save_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'versus_missile_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'})
        },
        u'sheet.weaponspecialquality': {
            'Meta': {'object_name': 'WeaponSpecialQuality'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'climb_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fly_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'run_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'swim_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '2'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.weapontemplate': {
            'Meta': {'ordering': "['name']", 'object_name': 'WeaponTemplate'},
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_weapontemplate'", 'to': u"orm['sheet.Skill']"}),
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'ccv_unskilled_modifier': ('django.db.models.fields.IntegerField', [], {'default': '-10'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'is_lance': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_shield': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_weapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_weapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        }
    }

    complete_apps = ['sheet']